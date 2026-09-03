# 알려진 한계 (Known Limitations)

각 항목은 특정 기능 구현 시 의도적으로 스코프 밖으로 남긴 것입니다. 머지 블로커는
아니지만, 관련 기능을 더 다루기 전에 확인해야 합니다.

## 게스트 체크아웃 ([2026-08-09-guest-checkout-plan.md](superpowers/plans/2026-08-09-guest-checkout-plan.md))

최종 전체 브랜치 리뷰에서 발견된 Critical/Important 6건은 모두 수정 후 병합됨
(`58c6221`, `f22f13e`, `bdfcbab`, `997f8b1`). 아래 4건은 리뷰에서 낮은 우선순위로
판단되어 의도적으로 남겨둔 항목.

### 1. 주문 조회 RPC에 rate limit 없음

- 위치: [`supabase/migrations/20260809020000_order_rpcs.sql:55`](../supabase/migrations/20260809020000_order_rpcs.sql)
  — `grant execute on function get_order_by_number_and_email(text, text) to anon, authenticated;`
- `/orders/lookup`이 로그인 없이 호출 가능한 RPC라 요청 빈도 제한이 없음.
- **위험도: 낮음.** 주문번호 엔트로피가 10자리 hex(약 40비트)로 넓어져 있어
  브루트포스로 맞추는 건 사실상 불가능. 일반적인 API 위생 수준의 이슈.
- 고치려면: `/orders/lookup` 관련 API 경로에 IP 기준 rate limiter 추가 (예:
  Upstash ratelimit, Vercel 엣지 미들웨어).

### 2. 체크아웃에 idempotency key 없음

- 위치: [`src/app/api/checkout/route.ts`](../src/app/api/checkout/route.ts)의
  `POST` 핸들러, `generateOrderNumber()` 호출부 근처.
