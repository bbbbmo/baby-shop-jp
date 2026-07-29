export type Locale = "ja" | "ko";

export type Localized = {
  ja: string;
  ko: string;
};

export type Audience = "girl" | "boy" | "mom" | "accessory" | "gift";

export type ClothingType =
  | "top"
  | "setup"
  | "bottom"
  | "dress"
  | "homewear"
  | "swimwear";

export type CategorySlug =
  | "girl-top"
  | "girl-setup"
  | "girl-bottom"
  | "girl-dress"
  | "girl-homewear"
  | "girl-swimwear"
  | "boy-top"
  | "boy-setup"
  | "boy-bottom"
  | "boy-homewear"
  | "boy-swimwear"
  | "mom"
  | "accessory"
  | "gift";

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
