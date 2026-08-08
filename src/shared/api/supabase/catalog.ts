import type { CategorySlug } from "@/entities/category";
import type { Product } from "@/entities/product";
import type { FriendLook } from "@/entities/look";
import { supabase } from "./client";

type ProductRow = {
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

const PRODUCT_SELECT = `
  id, category, name_ja, name_ko, description_ja, description_ko,
  price, list_price, season, is_new, is_best, sold_out, rating, review_count,
  brands ( name_ja ),
  product_variants ( color, size )
`;

export function mapDbProductToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: { ja: row.name_ja, ko: row.name_ko },
    brand: row.brands?.name_ja ?? "",
    category: row.category,
    price: row.price,
    listPrice: row.list_price,
    colors: uniqueInOrder(row.product_variants.map((v) => v.color)),
    sizes: uniqueInOrder(row.product_variants.map((v) => v.size)),
    season: row.season,
    isNew: row.is_new,
    isBest: row.is_best,
    soldOut: row.sold_out,
    rating: row.rating,
    reviewCount: row.review_count,
    description: { ja: row.description_ja ?? "", ko: row.description_ko ?? "" },
  };
}

function uniqueInOrder(values: string[]): string[] {
  return Array.from(new Set(values));
}

export async function listProducts(): Promise<Product[]> {
  const { data, error } = await supabase.from("products").select(PRODUCT_SELECT);
  if (error) {
    throw new Error(error.message);
  }
  return (data as unknown as ProductRow[]).map(mapDbProductToProduct);
}

export async function getProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data ? mapDbProductToProduct(data as unknown as ProductRow) : null;
}

export type ProductVariantRow = {
  id: string;
  color: string;
  size: string;
  stock: number;
};

export async function getProductVariants(
  productId: string,
): Promise<ProductVariantRow[]> {
  const { data, error } = await supabase
    .from("product_variants")
    .select("id, color, size, stock")
    .eq("product_id", productId);
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

type FriendLookRow = {
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

export async function listFriendLooks(): Promise<FriendLook[]> {
  const { data, error } = await supabase
    .from("friend_looks")
    .select(
      "id, handle, image_src, model_info_ja, model_info_ko, friend_look_products ( product_id )",
    )
    .order("created_at", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return (data as unknown as FriendLookRow[]).map(mapDbFriendLookToFriendLook);
}
