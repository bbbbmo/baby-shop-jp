export type Locale = "ja" | "ko";

export type Localized = {
  ja: string;
  ko: string;
};

export type CategorySlug =
  | "rompers"
  | "innerwear"
  | "tops"
  | "bottoms"
  | "outer"
  | "accessories"
  | "gift";

export type Category = {
  slug: CategorySlug;
  name: Localized;
  emoji: string;
};

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
};
