import { describe, expect, it } from "vitest";
import {
  DEFAULT_MARKET,
  MARKETS,
  MARKET_CONFIG,
  isMarket,
  marketLocale,
  shippingFeeFor,
} from "./markets";

describe("isMarket", () => {
  it("accepts the two known markets", () => {
    expect(isMarket("jp")).toBe(true);
    expect(isMarket("kr")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isMarket("us")).toBe(false);
    expect(isMarket("admin")).toBe(false);
    expect(isMarket("")).toBe(false);
    expect(isMarket(undefined)).toBe(false);
    expect(isMarket(null)).toBe(false);
    expect(isMarket(0)).toBe(false);
  });
});

describe("marketLocale", () => {
  it("maps each market to its fixed language", () => {
    expect(marketLocale("jp")).toBe("ja");
    expect(marketLocale("kr")).toBe("ko");
  });
});

describe("market constants", () => {
  it("lists every market", () => {
    expect([...MARKETS]).toEqual(["jp", "kr"]);
  });

  it("defaults to the japanese market", () => {
    expect(DEFAULT_MARKET).toBe("jp");
  });

  it("has a locale for every market", () => {
    for (const market of MARKETS) {
      expect(marketLocale(market)).toMatch(/^(ja|ko)$/);
    }
  });
});

describe("MARKET_CONFIG", () => {
  it("gives each market its own currency", () => {
    expect(MARKET_CONFIG.jp.currency).toBe("JPY");
    expect(MARKET_CONFIG.kr.currency).toBe("KRW");
  });

  it("points each market at its own price columns", () => {
    expect(MARKET_CONFIG.jp.priceColumn).toBe("price_jpy");
    expect(MARKET_CONFIG.jp.listPriceColumn).toBe("list_price_jpy");
    expect(MARKET_CONFIG.kr.priceColumn).toBe("price_krw");
    expect(MARKET_CONFIG.kr.listPriceColumn).toBe("list_price_krw");
  });

  it("keeps the existing japanese shipping policy", () => {
    expect(MARKET_CONFIG.jp.freeShippingThreshold).toBe(5000);
    expect(MARKET_CONFIG.jp.shippingFee).toBe(550);
  });

  it("has a shipping policy for every market", () => {
    for (const market of MARKETS) {
      expect(MARKET_CONFIG[market].shippingFee).toBeGreaterThan(0);
      expect(MARKET_CONFIG[market].freeShippingThreshold).toBeGreaterThan(0);
    }
  });
});

describe("shippingFeeFor", () => {
  it("charges the fee below the threshold", () => {
    expect(shippingFeeFor("jp", 4999)).toBe(550);
  });

  it("is free at exactly the threshold", () => {
    expect(shippingFeeFor("jp", 5000)).toBe(0);
  });

  it("is free above the threshold", () => {
    expect(shippingFeeFor("jp", 5001)).toBe(0);
  });

  it("uses the korean policy for the korean market", () => {
    expect(shippingFeeFor("kr", 29999)).toBe(3000);
    expect(shippingFeeFor("kr", 30000)).toBe(0);
  });
});