- 네트워크 에러 발생 시 사용자에게 에러를 보여주도록 고쳤지만(최종 리뷰 Important
  #5), 재시도 자체를 막지는 않음 — 서버가 재시도 요청과 새 주문 요청을 구분할
  방법이 없어 중복 `orders` 행이 생길 수 있음.
- **위험도: 낮음~중간.** 결제 연동 전인 지금은 금전적 피해 없음. **결제 붙이기
  전에 반드시 처리 필요** (중복 결제로 직결).
- 고치려면: 클라이언트가 폼 제출 시 `crypto.randomUUID()`로 키를 한 번 생성해
  `Idempotency-Key` 헤더로 전송, 서버는 `orders`에 유니크 컬럼으로 저장해 같은
  키의 재요청은 새로 만들지 않고 기존 주문을 반환.

### 3. 재고를 확인만 하고 차감하지 않음

- 위치: [`src/app/api/checkout/route.ts:107`](../src/app/api/checkout/route.ts)
  (`resolveOneItem` 내부) — `data.stock < item.quantity`로 확인만 하고, 주문
  생성 시 `product_variants.stock`을 차감하는 코드 없음.
- 동시에 여러 명이 같은 재고에 체크아웃하면 둘 다 통과하는 경쟁 조건(TOCTOU).
- **위험도: 낮음(지금은), 결제 연동 전 필수.** 아직 실제 결제가 없어 되돌리면
  그만이지만, 이 상태로 실제 상거래라고 홍보하면 안 됨.
- 고치려면: `product_variants` UPDATE를
  `stock = stock - :quantity where stock >= :quantity` 조건부로 만들어
  원자적으로 처리, 영향받은 행이 0개면 `soldOut`으로 되돌림.

### 4. 품절 에러가 실제 DB 오류와 진짜 품절을 구분하지 않음

- 위치: [`src/app/api/checkout/route.ts:111-112`](../src/app/api/checkout/route.ts)
  (`resolveOneItem` 내부) — `error`(쿼리 실패), `!data`(variant 없음),
  `stock < quantity`(진짜 품절)가 전부 같은 분기에서 `409 soldOut`으로 처리됨.
  `product`가 없으면 상품명 대신 `item.productId`(UUID)가 그대로 에러 메시지에
  노출됨.
- 색상/사이즈 마스터 리스트 도입(`color_id`/`size_id` FK화) 이후 같은
  `409 soldOut`으로 가는 세 번째 경로가 생김: [`resolveColorSizeIds`](../src/app/api/checkout/route.ts)
  (`resolveOneItem` 바로 위, 117-126행)가 hex/사이즈 값으로 `colors`/`sizes`를
  조회하다 실패하면(쿼리 오류든 매칭 없음이든 구분 없이) `null`을 반환하고,
  이 역시 상품명 대신 `item.productId`가 노출되는 동일한 `409 soldOut`으로
  이어짐.
- **위험도: 낮음.** 일시적 DB 장애를 품절로 오인시키고, 드물게 내부 UUID를
  사용자에게 보여주는 정도의 UX/정보노출 흠집.
- 고치려면: `error`/`!data`/`resolveColorSizeIds`의 DB 오류 케이스는
  `500 unknownError`로 분리하고, 진짜 `stock < quantity`(또는 진짜 hex/사이즈
  불일치)인 경우에만 `409 soldOut` + 상품명 반환.

## 회원가입 최소 수집 + 동의 기록

### 카카오 로그인 시 이메일이 없을 수 있다

- 카카오는 이메일이 선택 동의 항목이라 사용자가 거부하면 이메일 없는 계정이
  생성됨.
- 이 사용자는 [`/orders/lookup`](../src/shared/api/supabase/orders.ts)의
  이메일 기반 게스트 주문 연결(`link_guest_orders_to_current_user`)이 동작하지
  않음.
- 고치려면: 카카오 디벨로퍼스에서 이메일을 필수 동의로 올려야 하는데, 여기엔
  비즈 앱 전환과 검수가 필요.

### 동의 화면을 이탈하면 다시 묻지 않는다

- 위치: [`src/app/auth/callback/page.tsx`](../src/app/auth/callback/page.tsx),
  [`src/app/auth/consent/page.tsx`](../src/app/auth/consent/page.tsx)
- 소셜 첫 로그인 후 `/auth/consent`에서 이탈하면 세션은 남고 동의 레코드는
  없는 상태가 됨. 다음 접속은 `/auth/callback`을 거치지 않으므로 동의 화면이
  다시 뜨지 않음.
- 고치려면: 전역 가드가 필요해 현재는 허용.

## 결제창까지 갔다가 이탈한 주문이 쌓인다

주문은 결제 전에 `pending_payment`로 만들어집니다. 손님이 결제창에서 그냥 나가면 그 주문이
그대로 남습니다. 재고를 잡아두지 않으므로 판매에 영향은 없지만, 주문 목록에 미결제 건이 쌓입니다.

정리 작업(만료 처리)은 **주문 만료 정책이 정해진 뒤** 합니다. 며칠 뒤 지울지, 지울지 아니면
상태만 바꿀지가 사업 결정입니다.

## 취소 도중 죽으면 결제 행이 cancelling에 갇힌다

관리자 취소는 PG를 부르기 전에 결제 행을 `cancelling`으로 선점합니다. 환불이 두 번 나가는 것을
막기 위해서입니다. 그런데 선점 직후 또는 PG 호출 도중에 프로세스가 죽으면(배포·크래시) 그 행을
되돌릴 코드가 실행되지 않아 `cancelling`으로 남습니다.

**이 상태에서 환불이 실제로 됐는지 우리 DB만으로는 알 수 없습니다.** PG 관리 화면과 대조해야
합니다. 다시 취소를 시도해도 409로 막히므로 중복 환불은 나지 않지만, 사람이 손으로 SQL을 써서
`paid`(재시도 가능) 또는 `cancelled`(이미 환불됨)로 옮겨야 합니다.

`cancelling`은 정상 흐름에서 오래 머무는 상태가 아니므로, 이 상태로 몇 분 이상 남은 행을 찾는
쿼리 하나가 있으면 발견은 쉽습니다. 자동 복구는 정산 대사와 함께 만드는 것이 맞습니다.

## 결제 정산 대사가 없다

`payments.raw`에 PG 원본 응답을 보관하므로 나중에 대사를 붙일 수 있지만, 지금은 자동으로
맞춰 보지 않습니다. PG 관리자 화면과 우리 장부가 어긋나면 사람이 찾아야 합니다.

## 손님이 스스로 주문을 취소할 수 없다

취소·환불은 관리자 라우트(`POST /api/payments/cancel`)로만 됩니다. 취소 가능 기간과 배송 단계별
정책이 정해지면 손님 화면을 엽니다.

## 실제 PG를 붙이기 전에 반드시 닫아야 하는 것들

가짜 결제사로는 드러나지 않지만 실제 PG를 붙이는 순간 돈이 걸리는 문제들입니다.
**계약 후 provider 파일 하나를 추가하는 작업에 이 항목들이 함께 들어가야 합니다.**

### 한 주문에 결제 시도가 동시에 여러 건 진행될 수 있습니다

결제 시작은 부를 때마다 `payments` 행을 새로 만듭니다. 결제창을 두 개 띄워 둘 다 승인하면
두 번 결제되고, 두 번째는 `한 주문에 성공 결제는 하나` 제약에 걸려 저장만 실패합니다.
**환불은 금액 불일치일 때만 시도하므로, 이 경우 돈은 두 번 빠지고 환불은 없습니다.**

### PG가 돈을 받은 뒤 우리 DB에 적기 전에 죽으면 복구 경로가 없습니다

승인과 주문 확정은 한 트랜잭션으로 묶여 있지만, 그건 `payments`와 `orders` 사이의 틈만 막습니다.
**PG와 우리 DB 사이의 틈은 그대로 열려 있습니다.** webhook도, 대사도, 오래된 `pending` 행을
찾는 장치도 없습니다.

### 취소된 주문이 되살아날 수 있습니다

승인 함수가 결제 행의 상태만 보고 주문 상태는 보지 않습니다. 관리자가 환불해 취소된 주문에
남아 있던 결제 건이 뒤늦게 승인되면 주문이 다시 결제완료가 됩니다.

### 이 문서가 이미 「결제 전 필수」로 적어 둔 두 가지가 아직 그대로입니다

주문 생성에 멱등키가 없고, 재고는 확인만 하고 차감하지 않습니다. 둘 다 이 문서에서
**결제를 붙이기 전에 처리해야 한다**고 적어 둔 것인데 이번 작업에서 다루지 않았습니다.
결제 실패 후 손님이 폼을 다시 제출하면 주문이 하나 더 생깁니다 — 지금은 「이 주문의 결제를
이어서 하기」 경로가 없기 때문입니다.

### 결제 시작에 호출 제한이 없습니다

주문번호와 이메일만 맞으면 누구나 부를 수 있고, 부를 때마다 결제 행이 하나씩 쌓입니다.
