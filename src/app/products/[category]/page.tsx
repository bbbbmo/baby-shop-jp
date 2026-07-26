"use client";

import { notFound, useParams } from "next/navigation";
import { useLocale } from "@/i18n/LocaleProvider";
import { getCategory } from "@/lib/categories";
import { getByCategory } from "@/lib/products";
import type { CategorySlug } from "@/lib/types";
import { ProductBrowser } from "@/components/product/ProductBrowser";

export default function CategoryPage() {
  const { locale } = useLocale();
  const params = useParams<{ category: string }>();
  const category = getCategory(params.category);

  if (!category) {
    notFound();
  }

  return (
    <ProductBrowser
      title={category.name[locale]}
      products={getByCategory(category.slug as CategorySlug)}
    />
  );
}
