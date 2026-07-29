"use client";

import { notFound, useParams } from "next/navigation";
import { getCategoryTitle, isCategorySlug } from "@/lib/categories";
import { getByCategory } from "@/lib/products";
import { ProductBrowser } from "@/components/product/ProductBrowser";

export default function CategoryPage() {
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
