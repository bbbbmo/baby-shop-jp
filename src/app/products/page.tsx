"use client";

import { useLocale } from "@/shared/i18n/LocaleProvider";
import { products } from "@/entities/product";
import { ProductBrowser } from "@/components/product/ProductBrowser";

export default function AllProductsPage() {
  const { d } = useLocale();
  return <ProductBrowser title={d.nav.all} products={products} />;
}
