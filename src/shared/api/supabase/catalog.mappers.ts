import type { CategorySlug } from "@/entities/category";
import type { Product } from "@/entities/product";
import type { FriendLook } from "@/entities/look";

export type ProductRow = {
  id: string;
  category: CategorySlug;
  name_ja: string;
  name_ko: string;
  description_ja: string | null;
  description_ko: string | null;
  price: number;
  list_price: number;
  season: "ss" | "aw" | "all";
  is_new: boolean;
  is_best: boolean;
  sold_out: boolean;
  rating: number;
  review_count: number;
  brands: { name_ja: string } | null;
  product_variants: { color: string; size: string }[];
};

export function mapDbProductToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: { ja: row.name_ja, ko: row.name_ko },
    brand: row.brands?.name_ja ?? "",
    category: row.category,
    price: row.price,
    listPrice: row.list_price,
    colors: uniqueColors(row.product_variants.map((v) => v.color)),
    sizes: uniqueSizes(row.product_variants.map((v) => v.size)),
    season: row.season,
    isNew: row.is_new,
    isBest: row.is_best,
    soldOut: row.sold_out,
    rating: row.rating,
    reviewCount: row.review_count,
    description: { ja: row.description_ja ?? "", ko: row.description_ko ?? "" },
  };
}

// Postgres gives no ordering guarantee on the embedded product_variants rows
// (and it will change the instant a variant row is UPDATEd), so colors/sizes
// are deduped and sorted here rather than relying on DB row order.
function uniqueColors(values: string[]): string[] {
  return Array.from(new Set(values)).sort();
}

function uniqueSizes(values: string[]): string[] {
  return Array.from(new Set(values)).sort((a, b) => sizeRank(a) - sizeRank(b));
}

// Sizes look like "50-60", "70", "90", "95" — rank by the leading number so
// they sort numerically ("50-60" < "70" < ... < "95") instead of lexically.
// Unknown/non-numeric sizes sort last.
function sizeRank(size: string): number {
  const match = size.match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

export type FriendLookRow = {
  id: string;
  handle: string;
  image_src: string;
  model_info_ja: string | null;
  model_info_ko: string | null;
  friend_look_products: { product_id: string }[];
};

export function mapDbFriendLookToFriendLook(row: FriendLookRow): FriendLook {
  return {
    id: row.id,
    handle: row.handle,
    imageSrc: row.image_src,
    modelInfo: { ja: row.model_info_ja ?? "", ko: row.model_info_ko ?? "" },
    productIds: row.friend_look_products.map((p) => p.product_id),
  };
}
