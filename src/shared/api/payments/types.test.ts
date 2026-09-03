import { describe, expect, it } from "vitest";
import { PaymentError, toPaymentErrorCode, toPaymentErrorRaw } from "./types";

describe("toPaymentErrorCode", () => {
  it("PaymentError는 자기 코드를 돌려준다", () => {
    expect(toPaymentErrorCode(new PaymentError("userCancelled"))).toBe(
      "userCancelled",
    );
  });

  it("보통 Error는 unknown이다", () => {
    expect(toPaymentErrorCode(new Error("boom"))).toBe("unknown");
  });

  it("Error가 아닌 값을 던져도 unknown이다", () => {
    expect(toPaymentErrorCode("timeout")).toBe("unknown");
    expect(toPaymentErrorCode(undefined)).toBe("unknown");
  });
});

describe("toPaymentErrorRaw", () => {
  it("PaymentError에 담긴 PG 원본을 꺼낸다", () => {
    const raw = { code: "PAY-1", message: "declined" };
    expect(
      toPaymentErrorRaw(new PaymentError("providerDown", { raw })),
    ).toEqual(raw);
  });

  it("원본이 없으면 undefined다", () => {
    expect(toPaymentErrorRaw(new Error("boom"))).toBeUndefined();
  });
});
