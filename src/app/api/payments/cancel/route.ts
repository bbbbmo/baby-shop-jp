import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/shared/api/supabase/requireAdmin";
import { supabaseServer } from "@/shared/api/supabase/serverClient";
import { getProvider } from "@/shared/api/payments/registry";
import { toPaymentErrorCode } from "@/shared/api/payments/types";

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
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalidInput" }, { status: 400 });
  }
  return await cancelPaid(parsed.data.orderNumber, parsed.data.reason ?? "adminCancel");
}

async function cancelPaid(orderNumber: string, reason: string): Promise<NextResponse> {
  const payment = await fetchPaidPayment(orderNumber);
  if (!payment || !payment.provider_txn_id) {
    return NextResponse.json({ error: "paidPaymentNotFound" }, { status: 404 });
  }
  const failure = await callProviderCancel(payment, payment.provider_txn_id, reason);
  if (failure) {
    return NextResponse.json({ error: failure }, { status: 502 });
  }
  return await finishCancel(payment.id);
}

async function callProviderCancel(
  payment: PaidPayment,
  providerTxnId: string,
  reason: string,
): Promise<string | null> {
  const provider = getProvider(payment.provider);
  if (!provider) {
    return "unknown";
  }
  try {
    await provider.cancel({ providerTxnId, amount: payment.amount, reason });
    return null;
  } catch (error) {
    return toPaymentErrorCode(error);
  }
}

async function finishCancel(paymentId: string): Promise<NextResponse> {
  const { data, error } = await supabaseServer.rpc("cancel_payment", {
    p_payment_id: paymentId,
    p_raw: {},
  });
  const outcome = error ? "unknown" : ((data as string | null) ?? "unknown");
  return outcome === "ok"
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: outcome }, { status: 500 });
}

async function fetchPaidPayment(orderNumber: string): Promise<PaidPayment | null> {
  const { data: order } = await supabaseServer
    .from("orders")
    .select("id")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (!order) {
    return null;
  }
  const { data } = await supabaseServer
    .from("payments")
    .select("id, provider, amount, provider_txn_id")
    .eq("order_id", order.id)
    .eq("status", "paid")
    .maybeSingle();
  return (data as PaidPayment | null) ?? null;
}
