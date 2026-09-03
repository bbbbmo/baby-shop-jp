# 결제 추상화 설계 — 한국 마켓 먼저

작성일: 2026-09-03

## 목표

한국 마켓에 네이버페이·카카오페이를 포함한 결제를 붙인다.
그러면서 **PG사가 추가되거나 교체되어도 앱 코드가 흔들리지 않게** 경계를 긋는다.

지금 `/api/checkout`은 주문을 `pending_payment`로 만들고 끝난다. 돈을 받는 길이 아예 없다.

## 전제

`docs/payment-plan-explainer.md`에서 정한 것을 그대로 따른다.

- 일본 손님에게는 엔화로, 한국 손님에게는 원화로 받는다. 통화 통일은 하지 않는다
- 한국 결제는 **국내 PG사 한 곳과 직계약**한다 (토스페이먼츠·나이스페이 등, 미정)
- 일본 결제(엑심베이·KOMOJU)는 이번 범위 밖이다. 나중에 provider 하나가 더 붙는 자리만 비워둔다

**계약도 테스트 키도 아직 없다.** 그래서 가짜 결제사(mock)를 정식 provider로 두고 전 구간을 먼저
완성한다. 계약이 끝나면 실제 provider 파일 하나를 추가하는 것으로 끝나야 한다 — 그게 이 설계가
제대로 됐는지 판별하는 기준이다.

## 범위

| 포함 | 제외 |
| --- | --- |
| 결제 시작 · 승인 | 부분취소 · 부분환불 · 교환 |
| 전체 취소 · 환불 | 재고 차감 (별도 작업) |
| 결제수단 선택 UI (한국) | 일본 결제수단 |
| mock provider + e2e | 정산 대사 · 매출 집계 |

---

## 왜 provider 하나에 결제수단 여럿인가

처음에는 네이버페이·카카오페이를 각각 직접 연동하는 안을 검토했다. 그 경우 `provider = 결제수단`이
1:1이 된다. 그런데 국내 PG 한 곳과 직계약하는 쪽으로 정해지면서 관계가 1:N이 된다.

```
provider: tosspayments (예시)
  └ method: kakaopay | naverpay | card | ...
```

**화면은 이 구분을 모른다.** 화면은 「결제수단 목록」을 받아 하나를 고를 뿐이고, 그 뒤에 PG가
하나인지 셋인지는 서버만 안다. 나중에 일본 PG가 붙어도 목록에 항목이 늘 뿐 화면 코드는 그대로다.

---

## 구조

### 파일 배치

Supabase 어댑터와 같은 층에 둔다. CLAUDE.md의 "외부 서비스 접근은 `shared/api`에 모으고, 상위
레이어는 직접 import하지 않는다"를 그대로 적용한다.

```
src/shared/api/payments/
  types.ts          인터페이스와 타입 (서버·클라 공용)
  catalog.ts        결제수단 표시 정보 — 클라이언트 안전
  registry.ts       id → provider 구현 (server-only)
  providers/
    mock.ts         계약 전까지 쓰는 가짜 결제사
    <pg>.ts         (계약 후) 실제 PG 한 개
```

`catalog.ts`와 `providers/`를 나누는 이유는 **비밀키가 브라우저로 새면 안 되기 때문**이다. 화면은
`catalog.ts`만 import하고, `registry.ts`와 `providers/*`에는 `import "server-only"`를 단다.

### 인터페이스

```ts
export type NextAction =
  | { kind: "redirect"; url: string }
  | { kind: "sdk"; sdk: string; params: Record<string, string> };

export type PaymentProvider = {
  id: string;
  markets: readonly Market[];
  initiate(intent: PaymentIntent): Promise<InitiateResult>;   // → { providerRef, nextAction }
  confirm(input: ConfirmInput): Promise<ConfirmResult>;       // → { providerTxnId, paidAmount, raw }
  cancel(input: CancelInput): Promise<CancelResult>;
};
```

`PaymentIntent`에는 주문번호·금액·통화·구매자 정보·복귀 URL과 함께 **`method`**가 들어간다.
provider 하나가 결제수단 여럿을 다루므로 무엇으로 낼지를 함께 넘겨야 한다.

추상화의 성패를 가르는 지점이 셋 있다.

**`confirm`은 복귀 URL의 쿼리를 통째로 받는다.** 카카오는 `pg_token`, 네이버는 `paymentId`,
토스는 `paymentKey`를 돌려준다. 라우트가 이 이름 중 하나라도 알기 시작하면 그 순간 PG가 앱으로
샌다. `query: Record<string, string>`를 그대로 넘기고 무엇을 읽을지는 provider가 정한다.

