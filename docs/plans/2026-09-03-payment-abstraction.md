# 결제 추상화 실행 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PG사가 바뀌어도 앱 코드가 흔들리지 않는 결제 계층을 만들고, 계약 전이라 가짜 결제사(mock)로 결제 전 구간을 동작시킨다.

**Architecture:** `src/shared/api/payments/`에 `initiate / confirm / cancel` 세 메서드짜리 `PaymentProvider` 인터페이스를 두고, PG 고유 개념(토큰 이름·에러코드)은 provider 구현 안에 가둔다. Next Route Handler 세 개(`start` / `return/[provider]` / `cancel`)만 앱이 알고, 결제 이력은 `payments` 테이블에 쌓는다. 승인과 주문 확정은 Postgres 함수 하나로 묶어 부분 실패를 없앤다.

**Tech Stack:** Next 16 (App Router, Route Handler), TypeScript, Supabase(Postgres + RPC), zod, vitest, Playwright

**설계 문서:** `docs/specs/2026-09-03-payment-abstraction-design.md`

**플랜 위치에 대한 메모:** superpowers 기본값은 `docs/superpowers/plans/`지만 그 경로는 `.gitignore`에 있다(CLAUDE.md). 이 저장소는 실행 계획을 `docs/plans/`에 커밋해 왔으므로 그 관례를 따른다.

---

## 파일 구조

**새로 만드는 것**

| 경로 | 책임 |
| --- | --- |
| `src/shared/api/payments/types.ts` | 인터페이스·타입·에러 코드. 서버/클라 공용 |
| `src/shared/api/payments/catalog.ts` | 결제수단 표시 목록과 마켓 필터. 클라이언트 안전 |
| `src/shared/api/payments/registry.ts` | provider id → 구현. 서버 전용 |
| `src/shared/api/payments/providers/mock.ts` | 가짜 결제사 |
| `src/shared/lib/siteOrigin.ts` | 결제사에 넘길 절대 URL의 오리진 결정 |
| `src/app/api/payments/start/route.ts` | 결제 시작 |
| `src/app/api/payments/return/[provider]/route.ts` | 결제사 복귀 처리 |
| `src/app/api/payments/cancel/route.ts` | 취소·환불 (관리자 전용) |
| `src/app/[market]/(main)/checkout/mock-pay/page.tsx` | 가짜 결제창 라우트 |
| `src/views/mock-pay/MockPayView.tsx` | 가짜 결제창 화면 |
| `src/features/payment-method/` | 결제수단 선택 UI + 결제 시작 훅 |
| `supabase/migrations/20260903000000_payments.sql` | `payments` 테이블, `orders.status` 확장 |
| `supabase/migrations/20260903010000_payment_rpcs.sql` | `confirm_payment`, `cancel_payment` |
| `e2e/payment.spec.ts` | 가짜 결제창 + 복귀 라우트 회귀 |

**고치는 것**

| 경로 | 무엇 |
| --- | --- |
| `src/entities/order/model/types.ts` | `OrderStatus`에 `paid`·`cancelled` 추가 |
| `src/shared/i18n/dictionaries.ts` | `payment` 블록(ja/ko), 주문 상태 라벨 2종 |
| `src/features/order-lookup-form/OrderLookupForm.tsx` | 상태를 라벨로 매핑 (지금은 항상 「결제 대기」) |
| `src/views/checkout/CheckoutView.tsx` | 결제수단 선택 + 주문 생성 후 결제 시작 |

**서버 전용 파일 규약:** `registry.ts`와 `providers/*.ts` 맨 위에 `import "server-only";`를 단다. 주석 규약보다 빌드 오류가 확실하고, 비밀키를 쥔 모듈이 브라우저 번들로 새는 사고는 되돌릴 수 없다. 이 패키지는 `react-server` 조건이 아닌 곳에서 import하면 일부러 예외를 던지므로, vitest에는 빈 모듈로 바꿔 끼우는 별칭을 넣는다 (Task 1).

**슬라이스 `index.ts`를 두지 않는다:** 이 저장소는 슬라이스마다 public API 배럴을 두지만 `payments`에는 두지 않는다. 배럴 하나에 클라이언트 안전한 `catalog`와 서버 전용 `registry`를 함께 담으면 파일을 갈라 놓은 의미가 사라진다. 호출부는 `@/shared/api/payments/catalog`처럼 파일을 직접 가리킨다.

---

## Task 1: 결제 타입과 결제수단 카탈로그

**Files:**
- Create: `src/shared/api/payments/types.ts`
- Create: `src/shared/api/payments/catalog.ts`
- Test: `src/shared/api/payments/catalog.test.ts`

- [ ] **Step 1: 타입 파일을 만든다**

`src/shared/api/payments/types.ts`:

```ts
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
export type PaymentOutcomeCode =
  | PaymentErrorCode
  | "notFound"
  | "notPaid"
  | "notPending";

export type PaymentStatus = "pending" | "paid" | "failed" | "cancelled";

export class PaymentError extends Error {
  readonly code: PaymentErrorCode;
  // PG 원본 응답. 실패한 결제야말로 나중에 사람이 들여다볼 행이라
  // 코드 한 단어로 줄여 버리지 않는다.
  readonly raw?: unknown;

  // 두 번째 인자를 옵션 객체로 받는다. (code, raw?, message?)로 두면
  // 메시지로 쓰려던 문자열이 조용히 raw 자리에 들어가고, .message는 코드
  // 한 단어로 남는다 — 컴파일도 통과해서 알아채기 어렵다.
  constructor(code: PaymentErrorCode, options?: { raw?: unknown; message?: string }) {
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

export type PaymentProvider = {
  id: string;
  markets: readonly Market[];
  initiate(intent: PaymentIntent): Promise<InitiateResult>;
  confirm(input: ConfirmInput): Promise<ConfirmResult>;
  cancel(input: CancelInput): Promise<CancelResult>;
};
```

- [ ] **Step 2: 카탈로그 테스트를 먼저 쓴다**

`src/shared/api/payments/catalog.test.ts`:

```ts
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
    expect(paymentMethodsFor("kr", false).map((m) => m.id)).not.toContain("mock");
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
```

- [ ] **Step 3: 테스트를 돌려 실패를 확인한다**

Run: `pnpm vitest run src/shared/api/payments/catalog.test.ts`
Expected: FAIL — `Failed to resolve import "./catalog"`

- [ ] **Step 4: 카탈로그를 구현한다**

`src/shared/api/payments/catalog.ts`:

```ts
import type { Market } from "@/shared/config/markets";
import type { Localized } from "@/shared/i18n/types";

// 화면이 보는 결제수단 목록. provider 하나가 결제수단 여럿을 다루므로
// (국내 PG 직계약) provider와 method를 따로 들고 다닌다.
// 비밀키를 쓰는 코드는 providers/에만 있고 이 파일은 클라이언트에 내려가도 안전하다.
export type PaymentMethodOption = {
  id: string;
  provider: string;
  method: string;
  label: Localized;
  markets: readonly Market[];
};

export const PAYMENT_METHODS: readonly PaymentMethodOption[] = [
  {
    id: "mock",
    provider: "mock",
    method: "mock",
    label: { ja: "テスト決済", ko: "테스트 결제" },
    markets: ["kr", "jp"],
  },
];

// includeMock을 인자로 뺀 이유는 테스트 가능성 때문이다.
// 호출부는 기본값을 그대로 쓰면 된다.
export function paymentMethodsFor(
  market: Market,
  includeMock: boolean = process.env.NODE_ENV !== "production",
): PaymentMethodOption[] {
  return PAYMENT_METHODS.filter(
    (m) => m.markets.includes(market) && (includeMock || m.id !== "mock"),
  );
}

// 서버(결제 시작 라우트)도 이 함수로 결제수단을 찾는다. 여기서 mock을 걸러
// 내지 않으면 운영에서 methodId "mock"으로 결제를 통과시킬 수 있다 — 무료 주문.
export function findPaymentMethod(
  id: string,
  includeMock: boolean = process.env.NODE_ENV !== "production",
): PaymentMethodOption | null {
  const found = PAYMENT_METHODS.find((m) => m.id === id) ?? null;
  if (!found || (!includeMock && found.id === "mock")) {
    return null;
  }
  return found;
}
```

- [ ] **Step 5: 타입 파일의 런타임 코드에도 테스트를 붙인다**

`toPaymentErrorCode`는 뒤의 모든 provider 실패가 지나가는 깔때기다. Error가 아닌 값을 던지는
경우(`throw "timeout"`)가 실제로 있으므로 그것까지 고정한다.

`src/shared/api/payments/types.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { PaymentError, toPaymentErrorCode, toPaymentErrorRaw } from "./types";

describe("toPaymentErrorCode", () => {
  it("PaymentError는 자기 코드를 돌려준다", () => {
    expect(toPaymentErrorCode(new PaymentError("userCancelled"))).toBe("userCancelled");
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
    expect(toPaymentErrorRaw(new PaymentError("providerDown", { raw }))).toEqual(raw);
  });

  it("원본이 없으면 undefined다", () => {
    expect(toPaymentErrorRaw(new Error("boom"))).toBeUndefined();
  });
});
```

