import { describe, expect, it } from "vitest";
import { DEFAULT_MARKET, MARKETS, isMarket, marketLocale } from "./markets";

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
