// 가짜 결제사 — Route Handler 전용. server-only가 클라이언트 번들 유입을 막는다.
// 실제 PG가 계약되기 전까지 결제 전 구간을 동작시키고, 계약 후에도
// e2e 회귀 테스트용으로 남는다.
import "server-only";
import {
  PaymentError,
  type CancelInput,
  type CancelResult,
  type ConfirmInput,
  type ConfirmResult,
  type InitiateResult,
  type PaymentErrorCode,
  type PaymentIntent,
  type PaymentProvider,
} from "../types";

export function buildMockPayUrl(intent: PaymentIntent): string {
  const params = new URLSearchParams({
    ref: intent.paymentId,
    orderNumber: intent.orderNumber,
    amount: String(intent.amount),
    returnUrl: intent.returnUrl,
    cancelUrl: intent.cancelUrl,
  });
  return `/${intent.market}/checkout/mock-pay?${params.toString()}`;
}

// 실제 provider에서는 각 PG의 에러코드를 우리 여섯 개로 옮기는 표가 놓이는 자리다.
const MOCK_ERRORS: Record<string, PaymentErrorCode> = {
  cancelled: "userCancelled",
  failed: "providerDown",
};

// 가짜 결제창이 복귀 URL에 붙여 보내는 mockResult를 읽는다.
// 실제 provider에서는 pg_token·paymentKey 같은 PG 고유 필드를 읽는 자리다.
export function readMockOutcome(
  query: Record<string, string>,
  paymentId: string,
  expectedAmount: number,
): ConfirmResult {
  // 승인이 아닌 것은 전부 던진다 — 모르는 값도 통과시키지 않는다.
  if (query.mockResult !== "approved") {
    throw new PaymentError(MOCK_ERRORS[query.mockResult] ?? "unknown");
  }
  const paidAmount = query.mockAmount ? Number(query.mockAmount) : expectedAmount;
  return { providerTxnId: `mock-txn-${paymentId}`, paidAmount, raw: query };
}

// 이 값을 라우트에서 직접 import하지 말 것. 반드시 registry.getProvider를 거친다 —
// 직접 import하면 운영에서 mock을 빼는 가드를 통째로 건너뛴다.
export const mockProvider: PaymentProvider = {
  id: "mock",
  markets: ["kr", "jp"],

  async initiate(intent: PaymentIntent): Promise<InitiateResult> {
    return {
      providerRef: `mock-ref-${intent.paymentId}`,
      nextAction: { kind: "redirect", url: buildMockPayUrl(intent) },
    };
  },

  async confirm(input: ConfirmInput): Promise<ConfirmResult> {
    return readMockOutcome(input.query, input.paymentId, input.amount);
  },

  async cancel(input: CancelInput): Promise<CancelResult> {
    return { raw: { cancelled: input.providerTxnId } };
  },
};
