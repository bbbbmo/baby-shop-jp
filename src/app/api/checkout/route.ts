import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/shared/api/supabase/serverClient";
import { createServerAuthClient } from "@/shared/api/supabase/serverAuthClient";
import { checkoutSchema, type CheckoutFormValues } from "@/features/checkout-form/model/schema";
import { isMarket, shippingFeeFor, type Market } from "@/shared/config/markets";

type CheckoutItem = { productId: string; color: string; size: string; quantity: number };
type CheckoutRequestBody = { items: CheckoutItem[]; shipping: unknown; market?: unknown };
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
  try {
    const body = (await request.json()) as CheckoutRequestBody;
    if (!isMarket(body.market)) {
      return NextResponse.json({ error: "invalidInput" }, { status: 400 });
    }
    const userId = await resolveUserId();
    const result = await processCheckout(body, userId, body.market);
    return NextResponse.json(result.body, { status: result.status });
  } catch {
    return NextResponse.json({ error: "unknownError" }, { status: 500 });
  }
}

async function resolveUserId(): Promise<string | null> {
  const supabase = await createServerAuthClient();
  const { data, error } = await supabase.auth.getClaims();
  return error || !data ? null : data.claims.sub;
}

async function processCheckout(
  body: CheckoutRequestBody,
  userId: string | null,
  market: Market,
): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(body.shipping);
  if (!parsed.success || !hasValidItems(body.items)) {
    return { status: 400, body: { error: "invalidInput" } };
  }
  const resolved = await resolveOrderItems(body.items, market);
  if ("error" in resolved) {
    return { status: 409, body: { error: "soldOut", productName: resolved.error } };
  }
  return createOrder(userId, parsed.data, resolved.items, market);
}

function hasValidItems(items: CheckoutItem[]): boolean {
  return Array.isArray(items) && items.length > 0 &&
    items.every((i) => Number.isInteger(i.quantity) && i.quantity > 0);
}

async function createOrder(
  userId: string | null,
  shipping: CheckoutFormValues,
  items: ResolvedItem[],
  market: Market,
): Promise<CheckoutResult> {
  const orderNumber = generateOrderNumber();
  const orderId = await insertOrder(orderNumber, userId, shipping, items, market);
  if (!orderId) {
    return { status: 500, body: { error: "unknownError" } };
  }
  const itemsOk = await insertOrderItems(orderId, items);
  return itemsOk
    ? { status: 200, body: { orderNumber } }
    : await rollbackOrder(orderId);
}

async function rollbackOrder(orderId: string): Promise<CheckoutResult> {
  await supabaseServer.from("orders").delete().eq("id", orderId);
  return { status: 500, body: { error: "unknownError" } };
}

function generateOrderNumber(): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const suffix = randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
  return `CM${yy}${mm}${dd}-${suffix}`;
}

async function resolveOrderItems(
  items: CheckoutItem[],
  market: Market,
): Promise<{ items: ResolvedItem[] } | { error: string }> {
  const resolved: ResolvedItem[] = [];
  for (const item of items) {
    const result = await resolveOneItem(item, market);
    if ("error" in result) {
      return result;
    }
    resolved.push(result.item);
  }
  return { items: resolved };
}

async function resolveOneItem(
  item: CheckoutItem,
  market: Market,
): Promise<{ item: ResolvedItem } | { error: string }> {
  const ids = await resolveColorSizeIds(item.color, item.size);
  if (!ids) {
    return { error: item.productId };
  }
  const { data, error } = await fetchVariantWithProduct(item, ids);
  const product = extractProduct(data);
  const price = product ? priceFor(market, product) : null;
  if (error || !data || data.stock < item.quantity || !product || price === null) {
    return { error: product?.name_ja ?? item.productId };
  }
  return { item: buildResolvedItem(item, data.id, product.name_ja, price) };
}

function priceFor(
  market: Market,
  product: { price_jpy: number; price_krw: number | null },
): number | null {
  return market === "jp" ? product.price_jpy : product.price_krw;
}

async function resolveColorSizeIds(
  hex: string,
  size: string,
): Promise<{ colorId: string; sizeId: string } | null> {
  const [color, sizeRow] = await Promise.all([
    supabaseServer.from("colors").select("id").eq("hex", hex).maybeSingle(),
    supabaseServer.from("sizes").select("id").eq("value", size).maybeSingle(),
  ]);
  return color.data && sizeRow.data ? { colorId: color.data.id, sizeId: sizeRow.data.id } : null;
}

function fetchVariantWithProduct(item: CheckoutItem, ids: { colorId: string; sizeId: string }) {
  return supabaseServer
    .from("product_variants")
    .select("id, stock, products ( name_ja, price_jpy, price_krw )")
    .eq("product_id", item.productId)
    .eq("color_id", ids.colorId)
    .eq("size_id", ids.sizeId)
    .maybeSingle();
}

function extractProduct(data: { products?: unknown } | null) {
  return data?.products as
    | { name_ja: string; price_jpy: number; price_krw: number | null }
    | undefined;
}

function buildResolvedItem(
  item: CheckoutItem,
  variantId: string,
  productNameJa: string,
  unitPrice: number,
): ResolvedItem {
  return {
    variant_id: variantId,
    product_name_ja: productNameJa,
    color: item.color,
    size: item.size,
    unit_price: unitPrice,
    quantity: item.quantity,
  };
}

async function insertOrder(
  orderNumber: string,
  userId: string | null,
  shipping: CheckoutFormValues,
  items: ResolvedItem[],
  market: Market,
): Promise<string | null> {
  const payload = buildOrderPayload(orderNumber, userId, shipping, items, market);
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
  market: Market,
) {
  const subtotal = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  const shippingFee = shippingFeeFor(market, subtotal);
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
