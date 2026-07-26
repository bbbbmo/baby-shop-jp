"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/i18n/LocaleProvider";
import { searchProducts } from "@/lib/products";
import { ProductGrid } from "@/components/product/ProductGrid";

function SearchResults() {
  const { d } = useLocale();
  const params = useSearchParams();
  const query = params.get("q") ?? "";
  const results = searchProducts(query);

  return (
    <div className="mx-auto max-w-480 px-6 py-8 sm:px-10">
      <h1 className="text-xl font-bold text-foreground">
        <span className="text-sage">“{query}”</span>
        {d.search.resultFor}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {results.length}
        {d.filter.count}
      </p>
      {results.length > 0 ? (
        <div className="mt-8">
          <ProductGrid products={results} />
        </div>
      ) : (
        <p className="mt-16 text-center text-sm text-muted">{d.search.empty}</p>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-480 px-6 py-16 sm:px-10" />}>
      <SearchResults />
    </Suspense>
  );
}
