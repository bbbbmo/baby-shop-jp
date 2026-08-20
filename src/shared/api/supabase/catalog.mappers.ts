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
  product_variants: { colors: { hex: string } | null; sizes: { value: string } | null }[];
  product_images: { url: string; sort_order: number }[];
};

export function mapDbProductToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: { ja: row.name_ja, ko: row.name_ko },
    brand: row.brands?.name_ja ?? "",
    category: row.category,
    price: row.price,
    listPrice: row.list_price,
    colors: uniqueColors(row.product_variants.map((v) => v.colors?.hex ?? "")),
    sizes: uniqueSizes(row.product_variants.map((v) => v.sizes?.value ?? "")),
    season: row.season,
    isNew: row.is_new,
    isBest: row.is_best,
    soldOut: row.sold_out,
    rating: row.rating,
    reviewCount: row.review_count,
    description: { ja: row.description_ja ?? "", ko: row.description_ko ?? "" },
    images: sortedImageUrls(row.product_images),
  };
}

// Postgres gives no ordering guarantee on the embedded product_variants rows
// (and it will change the instant a variant row is UPDATEd), so colors/sizes
// are deduped and sorted here rather than relying on DB row order.
//
// "" is filtered out here (not in mapVariantRow below) because color_id/size_id
// are nullable — mid-save (see the two-phase update in variants/route.ts) a row
// can briefly have a null join, which maps to "". The storefront must never
// offer a blank color/size, but the admin form's ProductVariantRow SHOULD see
// the broken row so its existing zod validation forces a re-pick. Don't "fix"
// one to match the other.
function uniqueColors(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort();
}

function uniqueSizes(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => sizeRank(a) - sizeRank(b));
}

// Sizes look like "50-60", "70", "90", "95" — rank by the leading number so
// they sort numerically ("50-60" < "70" < ... < "95") instead of lexically.
// Unknown/non-numeric sizes sort last.
function sizeRank(size: string): number {
  const match = size.match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

function sortedImageUrls(images: { url: string; sort_order: number }[]): string[] {
  return [...images].sort((a, b) => a.sort_order - b.sort_order).map((i) => i.url);
}

export type JoinedVariantRow = {
  id: string;
  stock: number;
  colors: { hex: string } | null;
  sizes: { value: string } | null;
};

export function mapVariantRow(row: JoinedVariantRow): { id: string; color: string; size: string; stock: number } {
  return { id: row.id, color: row.colors?.hex ?? "", size: row.sizes?.value ?? "", stock: row.stock };
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
