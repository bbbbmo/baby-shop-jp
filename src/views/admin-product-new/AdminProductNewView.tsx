"use client";

import { useBrands, useColors, useSizes, AdminProductForm, EMPTY_PRODUCT_FORM_VALUES } from "@/features/admin-product-form";
import { QueryGuardBase } from "@/shared/ui/QueryGuardBase";

export function AdminProductNewView() {
  const brands = useBrands();
  const colors = useColors();
  const sizes = useSizes();
  const isLoading = brands.isLoading || colors.isLoading || sizes.isLoading;
  const error = brands.error ?? colors.error ?? sizes.error;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-6 text-xl font-bold text-foreground">상품 등록</h1>
      <QueryGuardBase errorText="불러오지 못했습니다. 다시 시도해 주세요." isLoading={isLoading} error={error}>
        <AdminProductForm
          productId={null}
          defaultValues={EMPTY_PRODUCT_FORM_VALUES}
          brands={brands.data ?? []}
          colors={colors.data ?? []}
          sizes={sizes.data ?? []}
        />
      </QueryGuardBase>
    </div>
  );
}
