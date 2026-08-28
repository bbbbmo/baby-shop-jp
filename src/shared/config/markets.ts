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

export type Currency = "JPY" | "KRW";

type MarketConfig = {
  currency: Currency;
  priceColumn: "price_jpy" | "price_krw";
  listPriceColumn: "list_price_jpy" | "list_price_krw";
  freeShippingThreshold: number;
  shippingFee: number;
};

export const MARKET_CONFIG: Record<Market, MarketConfig> = {
  jp: {
    currency: "JPY",
    priceColumn: "price_jpy",
    listPriceColumn: "list_price_jpy",
    freeShippingThreshold: 5000,
    shippingFee: 550,
  },
  kr: {
    currency: "KRW",
    priceColumn: "price_krw",
    listPriceColumn: "list_price_krw",
    // 잠정값 — 한국 배송비 정책이 확정되면 이 두 줄만 고친다.
    // docs/open-decisions.md A-1 참고.
    freeShippingThreshold: 30000,
    shippingFee: 3000,
  },
};

export function marketCurrency(market: Market): Currency {
  return MARKET_CONFIG[market].currency;
}

export function shippingFeeFor(market: Market, subtotal: number): number {
  const { freeShippingThreshold, shippingFee } = MARKET_CONFIG[market];
  return subtotal >= freeShippingThreshold ? 0 : shippingFee;
}
