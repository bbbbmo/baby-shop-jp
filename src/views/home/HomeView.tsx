"use client";

import { useLocale } from "@/shared/i18n/LocaleProvider";
import { useProducts, bestProducts, newProducts } from "@/entities/product";
import { HeroCarousel } from "@/widgets/home-hero";
import { ProductSection } from "@/widgets/home-product-section";
import { FriendsSection } from "@/widgets/friends-section";

export function HomeView() {
  const { d } = useLocale();
  const { data: products = [] } = useProducts();

  return (
    <div className="pb-4">
      <HeroCarousel />
      <ProductSection
        title={d.home.bestTitle}
        products={bestProducts(products)}
        moreHref="/products"
      />
      <ProductSection
        title={d.home.newTitle}
        products={newProducts(products)}
        moreHref="/products"
      />
      <FriendsSection />
    </div>
  );
}
