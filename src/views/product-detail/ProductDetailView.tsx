"use client";

import { notFound, useParams } from "next/navigation";
import { useProduct, type Product } from "@/entities/product";
import { QueryGuard } from "@/shared/ui/QueryGuard";
import { ProductDetail } from "./ProductDetail";

export function ProductDetailView() {
  const params = useParams<{ id: string }>();
  const { data: product, isLoading, error } = useProduct(params.id);

  return (
    <QueryGuard isLoading={isLoading} error={error}>
      <ProductDetailBody product={product ?? null} />
    </QueryGuard>
  );
}

function ProductDetailBody({ product }: { product: Product | null }) {
  if (!product) {
    notFound();
  }
  return <ProductDetail product={product} />;
}
