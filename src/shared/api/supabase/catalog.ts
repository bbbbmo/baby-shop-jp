import { supabase } from "./client";
import {
  mapDbFriendLookToFriendLook,
  mapDbProductToProduct,
  mapVariantRow,
  type FriendLookRow,
  type JoinedVariantRow,
  type ProductRow,
} from "./catalog.mappers";
import type { Product } from "@/entities/product";
import type { FriendLook } from "@/entities/look";
import type { Market } from "@/shared/config/markets";

export { mapDbProductToProduct, mapDbFriendLookToFriendLook, mapVariantRow };
export type { ProductRow, FriendLookRow, JoinedVariantRow };

const PRODUCT_SELECT = `
  id, category, name_ja, name_ko, description_ja, description_ko,
  price_jpy, list_price_jpy, price_krw, list_price_krw,
  season, is_new, is_best, sold_out, rating, review_count,
  brands ( name_ja ),
  product_variants ( colors ( hex ), sizes ( value ) ),
  product_images ( url, sort_order )
`;

export async function listProducts(market: Market): Promise<Product[]> {
  let query = supabase.from("products").select(PRODUCT_SELECT);
  if (market === "kr") {
    query = query.not("price_krw", "is", null);
  }
  const { data, error } = await query.order("created_at", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return (data as unknown as ProductRow[]).map((row) => mapDbProductToProduct(row, market));
}

export async function getProduct(id: string, market: Market): Promise<Product | null> {
  let query = supabase.from("products").select(PRODUCT_SELECT).eq("id", id);
  if (market === "kr") {
    query = query.not("price_krw", "is", null);
  }
  const { data, error } = await query.maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data ? mapDbProductToProduct(data as unknown as ProductRow, market) : null;
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
    .select("id, stock, colors ( hex ), sizes ( value )")
    .eq("product_id", productId);
  if (error) {
    throw new Error(error.message);
  }
  return ((data ?? []) as unknown as JoinedVariantRow[]).map(mapVariantRow);
}

export async function listFriendLooks(): Promise<FriendLook[]> {
  const { data, error } = await supabase
    .from("friend_looks")
    .select(
      "id, handle, image_src, model_info_ja, model_info_ko, friend_look_products ( product_id )",
    )
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return (data as unknown as FriendLookRow[]).map(mapDbFriendLookToFriendLook);
}
