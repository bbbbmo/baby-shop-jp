"use client";

import { useBrands, useColors, useSizes, AdminProductForm, EMPTY_PRODUCT_FORM_VALUES } from "@/features/admin-product-form";
import { QueryGuard } from "@/shared/ui/QueryGuard";

export function AdminProductNewView() {
  const brands = useBrands();
  const colors = useColors();
  const sizes = useSizes();
  const isLoading = brands.isLoading || colors.isLoading || sizes.isLoading;
  const error = brands.error ?? colors.error ?? sizes.error;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-6 text-xl font-bold text-foreground">상품 등록</h1>
      <QueryGuard isLoading={isLoading} error={error}>
        <AdminProductForm
          productId={null}
          defaultValues={EMPTY_PRODUCT_FORM_VALUES}
          brands={brands.data ?? []}
          colors={colors.data ?? []}
          sizes={sizes.data ?? []}
        />
      </QueryGuard>
    </div>
  );
}
