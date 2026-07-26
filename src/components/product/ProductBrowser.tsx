"use client";

import { useMemo, useState } from "react";
import type { Product } from "@/lib/types";
import { useLocale } from "@/i18n/LocaleProvider";
import { ProductGrid } from "./ProductGrid";
import { FilterBar, type SortKey, type SeasonKey } from "./FilterBar";

const collectSizes = (products: Product[]): string[] => {
  const set = new Set<string>();
  products.forEach((p) => p.sizes.forEach((s) => set.add(s)));
  return Array.from(set);
};

const bySeason = (season: SeasonKey) => (p: Product) =>
  season === "all" || p.season === season || p.season === "all";

const bySizes = (sizes: string[]) => (p: Product) =>
  sizes.length === 0 || p.sizes.some((s) => sizes.includes(s));

const SORTERS: Record<SortKey, (a: Product, b: Product) => number> = {
  recommended: (a, b) => Number(b.isBest) - Number(a.isBest),
  priceAsc: (a, b) => a.price - b.price,
  priceDesc: (a, b) => b.price - a.price,
  new: (a, b) => Number(b.isNew) - Number(a.isNew),
};

export function ProductBrowser({
  title,
  products,
}: {
  title: string;
  products: Product[];
}) {
  const { d } = useLocale();
  const [season, setSeason] = useState<SeasonKey>("all");
  const [sizes, setSizes] = useState<string[]>([]);
  const [sort, setSort] = useState<SortKey>("recommended");

  const available = useMemo(() => collectSizes(products), [products]);
  const result = useMemo(
    () =>
      products
        .filter(bySeason(season))
        .filter(bySizes(sizes))
        .sort(SORTERS[sort]),
    [products, season, sizes, sort],
  );

  return (
    <div className="mx-auto max-w-480 px-6 py-8 sm:px-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted">
          {result.length}
          {d.filter.count}
        </p>
      </header>
      <FilterBar
        sizeOptions={available}
        season={season}
        sizes={sizes}
        sort={sort}
        onSeason={setSeason}
        onSizes={setSizes}
        onSort={setSort}
      />
      {result.length > 0 ? (
        <div className="mt-8">
          <ProductGrid products={result} />
        </div>
      ) : (
        <p className="mt-16 text-center text-sm text-muted">{d.filter.empty}</p>
      )}
    </div>
  );
}