**`nextAction`은 유니온이다.** 카카오는 서버가 받은 URL로 리다이렉트하고, 국내 PG는 대개
클라이언트 SDK로 결제창을 연다. 반환을 `{ url: string }`으로 좁게 잡으면 두 번째 PG에서 바로
깨진다. 「다음에 무엇을 하라」는 지시로 두면 팝업·iframe 방식이 와도 분기 하나만 는다.

**에러를 번역한다.** 각 PG의 에러코드를 provider가 여섯 개로 옮긴다.

```
userCancelled | expired | amountMismatch | alreadyPaid | providerDown | unknown
```

화면과 라우트는 이 여섯 개만 안다.

### 서버는 Next Route Handler

결제 승인 요청은 반드시 서버에서 나가야 한다. 비밀키가 필요하고, "얼마가 결제됐는지"를 브라우저
말을 믿고 판단하면 안 된다. 주문을 쓰는 코드가 이미 Next 서버(`/api/checkout`)에 있으므로 결제도
같은 자리에 둔다.

Supabase Edge Function으로 빼는 안도 검토했으나 런타임이 갈라져 타입 공유가 끊기고 배포가 두 벌이
된다. CLAUDE.md의 "별도 패키지로 분리하지 마세요"와도 어긋난다.

| 라우트 | 하는 일 |
| --- | --- |
| `POST /api/payments/start` | 주문 확인 → `payments` 삽입 → `initiate` → `nextAction` 반환 |
| `GET /api/payments/return/[provider]` | 결제사가 손님을 돌려보내는 곳. `confirm` → 확정 → 302 |
| `POST /api/payments/cancel` | 취소·환불 |

취소는 **관리자만** 호출한다. 손님이 스스로 주문을 취소하는 화면은 이번 범위 밖이다 — 취소 가능
기간·배송 단계 같은 운영 정책이 아직 없기 때문이다. 라우트는 관리자 권한을 확인한다.

---

## 데이터

### `payments` 테이블

주문에 컬럼을 붙이지 않고 별도 테이블을 둔다. **재시도 때문이다.** 손님이 한 수단으로 시도했다
취소하고 다른 수단으로 다시 하는 일이 흔한데, 주문에 컬럼을 붙이면 이 이력이 덮어써진다.

```
payments
  id               uuid pk
  order_id         → orders
  provider         'mock' | '<pg>'
  method           'kakaopay' | 'naverpay' | 'card' | ...
  status           'pending' | 'paid' | 'failed' | 'cancelled'
  amount           결제 시도 시점의 금액
  currency         'KRW' | 'JPY'
  provider_ref     initiate가 준 값
  provider_txn_id  confirm이 준 값
  raw              PG 원본 응답 jsonb
  created_at / paid_at / cancelled_at
```

`status = 'paid'`인 행에만 걸리는 **부분 유니크 인덱스**를 `order_id`에 둔다. 한 주문에 성공 결제는
하나뿐이되, 실패한 시도는 행으로 남으면서 재시도를 막지 않는다.

`raw`를 보관하는 이유는 **지나간 결제는 복원할 수 없기 때문**이다. 나중에 대사나 분쟁이 생겼을 때
원본이 없으면 방법이 없다. 나중에 넣기가 유독 어려운 항목이라 처음부터 넣는다.

### `orders.status`

`pending_payment | paid | cancelled` 세 개가 된다. `src/entities/order/model/types.ts`의
`OrderStatus`도 함께 넓힌다.

**결제 실패는 주문 상태를 바꾸지 않는다.** `payments`에만 남기고 주문은 `pending_payment`로 둬서
다른 수단으로 다시 시도할 수 있게 한다.

---

## 흐름

```
체크아웃 제출 ──→ POST /api/checkout           (기존 그대로, 주문 생성)
                        ↓ orderNumber
결제수단 선택 ──→ POST /api/payments/start
                        │ 주문 확인 → payments(pending) → provider.initiate
                        ↓ nextAction
              브라우저가 nextAction 수행 (리다이렉트 또는 SDK)
                        ↓
                  [결제사 결제창]
                        ↓
        GET /api/payments/return/[provider]?ref=<payments.id>&...
                        │ provider.confirm → 금액 대조 → confirm_payment RPC
                        ↓
              /{market}/checkout/complete
```

### `ref`는 우리가 심는다

결제사에 넘기는 복귀 URL에 `payments.id`를 쿼리로 박아 보낸다. 돌아왔을 때 어느 결제 시도인지
**PG 고유 필드를 해석하지 않고** 찾기 위해서다. 이것이 라우트를 PG 중립으로 유지하는 장치다.

### 금액은 서버가 대조한다

`confirm`이 돌려준 실결제액과 주문 금액이 다르면 즉시 `cancel`을 걸고 실패 처리한다. 브라우저가
보낸 금액은 어디서도 믿지 않는다.

### 복귀 라우트는 멱등이다

새로고침·뒤로가기로 같은 URL이 다시 열린다. `payments.status`가 이미 `paid`면 `confirm`을 호출하지
않고 완료 화면으로 보낸다.