- [ ] **Step 6: `server-only`를 넣고 vitest가 그것을 통과하게 한다**

설계 문서가 `registry.ts`와 `providers/*`에 `import "server-only"`를 달라고 한다. 주석 규약보다
빌드 오류가 확실하다 — 비밀키를 쥔 모듈이 브라우저 번들로 새는 사고는 되돌릴 수 없다.

Run: `pnpm add server-only`

그런데 이 패키지는 `react-server` 조건이 아닌 곳에서 import하면 **일부러 throw한다**. vitest는
Node로 돌므로 provider와 레지스트리를 부르는 테스트가 전부 죽는다. 빈 모듈로 바꿔 끼운다.

`vitest.config.ts`의 `resolve.alias`를 이렇게 고친다:

```ts
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // server-only는 react-server 조건에서만 빈 모듈이고, 그냥 Node에서
      // import하면 일부러 예외를 던진다. 테스트는 서버 코드를 직접 부르므로
      // 여기서 빈 모듈로 바꿔 끼운다.
      "server-only": path.resolve(__dirname, "./node_modules/server-only/empty.js"),
    },
  },
```

- [ ] **Step 7: 테스트를 돌려 통과를 확인한다**

Run: `pnpm vitest run src/shared/api/payments`
Expected: PASS (12 tests — 카탈로그 6개 + 타입 5개... 실제 개수는 실행 결과를 따른다)

이어서 `pnpm exec tsc --noEmit`과 `pnpm exec eslint src/shared/api/payments`도 돌려 깨끗한지 본다.

- [ ] **Step 8: 커밋**

```bash
git add src/shared/api/payments vitest.config.ts package.json pnpm-lock.yaml
git commit -m "$(cat <<'MSG'
feat(payment): 결제 인터페이스와 결제수단 카탈로그를 둔다

- PG 고유 개념이 화면으로 새지 않으려면 경계 타입을 먼저 고정해야 한다
- 결제수단 목록과 비밀키를 쓰는 코드를 파일 단위로 갈라, 카탈로그가 브라우저에 내려가도 안전하게 한다
- 서버가 쓰는 조회 함수에서도 가짜 결제사를 걸러야 운영에서 무료 주문이 나지 않는다

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

## Task 2: 절대 URL 오리진 헬퍼

결제사에 넘기는 복귀 URL은 절대 URL이어야 한다. 배포처가 미정이라 요청 URL과 환경변수 중 무엇을 믿을지 한 곳에서 정한다.

**Files:**
- Create: `src/shared/lib/siteOrigin.ts`
- Test: `src/shared/lib/siteOrigin.test.ts`

- [ ] **Step 1: 테스트를 먼저 쓴다**

`src/shared/lib/siteOrigin.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { resolveSiteOrigin } from "./siteOrigin";

describe("resolveSiteOrigin", () => {
  it("환경변수가 있으면 그것을 쓴다", () => {
    expect(resolveSiteOrigin("https://como.example", "http://localhost:3000/api/x")).toBe(
      "https://como.example",
    );
  });

  it("환경변수의 끝 슬래시를 떼어낸다", () => {
    expect(resolveSiteOrigin("https://como.example/", "http://localhost:3000/api/x")).toBe(
      "https://como.example",
    );
  });

  it("환경변수에 경로가 붙어 있어도 오리진만 남긴다", () => {
    expect(resolveSiteOrigin("https://como.example/shop", "http://localhost:3000/api/x")).toBe(
      "https://como.example",
    );
  });

  it("환경변수가 없으면 요청 URL의 오리진을 쓴다", () => {
    expect(resolveSiteOrigin(undefined, "http://localhost:3000/api/payments/start")).toBe(
      "http://localhost:3000",
    );
  });

  it("환경변수가 빈 문자열이면 요청 URL을 쓴다", () => {
    expect(resolveSiteOrigin("", "http://localhost:3000/api/x")).toBe("http://localhost:3000");
  });

  // 오타를 조용히 넘기면 결제 복귀가 엉뚱한 곳으로 간다. 그때 디버깅하는 것보다
  // 서버가 뜰 때 죽는 편이 낫다.
  it("환경변수가 URL이 아니면 던진다", () => {
    expect(() => resolveSiteOrigin("como.example", "http://localhost:3000/api/x")).toThrow();
  });
});
```

- [ ] **Step 2: 테스트를 돌려 실패를 확인한다**

Run: `pnpm vitest run src/shared/lib/siteOrigin.test.ts`
Expected: FAIL — `Failed to resolve import "./siteOrigin"`

- [ ] **Step 3: 구현한다**

`src/shared/lib/siteOrigin.ts`:

```ts
// 결제사에 넘기는 복귀 URL은 절대 URL이어야 한다. 프록시 뒤에 서면 요청 URL의
// 호스트가 내부 주소일 수 있으므로 SITE_URL을 우선한다.
// 배포처가 정해지면 그 값을 .env에 넣는다.
//
// NEXT_PUBLIC_ 접두사를 쓰지 않는다. 이 값을 읽는 곳은 서버뿐이고, 접두사를
// 붙이면 쓰지도 않는 값이 클라이언트 번들에 실린다.
//
// URL로 파싱해서 오리진만 남긴다. 끝 슬래시·경로가 함께 정리되고, 오타처럼
// URL이 아닌 값은 여기서 바로 던진다 — 조용히 넘어가면 결제 복귀가 엉뚱한
// 곳으로 가고, 그건 실제 결제 때나 드러난다.
export function resolveSiteOrigin(configured: string | undefined, requestUrl: string): string {
  if (!configured) {
    return new URL(requestUrl).origin;
  }
  return new URL(configured).origin;
}

export function siteOrigin(request: Request): string {
  return resolveSiteOrigin(process.env.SITE_URL, request.url);
}
```

- [ ] **Step 4: 테스트를 돌려 통과를 확인한다**

Run: `pnpm vitest run src/shared/lib/siteOrigin.test.ts`
Expected: PASS (6 tests)

- [ ] **Step 5: 커밋**

```bash
git add src/shared/lib/siteOrigin.ts src/shared/lib/siteOrigin.test.ts
git commit -m "$(cat <<'MSG'
feat(payment): 결제 복귀 URL의 오리진을 한 곳에서 정한다

- 배포처가 미정이라 요청 URL과 환경변수 중 무엇을 믿을지 규칙이 필요하다
- 프록시 뒤에서는 요청 호스트가 내부 주소일 수 있어 환경변수를 우선한다

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

## Task 3: mock provider와 레지스트리

**Files:**
- Create: `src/shared/api/payments/providers/mock.ts`
- Create: `src/shared/api/payments/registry.ts`
- Test: `src/shared/api/payments/providers/mock.test.ts`

- [ ] **Step 1: 테스트를 먼저 쓴다**

`src/shared/api/payments/providers/mock.test.ts`:

```ts
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

  // ref를 빠뜨려도 다른 단언이 전부 통과한다 — 복귀 라우트가 결제 행을 찾는
  // 값이므로 여기서 잡지 않으면 실제 결제 때나 드러난다. 다섯 개를 모두 본다.
  it("결제 건 식별자와 복귀 URL을 쿼리로 넘긴다", () => {
    const url = new URL(buildMockPayUrl(intent), "http://localhost:3000");
    expect(url.searchParams.get("ref")).toBe(intent.paymentId);
    expect(url.searchParams.get("orderNumber")).toBe(intent.orderNumber);
    expect(url.searchParams.get("amount")).toBe("33000");
    expect(url.searchParams.get("returnUrl")).toBe(intent.returnUrl);
    expect(url.searchParams.get("cancelUrl")).toBe(intent.cancelUrl);
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
```

- [ ] **Step 2: 테스트를 돌려 실패를 확인한다**

Run: `pnpm vitest run src/shared/api/payments/providers/mock.test.ts`
Expected: FAIL — `Failed to resolve import "./mock"`

- [ ] **Step 3: mock provider를 구현한다**

`src/shared/api/payments/providers/mock.ts`:

```ts
// 가짜 결제사 — Route Handler 전용. server-only가 클라이언트 번들 유입을 막는다.
// 실제 PG가 계약되기 전까지 결제 전 구간을 동작시키고, 계약 후에도
// e2e 회귀 테스트용으로 남는다.
import "server-only";
import {
  PaymentError,
  type PaymentErrorCode,
  type CancelInput,
  type CancelResult,
  type ConfirmInput,
  type ConfirmResult,
  type InitiateResult,
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
```

- [ ] **Step 4: 레지스트리를 만든다**

`src/shared/api/payments/registry.ts`:

```ts
// provider 구현을 모아 두는 곳 — Route Handler 전용.
// PG가 추가되면 이 파일에 한 줄만 늘어난다.
import "server-only";
import { mockProvider } from "./providers/mock";
import type { PaymentProvider } from "./types";

// 가짜 결제사는 개발·테스트에만 등록한다. 이 가드는 복귀·취소 라우트를 막고,
// catalog의 필터는 시작 라우트를 막는다 — 서로 다른 경로다. 둘이 실제로
// 겹쳐서 막히는 것은 Task 7이 payment.provider와 URL의 provider를 대조한
// 뒤부터다.
const PROVIDERS: Record<string, PaymentProvider> =
  process.env.NODE_ENV === "production" ? {} : { [mockProvider.id]: mockProvider };

export function getProvider(id: string): PaymentProvider | null {
  return PROVIDERS[id] ?? null;
}
```

