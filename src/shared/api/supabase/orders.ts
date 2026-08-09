import { supabase } from "./client";
import { mapDbOrderToOrder, type OrderRow } from "./orders.mappers";
import type { Order } from "@/entities/order";

const ORDER_SELECT = `
  id, order_number, status, recipient_name, recipient_furigana, phone, email,
  postal_code, prefecture, city, address_line, building, memo, total_price, created_at,
  order_items ( id, product_variant_id, product_name_ja, color, size, unit_price, quantity )
`;

export async function lookupOrder(
  orderNumber: string,
  email: string,
): Promise<Order | null> {
  const { data, error } = await supabase.rpc("get_order_by_number_and_email", {
    p_order_number: orderNumber,
    p_email: email,
  });
  if (error) {
    throw new Error(error.message);
  }
  return (data as Order | null) ?? null;
}

export async function listMyOrders(): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return (data as unknown as OrderRow[]).map(mapDbOrderToOrder);
}

export async function linkGuestOrdersToCurrentUser(email: string): Promise<void> {
  const { error } = await supabase.rpc("link_guest_orders_to_current_user", {
    p_email: email,
  });
  if (error) {
    console.error(error);
  }
}
