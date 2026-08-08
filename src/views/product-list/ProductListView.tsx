"use client";

import { useLocale } from "@/shared/i18n/LocaleProvider";
import { useProducts } from "@/entities/product";
import { ProductBrowser } from "@/widgets/product-browser";
import { QueryGuard } from "@/shared/ui/QueryGuard";

export function ProductListView() {
  const { d } = useLocale();
  const { data: products = [], isLoading, error } = useProducts();

  return (
    <QueryGuard isLoading={isLoading} error={error}>
      <ProductBrowser title={d.nav.all} products={products} />
    </QueryGuard>
  );
}
