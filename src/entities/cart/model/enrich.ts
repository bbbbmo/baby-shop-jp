import type { CartItem } from "./store";
import type { Product } from "@/entities/product";

export type EnrichedCartItem = CartItem & { product: Product };

export const enrichCartLines = (
  items: CartItem[],
  products: Product[],
): EnrichedCartItem[] => {
  const byId = new Map(products.map((p) => [p.id, p]));
  return items
    .map((item) => ({ ...item, product: byId.get(item.productId) }))
    .filter((item): item is EnrichedCartItem => Boolean(item.product));
};
