import type { FriendLook } from "@/entities/look";
import { getProduct, type Product } from "@/entities/product";

/** productIds 를 실제 제품으로 해석한다. */
export const lookProducts = (look: FriendLook): Product[] =>
  look.productIds
    .map(getProduct)
    .filter((p): p is Product => p !== undefined);
