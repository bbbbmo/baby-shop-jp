"use client";

import { useParams } from "next/navigation";
import { QueryGuardBase } from "@/shared/ui/QueryGuardBase";
import { useBrands, useColors, useSizes, AdminProductForm, ImageUploader } from "@/features/admin-product-form";
import { useAdminProduct } from "./model/useAdminProduct";
import { useAdminVariants } from "./model/useAdminVariants";
import { buildFormDefaults } from "./model/buildFormDefaults";
import { useProductImages } from "./model/useProductImages";

export function AdminProductEditView() {
  const { id } = useParams<{ id: string }>();
  const brands = useBrands();
  const colors = useColors();
  const sizes = useSizes();
  const product = useAdminProduct(id);
  const variants = useAdminVariants(id);
  const images = useProductImages(id);

  const isLoading = brands.isLoading || colors.isLoading || sizes.isLoading || product.isLoading || variants.isLoading || images.isLoading;
  const error = brands.error ?? colors.error ?? sizes.error ?? product.error ?? variants.error ?? images.error;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-6 text-xl font-bold text-foreground">상품 수정</h1>
      <QueryGuardBase errorText="불러오지 못했습니다. 다시 시도해 주세요." isLoading={isLoading} error={error}>
        {product.data && (
          <>
            <AdminProductForm
              productId={id}
              defaultValues={buildFormDefaults(product.data, variants.data ?? [])}
              brands={brands.data ?? []}
              colors={colors.data ?? []}
              sizes={sizes.data ?? []}
            />
            <ImageUploader productId={id} images={images.data ?? []} />
          </>
        )}
      </QueryGuardBase>
    </div>
  );
}
