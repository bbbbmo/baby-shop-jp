"use client";

import type { Product } from "@/lib/types";
import { SectionHeader } from "@/shared/ui/SectionHeader";
import { ProductGrid } from "@/components/product/ProductGrid";

type Props = {
  title: string;
  subtitle?: string;
  products: Product[];
  moreHref?: string;
};

export function ProductSection({ title, subtitle, products, moreHref }: Props) {
  return (
    <section className="mx-auto max-w-480 px-6 pt-16 sm:px-10">
      <SectionHeader title={title} subtitle={subtitle} moreHref={moreHref} />
      <ProductGrid products={products.slice(0, 4)} />
    </section>
  );
}
