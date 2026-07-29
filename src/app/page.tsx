"use client";

import { useLocale } from "@/i18n/LocaleProvider";
import { bestProducts, newProducts } from "@/lib/products";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { ProductSection } from "@/components/home/ProductSection";

export default function HomePage() {
  const { d } = useLocale();

  return (
    <div className="pb-4">
      <HeroCarousel />
      <ProductSection
        title={d.home.bestTitle}
        products={bestProducts()}
        moreHref="/products"
      />
      <ProductSection
        title={d.home.newTitle}
        products={newProducts()}
        moreHref="/products"
      />
    </div>
  );
}
