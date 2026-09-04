import type { Market } from "@/shared/config/markets";

export type OrderStatus = "pending_payment" | "paid" | "cancelled";

export type OrderItem = {
  id: string;
  productVariantId: string;
  productNameJa: string;
  productNameKo: string | null;
  color: string;
  size: string;
  unitPrice: number;
  quantity: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  market: Market;
  recipientName: string;
  recipientFurigana: string | null;
  phone: string;
  email: string;
  postalCode: string;
  prefecture: string;
  city: string;
  addressLine: string;
  building: string | null;
  memo: string | null;
  totalPrice: number;
  createdAt: string;
  items: OrderItem[];
};
