import type { AdminProductDetail } from "@/shared/api/supabase/admin";
import type { ProductVariantRow } from "@/shared/api/supabase/catalog";
import type { ProductFormValues } from "@/features/admin-product-form";

export function buildFormDefaults(
  product: AdminProductDetail,
  variants: ProductVariantRow[],
): ProductFormValues {
  return {
    brandId: product.brandId,
    category: product.category,
    nameJa: product.nameJa,
    nameKo: product.nameKo,
    descriptionJa: product.descriptionJa,
    descriptionKo: product.descriptionKo,
    priceJpy: product.priceJpy,
    listPriceJpy: product.listPriceJpy,
    priceKrw: product.priceKrw ?? 0,
    listPriceKrw: product.listPriceKrw ?? 0,
    season: product.season,
    isNew: product.isNew,
    isBest: product.isBest,
    soldOut: product.soldOut,
    variants: variants.map((v) => ({ id: v.id, color: v.color, size: v.size, stock: v.stock })),
  };
}
