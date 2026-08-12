import { supabase } from "./client";
import {
  mapAdminProductListRow,
  mapAdminProductDetailRow,
  type AdminProductListRow,
  type AdminProductListItem,
  type AdminProductDetailRow,
  type AdminProductDetail,
} from "./admin.mappers";

export type { AdminProductListItem, AdminProductDetail };

const ADMIN_LIST_SELECT = `
  id, name_ja, category, price, sold_out,
  brands ( name_ja ),
  product_variants ( stock ),
  product_images ( url, sort_order )
`;

export async function listAdminProducts(): Promise<AdminProductListItem[]> {
  const { data, error } = await supabase
    .from("products")
    .select(ADMIN_LIST_SELECT)
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return (data as unknown as AdminProductListRow[]).map(mapAdminProductListRow);
}

const ADMIN_DETAIL_SELECT = `
  id, brand_id, category, name_ja, name_ko, description_ja, description_ko,
  price, list_price, season, is_new, is_best, sold_out
`;

export async function getAdminProduct(id: string): Promise<AdminProductDetail | null> {
  const { data, error } = await supabase
    .from("products")
    .select(ADMIN_DETAIL_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data ? mapAdminProductDetailRow(data as unknown as AdminProductDetailRow) : null;
}

export type AdminProductImage = { id: string; url: string; sortOrder: number };

export async function getProductImages(productId: string): Promise<AdminProductImage[]> {
  const { data, error } = await supabase
    .from("product_images")
    .select("id, url, sort_order")
    .eq("product_id", productId)
    .order("sort_order", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((r) => ({ id: r.id, url: r.url, sortOrder: r.sort_order }));
}

export type AdminBrand = { id: string; nameJa: string };

export async function listBrands(): Promise<AdminBrand[]> {
  const { data, error } = await supabase
    .from("brands")
    .select("id, name_ja")
    .order("name_ja", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return (data ?? []).map((r) => ({ id: r.id, nameJa: r.name_ja }));
}