- [ ] **Step 5: 카탈로그와 레지스트리가 어긋나지 않는지 고정한다**

`PaymentMethodOption.provider`와 `PaymentProvider.id`는 둘 다 그냥 문자열이라 오타가 나도
타입 검사에 안 걸리고 결제 순간에 502로 드러난다. 테스트 하나로 막는다.

`src/shared/api/payments/registry.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { PAYMENT_METHODS } from "./catalog";
import { getProvider } from "./registry";

describe("registry", () => {
  it("카탈로그가 가리키는 provider가 모두 등록되어 있다", () => {
    for (const method of PAYMENT_METHODS) {
      expect(getProvider(method.provider), method.id).not.toBeNull();
    }
  });

  it("모르는 id는 null이다", () => {
    expect(getProvider("nope")).toBeNull();
  });

  // 이 가드가 하는 일 자체를 고정한다. 위 두 테스트는 "개발에서 mock이 있다"만
  // 증명하고, 정작 중요한 "운영에서 없다"는 덮지 못한다.
  // NODE_ENV를 모듈 최상단에서 읽으므로 모듈을 다시 불러와야 한다.
  it("운영에서는 아무 provider도 등록하지 않는다", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();
    const { getProvider: getInProduction } = await import("./registry");
    expect(getInProduction("mock")).toBeNull();
    vi.unstubAllEnvs();
    vi.resetModules();
  });
});
```

`vi`를 import에 더한다: `import { describe, expect, it, vi } from "vitest";`

> **주의:** Next는 빌드할 때 `process.env.NODE_ENV`를 명령어 기준으로 문자열 리터럴로 바꿔 넣는다
> (`next build` → `"production"`, `next dev` → `"development"`). 셸의 `NODE_ENV` 값과 무관하다.
> 그래서 운영 번들에서는 mock 등록 분기가 죽은 코드로 제거된다 — 런타임에 되살릴 방법이 없다.
> 이 테스트는 vitest에서 모듈을 다시 불러오는 것이라 그 최적화와는 별개로 로직만 검증한다.

- [ ] **Step 6: 테스트를 돌려 통과를 확인한다**

Run: `pnpm vitest run src/shared/api/payments`
Expected: 전부 PASS (카탈로그 · 타입 · mock · 레지스트리)

이어서 `pnpm exec tsc --noEmit`도 깨끗한지 본다.

- [ ] **Step 7: 커밋**

```bash
git add src/shared/api/payments
git commit -m "$(cat <<'MSG'
feat(payment): 가짜 결제사와 provider 레지스트리를 만든다

- 계약 전에도 결제 전 구간을 동작시켜야 추상화가 맞는지 검증할 수 있다
- 복귀 쿼리 해석과 에러코드 번역을 순수 함수로 빼서, PG가 바뀌어도 같은 자리를 고치게 한다

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

## Task 4: payments 테이블과 주문 상태 확장

**Files:**
- Create: `supabase/migrations/20260903000000_payments.sql`
- Modify: `src/entities/order/model/types.ts:3`

- [ ] **Step 1: 마이그레이션을 쓴다**

`supabase/migrations/20260903000000_payments.sql`:

```sql
-- 결제 시도 이력. 주문에 컬럼을 붙이지 않는 이유는 재시도 때문이다.
-- 한 수단으로 실패하고 다른 수단으로 다시 하는 일이 흔한데, 주문에 붙이면
-- 그 이력이 덮어써진다.
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  provider text not null,
  method text not null,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'failed', 'cancelled')),
  amount integer not null,
  currency text not null check (currency in ('KRW', 'JPY')),
  provider_ref text,
  provider_txn_id text,
  failure_code text,
  -- PG 원본 응답. 지나간 결제는 복원할 수 없으므로 처음부터 남긴다.
  raw jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  cancelled_at timestamptz
);

create index if not exists payments_order_id_idx on payments(order_id);

-- 한 주문에 성공 결제는 하나뿐이다. 실패한 시도는 행으로 남되 재시도를 막지 않는다.
create unique index if not exists payments_one_paid_per_order
  on payments(order_id) where status = 'paid';

-- 클라이언트는 payments를 직접 읽지 않는다. Route Handler가 service-role로만
-- 접근하므로 정책을 하나도 만들지 않는다 (= anon/authenticated 전면 차단).
alter table payments enable row level security;

-- 결제가 붙으면서 주문 상태가 셋이 된다.
-- 결제 실패는 주문 상태를 바꾸지 않는다 — payments에만 남기고 재시도를 허용한다.
alter table orders drop constraint if exists orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('pending_payment', 'paid', 'cancelled'));
```

- [ ] **Step 2: 마이그레이션을 적용한다**

Run: `npx supabase db push`
Expected: `Applying migration 20260903000000_payments.sql...` 후 오류 없이 종료

> Supabase CLI가 연결되어 있지 않으면 대시보드 SQL Editor에 위 내용을 그대로 붙여 실행한다. 어느 쪽이든 파일은 저장소에 남긴다.

- [ ] **Step 3: 주문 상태 타입을 넓힌다**

`src/entities/order/model/types.ts`의 3번째 줄을 바꾼다.

바꾸기 전:

```ts
export type OrderStatus = "pending_payment";
```

바꾼 뒤:

```ts
export type OrderStatus = "pending_payment" | "paid" | "cancelled";
```

- [ ] **Step 4: 타입 검사와 기존 테스트를 돌린다**

Run: `pnpm exec tsc --noEmit && pnpm test`
Expected: 타입 오류 없음, 기존 테스트 전부 PASS

- [ ] **Step 5: 커밋**

```bash
git add supabase/migrations/20260903000000_payments.sql src/entities/order/model/types.ts
git commit -m "$(cat <<'MSG'
feat(payment): 결제 이력 테이블을 두고 주문 상태를 넓힌다

- 결제는 재시도되므로 이력을 주문 컬럼에 덮어쓰면 안 된다
- PG 원본 응답은 나중에 복원할 수 없어 처음부터 보관한다
- 결제 실패로는 주문 상태를 바꾸지 않아, 다른 수단으로 다시 시도할 수 있게 한다

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

## Task 5: 승인·취소 RPC

승인은 `payments`와 `orders`를 함께 고친다. 둘을 따로 하면 그 사이에 프로세스가 죽었을 때 "돈은 빠졌는데 주문은 미결제"가 된다. 한 함수로 묶는다.

**Files:**
- Create: `supabase/migrations/20260903010000_payment_rpcs.sql`

- [ ] **Step 1: RPC 마이그레이션을 쓴다**

`supabase/migrations/20260903010000_payment_rpcs.sql`:

```sql
-- 결제 승인 확정. payments와 orders를 한 트랜잭션으로 고친다.
-- 반환값: 'ok' | 'notFound' | 'alreadyPaid' | 'notPending' | 'amountMismatch'
create or replace function confirm_payment(
  p_payment_id uuid,
  p_txn_id text,
  p_paid_amount integer,
  p_raw jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_status text;
  v_total integer;
begin
  select order_id, status into v_order_id, v_status
  from public.payments where id = p_payment_id for update;

  if not found then
    return 'notFound';
  end if;

  -- 복귀 URL은 새로고침·뒤로가기로 여러 번 열린다.
  if v_status = 'paid' then
    return 'alreadyPaid';
  end if;

  -- pending이 아닌 것을 승인하지 않는다. 이 검사가 없으면 이미 취소된 결제에
  -- 승인이 한 번 더 들어왔을 때 주문이 조용히 결제완료로 되살아난다.
  if v_status <> 'pending' then
    return 'notPending';
  end if;

  select total_price into v_total from public.orders where id = v_order_id;

  -- 브라우저가 보낸 금액은 어디서도 믿지 않는다. 주문 금액이 기준이다.
  if v_total is distinct from p_paid_amount then
    update public.payments
      set status = 'failed',
          failure_code = 'amountMismatch',
          provider_txn_id = p_txn_id,
          raw = p_raw
      where id = p_payment_id;
    return 'amountMismatch';
  end if;

  update public.payments
    set status = 'paid',
        provider_txn_id = p_txn_id,
        raw = p_raw,
        paid_at = now()
    where id = p_payment_id;

  update public.orders set status = 'paid' where id = v_order_id;

  return 'ok';
end;
$$;

-- 결제 취소 확정. 반환값: 'ok' | 'notFound' | 'notPaid'
create or replace function cancel_payment(
  p_payment_id uuid,
  p_raw jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order_id uuid;
  v_status text;
begin
  select order_id, status into v_order_id, v_status
  from public.payments where id = p_payment_id for update;

  if not found then
    return 'notFound';
  end if;

  if v_status <> 'paid' then
    return 'notPaid';
  end if;

  update public.payments
    set status = 'cancelled',
        raw = p_raw,
        cancelled_at = now()
    where id = p_payment_id;

  update public.orders set status = 'cancelled' where id = v_order_id;

  return 'ok';
end;
$$;

-- 이 두 함수는 Route Handler가 service-role로만 부른다.
-- 손님이나 로그인 사용자가 직접 부를 수 있으면 안 된다.
revoke execute on function confirm_payment(uuid, text, integer, jsonb) from public, anon, authenticated;
revoke execute on function cancel_payment(uuid, jsonb) from public, anon, authenticated;

-- service_role에는 명시적으로 준다. public에서 revoke하면 상속으로 얻던 권한이
-- 함께 사라지는데, 그러면 모든 결제 승인이 실패한다. 기본 권한 설정에 기대지 않는다.
grant execute on function confirm_payment(uuid, text, integer, jsonb) to service_role;
grant execute on function cancel_payment(uuid, jsonb) to service_role;
```

