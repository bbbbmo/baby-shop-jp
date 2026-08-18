import type { Localized } from "@/shared/i18n/types";
import type { CategorySlug } from "@/entities/category";

export type Product = {
  id: string;
  name: Localized;
  brand: string;
  category: CategorySlug;
  price: number;
  listPrice: number;
  colors: string[];
  sizes: string[];
  season: "ss" | "aw" | "all";
  isNew: boolean;
  isBest: boolean;
  soldOut: boolean;
  rating: number;
  reviewCount: number;
  description: Localized;
  images: string[];
};
