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
