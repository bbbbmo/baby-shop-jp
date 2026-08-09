"use client";

import type { FriendLook } from "@/entities/look";
import { useProducts, type Product } from "@/entities/product";

/** productIds 를 실제 제품으로 해석한다. */
export function useLookProducts(look: FriendLook | null): Product[] {
  const { data: products = [] } = useProducts();
  if (!look) {
    return [];
  }
  return look.productIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined);
}
