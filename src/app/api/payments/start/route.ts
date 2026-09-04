import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/shared/api/supabase/serverClient";
import { findPaymentMethod, type PaymentMethodOption } from "@/shared/api/payments/catalog";
import { getProvider } from "@/shared/api/payments/registry";
import type { NextAction, PaymentIntent, PaymentProvider } from "@/shared/api/payments/types";
import { siteOrigin } from "@/shared/lib/siteOrigin";
import { marketCurrency, isMarket, type Market } from "@/shared/config/markets";

// 이메일까지 받는 이유는 이 저장소가 이미 「주문번호 + 이메일」을 비회원
// 인가 규칙으로 쓰고 있기 때문이다 (get_order_by_number_and_email RPC).
// 주문 조회보다 결제 시작이 더 느슨하면 앞뒤가 맞지 않는다. 주문번호만으로
// 남의 주문 상태와 금액을 알아낼 수 있고 결제 행을 계속 쌓을 수도 있다.
const bodySchema = z.object({
  orderNumber: z.string().min(1),
  email: z.string().min(1),
  methodId: z.string().min(1),
});

type OrderRow = {
  id: string;
  order_number: string;
  market: string;
  status: string;
  total_price: number;
  recipient_name: string;
  email: string;
};

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    const method = parsed.success ? findPaymentMethod(parsed.data.methodId) : null;
    if (!parsed.success || !method) {
      return NextResponse.json({ error: "invalidInput" }, { status: 400 });
    }
    return await startPayment(parsed.data, method, siteOrigin(request));
  } catch {
    return NextResponse.json({ error: "unknownError" }, { status: 500 });
  }
}

async function startPayment(
  input: { orderNumber: string; email: string },
  method: PaymentMethodOption,
  origin: string,
): Promise<NextResponse> {
  const found = await fetchOrder(input.orderNumber);
  if ("failed" in found) {
    return NextResponse.json({ error: "unknownError" }, { status: 500 });
  }
  // 주문이 없을 때와 이메일이 다를 때를 같은 응답으로 돌려준다.
  // 나누면 그 차이 자체가 주문 존재 여부를 알려 준다.
  const order = matchOrder(found.order, input.email);
  if (!order || !isMarket(order.market)) {
    return NextResponse.json({ error: "orderNotFound" }, { status: 404 });
  }
  if (order.status !== "pending_payment") {
    return NextResponse.json({ error: "alreadyPaid" }, { status: 409 });
  }
  return await createAndInitiate(order, order.market, method, origin);
}

function matchOrder(order: OrderRow | null, email: string): OrderRow | null {
  const same = order && order.email.toLowerCase() === email.trim().toLowerCase();
  return same ? order : null;
}

async function createAndInitiate(
  order: OrderRow,
  market: Market,
  method: PaymentMethodOption,
  origin: string,
): Promise<NextResponse> {
  // provider가 이 마켓을 취급하는지도 본다. 카탈로그와 provider 양쪽이
  // 마켓을 들고 있으므로 어긋나면 결제창까지 갔다가 실패한다.
  const provider = getProvider(method.provider);
  const usable = provider?.markets.includes(market) ? provider : null;
  const paymentId = usable ? await insertPayment(order, market, method) : null;
  if (!usable || !paymentId) {
    return NextResponse.json({ error: "providerDown" }, { status: 502 });
  }
  const intent = buildIntent(order, market, method, paymentId, origin);
  const nextAction = await runInitiate(usable, paymentId, intent);
  return nextAction
    ? NextResponse.json({ paymentId, nextAction })
    : NextResponse.json({ error: "providerDown" }, { status: 502 });
}

async function runInitiate(
  provider: PaymentProvider,
  paymentId: string,
  intent: PaymentIntent,
): Promise<NextAction | null> {
  try {
    const result = await provider.initiate(intent);
    await supabaseServer
      .from("payments")
      .update({ provider_ref: result.providerRef })
      .eq("id", paymentId);
    return result.nextAction;
  } catch {
    await markFailed(paymentId, "providerDown");
    return null;
  }
}

function buildIntent(
  order: OrderRow,
  market: Market,
  method: PaymentMethodOption,
  paymentId: string,
  origin: string,
): PaymentIntent {
  return {
    paymentId,
    orderNumber: order.order_number,
    market,
    method: method.method,
    amount: order.total_price,
    currency: marketCurrency(market),
    // 결제사 화면에 뜨는 상품명 자리다. 주문번호로 둔다 — 상품명을 다시 조회하면
    // 쿼리가 늘고, 무엇을 샀는지가 PG로 더 나간다.
    itemName: order.order_number,
    buyerName: order.recipient_name,
    buyerEmail: order.email,
    returnUrl: buildReturnUrl(origin, method.provider, paymentId, market),
    cancelUrl: `${origin}/${market}/checkout`,
  };
}

// 마켓을 함께 심는다. 결제 행을 못 찾는 실패에서도 손님을 원래 언어의
// 화면으로 돌려보내야 한다 — 그러지 않으면 한국 손님이 일본어 화면에 떨어진다.
function buildReturnUrl(
  origin: string,
  provider: string,
  paymentId: string,
  market: Market,
): string {
  return `${origin}/api/payments/return/${provider}?ref=${paymentId}&m=${market}`;
}

// DB 오류와 「주문 없음」을 구분한다. 뭉뚱그리면 DB가 잠깐 죽었을 때
// 손님에게 "주문이 없습니다"라고 말하게 되고, 재시도할 생각을 못 한다.
async function fetchOrder(
  orderNumber: string,
): Promise<{ order: OrderRow | null } | { failed: true }> {
  const { data, error } = await supabaseServer
    .from("orders")
    .select("id, order_number, market, status, total_price, recipient_name, email")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (error) {
    return { failed: true };
  }
  return { order: (data as OrderRow | null) ?? null };
}

async function insertPayment(
  order: OrderRow,
  market: Market,
  method: PaymentMethodOption,
): Promise<string | null> {
  const { data } = await supabaseServer
    .from("payments")
    .insert({
      order_id: order.id,
      provider: method.provider,
      method: method.method,
      amount: order.total_price,
      currency: marketCurrency(market),
    })
    .select("id")
    .single();
  return data?.id ?? null;
}

async function markFailed(paymentId: string, code: string): Promise<void> {
  await supabaseServer
    .from("payments")
    .update({ status: "failed", failure_code: code })
    .eq("id", paymentId);
}
