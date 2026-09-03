import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/shared/api/supabase/serverClient";
import { findPaymentMethod, type PaymentMethodOption } from "@/shared/api/payments/catalog";
import { getProvider } from "@/shared/api/payments/registry";
import type { NextAction, PaymentIntent, PaymentProvider } from "@/shared/api/payments/types";
import { siteOrigin } from "@/shared/lib/siteOrigin";
import { marketCurrency, isMarket, type Market } from "@/shared/config/markets";

const bodySchema = z.object({
  orderNumber: z.string().min(1),
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
    return await startPayment(parsed.data.orderNumber, method, siteOrigin(request));
  } catch {
    return NextResponse.json({ error: "unknownError" }, { status: 500 });
  }
}

async function startPayment(
  orderNumber: string,
  method: PaymentMethodOption,
  origin: string,
): Promise<NextResponse> {
  const order = await fetchOrder(orderNumber);
  if (!order || !isMarket(order.market)) {
    return NextResponse.json({ error: "orderNotFound" }, { status: 404 });
  }
  if (order.status !== "pending_payment") {
    return NextResponse.json({ error: "alreadyPaid" }, { status: 409 });
  }
  return await createAndInitiate(order, order.market, method, origin);
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
    returnUrl: `${origin}/api/payments/return/${method.provider}?ref=${paymentId}`,
    cancelUrl: `${origin}/${market}/checkout`,
  };
}

async function fetchOrder(orderNumber: string): Promise<OrderRow | null> {
  const { data } = await supabaseServer
    .from("orders")
    .select("id, order_number, market, status, total_price, recipient_name, email")
    .eq("order_number", orderNumber)
    .maybeSingle();
  return (data as OrderRow | null) ?? null;
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
