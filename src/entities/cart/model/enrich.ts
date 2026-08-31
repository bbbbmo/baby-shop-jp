import type { CartItem } from "./store";
import type { Product } from "@/entities/product";

export type EnrichedCartItem = CartItem & { product: Product };

export type EnrichedCart = {
  lines: EnrichedCartItem[];
  droppedCount: number;
};

// 마켓을 옮기면 그 마켓에서 취급하지 않는 상품이 카탈로그에 없다.
// 조용히 지우면 사용자가 결제 직전에야 금액 차이를 발견하므로 개수를 함께 돌려준다.
export const enrichCartLines = (
  items: CartItem[],
  products: Product[],
): EnrichedCart => {
  const byId = new Map(products.map((p) => [p.id, p]));
  const lines = items
    .map((item) => ({ ...item, product: byId.get(item.productId) }))
    .filter((item): item is EnrichedCartItem => Boolean(item.product));
  return { lines, droppedCount: items.length - lines.length };
};
