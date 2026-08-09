import { NextResponse } from "next/server";
import { supabaseServer } from "@/shared/api/supabase/serverClient";
import { checkoutSchema, type CheckoutFormValues } from "@/features/checkout-form";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/shared/lib/constants";

type CheckoutItem = { productId: string; color: string; size: string; quantity: number };
type CheckoutRequestBody = { items: CheckoutItem[]; shipping: unknown; userId?: string | null };
type ResolvedItem = {
  variant_id: string;
  product_name_ja: string;
  color: string;
  size: string;
  unit_price: number;
  quantity: number;
};

type CheckoutResult = { status: number; body: Record<string, unknown> };

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as CheckoutRequestBody;
  const result = await processCheckout(body);
  return NextResponse.json(result.body, { status: result.status });
}

async function processCheckout(body: CheckoutRequestBody): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(body.shipping);
  if (!parsed.success || !Array.isArray(body.items) || body.items.length === 0) {
    return { status: 400, body: { error: "invalidInput" } };
  }
  const resolved = await resolveOrderItems(body.items);
  if ("error" in resolved) {
    return { status: 409, body: { error: "soldOut", productName: resolved.error } };
  }
  return createOrder(body.userId ?? null, parsed.data, resolved.items);
}

async function createOrder(
  userId: string | null,
  shipping: CheckoutFormValues,
  items: ResolvedItem[],
): Promise<CheckoutResult> {
  const orderNumber = generateOrderNumber();
  const orderId = await insertOrder(orderNumber, userId, shipping, items);
  if (!orderId) {
    return { status: 500, body: { error: "unknownError" } };
  }
  const itemsOk = await insertOrderItems(orderId, items);
  if (!itemsOk) {
    return { status: 500, body: { error: "unknownError" } };
  }
  return { status: 200, body: { orderNumber } };
}

function generateOrderNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const suffix = Math.random().toString(16).slice(2, 6).toUpperCase();
  return `CM${yy}${mm}${dd}-${suffix}`;
}

async function resolveOrderItems(
  items: CheckoutItem[],
): Promise<{ items: ResolvedItem[] } | { error: string }> {
  const resolved: ResolvedItem[] = [];
  for (const item of items) {
    const result = await resolveOneItem(item);
    if ("error" in result) {
      return result;
    }
    resolved.push(result.item);
  }
  return { items: resolved };
}

async function resolveOneItem(
  item: CheckoutItem,
): Promise<{ item: ResolvedItem } | { error: string }> {
  const { data, error } = await supabaseServer
    .from("product_variants")
    .select("id, stock, products ( name_ja, price )")
    .eq("product_id", item.productId)
    .eq("color", item.color)
    .eq("size", item.size)
    .maybeSingle();
  const product = data?.products as unknown as { name_ja: string; price: number } | undefined;
  if (error || !data || data.stock < item.quantity || !product) {
    return { error: product?.name_ja ?? item.productId };
  }
  return {
    item: {
      variant_id: data.id,
      product_name_ja: product.name_ja,
      color: item.color,
      size: item.size,
      unit_price: product.price,
      quantity: item.quantity,
    },
  };
}

async function insertOrder(
  orderNumber: string,
  userId: string | null,
  shipping: CheckoutFormValues,
  items: ResolvedItem[],
): Promise<string | null> {
  const payload = buildOrderPayload(orderNumber, userId, shipping, items);
  const { data, error } = await supabaseServer
    .from("orders")
    .insert(payload)
    .select("id")
    .single();
  return error || !data ? null : data.id;
}

function buildOrderPayload(
  orderNumber: string,
  userId: string | null,
  shipping: CheckoutFormValues,
  items: ResolvedItem[],
) {
  const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  return {
    order_number: orderNumber,
    user_id: userId,
    recipient_name: shipping.recipientName,
    recipient_furigana: shipping.recipientFurigana,
    phone: shipping.phone,
    email: shipping.email,
    postal_code: shipping.postalCode,
    prefecture: shipping.prefecture,
    city: shipping.city,
    address_line: shipping.addressLine,
    building: shipping.building || null,
    memo: shipping.memo || null,
    total_price: subtotal + shippingFee,
  };
}

async function insertOrderItems(orderId: string, items: ResolvedItem[]): Promise<boolean> {
  const { error } = await supabaseServer.from("order_items").insert(
    items.map((item) => ({
      order_id: orderId,
      product_variant_id: item.variant_id,
      product_name_ja: item.product_name_ja,
      color: item.color,
      size: item.size,
      unit_price: item.unit_price,
      quantity: item.quantity,
    })),
  );
  return !error;
}
