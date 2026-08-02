"use client";

import { useLocale } from "@/shared/i18n/LocaleProvider";
import { bestProducts, newProducts } from "@/entities/product";
import { HeroCarousel } from "@/widgets/home-hero";
import { ProductSection } from "@/widgets/home-product-section";
import { FriendsSection } from "@/widgets/friends-section";

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
      <FriendsSection />
    </div>
  );
}
