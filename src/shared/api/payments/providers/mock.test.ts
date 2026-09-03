import { describe, expect, it } from "vitest";
import { PaymentError } from "../types";
import { buildMockPayUrl, mockProvider, readMockOutcome } from "./mock";

const intent = {
  paymentId: "pay-1",
  orderNumber: "CM260903-ABC",
  market: "kr" as const,
  method: "mock",
  amount: 33000,
  currency: "KRW" as const,
  itemName: "베이비 가디건 외 1건",
  buyerName: "홍길동",
  buyerEmail: "a@b.com",
  returnUrl: "http://localhost:3000/api/payments/return/mock?ref=pay-1",
  cancelUrl: "http://localhost:3000/kr/checkout",
};

describe("buildMockPayUrl", () => {
  it("마켓 접두사가 붙은 가짜 결제창 경로를 만든다", () => {
    expect(buildMockPayUrl(intent)).toContain("/kr/checkout/mock-pay?");
  });

  it("복귀 URL과 금액을 쿼리로 넘긴다", () => {
    const url = new URL(buildMockPayUrl(intent), "http://localhost:3000");
    expect(url.searchParams.get("amount")).toBe("33000");
    expect(url.searchParams.get("returnUrl")).toBe(intent.returnUrl);
  });
});

describe("readMockOutcome", () => {
  it("승인이면 결제 결과를 돌려준다", () => {
    const result = readMockOutcome({ mockResult: "approved" }, "pay-1", 33000);
    expect(result).toEqual({
      providerTxnId: "mock-txn-pay-1",
      paidAmount: 33000,
      raw: { mockResult: "approved" },
    });
  });

  it("mockAmount가 있으면 그 금액으로 승인한다 (금액 불일치 재현용)", () => {
    const result = readMockOutcome({ mockResult: "approved", mockAmount: "10" }, "pay-1", 33000);
    expect(result.paidAmount).toBe(10);
  });

  it("취소는 userCancelled로 옮긴다", () => {
    expect(() => readMockOutcome({ mockResult: "cancelled" }, "pay-1", 1)).toThrow(
      new PaymentError("userCancelled"),
    );
  });

  it("실패는 providerDown으로 옮긴다", () => {
    expect(() => readMockOutcome({ mockResult: "failed" }, "pay-1", 1)).toThrow(
      new PaymentError("providerDown"),
    );
  });

  it("모르는 값은 unknown이다", () => {
    expect(() => readMockOutcome({}, "pay-1", 1)).toThrow(new PaymentError("unknown"));
  });
});

describe("mockProvider", () => {
  it("한국·일본 마켓을 모두 지원한다", () => {
    expect(mockProvider.markets).toEqual(["kr", "jp"]);
  });

  it("initiate는 리다이렉트 지시를 돌려준다", async () => {
    const result = await mockProvider.initiate(intent);
    expect(result.providerRef).toBe("mock-ref-pay-1");
    expect(result.nextAction.kind).toBe("redirect");
  });

  it("confirm은 우리 결제 건 id로 거래번호를 만든다", async () => {
    const result = await mockProvider.confirm({
      paymentId: "pay-1",
      providerRef: "mock-ref-pay-1",
      orderNumber: intent.orderNumber,
      amount: 33000,
      query: { mockResult: "approved" },
    });
    expect(result.providerTxnId).toBe("mock-txn-pay-1");
  });

  it("cancel은 언제나 성공한다", async () => {
    const result = await mockProvider.cancel({
      providerTxnId: "mock-txn-pay-1",
      amount: 33000,
      reason: "test",
    });
    expect(result.raw).toEqual({ cancelled: "mock-txn-pay-1" });
  });
});
