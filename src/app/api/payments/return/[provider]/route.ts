import { NextResponse } from "next/server";
import { supabaseServer } from "@/shared/api/supabase/serverClient";
import { getProvider } from "@/shared/api/payments/registry";
import {
  toPaymentErrorCode,
  toPaymentErrorRaw,
  type PaymentOutcomeCode,
  type PaymentProvider,
} from "@/shared/api/payments/types";
import { siteOrigin } from "@/shared/lib/siteOrigin";
import { DEFAULT_MARKET, isMarket, type Market } from "@/shared/config/markets";

type PaymentRow = {
  id: string;
  provider: string;
  status: string;
  amount: number;
  provider_ref: string | null;
  provider_txn_id: string | null;
  orders: { order_number: string; market: string } | null;
};

// 손님이 결제사에서 돌아오는 자리다. 어떤 경우에도 JSON을 뱉지 않고
// 화면으로 되돌린다 — 흰 화면에 에러 텍스트가 떠서는 안 된다.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
): Promise<NextResponse> {
  const origin = siteOrigin(request);
  try {
    const { provider: providerId } = await params;
    const url = new URL(request.url);
    const payment = await fetchPayment(url.searchParams.get("ref"));
    const provider = getProvider(providerId);
    // 결제 행이 어느 PG로 시작됐는지와 URL의 provider가 같아야 한다.
    // 대조하지 않으면 A사로 결제를 시작해 놓고 B사 복귀 URL로 승인시킬 수 있다.
    // 가짜 결제사가 등록된 개발 환경에서는 그게 곧 무료 주문이 된다.
    if (!payment || !provider || payment.provider !== providerId) {
      return fail(origin, DEFAULT_MARKET, "unknown");
    }
    return await settle(payment, provider, toQuery(url), origin);
  } catch {
    return fail(origin, DEFAULT_MARKET, "unknown");
  }
}

async function settle(
  payment: PaymentRow,
  provider: PaymentProvider,
  query: Record<string, string>,
  origin: string,
): Promise<NextResponse> {
  const market = marketOf(payment);
  const orderNumber = payment.orders?.order_number ?? "";
  if (payment.status === "paid") {
    return done(origin, market, orderNumber);
  }
  const confirmed = await confirmWithProvider(payment, provider, query);
  if ("code" in confirmed) {
    await markFailed(payment.id, confirmed.code, confirmed.raw);
    return fail(origin, market, confirmed.code);
  }
  return await applyResult(payment, provider, confirmed, { origin, market, orderNumber });
}

async function confirmWithProvider(
  payment: PaymentRow,
  provider: PaymentProvider,
  query: Record<string, string>,
): Promise<
  { providerTxnId: string; paidAmount: number; raw: unknown }
  | { code: PaymentOutcomeCode; raw: unknown }
> {
  try {
    return await provider.confirm({
      paymentId: payment.id,
      providerRef: payment.provider_ref ?? payment.id,
      orderNumber: payment.orders?.order_number ?? "",
      amount: payment.amount,
      query,
    });
  } catch (error) {
    // PG가 준 원본을 코드 한 단어로 줄이지 않는다. 실패한 행이야말로
    // 나중에 사람이 들여다볼 자리다.
    return { code: toPaymentErrorCode(error), raw: toPaymentErrorRaw(error) };
  }
}

async function applyResult(
  payment: PaymentRow,
  provider: PaymentProvider,
  confirmed: { providerTxnId: string; paidAmount: number; raw: unknown },
  target: { origin: string; market: Market; orderNumber: string },
): Promise<NextResponse> {
  const outcome = await runConfirmRpc(payment.id, confirmed);
  if (outcome === "ok" || outcome === "alreadyPaid") {
    return done(target.origin, target.market, target.orderNumber);
  }
  if (outcome === "amountMismatch") {
    await refundAndRecord(provider, payment.id, confirmed);
  }
  return fail(target.origin, target.market, outcome);
}

