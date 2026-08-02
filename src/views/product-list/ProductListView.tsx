"use client";

import { useLocale } from "@/shared/i18n/LocaleProvider";
import { products } from "@/entities/product";
import { ProductBrowser } from "@/widgets/product-browser";

export function ProductListView() {
  const { d } = useLocale();
  return <ProductBrowser title={d.nav.all} products={products} />;
}