### 승인과 주문 확정은 한 트랜잭션

가장 무서운 실패는 **PG에서는 승인됐는데 우리 DB 쓰기가 중간에 깨진** 경우다. 돈은 빠졌는데
주문은 미결제로 남는다. `payments` 갱신과 `orders.status` 갱신을 따로 하면 그 틈이 생기므로,
Postgres 함수 `confirm_payment(p_payment_id, p_txn_id, p_paid_amount, p_raw)` 하나로 묶는다.
이 프로젝트는 이미 주문 조회에 RPC를 쓰고 있어 낯선 방식이 아니다.

---

## 실패 처리

복귀 라우트는 **어떤 경우에도 JSON을 뱉지 않고 302로 화면에 보낸다.** 손님이 결제사에서 돌아온
자리라 흰 화면에 에러 텍스트가 떠서는 안 된다.

| 상황 | 처리 |
| --- | --- |
| 손님이 결제창에서 취소 | 체크아웃 화면으로. 주문 유지, 재시도 가능 |
| 승인 실패 · 만료 | `payments` = failed, 주문은 `pending_payment` 유지 |
| 금액 불일치 | 즉시 취소 요청 + 관리자 확인이 필요한 상태로 기록 |
| PG 응답 없음 | "잠시 후 다시" 안내, 주문 유지 |

문구는 일본어·한국어 둘 다 `src/shared/i18n/dictionaries.ts`에 넣는다. 한국 마켓 기능이라고
한국어만 넣지 않는다 — CLAUDE.md의 "한국어를 부차적으로 취급하지 말라"는 반대 방향으로도 적용된다.

---

## UI

체크아웃 화면 하단, 제출 버튼 위에 결제수단 목록을 둔다.

- `catalog.ts`에서 현재 마켓으로 걸러낸 목록을 라디오로 표시한다
- 각지게(`border-radius: 0`), 무채색, 선택 시 면으로 구분한다. 결제 버튼은 검정
- 터치 타깃을 충분히 크게 잡는다 (모바일 우선)
- 결제수단이 하나뿐이면 목록을 감추고 바로 결제한다

---

## 테스트

**mock provider가 테스트의 핵심이다.** 가짜 결제창 페이지(`/[market]/checkout/mock-pay`)에 승인·
취소·실패 버튼 셋을 둔다. 그러면 계약 전에도 Playwright로 결제 전 구간을 회귀 테스트할 수 있고,
나중에 실제 PG를 붙여도 이 e2e가 그대로 남는다.

| 층 | 무엇 |
| --- | --- |
| vitest | 에러코드 번역, 복귀 쿼리 해석, 금액 대조 — 전부 순수 함수로 뺀다 |
| vitest | `catalog` 마켓 필터링 |
| playwright | 체크아웃 → 수단 선택 → mock 결제창 → 승인 → 완료 (+ 취소·실패 분기) |

HTTP 호출부는 얇게 유지해 테스트 대상에서 뺀다. 계약 후 실제 provider는 테스트 키로 수동 확인한다.

---

## 구현 순서

1. `types` · `catalog` · `registry` · mock provider + 가짜 결제창
2. `payments` 마이그레이션 + `confirm_payment` RPC + `OrderStatus` 확장
3. 라우트 세 개
4. 체크아웃 결제수단 선택 UI + i18n
5. e2e 회귀
6. *(계약 후)* 실제 PG provider 파일 한 개

1~5는 계약 없이 지금 전부 된다. **6번이 하루짜리가 되도록 만드는 것이 이 설계의 목표다.**

### 코드 규약

CLAUDE.md의 함수 15줄 · 중첩 3단 제한을 지킨다. provider 구현은 길어지기 쉬우므로
`요청 본문 만들기 / 호출 / 응답 매핑` 세 함수로 쪼갠다.

---

## 알면서 남기는 것

**결제창까지 갔다가 이탈하면 `pending_payment` 주문이 쌓인다.** 지금도 그렇고 이번에도 안 고친다.
정리 작업은 주문 만료 정책이 정해진 뒤가 맞다.

**정산 대사가 없다.** `raw`를 보관하므로 나중에 붙일 수 있지만, 지금은 자동 대사를 만들지 않는다.

---

## 미결 항목

`docs/open-decisions.md`에 옮긴다.

| 항목 | 막는 것 |
| --- | --- |
| PG사 선정 (B-2) | 6번 태스크만. 1~5는 진행 가능 |
| 배포처 · 결제사 서버 IP 신고 요건 | 없음. 직계약 국내 PG는 대개 IP 신고를 요구하지 않는다 |
| 현금영수증 · 에스크로 대응 주체 | 없음. 계약 시 확인 |
| `pending_payment` 주문 만료 정책 | 없음 |