// RPC가 돌려주는 문자열을 화면이 아는 코드로 좁힌다. 여기서 좁혀 두면
// 사전에 문구가 빠졌을 때 타입 검사가 잡는다.
function toOutcomeCode(value: string | null): "ok" | PaymentOutcomeCode {
  const known = [
    "ok",
    "notFound",
    "notPaid",
    "notPending",
    "alreadyPaid",
    "amountMismatch",
  ] as const;
  return known.includes(value as (typeof known)[number])
    ? (value as "ok" | PaymentOutcomeCode)
    : "unknown";
}

async function runConfirmRpc(
  paymentId: string,
  confirmed: { providerTxnId: string; paidAmount: number; raw: unknown },
): Promise<"ok" | PaymentOutcomeCode> {
  const { data, error } = await supabaseServer.rpc("confirm_payment", {
    p_payment_id: paymentId,
    p_txn_id: confirmed.providerTxnId,
    p_paid_amount: confirmed.paidAmount,
    p_raw: confirmed.raw ?? {},
  });
  return error ? "unknown" : toOutcomeCode(data as string | null);
}

// 금액이 다르면 받은 돈을 돌려주려 시도한다. 이 호출이 실패해도 손님을
// 붙잡아 둘 수는 없다 — 그래서 시도 결과를 반드시 남긴다. 돈은 이미 빠져나갔고,
// 나중에 이 행을 들여다볼 사람에게 「환불을 시도했는가, 왜 실패했는가」가 전부다.
async function refundAndRecord(
  provider: PaymentProvider,
  paymentId: string,
  confirmed: { providerTxnId: string; paidAmount: number; raw: unknown },
): Promise<void> {
  const attempt = await tryCancel(provider, confirmed);
  await supabaseServer
    .from("payments")
    .update({ raw: { confirm: confirmed.raw ?? null, refundAttempt: attempt } })
    .eq("id", paymentId);
}

async function tryCancel(
  provider: PaymentProvider,
  confirmed: { providerTxnId: string; paidAmount: number },
): Promise<Record<string, unknown>> {
  try {
    const result = await provider.cancel({
      providerTxnId: confirmed.providerTxnId,
      amount: confirmed.paidAmount,
      reason: "amountMismatch",
    });
    return { ok: true, raw: result.raw ?? null };
  } catch (error) {
    return { ok: false, code: toPaymentErrorCode(error), raw: toPaymentErrorRaw(error) ?? null };
  }
}

function toQuery(url: URL): Record<string, string> {
  return Object.fromEntries(url.searchParams.entries());
}

function marketOf(payment: PaymentRow): Market {
  const market = payment.orders?.market;
  return isMarket(market) ? market : DEFAULT_MARKET;
}

function done(origin: string, market: Market, orderNumber: string): NextResponse {
  return NextResponse.redirect(
    `${origin}/${market}/checkout/complete?order=${encodeURIComponent(orderNumber)}`,
    303,
  );
}

function fail(origin: string, market: Market, code: PaymentOutcomeCode): NextResponse {
  return NextResponse.redirect(
    `${origin}/${market}/checkout?payError=${encodeURIComponent(code)}`,
    303,
  );
}

async function fetchPayment(ref: string | null): Promise<PaymentRow | null> {
  if (!ref) {
    return null;
  }
  const { data } = await supabaseServer
    .from("payments")
    .select(
      "id, provider, status, amount, provider_ref, provider_txn_id, orders ( order_number, market )",
    )
    .eq("id", ref)
    .maybeSingle();
  return (data as unknown as PaymentRow | null) ?? null;
}

// pending인 행만 실패로 닫는다. 조건이 없으면 관리자가 환불해 cancelled가 된
// 건에 오래된 복귀 URL이 재생됐을 때 failed로 덮여 cancelled_at이 의미를 잃는다.
// DB 쪽 confirm_payment에는 같은 가드(notPending)가 이미 있다.
async function markFailed(
  paymentId: string,
  code: PaymentOutcomeCode,
  raw: unknown,
): Promise<void> {
  await supabaseServer
    .from("payments")
    .update({ status: "failed", failure_code: code, raw: raw ?? null })
    .eq("id", paymentId)
    .eq("status", "pending");
}
