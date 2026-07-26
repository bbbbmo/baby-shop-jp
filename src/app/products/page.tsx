"use client";

import { useLocale } from "@/i18n/LocaleProvider";
import { products } from "@/lib/products";
import { ProductBrowser } from "@/components/product/ProductBrowser";

export default function AllProductsPage() {
  const { d } = useLocale();
  return <ProductBrowser title={d.nav.all} products={products} />;
}
