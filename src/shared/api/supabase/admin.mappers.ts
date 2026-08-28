import type { CategorySlug } from "@/entities/category";

export type AdminProductListRow = {
  id: string;
  name_ja: string;
  category: CategorySlug;
  price_jpy: number;
  price_krw: number | null;
  sold_out: boolean;
  brands: { name_ja: string } | null;
  product_variants: { stock: number }[];
  product_images: { url: string; sort_order: number }[];
};

export type AdminProductListItem = {
  id: string;
  nameJa: string;
  brandName: string;
  category: CategorySlug;
  priceJpy: number;
  priceKrw: number | null;
  soldOut: boolean;
  totalStock: number;
  thumbnailUrl: string | null;
};

export function mapAdminProductListRow(row: AdminProductListRow): AdminProductListItem {
  return {
    id: row.id,
    nameJa: row.name_ja,
    brandName: row.brands?.name_ja ?? "",
    category: row.category,
    priceJpy: row.price_jpy,
    priceKrw: row.price_krw,
    soldOut: row.sold_out,
    totalStock: row.product_variants.reduce((sum, v) => sum + v.stock, 0),
    thumbnailUrl: firstImageUrl(row.product_images),
  };
}

function firstImageUrl(images: { url: string; sort_order: number }[]): string | null {
  if (images.length === 0) {
    return null;
  }
  return [...images].sort((a, b) => a.sort_order - b.sort_order)[0].url;
}

export type AdminProductDetailRow = {
  id: string;
  brand_id: string;
  category: CategorySlug;
  name_ja: string;
  name_ko: string;
  description_ja: string | null;
  description_ko: string | null;
  price_jpy: number;
  list_price_jpy: number;
  price_krw: number | null;
  list_price_krw: number | null;
  season: "ss" | "aw" | "all";
  is_new: boolean;
  is_best: boolean;
  sold_out: boolean;
};

export type AdminProductDetail = {
  id: string;
  brandId: string;
  category: CategorySlug;
  nameJa: string;
  nameKo: string;
  descriptionJa: string;
  descriptionKo: string;
  priceJpy: number;
  listPriceJpy: number;
  priceKrw: number | null;
  listPriceKrw: number | null;
  season: "ss" | "aw" | "all";
  isNew: boolean;
  isBest: boolean;
  soldOut: boolean;
};

export function mapAdminProductDetailRow(row: AdminProductDetailRow): AdminProductDetail {
  return {
    id: row.id,
    brandId: row.brand_id,
    category: row.category,
    nameJa: row.name_ja,
    nameKo: row.name_ko,
    descriptionJa: row.description_ja ?? "",
    descriptionKo: row.description_ko ?? "",
    priceJpy: row.price_jpy,
    listPriceJpy: row.list_price_jpy,
    priceKrw: row.price_krw,
    listPriceKrw: row.list_price_krw,
    season: row.season,
    isNew: row.is_new,
    isBest: row.is_best,
    soldOut: row.sold_out,
  };
}
