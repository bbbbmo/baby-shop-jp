import type { Category } from "./types";

export const categories: Category[] = [
  { slug: "rompers", name: { ja: "ロンパース", ko: "우주복·롬퍼" }, emoji: "🧸" },
  { slug: "innerwear", name: { ja: "肌着", ko: "내의" }, emoji: "🌿" },
  { slug: "tops", name: { ja: "トップス", ko: "상의" }, emoji: "👕" },
  { slug: "bottoms", name: { ja: "ボトムス", ko: "하의" }, emoji: "🩳" },
  { slug: "outer", name: { ja: "アウター", ko: "아우터" }, emoji: "🧥" },
  { slug: "accessories", name: { ja: "小物", ko: "소품" }, emoji: "🧦" },
  { slug: "gift", name: { ja: "ギフト", ko: "선물세트" }, emoji: "🎁" },
];

export const getCategory = (slug: string): Category | undefined =>
  categories.find((c) => c.slug === slug);
