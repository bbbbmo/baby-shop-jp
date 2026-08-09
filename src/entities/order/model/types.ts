export type OrderStatus = "pending_payment";

export type OrderItem = {
  id: string;
  productVariantId: string;
  productNameJa: string;
  color: string;
  size: string;
  unitPrice: number;
  quantity: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  recipientName: string;
  recipientFurigana: string;
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
