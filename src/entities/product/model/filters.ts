import type { CategorySlug } from "@/entities/category";
import type { Product } from "./types";

export const getByCategory = (
  products: Product[],
  slug: CategorySlug,
): Product[] => products.filter((p) => p.category === slug);

export const bestProducts = (products: Product[]): Product[] =>
  products.filter((p) => p.isBest);

export const newProducts = (products: Product[]): Product[] =>
  products.filter((p) => p.isNew);

export const searchProducts = (products: Product[], query: string): Product[] => {
  const q = query.trim().toLowerCase();
  if (!q) {
    return [];
  }
  return products.filter((p) => matchesQuery(p, q));
};

const matchesQuery = (p: Product, q: string): boolean => {
  const haystack = `${p.name.ja} ${p.name.ko} ${p.brand}`.toLowerCase();
  return haystack.includes(q);
};