- [ ] **Step 2: 마이그레이션을 적용한다**

Run: `npx supabase db push`
Expected: `Applying migration 20260903010000_payment_rpcs.sql...` 후 오류 없이 종료

- [ ] **Step 3: 커밋**

```bash
git add supabase/migrations/20260903010000_payment_rpcs.sql
git commit -m "$(cat <<'MSG'
feat(payment): 승인·취소를 한 트랜잭션으로 묶는 RPC를 만든다

- 결제와 주문을 따로 고치면 그 틈에서 「돈은 빠졌는데 미결제」가 생긴다
- 금액 대조를 DB 안에서 해, 어떤 경로로 불려도 같은 기준이 적용되게 한다
- 복귀 URL이 여러 번 열려도 안전하도록 이미 승인된 건은 그대로 통과시킨다

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

## Task 6: 결제 시작 라우트

**Files:**
- Create: `src/app/api/payments/start/route.ts`

- [ ] **Step 1: 라우트를 구현한다**

`src/app/api/payments/start/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { supabaseServer } from "@/shared/api/supabase/serverClient";
import { findPaymentMethod, type PaymentMethodOption } from "@/shared/api/payments/catalog";
import { getProvider } from "@/shared/api/payments/registry";
import type { NextAction, PaymentIntent, PaymentProvider } from "@/shared/api/payments/types";
import { siteOrigin } from "@/shared/lib/siteOrigin";
import { marketCurrency, isMarket, type Market } from "@/shared/config/markets";

const bodySchema = z.object({
  orderNumber: z.string().min(1),
  methodId: z.string().min(1),
});

type OrderRow = {
  id: string;
  order_number: string;
  market: string;
  status: string;
  total_price: number;
  recipient_name: string;
  email: string;
};

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const parsed = bodySchema.safeParse(await request.json());
    const method = parsed.success ? findPaymentMethod(parsed.data.methodId) : null;
    if (!parsed.success || !method) {
      return NextResponse.json({ error: "invalidInput" }, { status: 400 });
    }
    return await startPayment(parsed.data.orderNumber, method, siteOrigin(request));
  } catch {
    return NextResponse.json({ error: "unknownError" }, { status: 500 });
  }
}

async function startPayment(
  orderNumber: string,
  method: PaymentMethodOption,
  origin: string,
): Promise<NextResponse> {
  const order = await fetchOrder(orderNumber);
  if (!order || !isMarket(order.market)) {
    return NextResponse.json({ error: "orderNotFound" }, { status: 404 });
  }
  if (order.status !== "pending_payment") {
    return NextResponse.json({ error: "alreadyPaid" }, { status: 409 });
  }
  return await createAndInitiate(order, order.market, method, origin);
}

async function createAndInitiate(
  order: OrderRow,
  market: Market,
  method: PaymentMethodOption,
  origin: string,
): Promise<NextResponse> {
  // provider가 이 마켓을 취급하는지도 본다. 카탈로그와 provider 양쪽이
  // 마켓을 들고 있으므로 어긋나면 결제창까지 갔다가 실패한다.
  const provider = getProvider(method.provider);
  const usable = provider?.markets.includes(market) ? provider : null;
  const paymentId = usable ? await insertPayment(order, market, method) : null;
  if (!usable || !paymentId) {
    return NextResponse.json({ error: "providerDown" }, { status: 502 });
  }
  const intent = buildIntent(order, market, method, paymentId, origin);
  const nextAction = await runInitiate(usable, paymentId, intent);
  return nextAction
    ? NextResponse.json({ paymentId, nextAction })
    : NextResponse.json({ error: "providerDown" }, { status: 502 });
}

async function runInitiate(
  provider: PaymentProvider,
  paymentId: string,
  intent: PaymentIntent,
): Promise<NextAction | null> {
  try {
    const result = await provider.initiate(intent);
    await supabaseServer
      .from("payments")
      .update({ provider_ref: result.providerRef })
      .eq("id", paymentId);
    return result.nextAction;
  } catch {
    await markFailed(paymentId, "providerDown");
    return null;
  }
}

function buildIntent(
  order: OrderRow,
  market: Market,
  method: PaymentMethodOption,
  paymentId: string,
  origin: string,
): PaymentIntent {
  return {
    paymentId,
    orderNumber: order.order_number,
    market,
    method: method.method,
    amount: order.total_price,
    currency: marketCurrency(market),
    // 결제사 화면에 뜨는 상품명 자리다. 주문번호로 둔다 — 상품명을 다시 조회하면
    // 쿼리가 늘고, 무엇을 샀는지가 PG로 더 나간다.
    itemName: order.order_number,
    buyerName: order.recipient_name,
    buyerEmail: order.email,
    returnUrl: `${origin}/api/payments/return/${method.provider}?ref=${paymentId}`,
    cancelUrl: `${origin}/${market}/checkout`,
  };
}

async function fetchOrder(orderNumber: string): Promise<OrderRow | null> {
  const { data } = await supabaseServer
    .from("orders")
    .select("id, order_number, market, status, total_price, recipient_name, email")
    .eq("order_number", orderNumber)
    .maybeSingle();
  return (data as OrderRow | null) ?? null;
}

async function insertPayment(
  order: OrderRow,
  market: Market,
  method: PaymentMethodOption,
): Promise<string | null> {
  const { data } = await supabaseServer
    .from("payments")
    .insert({
      order_id: order.id,
      provider: method.provider,
      method: method.method,
      amount: order.total_price,
      currency: marketCurrency(market),
    })
    .select("id")
    .single();
  return data?.id ?? null;
}

async function markFailed(paymentId: string, code: string): Promise<void> {
  await supabaseServer
    .from("payments")
    .update({ status: "failed", failure_code: code })
    .eq("id", paymentId);
}
```

- [ ] **Step 2: 타입 검사와 린트를 돌린다**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add src/app/api/payments/start/route.ts
git commit -m "$(cat <<'MSG'
feat(payment): 결제 시작 라우트를 만든다

- 결제 금액은 주문 행에서 읽는다. 브라우저가 보낸 금액을 믿으면 안 된다
- 복귀 URL에 우리 payments.id를 심어, 돌아왔을 때 PG 고유 필드 없이 찾을 수 있게 한다
- provider 호출이 실패하면 결제 행을 실패로 닫아 유령 행이 남지 않게 한다

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

## Task 7: 결제사 복귀 라우트

**Files:**
- Create: `src/app/api/payments/return/[provider]/route.ts`

- [ ] **Step 1: 라우트를 구현한다**

`src/app/api/payments/return/[provider]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { supabaseServer } from "@/shared/api/supabase/serverClient";
import { getProvider } from "@/shared/api/payments/registry";
import {
  toPaymentErrorCode,
  toPaymentErrorRaw,
  type PaymentOutcomeCode,
  type PaymentProvider,
} from "@/shared/api/payments/types";
import { siteOrigin } from "@/shared/lib/siteOrigin";
import { DEFAULT_MARKET, isMarket, type Market } from "@/shared/config/markets";

type PaymentRow = {
  id: string;
  provider: string;
  status: string;
  amount: number;
  provider_ref: string | null;
  provider_txn_id: string | null;
  orders: { order_number: string; market: string } | null;
};

// 손님이 결제사에서 돌아오는 자리다. 어떤 경우에도 JSON을 뱉지 않고
// 화면으로 되돌린다 — 흰 화면에 에러 텍스트가 떠서는 안 된다.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ provider: string }> },
): Promise<NextResponse> {
  const origin = siteOrigin(request);
  try {
    const { provider: providerId } = await params;
    const url = new URL(request.url);
    const payment = await fetchPayment(url.searchParams.get("ref"));
    const provider = getProvider(providerId);
    // 결제 행이 어느 PG로 시작됐는지와 URL의 provider가 같아야 한다.
    // 대조하지 않으면 A사로 결제를 시작해 놓고 B사 복귀 URL로 승인시킬 수 있다.
    // 가짜 결제사가 등록된 개발 환경에서는 그게 곧 무료 주문이 된다.
    if (!payment || !provider || payment.provider !== providerId) {
      return fail(origin, DEFAULT_MARKET, "unknown");
    }
    return await settle(payment, provider, toQuery(url), origin);
  } catch {
    return fail(origin, DEFAULT_MARKET, "unknown");
  }
}

