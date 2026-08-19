"use client";

import { useBrands, AdminProductForm, EMPTY_PRODUCT_FORM_VALUES } from "@/features/admin-product-form";
import { QueryGuard } from "@/shared/ui/QueryGuard";

export function AdminProductNewView() {
  const { data: brands, isLoading, error } = useBrands();
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-6 text-xl font-bold text-foreground">상품 등록</h1>
      <QueryGuard isLoading={isLoading} error={error}>
        <AdminProductForm productId={null} defaultValues={EMPTY_PRODUCT_FORM_VALUES} brands={brands ?? []} />
      </QueryGuard>
    </div>
  );
}
