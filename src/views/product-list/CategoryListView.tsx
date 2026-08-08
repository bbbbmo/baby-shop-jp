"use client";

import { notFound, useParams } from "next/navigation";
import { getCategoryTitle, isCategorySlug } from "@/entities/category";
import { useProducts, getByCategory } from "@/entities/product";
import { ProductBrowser } from "@/widgets/product-browser";
import { QueryGuard } from "@/shared/ui/QueryGuard";

export function CategoryListView() {
  const params = useParams<{ category: string }>();
  const { category } = params;
  const { data: products = [], isLoading, error } = useProducts();

  if (!isCategorySlug(category)) {
    notFound();
  }

  return (
    <QueryGuard isLoading={isLoading} error={error}>
      <ProductBrowser
        title={getCategoryTitle(category)}
        products={getByCategory(products, category)}
      />
    </QueryGuard>
  );
}
