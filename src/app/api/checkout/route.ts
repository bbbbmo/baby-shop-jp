import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/shared/api/supabase/serverClient";
import { checkoutSchema, type CheckoutFormValues } from "@/features/checkout-form/model/schema";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/shared/lib/constants";

type CheckoutItem = { productId: string; color: string; size: string; quantity: number };
type CheckoutRequestBody = { items: CheckoutItem[]; shipping: unknown };
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
    const userId = await resolveUserId(request);
    const result = await processCheckout(body, userId);
    return NextResponse.json(result.body, { status: result.status });
  } catch {
    return NextResponse.json({ error: "unknownError" }, { status: 500 });
  }
}

async function resolveUserId(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return null;
  }
  const { data, error } = await supabaseServer.auth.getUser(token);
  return error || !data.user ? null : data.user.id;
}

async function processCheckout(body: CheckoutRequestBody, userId: string | null): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(body.shipping);
  if (!parsed.success || !hasValidItems(body.items)) {
    return { status: 400, body: { error: "invalidInput" } };
  }
  const resolved = await resolveOrderItems(body.items);
  if ("error" in resolved) {
    return { status: 409, body: { error: "soldOut", productName: resolved.error } };
  }
  return createOrder(userId, parsed.data, resolved.items);
}

function hasValidItems(items: CheckoutItem[]): boolean {
  return Array.isArray(items) && items.length > 0 &&
    items.every((i) => Number.isInteger(i.quantity) && i.quantity > 0);
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
  const { data, error } = await fetchVariantWithProduct(item);
  const product = extractProduct(data);
  if (error || !data || data.stock < item.quantity || !product) {
    return { error: product?.name_ja ?? item.productId };
  }
  return { item: buildResolvedItem(item, data.id, product) };
}

async function fetchVariantWithProduct(item: CheckoutItem) {
  return supabaseServer
    .from("product_variants")
    .select("id, stock, products ( name_ja, price )")
    .eq("product_id", item.productId)
    .eq("color", item.color)
    .eq("size", item.size)
    .maybeSingle();
}

function extractProduct(data: { products?: unknown } | null) {
  return data?.products as { name_ja: string; price: number } | undefined;
}

function buildResolvedItem(
  item: CheckoutItem,
  variantId: string,
  product: { name_ja: string; price: number },
): ResolvedItem {
  return {
    variant_id: variantId,
    product_name_ja: product.name_ja,
    color: item.color,
    size: item.size,
    unit_price: product.price,
    quantity: item.quantity,
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
