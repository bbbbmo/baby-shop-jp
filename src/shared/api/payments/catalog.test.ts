import { describe, expect, it } from "vitest";
import { findPaymentMethod, paymentMethodsFor } from "./catalog";

describe("paymentMethodsFor", () => {
  it("한국 마켓에서 mock 결제수단을 돌려준다", () => {
    const ids = paymentMethodsFor("kr", true).map((m) => m.id);
    expect(ids).toContain("mock");
  });

  // 목록이 비는지가 아니라 mock이 빠지는지를 본다. 전자는 항목이 하나뿐인
  // 지금만 참이고, 결제수단이 늘면 이유 없이 깨진다.
  it("운영에서는 mock을 감춘다", () => {
    expect(paymentMethodsFor("kr", false).map((m) => m.id)).not.toContain(
      "mock",
    );
  });

  it("돌려준 수단은 모두 그 마켓을 지원한다", () => {
    // 항목이 하나뿐이고 두 마켓을 다 지원해서, 지금은 이 단언이 필터를 실제로
    // 검증하지 못한다. 마켓이 갈리는 수단이 생기면 그때부터 의미가 생긴다.
    for (const market of ["kr", "jp"] as const) {
      const methods = paymentMethodsFor(market, true);
      expect(methods.every((m) => m.markets.includes(market))).toBe(true);
    }
  });
});

describe("findPaymentMethod", () => {
  it("id로 찾는다", () => {
    expect(findPaymentMethod("mock", true)?.provider).toBe("mock");
  });

  it("없는 id는 null이다", () => {
    expect(findPaymentMethod("nope", true)).toBeNull();
  });

  // 서버가 부르는 경로다. 여기가 뚫리면 운영에서 무료 주문이 가능해진다.
  it("운영에서는 mock을 찾지 못한다", () => {
    expect(findPaymentMethod("mock", false)).toBeNull();
  });
});
