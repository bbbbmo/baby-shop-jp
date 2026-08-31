import { supabase } from "./client";
import { mapDbOrderToOrder, type OrderRow } from "./orders.mappers";
import type { Order } from "@/entities/order";
import { isMarket } from "@/shared/config/markets";

const ORDER_SELECT = `
  id, order_number, status, market, recipient_name, recipient_furigana, phone, email,
  postal_code, prefecture, city, address_line, building, memo, total_price, created_at,
  order_items ( id, product_variant_id, product_name_ja, product_name_ko, color, size, unit_price, quantity )
`;

// RPC는 테이블 select를 거치지 않고 jsonb를 직접 만들어 반환하므로
// mapDbOrderToOrder를 지나지 않는다. 알 수 없는 마켓 값이 와도 화면이
// 죽지 않도록 여기서도 같은 방어를 둔다.
function normalizeLookedUpOrder(order: Order): Order {
  return { ...order, market: isMarket(order.market) ? order.market : "jp" };
}

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
  const order = (data as Order | null) ?? null;
  return order && normalizeLookedUpOrder(order);
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

export async function linkGuestOrdersToCurrentUser(): Promise<void> {
  const { error } = await supabase.rpc("link_guest_orders_to_current_user");
  if (error) {
    console.error(error);
  }
}
