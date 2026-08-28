import { describe, expect, it } from "vitest";
import { discountRate, formatPrice } from "./format";

describe("formatPrice", () => {
  it("formats japanese yen with a leading symbol", () => {
    expect(formatPrice(12000, "JPY")).toBe("¥12,000");
  });

  it("formats korean won with a trailing unit", () => {
    expect(formatPrice(35000, "KRW")).toBe("35,000원");
  });

  it("groups thousands in both currencies", () => {
    expect(formatPrice(1234567, "JPY")).toBe("¥1,234,567");
    expect(formatPrice(1234567, "KRW")).toBe("1,234,567원");
  });

  it("handles zero", () => {
    expect(formatPrice(0, "JPY")).toBe("¥0");
    expect(formatPrice(0, "KRW")).toBe("0원");
  });
});

describe("discountRate", () => {
  it("returns the rounded percentage off", () => {
    expect(discountRate(8000, 10000)).toBe(20);
  });

  it("returns zero when there is no discount", () => {
    expect(discountRate(10000, 10000)).toBe(0);
    expect(discountRate(12000, 10000)).toBe(0);
  });

  it("returns zero when the list price is missing", () => {
    expect(discountRate(8000, 0)).toBe(0);
  });
});
