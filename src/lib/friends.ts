import type { FriendLook, Locale, Product } from "./types";
import { getProduct } from "./products";

export const friendLooks: FriendLook[] = [
  {
    id: "look-01",
    handle: "@hana_mam",
    imageSrc: "/friends/look-01.svg",
    modelInfo: { ja: "24ヶ月 / 88cm", ko: "24개월 / 88cm" },
    productIds: ["romper-cloud", "acc-socks-3set"],
  },
  {
    id: "look-02",
    handle: "@yuzu.days",
    imageSrc: "/friends/look-02.svg",
    modelInfo: { ja: "10ヶ月 / 72cm", ko: "10개월 / 72cm" },
    productIds: ["romper-bear", "acc-bib"],
  },
  {
    id: "look-03",
    handle: "@mori_no_ie",
    imageSrc: "/friends/look-03.svg",
    modelInfo: { ja: "18ヶ月 / 82cm", ko: "18개월 / 82cm" },
    productIds: ["romper-knit", "acc-socks-3set"],
  },
  {
    id: "look-04",
    handle: "@kotoha_style",
    imageSrc: "/friends/look-04.svg",
    modelInfo: { ja: "6ヶ月 / 66cm", ko: "6개월 / 66cm" },
    productIds: ["inner-organic-2set"],
  },
  {
    id: "look-05",
    handle: "@sora_to_umi",
    imageSrc: "/friends/look-05.svg",
    modelInfo: { ja: "30ヶ月 / 92cm", ko: "30개월 / 92cm" },
    productIds: ["top-stripe-tee", "bottom-baggy", "acc-hat"],
  },
  {
    id: "look-06",
    handle: "@rina.baby",
    imageSrc: "/friends/look-06.svg",
    modelInfo: { ja: "27ヶ月 / 90cm", ko: "27개월 / 90cm" },
    productIds: ["top-frill", "bottom-leggings"],
  },
  {
    id: "look-07",
    handle: "@han2bit",
    imageSrc: "/friends/look-07.svg",
    modelInfo: { ja: "36ヶ月 / 96cm", ko: "36개월 / 96cm" },
    productIds: ["outer-fleece", "bottom-baggy", "acc-socks-3set"],
  },
  {
    id: "look-08",
    handle: "@zoopeach",
    imageSrc: "/friends/look-08.svg",
    modelInfo: { ja: "21ヶ月 / 86cm", ko: "21개월 / 86cm" },
    productIds: ["outer-vest", "top-frill", "bottom-leggings"],
  },
  {
    id: "look-09",
    handle: "@nagi_0301",
    imageSrc: "/friends/look-09.svg",
    modelInfo: { ja: "14ヶ月 / 78cm", ko: "14개월 / 78cm" },
    productIds: ["inner-longsleeve", "acc-socks-3set"],
  },
  {
    id: "look-10",
    handle: "@mameco_ie",
    imageSrc: "/friends/look-10.svg",
    modelInfo: { ja: "8ヶ月 / 70cm", ko: "8개월 / 70cm" },
    productIds: ["inner-short", "acc-bib"],
  },
  {
    id: "look-11",
    handle: "@tsumugi.log",
    imageSrc: "/friends/look-11.svg",
    modelInfo: { ja: "33ヶ月 / 94cm", ko: "33개월 / 94cm" },
    productIds: ["top-stripe-tee", "acc-hat"],
  },
  {
    id: "look-12",
    handle: "@baby_aoi",
    imageSrc: "/friends/look-12.svg",
    modelInfo: { ja: "12ヶ月 / 75cm", ko: "12개월 / 75cm" },
    productIds: ["inner-longsleeve", "bottom-leggings", "acc-socks-3set"],
  },
];

/** 홈 섹션 캐러셀에 노출하는 룩. 전체 열람은 /friends 가 담당한다. */
export const homeLooks = (): FriendLook[] => friendLooks.slice(0, 8);

/** productIds 를 실제 제품으로 해석한다. */
export const lookProducts = (look: FriendLook): Product[] =>
  look.productIds
    .map(getProduct)
    .filter((p): p is Product => p !== undefined);

/** 이미지 alt 문구. 룩별 코멘트가 없으므로 핸들과 모델정보를 조합한다. */
export const lookAlt = (look: FriendLook, locale: Locale): string =>
  `${look.handle} / ${look.modelInfo[locale]}`;
