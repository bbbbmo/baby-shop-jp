import type { Locale } from "@/shared/i18n/types";

const LOCALE_TAG: Record<Locale, string> = {
  ja: "ja-JP",
  ko: "ko-KR",
};

export const formatYen = (value: number): string =>
  `¥${value.toLocaleString("ja-JP")}`;

export const discountRate = (price: number, listPrice: number): number => {
  if (listPrice <= 0 || price >= listPrice) {
    return 0;
  }
  return Math.round((1 - price / listPrice) * 100);
};

export const localeTag = (locale: Locale): string => LOCALE_TAG[locale];