async function settle(
  payment: PaymentRow,
  provider: PaymentProvider,
  query: Record<string, string>,
  origin: string,
): Promise<NextResponse> {
  const market = marketOf(payment);
  const orderNumber = payment.orders?.order_number ?? "";
  if (payment.status === "paid") {
    return done(origin, market, orderNumber);
  }
  const confirmed = await confirmWithProvider(payment, provider, query);
  if ("code" in confirmed) {
    await markFailed(payment.id, confirmed.code, confirmed.raw);
    return fail(origin, market, confirmed.code);
  }
  return await applyResult(payment, provider, confirmed, { origin, market, orderNumber });
}

async function confirmWithProvider(
  payment: PaymentRow,
  provider: PaymentProvider,
  query: Record<string, string>,
): Promise<
  { providerTxnId: string; paidAmount: number; raw: unknown }
  | { code: PaymentOutcomeCode; raw: unknown }
> {
  try {
    return await provider.confirm({
      paymentId: payment.id,
      providerRef: payment.provider_ref ?? payment.id,
      orderNumber: payment.orders?.order_number ?? "",
      amount: payment.amount,
      query,
    });
  } catch (error) {
    // PG가 준 원본을 코드 한 단어로 줄이지 않는다. 실패한 행이야말로
    // 나중에 사람이 들여다볼 자리다.
    return { code: toPaymentErrorCode(error), raw: toPaymentErrorRaw(error) };
  }
}

async function applyResult(
  payment: PaymentRow,
  provider: PaymentProvider,
  confirmed: { providerTxnId: string; paidAmount: number; raw: unknown },
  target: { origin: string; market: Market; orderNumber: string },
): Promise<NextResponse> {
  const outcome = await runConfirmRpc(payment.id, confirmed);
  if (outcome === "ok" || outcome === "alreadyPaid") {
    return done(target.origin, target.market, target.orderNumber);
  }
  if (outcome === "amountMismatch") {
    await refundQuietly(provider, confirmed.providerTxnId, confirmed.paidAmount);
  }
  return fail(target.origin, target.market, outcome);
}

// RPC가 돌려주는 문자열을 화면이 아는 코드로 좁힌다. 여기서 좁혀 두면
// 사전에 문구가 빠졌을 때 타입 검사가 잡는다.
function toOutcomeCode(value: string | null): "ok" | PaymentOutcomeCode {
  const known = [
    "ok",
    "notFound",
    "notPaid",
    "notPending",
    "alreadyPaid",
    "amountMismatch",
  ] as const;
  return known.includes(value as (typeof known)[number])
    ? (value as "ok" | PaymentOutcomeCode)
    : "unknown";
}

async function runConfirmRpc(
  paymentId: string,
  confirmed: { providerTxnId: string; paidAmount: number; raw: unknown },
): Promise<"ok" | PaymentOutcomeCode> {
  const { data, error } = await supabaseServer.rpc("confirm_payment", {
    p_payment_id: paymentId,
    p_txn_id: confirmed.providerTxnId,
    p_paid_amount: confirmed.paidAmount,
    p_raw: confirmed.raw ?? {},
  });
  return error ? "unknown" : toOutcomeCode(data as string | null);
}

// 금액이 다르면 받은 돈을 돌려주려 시도한다. 이 호출이 실패해도 손님을
// 붙잡아 둘 수는 없다 — payments 행에 failed로 남아 관리자가 확인한다.
async function refundQuietly(
  provider: PaymentProvider,
  providerTxnId: string,
  amount: number,
): Promise<void> {
  try {
    await provider.cancel({ providerTxnId, amount, reason: "amountMismatch" });
  } catch {
    // 남길 곳은 payments.failure_code 하나뿐이다
  }
}

function toQuery(url: URL): Record<string, string> {
  return Object.fromEntries(url.searchParams.entries());
}

function marketOf(payment: PaymentRow): Market {
  const market = payment.orders?.market;
  return isMarket(market) ? market : DEFAULT_MARKET;
}

function done(origin: string, market: Market, orderNumber: string): NextResponse {
  return NextResponse.redirect(
    `${origin}/${market}/checkout/complete?order=${encodeURIComponent(orderNumber)}`,
    303,
  );
}

function fail(origin: string, market: Market, code: PaymentOutcomeCode): NextResponse {
  return NextResponse.redirect(
    `${origin}/${market}/checkout?payError=${encodeURIComponent(code)}`,
    303,
  );
}

async function fetchPayment(ref: string | null): Promise<PaymentRow | null> {
  if (!ref) {
    return null;
  }
  const { data } = await supabaseServer
    .from("payments")
    .select(
      "id, provider, status, amount, provider_ref, provider_txn_id, orders ( order_number, market )",
    )
    .eq("id", ref)
    .maybeSingle();
  return (data as unknown as PaymentRow | null) ?? null;
}

async function markFailed(
  paymentId: string,
  code: PaymentOutcomeCode,
  raw: unknown,
): Promise<void> {
  await supabaseServer
    .from("payments")
    .update({ status: "failed", failure_code: code, raw: raw ?? null })
    .eq("id", paymentId);
}
```

`applyResult`의 반환 타입에서 `outcome`은 `"ok" | PaymentOutcomeCode`다. `"ok"`와 `"alreadyPaid"`를 먼저 걸러내므로 `fail()`에 넘어가는 값은 `PaymentOutcomeCode`로 좁혀진다. TypeScript가 이를 좁히지 못하면 `fail(target.origin, target.market, outcome as PaymentOutcomeCode)` 대신 `if (outcome === "ok")`와 `if (outcome === "alreadyPaid")`를 따로 분기해 좁힌다 — 캐스팅보다 분기가 낫다.

`ref`가 uuid가 아니면 Postgres가 `22P02` 오류를 낸다. `fetchPayment`가 `error`를 무시하고 `data`만 보므로 `null`이 되어 `fail(...)`로 흘러간다 — 의도한 동작이다.

- [ ] **Step 2: 타입 검사와 린트를 돌린다**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add "src/app/api/payments/return/[provider]/route.ts"
git commit -m "$(cat <<'MSG'
feat(payment): 결제사 복귀 라우트를 만든다

- 손님이 결제사에서 돌아온 자리라 어떤 실패도 JSON이 아니라 화면으로 되돌린다
- 새로고침·뒤로가기로 다시 열려도 승인을 두 번 부르지 않게 한다
- 금액이 다르면 받은 돈을 돌려주려 시도하고, 그 시도가 실패해도 기록은 남긴다

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

## Task 8: 취소 라우트 (관리자 전용)

**Files:**
- Create: `src/app/api/payments/cancel/route.ts`

- [ ] **Step 1: 라우트를 구현한다**

`src/app/api/payments/cancel/route.ts`:

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/shared/api/supabase/requireAdmin";
import { supabaseServer } from "@/shared/api/supabase/serverClient";
import { getProvider } from "@/shared/api/payments/registry";
import { toPaymentErrorCode } from "@/shared/api/payments/types";

// 취소는 관리자만 부른다. 손님 셀프 취소 화면은 범위 밖이다 —
// 취소 가능 기간·배송 단계 같은 운영 정책이 아직 없다.
const bodySchema = z.object({
  orderNumber: z.string().min(1),
  reason: z.string().max(200).optional(),
});

type PaidPayment = {
  id: string;
  provider: string;
  amount: number;
  provider_txn_id: string | null;
};

export async function POST(request: Request): Promise<NextResponse> {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ error: "unauthorized" }, { status: auth.status });
  }
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalidInput" }, { status: 400 });
  }
  return await cancelPaid(parsed.data.orderNumber, parsed.data.reason ?? "adminCancel");
}

async function cancelPaid(orderNumber: string, reason: string): Promise<NextResponse> {
  const payment = await fetchPaidPayment(orderNumber);
  if (!payment || !payment.provider_txn_id) {
    return NextResponse.json({ error: "paidPaymentNotFound" }, { status: 404 });
  }
  const failure = await callProviderCancel(payment, reason);
  if (failure) {
    return NextResponse.json({ error: failure }, { status: 502 });
  }
  return await finishCancel(payment.id);
}

async function callProviderCancel(payment: PaidPayment, reason: string): Promise<string | null> {
  const provider = getProvider(payment.provider);
  if (!provider) {
    return "unknown";
  }
  try {
    await provider.cancel({
      providerTxnId: payment.provider_txn_id!,
      amount: payment.amount,
      reason,
    });
    return null;
  } catch (error) {
    return toPaymentErrorCode(error);
  }
}

async function finishCancel(paymentId: string): Promise<NextResponse> {
  const { data, error } = await supabaseServer.rpc("cancel_payment", {
    p_payment_id: paymentId,
    p_raw: {},
  });
  const outcome = error ? "unknown" : ((data as string | null) ?? "unknown");
  return outcome === "ok"
    ? NextResponse.json({ ok: true })
    : NextResponse.json({ error: outcome }, { status: 500 });
}

async function fetchPaidPayment(orderNumber: string): Promise<PaidPayment | null> {
  const { data: order } = await supabaseServer
    .from("orders")
    .select("id")
    .eq("order_number", orderNumber)
    .maybeSingle();
  if (!order) {
    return null;
  }
  const { data } = await supabaseServer
    .from("payments")
    .select("id, provider, amount, provider_txn_id")
    .eq("order_id", order.id)
    .eq("status", "paid")
    .maybeSingle();
  return (data as PaidPayment | null) ?? null;
}
```

