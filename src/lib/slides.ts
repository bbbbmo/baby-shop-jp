import type { Localized } from "./types";

export type Slide = {
  id: string;
  eyebrow: Localized;
  title: Localized;
  subtitle: Localized;
  cta: Localized;
  href: string;
  emoji: string;
  gradient: string;
};

export const slides: Slide[] = [
  {
    id: "agency",
    eyebrow: { ja: "韓国ベビー服セレクト", ko: "한국 아기옷 셀렉트" },
    title: {
      ja: "人気の韓国ブランドを、\n日本にいながら。",
      ko: "인기 한국 브랜드를,\n일본에서 편하게.",
    },
    subtitle: {
      ja: "話題の韓国ベビー服をまとめて代行購入。",
      ko: "화제의 한국 아기옷을 한 번에 구매대행.",
    },
    cta: { ja: "商品を見る", ko: "상품 보기" },
    href: "/products",
    emoji: "🧸",
    gradient: "bg-gradient-to-br from-sage-soft via-background to-blush-soft",
  },
  {
    id: "freeship",
    eyebrow: { ja: "期間限定キャンペーン", ko: "기간 한정 캠페인" },
    title: {
      ja: "¥5,000以上で\n送料無料。",
      ko: "5,000엔 이상\n무료배송.",
    },
    subtitle: {
      ja: "まとめ買いがおトク。今だけの特典です。",
      ko: "함께 살수록 이득. 지금만의 혜택이에요.",
    },
    cta: { ja: "まとめ買いする", ko: "모아 담기" },
    href: "/products",
    emoji: "🚚",
    gradient: "bg-gradient-to-br from-blush-soft via-background to-sand",
  },
  {
    id: "luckybag",
    eyebrow: { ja: "シーズン限定", ko: "시즌 한정" },
    title: {
      ja: "季節の福袋、\n登場。",
      ko: "시즌 럭키백,\n오픈.",
    },
    subtitle: {
      ja: "人気アイテムを詰め込んだ限定セット。",
      ko: "인기 아이템을 담은 알찬 한정 세트.",
    },
    cta: { ja: "福袋を見る", ko: "럭키백 보기" },
    href: "/products/gift",
    emoji: "🎁",
    gradient: "bg-gradient-to-br from-sand via-background to-sage-soft",
  },
];
