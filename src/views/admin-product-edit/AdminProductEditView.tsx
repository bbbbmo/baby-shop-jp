"use client";

import { useParams } from "next/navigation";
import { QueryGuard } from "@/shared/ui/QueryGuard";
import { useBrands, AdminProductForm, ImageUploader } from "@/features/admin-product-form";
import { useAdminProduct } from "./model/useAdminProduct";
import { useAdminVariants } from "./model/useAdminVariants";
import { buildFormDefaults } from "./model/buildFormDefaults";
import { useProductImages } from "./model/useProductImages";

export function AdminProductEditView() {
  const { id } = useParams<{ id: string }>();
  const brands = useBrands();
  const product = useAdminProduct(id);
  const variants = useAdminVariants(id);
  const images = useProductImages(id);

  const isLoading = brands.isLoading || product.isLoading || variants.isLoading || images.isLoading;
  const error = brands.error ?? product.error ?? variants.error ?? images.error;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="mb-6 text-xl font-bold text-foreground">상품 수정</h1>
      <QueryGuard isLoading={isLoading} error={error}>
        {product.data && (
          <>
            <AdminProductForm
              productId={id}
              defaultValues={buildFormDefaults(product.data, variants.data ?? [])}
              brands={brands.data ?? []}
            />
            <ImageUploader productId={id} images={images.data ?? []} />
          </>
        )}
      </QueryGuard>
    </div>
  );
}
