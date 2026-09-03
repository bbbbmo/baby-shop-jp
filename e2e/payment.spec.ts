import { test, expect } from "@playwright/test";

// 실제 상품 데이터 없이도 도는 구간만 자동화한다.
// 전체 구매 경로는 docs/plans/2026-09-03-payment-abstraction.md의 수동 확인 절차 참고.
const RETURN_URL = "http://localhost:3000/api/payments/return/mock?ref=not-a-real-payment";

function mockPayUrl(): string {
  const params = new URLSearchParams({
    ref: "not-a-real-payment",
    orderNumber: "CM260903-E2E",
    amount: "33000",
    returnUrl: RETURN_URL,
    cancelUrl: "http://localhost:3000/kr/checkout",
  });
  return `/kr/checkout/mock-pay?${params.toString()}`;
}

test("가짜 결제창이 네 가지 결과 버튼을 보여 준다", async ({ page }) => {
  await page.goto(mockPayUrl());
  await expect(page.getByRole("link", { name: "승인", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "금액 불일치 승인" })).toBeVisible();
  await expect(page.getByRole("link", { name: "결제 취소" })).toBeVisible();
  await expect(page.getByRole("link", { name: "결제 실패" })).toBeVisible();
});

test("가짜 결제창이 주문번호와 금액을 보여 준다", async ({ page }) => {
  await page.goto(mockPayUrl());
  await expect(page.getByText("CM260903-E2E")).toBeVisible();
});

// ref가 실재하는 결제 건이 아니므로 복귀 라우트는 어느 마켓 주문인지 알 수 없고
// DEFAULT_MARKET(jp)로 안전하게 되돌린다 — 이 케이스에서는 /kr/checkout이 아니다.
// 게다가 되돌아간 체크아웃 화면은 장바구니가 비어 있으면 곧장 /cart로
// 다시 이동하므로(CheckoutView), 최종 URL을 기다리면 그 클라이언트 리다이렉트와
// 경합한다. 라우트 자체의 303 응답만 확인해 그 경합을 피한다.
test("없는 결제 건으로 복귀하면 체크아웃으로 되돌린다", async ({ page }) => {
  await page.goto(mockPayUrl());
  const [response] = await Promise.all([
    page.waitForResponse((res) => res.url().includes("/api/payments/return/mock")),
    page.getByRole("link", { name: "승인", exact: true }).click(),
  ]);
  expect(response.status()).toBe(303);
  expect(response.headers()["location"] ?? "").toContain("/checkout?payError=");
});

test("결제창 닫기는 체크아웃으로 돌아간다", async ({ page }) => {
  await page.goto(mockPayUrl());
  await page.getByRole("link", { name: "결제창 닫기" }).click();
  await page.waitForURL("**/kr/checkout");
});