- [ ] **Step 2: 타입 검사와 린트를 돌린다**

Run: `pnpm exec tsc --noEmit && pnpm lint`
Expected: 오류 없음

- [ ] **Step 3: 커밋**

```bash
git add src/app/api/payments/cancel/route.ts
git commit -m "$(cat <<'MSG'
feat(payment): 관리자 결제 취소 라우트를 만든다

- 취소 가능 기간·배송 단계 정책이 없어 손님 셀프 취소는 아직 열지 않는다
- PG 취소가 먼저 성공해야 DB를 취소로 바꾼다. 순서를 뒤집으면 장부와 실제가 어긋난다

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

## Task 9: 가짜 결제창

**Files:**
- Create: `src/views/mock-pay/MockPayView.tsx`
- Create: `src/app/[market]/(main)/checkout/mock-pay/page.tsx`

- [ ] **Step 1: 화면을 만든다**

`src/views/mock-pay/MockPayView.tsx`:

```tsx
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

// 실제 PG 결제창을 대신하는 화면. 계약 전에도 결제 전 구간을 돌려보고,
// 계약 후에도 e2e 회귀에 쓴다. 운영에서는 page.tsx가 404로 막는다.
type Outcome = { result: string; amount?: string; label: string };

const OUTCOMES: Outcome[] = [
  { result: "approved", label: "승인" },
  { result: "approved", amount: "1", label: "금액 불일치 승인" },
  { result: "cancelled", label: "결제 취소" },
  { result: "failed", label: "결제 실패" },
];

function MockPayContent() {
  const params = useSearchParams();
  const returnUrl = params.get("returnUrl") ?? "";
  const cancelUrl = params.get("cancelUrl") ?? "";
  const amount = params.get("amount") ?? "";
  const orderNumber = params.get("orderNumber") ?? "";

  return (
    <div className="mx-auto max-w-480 px-6 py-16 sm:px-10">
      <h1 className="text-xl font-bold text-foreground">테스트 결제창</h1>
      <p className="mt-2 text-sm text-muted">
        주문번호 {orderNumber} · 결제금액 {amount}
      </p>
      <div className="mt-8 space-y-3">
        {OUTCOMES.map((outcome) => (
          <OutcomeButton key={outcome.label} outcome={outcome} returnUrl={returnUrl} />
        ))}
        <a
          href={cancelUrl || "/"}
          className="block w-full border border-border py-3 text-center text-sm text-foreground"
        >
          결제창 닫기
        </a>
      </div>
    </div>
  );
}

function OutcomeButton({ outcome, returnUrl }: { outcome: Outcome; returnUrl: string }) {
  return (
    <a
      href={buildReturnHref(returnUrl, outcome)}
      className="block w-full bg-foreground py-3 text-center text-sm text-white hover:opacity-90"
    >
      {outcome.label}
    </a>
  );
}

function buildReturnHref(returnUrl: string, outcome: Outcome): string {
  if (!returnUrl) {
    return "/";
  }
  const url = new URL(returnUrl);
  url.searchParams.set("mockResult", outcome.result);
  if (outcome.amount) {
    url.searchParams.set("mockAmount", outcome.amount);
  }
  return url.toString();
}

export function MockPayView() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-480 px-6 py-16 sm:px-10" />}>
      <MockPayContent />
    </Suspense>
  );
}
```

- [ ] **Step 2: 라우트를 만든다**

`src/app/[market]/(main)/checkout/mock-pay/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import { MockPayView } from "@/views/mock-pay/MockPayView";

export default function MockPayPage() {
  // 가짜 결제창은 개발·테스트 전용이다. 운영에는 존재하지 않아야 한다.
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <MockPayView />;
}
```

- [ ] **Step 3: 화면이 뜨는지 확인한다**

Run: `pnpm dev` 후 브라우저에서
`http://localhost:3000/kr/checkout/mock-pay?orderNumber=TEST&amount=1000&returnUrl=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fpayments%2Freturn%2Fmock%3Fref%3Dtest&cancelUrl=http%3A%2F%2Flocalhost%3A3000%2Fkr%2Fcheckout`

Expected: 「테스트 결제창」과 버튼 5개(승인 / 금액 불일치 승인 / 결제 취소 / 결제 실패 / 결제창 닫기)가 보인다. 「승인」을 누르면 `/kr/checkout?payError=unknown`으로 돌아온다 (`ref=test`가 실제 결제 행이 아니므로 정상 동작이다).

- [ ] **Step 4: 커밋**

```bash
git add src/views/mock-pay "src/app/[market]/(main)/checkout/mock-pay"
git commit -m "$(cat <<'MSG'
feat(payment): 가짜 결제창을 만든다

- 계약 전에도 승인·취소·실패·금액불일치 네 갈래를 전부 밟아볼 수 있어야 한다
- 운영 빌드에서는 404로 막아, 실제 서비스에 테스트 결제 경로가 열리지 않게 한다

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

## Task 10: 사전 문구

**Files:**
- Modify: `src/shared/i18n/dictionaries.ts` (ja 블록 `checkoutComplete` 앞, ko 블록 같은 자리, 그리고 양쪽 `orderLookup`)

- [ ] **Step 1: 일본어 블록에 `payment`를 넣는다**

`dictionaries.ja`의 `checkout: { ... },` 바로 다음, `checkoutComplete:` 바로 앞에 넣는다:

```ts
    payment: {
      methodTitle: "お支払い方法",
      errors: {
        userCancelled: "決済がキャンセルされました。もう一度お試しください。",
        expired: "決済の有効期限が切れました。もう一度お試しください。",
        amountMismatch: "決済金額が一致しませんでした。サポートまでご連絡ください。",
        alreadyPaid: "この注文はすでにお支払い済みです。",
        providerDown: "決済サービスに接続できませんでした。しばらくしてからお試しください。",
        notFound: "決済情報が見つかりませんでした。",
        notPaid: "お支払いが完了していない注文です。",
        notPending: "すでに処理された決済です。",

        unknown: "決済に失敗しました。もう一度お試しください。",
      },
    },
```

- [ ] **Step 2: 한국어 블록에 같은 키를 넣는다**

`dictionaries.ko`의 같은 자리에:

```ts
    payment: {
      methodTitle: "결제수단",
      errors: {
        userCancelled: "결제가 취소되었습니다. 다시 시도해 주세요.",
        expired: "결제 유효시간이 지났습니다. 다시 시도해 주세요.",
        amountMismatch: "결제 금액이 맞지 않습니다. 고객센터로 문의해 주세요.",
        alreadyPaid: "이미 결제가 완료된 주문입니다.",
        providerDown: "결제 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.",
        notFound: "결제 정보를 찾지 못했습니다.",
        notPaid: "결제가 완료되지 않은 주문입니다.",
        notPending: "이미 처리된 결제입니다.",
        unknown: "결제에 실패했습니다. 다시 시도해 주세요.",
      },
    },
```

- [ ] **Step 3: 주문 상태 라벨 두 개를 양쪽에 더한다**

`dictionaries.ja`의 `orderLookup` 안 `statusPendingPayment: "支払い待ち",` 아래에:

```ts
      statusPaid: "お支払い完了",
      statusCancelled: "キャンセル済み",
```

`dictionaries.ko`의 `statusPendingPayment: "결제 대기",` 아래에:

```ts
      statusPaid: "결제 완료",
      statusCancelled: "취소됨",
```

- [ ] **Step 4: 주문 조회 화면이 상태를 반영하게 고친다**

`src/features/order-lookup-form/OrderLookupForm.tsx`의 `OrderResult` 안, 지금 이 줄

```tsx
      <p className="mb-3 font-medium text-foreground">{d.orderLookup.statusPendingPayment}</p>
```

을 이렇게 바꾼다:

```tsx
      <p className="mb-3 font-medium text-foreground">{statusLabel(order.status, d)}</p>
```

그리고 같은 파일 아래쪽(`OrderResultItem` 앞)에 함수를 더한다:

```tsx
// 주문 상태가 셋이 되었다. 지금까지는 항상 「결제 대기」로 적고 있었다.
function statusLabel(status: Order["status"], d: Dictionary): string {
  if (status === "paid") return d.orderLookup.statusPaid;
  if (status === "cancelled") return d.orderLookup.statusCancelled;
  return d.orderLookup.statusPendingPayment;
}
```

파일 위쪽 import에 `Dictionary` 타입을 더한다:

```tsx
import type { Dictionary } from "@/shared/i18n/dictionaries";
```

- [ ] **Step 5: 타입 검사와 테스트를 돌린다**

Run: `pnpm exec tsc --noEmit && pnpm test`
Expected: 오류 없음, 기존 테스트 전부 PASS

- [ ] **Step 6: 커밋**

```bash
git add src/shared/i18n/dictionaries.ts src/features/order-lookup-form/OrderLookupForm.tsx
git commit -m "$(cat <<'MSG'
docs(payment): 결제 문구를 두 언어로 넣고 주문 상태를 반영한다

