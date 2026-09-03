import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/shared/api/supabase/requireAdmin";
import { supabaseServer } from "@/shared/api/supabase/serverClient";
import { getProvider } from "@/shared/api/payments/registry";
import { toPaymentErrorCode, toPaymentErrorRaw } from "@/shared/api/payments/types";

// 취소는 관리자만 부른다. 손님 셀프 취소 화면은 범위 밖이다 —
// 취소 가능 기간·배송 단계 같은 운영 정책이 아직 없다.
const bodySchema = z.object({
  orderNumber: z.string().min(1),
  reason: z.string().max(200).optional(),
});

type PaidPayment = {
  id: string;
  provider: string;
  amount: number;
  provider_txn_id: string | null;
};

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }
  try {
    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "invalidInput" }, { status: 400 });
    }
    return await cancelPaid(parsed.data.orderNumber, {
      reason: parsed.data.reason ?? "adminCancel",
      by: auth.email,
    });
  } catch {
    return NextResponse.json({ error: "unknownError" }, { status: 500 });
  }
}

type Audit = { reason: string; by: string };

async function cancelPaid(orderNumber: string, audit: Audit): Promise<NextResponse> {
  const found = await fetchPaidPayment(orderNumber);
  if ("failed" in found) {
    return NextResponse.json({ error: "unknownError" }, { status: 500 });
  }
  const payment = found.payment;
  if (!payment || !payment.provider_txn_id) {
    return NextResponse.json({ error: "paidPaymentNotFound" }, { status: 404 });
  }
  return await claimAndRefund(payment, payment.provider_txn_id, audit);
}

// PG를 부르기 전에 행을 선점한다. 이 순서가 아니면 관리자가 취소를 두 번
// 눌렀을 때 두 요청이 나란히 PG에 환불을 보낸다 — DB 잠금은 그 뒤 RPC에서야
// 걸린다. 선점 실패는 다른 요청이 이미 처리 중이라는 뜻이다.
async function claimAndRefund(
  payment: PaidPayment,
  providerTxnId: string,
  audit: Audit,
): Promise<NextResponse> {
  const claimed = await claimForCancel(payment.id);
  if (!claimed) {
    return NextResponse.json({ error: "notPaid" }, { status: 409 });
  }
  const result = await callProviderCancel(payment, providerTxnId, audit.reason);
  if ("code" in result) {
    await releaseClaim(payment.id, { ...audit, refund: result });
    return NextResponse.json({ error: result.code }, { status: 502 });
  }
  return await finishCancel(payment.id, { ...audit, refund: result });
}

async function claimForCancel(paymentId: string): Promise<boolean> {
  const { data } = await supabaseServer
    .from("payments")
    .update({ status: "cancelling" })
    .eq("id", paymentId)
    .eq("status", "paid")
    .select("id");
  return (data?.length ?? 0) > 0;
}

// PG 환불이 실패하면 선점을 되돌린다. 되돌리지 않으면 행이 cancelling에
// 영원히 갇힌다. 시도한 흔적은 raw에 남긴다.
async function releaseClaim(paymentId: string, audit: unknown): Promise<void> {
  await supabaseServer
    .from("payments")
    .update({ status: "paid", failure_code: "cancelFailed", raw: audit })
    .eq("id", paymentId)
    .eq("status", "cancelling");
}

async function callProviderCancel(
  payment: PaidPayment,
  providerTxnId: string,
  reason: string,
): Promise<{ raw: unknown } | { code: string; raw: unknown }> {
  const provider = getProvider(payment.provider);
  if (!provider) {
    return { code: "unknown", raw: null };
  }
  try {
    return await provider.cancel({ providerTxnId, amount: payment.amount, reason });
  } catch (error) {
    return { code: toPaymentErrorCode(error), raw: toPaymentErrorRaw(error) ?? null };
  }
}

async function finishCancel(paymentId: string, audit: unknown): Promise<NextResponse> {
  const { data, error } = await supabaseServer.rpc("cancel_payment", {
    p_payment_id: paymentId,
    p_raw: audit,
  });
  const outcome = error ? "unknown" : ((data as string | null) ?? "unknown");
  if (outcome === "ok") {
    return NextResponse.json({ ok: true });
  }
  // 여기까지 왔으면 PG 환불은 이미 성공했다. 500으로 알리면 관리자가 다시
  // 누르고, 그러면 환불이 두 번 갈 수 있다. 재시도를 부르지 않는 코드를 준다.
  return NextResponse.json({ error: outcome, refunded: true }, { status: 409 });
}

// DB 오류와 「결제된 건 없음」을 구분한다. 관리자가 404를 보면 「이 주문은
// 결제된 적이 없다」는 사실로 읽고 환불이 필요 없다고 판단할 수 있다.
async function fetchPaidPayment(
  orderNumber: string,
): Promise<{ payment: PaidPayment | null } | { failed: true }> {
  const { data: order, error: orderError } = await supabaseServer
    .from("orders")
    .select("id")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (orderError) {
    return { failed: true };
  }
  if (!order) {
    return { payment: null };
  }
  const { data, error } = await supabaseServer
    .from("payments")
    .select("id, provider, amount, provider_txn_id")
    .eq("order_id", order.id)
    .eq("status", "paid")
    .maybeSingle();
  return error ? { failed: true } : { payment: (data as PaidPayment | null) ?? null };
}
