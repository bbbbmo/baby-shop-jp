import { describe, expect, it } from "vitest";
import { findPaymentMethod, paymentMethodsFor } from "./catalog";

describe("paymentMethodsFor", () => {
  it("한국 마켓에서 mock 결제수단을 돌려준다", () => {
    const ids = paymentMethodsFor("kr", true).map((m) => m.id);
    expect(ids).toContain("mock");
  });

  it("운영에서는 mock을 감춘다", () => {
    expect(paymentMethodsFor("kr", false)).toEqual([]);
  });

  it("해당 마켓을 지원하지 않는 수단은 뺀다", () => {
    const all = paymentMethodsFor("kr", true);
    expect(all.every((m) => m.markets.includes("kr"))).toBe(true);
  });
});

describe("findPaymentMethod", () => {
  it("id로 찾는다", () => {
    expect(findPaymentMethod("mock")?.provider).toBe("mock");
  });

  it("없는 id는 null이다", () => {
    expect(findPaymentMethod("nope")).toBeNull();
  });
});
