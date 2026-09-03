import type { Currency, Market } from "@/shared/config/markets";

// 각 PG의 에러코드를 provider가 이 여섯 개로 옮긴다.
// 화면과 라우트는 이 목록 밖을 모른다.
export type PaymentErrorCode =
  | "userCancelled"
  | "expired"
  | "amountMismatch"
  | "alreadyPaid"
  | "providerDown"
  | "unknown";

export class PaymentError extends Error {
  readonly code: PaymentErrorCode;

  constructor(code: PaymentErrorCode, message?: string) {
    super(message ?? code);
    this.name = "PaymentError";
    this.code = code;
  }
}

export function toPaymentErrorCode(error: unknown): PaymentErrorCode {
  return error instanceof PaymentError ? error.code : "unknown";
}

export type PaymentIntent = {
  paymentId: string; // payments.id — 복귀 URL에 ref로 심는 값
  orderNumber: string;
  market: Market;
  method: string;
  amount: number;
  currency: Currency;
  itemName: string;
  buyerName: string;
  buyerEmail: string;
  returnUrl: string; // ref 쿼리가 이미 붙어 있는 절대 URL
  cancelUrl: string;
};

// 「다음에 무엇을 하라」는 지시. 반환을 URL 하나로 좁히면
// 클라이언트 SDK로 결제창을 여는 PG에서 바로 깨진다.
export type NextAction =
  | { kind: "redirect"; url: string }
  | { kind: "sdk"; sdk: string; params: Record<string, string> };

export type InitiateResult = { providerRef: string; nextAction: NextAction };

// query는 복귀 URL의 쿼리 전체다. pg_token·paymentId·paymentKey 중
// 무엇을 읽을지는 provider가 정한다 — 라우트는 이름을 몰라야 한다.
export type ConfirmInput = {
  providerRef: string;
  orderNumber: string;
  amount: number;
  query: Record<string, string>;
};

export type ConfirmResult = {
  providerTxnId: string;
  paidAmount: number;
  raw: unknown;
};

export type CancelInput = {
  providerTxnId: string;
  amount: number;
  reason: string;
};

export type CancelResult = { raw: unknown };

export type PaymentProvider = {
  id: string;
  markets: readonly Market[];
  initiate(intent: PaymentIntent): Promise<InitiateResult>;
  confirm(input: ConfirmInput): Promise<ConfirmResult>;
  cancel(input: CancelInput): Promise<CancelResult>;
};
