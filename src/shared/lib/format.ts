import type { Currency } from "@/shared/config/markets";
import type { Locale } from "@/shared/i18n/types";

const LOCALE_TAG: Record<Locale, string> = {
  ja: "ja-JP",
  ko: "ko-KR",
};

// 마켓이 아니라 통화를 받는다. 주문 내역에 찍히는 금액은 "지금 보고 있는 마켓"이
// 아니라 "주문 당시의 통화"이기 때문이다. 호출부에서 명시하게 두면
// 3단계에서 주문에 마켓 컬럼이 생길 때 무엇을 고쳐야 하는지 바로 드러난다.
export const formatPrice = (value: number, currency: Currency): string =>
  currency === "KRW"
    ? `${value.toLocaleString("ko-KR")}원`
    : `¥${value.toLocaleString("ja-JP")}`;

export const discountRate = (price: number, listPrice: number): number => {
  if (listPrice <= 0 || price >= listPrice) {
    return 0;
  }
  return Math.round((1 - price / listPrice) * 100);
};

export const localeTag = (locale: Locale): string => LOCALE_TAG[locale];