- 한국 마켓 기능이라도 일본어를 비워 두면 그 화면이 깨진다
- 주문 조회가 상태와 무관하게 항상 「결제 대기」를 적고 있었다

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

## Task 11: 결제수단 선택과 결제 시작 연결

**Files:**
- Create: `src/features/payment-method/index.ts`
- Create: `src/features/payment-method/PaymentMethodPicker.tsx`
- Create: `src/features/payment-method/PaymentErrorBanner.tsx`
- Create: `src/features/payment-method/model/useStartPayment.ts`
- Modify: `src/views/checkout/CheckoutView.tsx:82-85`

- [ ] **Step 1: 결제 시작 훅을 만든다**

`src/features/payment-method/model/useStartPayment.ts`:

```ts
"use client";

import { useState } from "react";
import type { NextAction } from "@/shared/api/payments/types";

type StartResponse = { paymentId: string; nextAction: NextAction } | { error: string };

export function useStartPayment() {
  const [payError, setPayError] = useState<string | null>(null);

  const start = async (orderNumber: string, methodId: string): Promise<void> => {
    setPayError(null);
    try {
      const result = await requestStart(orderNumber, methodId);
      if ("error" in result) {
        setPayError(result.error);
        return;
      }
      performNextAction(result.nextAction);
    } catch {
      setPayError("unknown");
    }
  };

  return { start, payError };
}

async function requestStart(orderNumber: string, methodId: string): Promise<StartResponse> {
  const res = await fetch("/api/payments/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderNumber, methodId }),
  });
  return (await res.json()) as StartResponse;
}

// 결제창을 여는 방법은 PG마다 다르다. 지금은 리다이렉트 하나뿐이고,
// SDK 방식은 실제 PG를 붙이는 태스크에서 이 분기에 더한다.
function performNextAction(action: NextAction): void {
  if (action.kind === "redirect") {
    window.location.assign(action.url);
    return;
  }
  throw new Error(`unsupported nextAction: ${action.kind}`);
}
```

- [ ] **Step 2: 결제수단 선택 UI를 만든다**

`src/features/payment-method/PaymentMethodPicker.tsx`:

```tsx
"use client";

import { useLocale } from "@/shared/i18n/LocaleProvider";
import { useMarket } from "@/shared/market";
import { paymentMethodsFor, type PaymentMethodOption } from "@/shared/api/payments/catalog";

type Props = { value: string; onChange: (methodId: string) => void };

export function PaymentMethodPicker({ value, onChange }: Props) {
  const { locale, d } = useLocale();
  const market = useMarket();
  const methods = paymentMethodsFor(market);

  if (methods.length <= 1) {
    return null;
  }

  return (
    <fieldset className="mb-6">
      <legend className="mb-2 text-sm font-medium text-foreground">
        {d.payment.methodTitle}
      </legend>
      <div className="divide-y divide-border border border-border">
        {methods.map((method) => (
          <MethodRow
            key={method.id}
            method={method}
            label={method.label[locale]}
            checked={value === method.id}
            onChange={onChange}
          />
        ))}
      </div>
    </fieldset>
  );
}

function MethodRow({
  method,
  label,
  checked,
  onChange,
}: {
  method: PaymentMethodOption;
  label: string;
  checked: boolean;
  onChange: (methodId: string) => void;
}) {
  return (
    <label
      className={`flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 text-sm ${
        checked ? "bg-sand text-foreground" : "text-muted"
      }`}
    >
      <input
        type="radio"
        name="paymentMethod"
        value={method.id}
        checked={checked}
        onChange={() => onChange(method.id)}
        className="h-4 w-4 accent-black"
      />
      {label}
    </label>
  );
}
```

- [ ] **Step 3: 결제 실패 안내 배너를 만든다**

`src/features/payment-method/PaymentErrorBanner.tsx`:

```tsx
"use client";

import { useSearchParams } from "next/navigation";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import type { Dictionary } from "@/shared/i18n/dictionaries";

type PaymentErrors = Dictionary["payment"]["errors"];

// 복귀 라우트가 ?payError=<code>로 되돌려 보낸다.
// useSearchParams를 쓰므로 호출부에서 Suspense로 감싼다.
export function PaymentErrorBanner({ code }: { code?: string }) {
  const { d } = useLocale();
  const params = useSearchParams();
  const errorCode = code ?? params.get("payError");
  if (!errorCode) {
    return null;
  }
  const message =
    d.payment.errors[errorCode as keyof PaymentErrors] ?? d.payment.errors.unknown;
  return <p className="mb-6 border border-border bg-sand px-4 py-3 text-sm text-sale">{message}</p>;
}
```

- [ ] **Step 4: public API를 만든다**

`src/features/payment-method/index.ts`:

```ts
export { PaymentMethodPicker } from "./PaymentMethodPicker";
export { PaymentErrorBanner } from "./PaymentErrorBanner";
export { useStartPayment } from "./model/useStartPayment";
```

- [ ] **Step 5: 체크아웃 화면에 연결한다**

`src/views/checkout/CheckoutView.tsx` 위쪽 import에 더한다:

```tsx
import { Suspense, useEffect, useState } from "react";
import { PaymentErrorBanner, PaymentMethodPicker, useStartPayment } from "@/features/payment-method";
```

(기존 `import { useEffect } from "react";`를 위 첫 줄로 대체한다.)

`CheckoutBody` 안, `const { lines, droppedCount } = ...` 아래에 상태를 더한다:

```tsx
  // 기본값을 "mock"으로 박으면 운영 빌드에서 목록이 비었을 때도 그 값이 남아
  // 시작 라우트가 400을 낸다. 목록의 첫 항목에서 끌어온다.
  const methods = paymentMethodsFor(market);
  const [methodId, setMethodId] = useState(methods[0]?.id ?? "");
  const { start, payError } = useStartPayment();
```

`market`은 `CheckoutBody` 안에서 `useMarket()`으로 얻는다. 이미 `OrderSummary`가 쓰고 있으므로 훅은 있다. 아래 import를 더한다:

```tsx
import { paymentMethodsFor } from "@/shared/api/payments/catalog";
import { useMarket } from "@/shared/market";
```

(`useMarket`은 파일 위쪽에 이미 import되어 있으므로 중복해서 넣지 않는다.)

`CheckoutBody` 안의 `const router = useMarketRouter();` 줄을 지운다 (결제로 넘어가므로 여기서 직접 이동하지 않는다). 바깥 `CheckoutView`의 같은 줄은 빈 장바구니 리다이렉트에 계속 쓰이므로 그대로 둔다 — `useMarketRouter` import도 남는다.

그리고 `<DroppedNotice count={droppedCount} />` 바로 아래에 배너를 넣는다:

```tsx
      <Suspense fallback={null}>
        <PaymentErrorBanner code={payError ?? undefined} />
      </Suspense>
```

마지막으로 `<CheckoutForm ... />` 앞에 선택 UI를 넣고 `onSuccess`를 결제 시작으로 바꾼다:

```tsx
        <PaymentMethodPicker value={methodId} onChange={setMethodId} />
        <CheckoutForm
          items={lines}
          prefill={prefill}
          onSuccess={(orderNumber) => start(orderNumber, methodId)}
        />
```

- [ ] **Step 6: 타입 검사·린트·테스트를 돌린다**

Run: `pnpm exec tsc --noEmit && pnpm lint && pnpm test`
Expected: 오류 없음, 기존 테스트 전부 PASS

- [ ] **Step 7: 실제로 결제를 한 바퀴 돌려본다**

Run: `pnpm dev`

1. `http://localhost:3000/kr`에서 상품 하나를 장바구니에 담는다
2. `/kr/checkout`에서 배송 정보를 채우고 주문한다
3. 가짜 결제창에서 「승인」 → `/kr/checkout/complete?order=...`로 이동하고 장바구니가 비는지 확인
4. Supabase에서 `select status from orders where order_number = '...'` → `paid`
5. 다시 한 바퀴 돌려 「금액 불일치 승인」 → `/kr/checkout?payError=amountMismatch`, 주문은 `pending_payment` 유지
6. 「결제 취소」 → `/kr/checkout?payError=userCancelled`
7. 3번의 완료 URL을 브라우저에서 새로고침해도 오류가 나지 않는지 확인

- [ ] **Step 8: 커밋**

```bash
git add src/features/payment-method src/views/checkout/CheckoutView.tsx
git commit -m "$(cat <<'MSG'
feat(payment): 체크아웃에서 결제수단을 고르고 결제를 시작한다

- 주문 생성 직후 결제로 이어져야 「주문했는데 돈은 안 낸」 상태가 화면에 안 남는다
- 화면은 결제수단 목록만 알고 그 뒤에 PG가 몇 곳인지는 모르게 둔다
- 결제창에서 돌아온 실패 사유를 체크아웃 화면에서 그대로 보여 준다

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

## Task 12: e2e 회귀

전체 구매 경로는 Supabase에 실제 상품 데이터가 있어야 해서 CI에서 안정적으로 돌지 않는다. 데이터 없이도 도는 두 구간 — 가짜 결제창 렌더링과 복귀 라우트의 실패 경로 — 을 자동화한다. 전체 경로는 Task 11 Step 7의 수동 확인으로 남긴다.

**Files:**
- Create: `e2e/payment.spec.ts`

- [ ] **Step 1: 테스트를 쓴다**

`e2e/payment.spec.ts`:

```ts
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

