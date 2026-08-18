import { supabase } from "./client";
import {
  mapDbFriendLookToFriendLook,
  mapDbProductToProduct,
  type FriendLookRow,
  type ProductRow,
} from "./catalog.mappers";
import type { Product } from "@/entities/product";
import type { FriendLook } from "@/entities/look";

export { mapDbProductToProduct, mapDbFriendLookToFriendLook };
export type { ProductRow, FriendLookRow };

const PRODUCT_SELECT = `
  id, category, name_ja, name_ko, description_ja, description_ko,
  price, list_price, season, is_new, is_best, sold_out, rating, review_count,
  brands ( name_ja ),
  product_variants ( color, size ),
  product_images ( url, sort_order )
`;

export async function listProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .order("created_at", { ascending: true });
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
