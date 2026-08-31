import type { Order, OrderItem } from "@/entities/order";
import { isMarket } from "@/shared/config/markets";

type OrderItemRow = {
  id: string;
  product_variant_id: string;
  product_name_ja: string;
  product_name_ko: string | null;
  color: string;
  size: string;
  unit_price: number;
  quantity: number;
};

export type OrderRow = {
  id: string;
  order_number: string;
  status: string;
  market: string;
  recipient_name: string;
  recipient_furigana: string | null;
  phone: string;
  email: string;
  postal_code: string;
  prefecture: string;
  city: string;
  address_line: string;
  building: string | null;
  memo: string | null;
  total_price: number;
  created_at: string;
  order_items: OrderItemRow[];
};

function mapDbOrderItemToOrderItem(row: OrderItemRow): OrderItem {
  return {
    id: row.id,
    productVariantId: row.product_variant_id,
    productNameJa: row.product_name_ja,
    productNameKo: row.product_name_ko,
    color: row.color,
    size: row.size,
    unitPrice: row.unit_price,
    quantity: row.quantity,
  };
}

export function mapDbOrderToOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    status: row.status as Order["status"],
    market: isMarket(row.market) ? row.market : "jp",
    recipientName: row.recipient_name,
    recipientFurigana: row.recipient_furigana,
    phone: row.phone,
    email: row.email,
    postalCode: row.postal_code,
    prefecture: row.prefecture,
    city: row.city,
    addressLine: row.address_line,
    building: row.building,
    memo: row.memo,
    totalPrice: row.total_price,
    createdAt: row.created_at,
    items: row.order_items.map(mapDbOrderItemToOrderItem),
  };
}
