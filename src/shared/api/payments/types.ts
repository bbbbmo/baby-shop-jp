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

// 화면까지 도달하는 코드는 provider 에러보다 넓다. 승인 RPC가 돌려주는 결과도
// 같은 자리(?payError=)로 흘러가므로 한 union으로 묶어, 사전에 문구가 빠지면
// 타입 검사에서 걸리게 한다.
export type PaymentOutcomeCode = PaymentErrorCode | "notFound" | "notPaid";

export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled";

export class PaymentError extends Error {
  readonly code: PaymentErrorCode;
  // PG 원본 응답. 실패한 결제야말로 나중에 사람이 들여다볼 행이라
  // 코드 한 단어로 줄여 버리지 않는다.
  readonly raw?: unknown;

  // 두 번째 인자를 옵션 객체로 받는다. (code, raw?, message?)로 두면
  // 메시지로 쓰려던 문자열이 조용히 raw 자리에 들어가고, .message는 코드
  // 한 단어로 남는다 — 컴파일도 통과해서 알아채기 어렵다.
  constructor(
    code: PaymentErrorCode,
    options?: { raw?: unknown; message?: string },
  ) {
    super(options?.message ?? code);
    this.name = "PaymentError";
    this.code = code;
    this.raw = options?.raw;
  }
}

export function toPaymentErrorCode(error: unknown): PaymentErrorCode {
  return error instanceof PaymentError ? error.code : "unknown";
}

export function toPaymentErrorRaw(error: unknown): unknown {
  return error instanceof PaymentError ? error.raw : undefined;
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
  // 우리 payments.id. 재시도마다 달라지므로 PG 쪽 주문 식별자로 쓰기 좋다
  // (주문번호는 재시도해도 같아서 대부분의 PG가 거절한다).
  paymentId: string;
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

// provider 구현자에게 거는 계약.
//
// confirm은 **반드시 PG 서버에 직접 확인**해야 한다. 복귀 URL의 쿼리는 손님의
// 브라우저를 거쳐 오므로 그 자체로는 아무것도 증명하지 않는다. 서명 검증이든
// 승인 API 호출이든, PG가 인정하는 방법으로 확인한 뒤에만 정상 반환할 것.
// 이 규칙을 어겨도 타입 검사는 통과한다 — 그래서 여기에 적어 둔다.
// (mock은 쿼리를 그대로 믿는다. 그래서 운영 레지스트리에서 빠진다.)
//
// confirm이 정상 반환하면 그 순간 주문이 결제완료가 된다.
export type PaymentProvider = {
  id: string;
  markets: readonly Market[];
  initiate(intent: PaymentIntent): Promise<InitiateResult>;
  confirm(input: ConfirmInput): Promise<ConfirmResult>;
  cancel(input: CancelInput): Promise<CancelResult>;
};
