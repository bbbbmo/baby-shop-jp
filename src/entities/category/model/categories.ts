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
  slug?: CategorySlug;
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
  { kind: "link", href: "/products/mom", slug: "mom", label: "mom" },
  {
    kind: "link",
    href: "/products/accessory",
    slug: "accessory",
    label: "accessory",
  },
  {
    kind: "link",
    href: "/products/gift",
    slug: "gift",
    label: "gift",
    starred: true,
  },
  { kind: "link", href: "/friends", label: "COMO Friends" },
];

export const ALL_CATEGORY_SLUGS: CategorySlug[] = menu.flatMap((entry) =>
  entry.kind === "group"
    ? entry.children.map((c) => c.slug)
    : entry.slug
      ? [entry.slug]
      : [],
);

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
