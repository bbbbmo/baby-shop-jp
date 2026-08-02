"use client";

import { notFound, useParams } from "next/navigation";
import { getCategoryTitle, isCategorySlug } from "@/entities/category";
import { getByCategory } from "@/entities/product";
import { ProductBrowser } from "@/widgets/product-browser";

export function CategoryListView() {
  const params = useParams<{ category: string }>();
  const { category } = params;

  if (!isCategorySlug(category)) {
    notFound();
  }

  return (
    <ProductBrowser
      title={getCategoryTitle(category)}
      products={getByCategory(category)}
    />
  );
}