test("없는 결제 건으로 복귀하면 체크아웃으로 되돌린다", async ({ page }) => {
  await page.goto(mockPayUrl());
  await page.getByRole("link", { name: "승인", exact: true }).click();
  await page.waitForURL("**/kr/checkout?payError=*");
  expect(page.url()).toContain("payError=");
});

test("결제창 닫기는 체크아웃으로 돌아간다", async ({ page }) => {
  await page.goto(mockPayUrl());
  await page.getByRole("link", { name: "결제창 닫기" }).click();
  await page.waitForURL("**/kr/checkout");
});
```

- [ ] **Step 2: e2e를 돌린다**

Run: `pnpm test:e2e e2e/payment.spec.ts`
Expected: 8 passed (chromium 4 + mobile 4)

- [ ] **Step 3: 커밋**

```bash
git add e2e/payment.spec.ts
git commit -m "$(cat <<'MSG'
test(payment): 가짜 결제창과 복귀 실패 경로를 회귀로 덮는다

- 실제 PG를 붙일 때 이 회귀가 그대로 남아 흐름이 깨졌는지 알려 준다
- 상품 데이터에 기대지 않는 구간만 자동화해 CI에서 흔들리지 않게 한다

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

## Task 13: 문서 갱신

**Files:**
- Modify: `docs/open-decisions.md` (B-2 항목)
- Modify: `docs/known-limitations.md`

- [ ] **Step 1: 미결 항목을 갱신한다**

`docs/open-decisions.md`의 `### B-2. 결제대행사 계약 · **조사 중**` 섹션 끝에 있는

```
**결제 구현은 이번 범위 밖입니다.** 지금 주문은 `결제대기` 상태로만 만들어집니다.
이 항목들이 정해져야 결제 스펙을 시작할 수 있습니다.
```

를 이렇게 바꾼다:

```
**결제 구조는 준비되었습니다.** `docs/specs/2026-09-03-payment-abstraction-design.md`의 설계로
결제 계층이 들어갔고, 계약 전까지는 가짜 결제사(mock)로 전 구간이 동작합니다.
PG사가 정해지면 `src/shared/api/payments/providers/`에 파일 하나를 추가하고
`registry.ts`와 `catalog.ts`에 각각 한 줄씩 더하면 됩니다.

한국 결제는 **국내 PG사 한 곳과 직계약**하는 것으로 방향이 잡혔습니다. 네이버페이·카카오페이는
그 PG가 제공하는 결제수단으로 들어옵니다.

남은 확인 사항
- [ ] 어느 PG사인가 (토스페이먼츠 · 나이스페이 등)
- [ ] 결제사가 가맹점 서버 IP 신고를 요구하는가 (배포처 결정과 엮입니다)
- [ ] 현금영수증 · 에스크로를 대행사가 처리하는가
- [ ] 일본 결제와 한국 결제의 수수료율

### B-4. 배포처 · **미정**

`SITE_URL` 환경변수가 결제 복귀 URL의 오리진을 정합니다. 배포처가 정해지면 그 값을 `.env`에
넣습니다. 넣지 않으면 요청 URL의 오리진을 씁니다 — 로컬 개발은 그대로 동작합니다.
URL이 아닌 값을 넣으면 결제 시작 시점에 바로 예외가 납니다. 조용히 잘못된 주소로 가는 것보다
낫다고 보았습니다.
```

- [ ] **Step 2: 알려진 한계를 더한다**

`docs/known-limitations.md` 끝에 더한다:

```markdown
## 결제창까지 갔다가 이탈한 주문이 쌓인다

주문은 결제 전에 `pending_payment`로 만들어집니다. 손님이 결제창에서 그냥 나가면 그 주문이
그대로 남습니다. 재고를 잡아두지 않으므로 판매에 영향은 없지만, 주문 목록에 미결제 건이 쌓입니다.

정리 작업(만료 처리)은 **주문 만료 정책이 정해진 뒤** 합니다. 며칠 뒤 지울지, 지울지 아니면
상태만 바꿀지가 사업 결정입니다.

## 결제 정산 대사가 없다

`payments.raw`에 PG 원본 응답을 보관하므로 나중에 대사를 붙일 수 있지만, 지금은 자동으로
맞춰 보지 않습니다. PG 관리자 화면과 우리 장부가 어긋나면 사람이 찾아야 합니다.

## 손님이 스스로 주문을 취소할 수 없다

취소·환불은 관리자 라우트(`POST /api/payments/cancel`)로만 됩니다. 취소 가능 기간과 배송 단계별
정책이 정해지면 손님 화면을 엽니다.
```

- [ ] **Step 3: 커밋**

```bash
git add docs/open-decisions.md docs/known-limitations.md
git commit -m "$(cat <<'MSG'
docs(payment): 결제 구조 완료 상태와 남은 한계를 기록한다

- 계약 전이라 무엇이 되고 무엇이 안 되는지 문서에 남아야 다음 사람이 헤매지 않는다
- 배포처가 결제 복귀 URL과 엮인다는 것을 미결 항목으로 드러낸다

Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
MSG
)"
```

---

## 가짜 결제사를 무엇으로 막는가

세 겹이고, 각각 다른 경로를 막는다.

| 겹 | 막는 경로 | 어디 |
| --- | --- | --- |
| `findPaymentMethod`의 mock 필터 | 결제 **시작** | Task 1 |
| 레지스트리가 운영에서 mock을 등록하지 않음 | 결제 **복귀·취소** | Task 3 |
| `payment.provider`와 URL provider 대조 | 결제 **복귀** | Task 7 |

세 번째가 있어야 앞의 둘이 실제로 겹친다. 그것이 없으면 실제 PG로 시작한 결제를 mock 복귀
URL로 승인시킬 수 있고, 이는 PG가 둘만 되어도 생기는 문제다 — mock과 무관한 PG 혼동 버그다.

**판단 하나를 기록해 둔다.** mock 노출 여부를 `NODE_ENV !== "production"`으로 정한다. 이건
fail-open이다 — `pnpm dev`로 띄운 스테이징 서버에는 가짜 결제사가 살아 있다. 명시적 opt-in
(`PAYMENTS_ALLOW_MOCK=1`)이 더 안전하지만, 그 대가로 로컬·CI·e2e 전부에 환경변수가 하나 늘어난다.
**세 번째 겹(provider 대조)이 있으면 mock으로 승인시키려면 그 결제 행 자체가 mock으로 시작됐어야
하고, 그건 시작 라우트가 이미 막는다.** 그래서 지금은 `NODE_ENV`로 둔다.

실제로 돈을 받는 스테이징 환경을 `pnpm dev`로 띄우게 되면 그때 명시적 플래그로 바꾼다.
`docs/open-decisions.md` B-4(배포처)와 함께 결정한다.

---

## 이 설계가 감당하지 못하는 것

**결제가 나중에 확정되는 수단은 이 구조로 안 된다.** 한국 가상계좌·무통장입금, 일본 편의점 결제와
Pay-easy가 여기 해당한다. 손님이 복귀 URL로 돌아온 시점에는 아직 돈이 들어오지 않았고, 며칠 뒤
webhook으로 입금이 통보된다. 그러려면

- `PaymentProvider`에 네 번째 메서드(webhook 서명 검증 + 페이로드 해석)가 필요하고 — `types.ts`가 깨진다
- `POST /api/payments/webhook/[provider]` 라우트가 하나 더 필요하며
- `payments.status`에 「입금 대기」가 하나 더 붙는다

즉 **첫 PG를 카드 위주로 시작하는 한** 아래 「계약 후 남는 일」이 맞지만, 편의점 결제를 붙이는
순간 그 약속은 깨진다. `docs/payment-plan-explainer.md`가 일본 편의점 결제를 비중 있게 다루므로
일본 마켓을 열 때 이 항목이 먼저 온다. 지금 인터페이스에 자리만 미리 파 두지는 않는다 —
구현체가 하나도 없는 상태에서 인터페이스를 넓히지 말라는 CLAUDE.md 지침을 따른다.

---

## 계약 후 남는 일 (이 계획 밖)

PG사가 정해지면 별도 태스크로 진행한다. 이 계획의 목표는 그 태스크를 작게 만드는 것이다.

1. `src/shared/api/payments/providers/<pg>.ts` — `initiate / confirm / cancel` 세 메서드 구현
2. `registry.ts`에 한 줄, `catalog.ts`에 결제수단 항목 추가 (`kakaopay`, `naverpay`, `card`)
3. `useStartPayment`의 `performNextAction`에 `sdk` 분기 추가
4. `.env`에 PG 키와 `SITE_URL`
5. 테스트 키로 승인·취소를 손으로 한 번씩 확인

`types.ts`, 라우트 세 개, `payments` 테이블, RPC, e2e는 손대지 않는다.
