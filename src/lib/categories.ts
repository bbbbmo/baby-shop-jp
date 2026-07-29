import type { Audience, CategorySlug, ClothingType } from "./types";

type ClothingTypeDef = { key: ClothingType; label: string };

const CLOTHING_TYPES: ClothingTypeDef[] = [
  { key: "top", label: "Top" },
  { key: "setup", label: "Set up" },
  { key: "bottom", label: "Bottom" },
  { key: "dress", label: "Dress" },
  { key: "homewear", label: "Home wear" },
  { key: "swimwear", label: "Swim wear" },
];

export type MenuLink = {
  kind: "link";
  href: string;
  label: string;
  starred?: boolean;
};

export type MenuGroupChild = {
  slug: CategorySlug;
  label: string;
};

export type MenuGroup = {
  kind: "group";
  key: "girl" | "boy";
  label: string;
  children: MenuGroupChild[];
};

export type MenuEntry = MenuLink | MenuGroup;

const childrenFor = (
  audience: "girl" | "boy",
  types: ClothingTypeDef[],
): MenuGroupChild[] =>
  types.map((t) => ({
    slug: `${audience}-${t.key}` as CategorySlug,
    label: t.label,
  }));

export const menu: MenuEntry[] = [
  { kind: "link", href: "/products", label: "All" },
  {
    kind: "group",
    key: "girl",
    label: "girl",
    children: childrenFor("girl", CLOTHING_TYPES),
  },
  {
    kind: "group",
    key: "boy",
    label: "boy",
    children: childrenFor(
      "boy",
      CLOTHING_TYPES.filter((t) => t.key !== "dress"),
    ),
  },
  { kind: "link", href: "/products/mom", label: "mom" },
  { kind: "link", href: "/products/accessory", label: "accessory" },
  { kind: "link", href: "/products/gift", label: "gift", starred: true },
];

const ALL_CATEGORY_SLUGS: CategorySlug[] = [
  "girl-top",
  "girl-setup",
  "girl-bottom",
  "girl-dress",
  "girl-homewear",
  "girl-swimwear",
  "boy-top",
  "boy-setup",
  "boy-bottom",
  "boy-homewear",
  "boy-swimwear",
  "mom",
  "accessory",
  "gift",
];

export const isCategorySlug = (value: string): value is CategorySlug =>
  (ALL_CATEGORY_SLUGS as string[]).includes(value);

export const getCategoryTitle = (slug: CategorySlug): string => {
  if (slug === "mom" || slug === "accessory" || slug === "gift") {
    return slug;
  }
  const [audience, typeKey] = slug.split("-") as [Audience, ClothingType];
  const type = CLOTHING_TYPES.find((t) => t.key === typeKey);
  return `${audience} / ${type?.label ?? typeKey}`;
};
