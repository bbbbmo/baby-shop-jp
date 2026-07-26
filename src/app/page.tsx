"use client";

import { useLocale } from "@/i18n/LocaleProvider";
import { bestProducts, newProducts } from "@/lib/products";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { CategoryTiles } from "@/components/home/CategoryTiles";
import { ProductSection } from "@/components/home/ProductSection";
import { FeatureBanner } from "@/components/home/FeatureBanner";

export default function HomePage() {
  const { d } = useLocale();

  return (
    <div className="pb-4">
      <HeroCarousel />
      <CategoryTiles />
      <ProductSection
        title={d.home.bestTitle}
        subtitle={d.home.bestSubtitle}
        products={bestProducts()}
        moreHref="/products"
      />
      <FeatureBanner />
      <ProductSection
        title={d.home.newTitle}
        subtitle={d.home.newSubtitle}
        products={newProducts()}
        moreHref="/products"
      />
    </div>
  );
}
