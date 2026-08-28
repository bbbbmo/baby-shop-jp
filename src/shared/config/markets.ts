import type { Locale } from "@/shared/i18n/types";

// 경로 첫 세그먼트가 마켓을 결정한다. 마켓은 통화·배송·주소 형식과
// 표시 언어를 함께 결정하므로 별도의 언어 토글을 두지 않는다.
export type Market = "jp" | "kr";

export const MARKETS = ["jp", "kr"] as const;

// 브라우저 언어가 일본어·한국어 어느 쪽도 아닐 때 보낼 곳.
// 기존 서비스가 일본 대상이었으므로 일본 마켓을 기본으로 둔다.
export const DEFAULT_MARKET: Market = "jp";

const MARKET_LOCALE: Record<Market, Locale> = {
  jp: "ja",
  kr: "ko",
};

export function isMarket(value: unknown): value is Market {
  return value === "jp" || value === "kr";
}

export function marketLocale(market: Market): Locale {
  return MARKET_LOCALE[market];
}
