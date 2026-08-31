# 다국가 마켓(일본/한국) 주문 설계

- 작성일: 2026-08-28
- 상태: 설계 확정, 구현 계획 대기
- 선행 스펙: `2026-08-28-signup-minimal-consent-design.md` (구현 완료, main 머지됨)

## 배경

프로젝트 타겟이 일본 단독에서 **일본 + 한국**으로 확대되었다. 그런데 주문 도메인 전체가
일본 전용으로 굳어 있어 한국 고객은 주문을 완료할 수 없다.

조사 결과:

| 영역 | 현재 상태 | 한국 대응 시 문제 |
|---|---|---|
| 상품명·설명 | `name_ja` / `name_ko` 양쪽 존재 | 없음 |
| 가격 | `price`, `list_price` 정수 1개 (엔화) | 원화 가격이 들어갈 자리가 없음 |
| 표시 | `formatYen`이 `¥` 하드코딩 | 통화 분기 없음 |
| 배송비 | `FREE_SHIPPING_THRESHOLD`/`SHIPPING_FEE` 상수 1쌍 | 국가별 정책 불가 |
| 주소 | `postal_code`가 `/^\d{3}-?\d{4}$/`, `prefecture`/`city`/`address_line`/`building` | 한국 주소 체계와 형식이 다름 |
| 후리가나 | `recipient_furigana` NOT NULL, 카타카나 필수 | 한국 고객은 쓸 값이 없음 |
| 주문 스냅샷 | `order_items.product_name_ja` 일본어만 | 한국 고객 주문 내역이 일본어로 남음 |

## 목표

한국 고객이 `/kr`에서 원화 가격을 보고, 도로명주소로 배송지를 입력해, 주문을 완료할 수 있다.

## 확정된 결정

| 결정 | 선택 | 근거 |
|---|---|---|
| 한국 판매 형태 | 국내 판매, 원화 별도 가격 | 대행 수수료·국제배송비가 빠져 가격 구조가 다르다 |
| 마켓 구분 | 경로 `/jp` · `/kr` | URL이 명확하고 링크 공유가 안전하다. 인증·장바구니·관리자가 그대로 공유되고 도메인·DNS 작업이 없다 |
| 주소 저장 | 기존 컬럼 유지 + `market` 추가 | 컬럼이 이미 양국에 대응된다. jsonb는 타입 안전성과 조회 편의를 잃고 기존 행 변환이 필요하다 |
| 가격 저장 | `products`에 원화 컬럼 추가, `price`→`price_jpy` 개명 | 마켓이 둘뿐이라 조인이 불필요하다. 개명은 `price`를 "그냥 가격"으로 오해하는 것을 막는다 |
| 주소 검색 | 한국만 (juso.go.kr) | 한국은 도로명주소 검색이 사실상 필수다. 일본은 수동 입력이 이미 동작한다 |
| 배송비 | 미확정 — 잠정값을 한 곳에 모아둠 | 정책이 정해지지 않았다. 값이 흩어지지 않게 하는 것이 설계의 몫이다 |
| 언어 | 경로가 고정 (`/jp`=일본어, `/kr`=한국어) | 축을 둘로 두면 어긋난 조합을 계속 관리해야 한다. 별도 언어 토글을 없앤다 |

## 도메인 분리를 하지 않는 이유

별도 도메인(`como.jp`/`como.kr`)을 검토했으나 채택하지 않았다.

도메인을 나눠도 **분기 자체는 사라지지 않고 위치만 옮겨간다.** 가격을 고르는 코드는 여전히
마켓을 알아야 하며, 바뀌는 것은 그 값을 어디서 읽느냐 한 곳뿐이다. "분기가 여기저기 생긴다"는
문제는 접점을 다섯 개로 가두는 설계로 막는 것이지 도메인 분리로 막는 것이 아니다.

반대로 도메인 분리의 비용은 크다. **Supabase 세션 쿠키는 도메인에 묶이므로** `como.jp`에
로그인해도 `como.kr`에서는 비로그인이다. 방금 구축한 OAuth·동의 흐름이 두 벌이 된다.

경로 방식에서 서브도메인이나 별도 도메인으로 옮기는 것은 나중에도 가능하며, 그때 바뀌는 것은
`src/proxy.ts`에서 마켓을 읽는 방식뿐이다. 아래 커머스 설계는 네 경우 모두 동일하다.

## 마켓이 언어까지 결정한다

경로 세그먼트 하나가 통화·배송·주소 형식과 **표시 언어를 모두** 결정한다.

| 경로 | 언어 | 통화 | 배송 |
|---|---|---|---|
| `/jp` | 일본어 | 엔화 | 일본 |
| `/kr` | 한국어 | 원화 | 한국 |

**별도의 언어 토글을 두지 않는다.** 마켓 전환이 언어 전환을 겸한다.

이 결정으로 잃는 것: 일본에 사는 한국인이 한국어로 읽으면서 일본 주소로 배송받는 조합이
불가능해진다. 한국어로 보려면 `/kr`로 가야 하고 거기서는 한국 배송만 된다. 편집샵 규모에서
감수할 만한 손실로 판단해 축을 하나로 합쳤다.

얻는 것은 상당하다. `komo_locale` 쿠키와 `localStorage`의 `komo.locale`이 사라지고, 로케일이
URL에 있으므로 서버 컴포넌트가 쿠키를 읽어 초기 로케일을 정할 필요가 없어진다. 언어와 마켓이
어긋나는 상태 자체가 존재할 수 없다.

### 기존 로케일 코드에 미치는 영향

- `src/shared/i18n/LocaleProvider.tsx` — `initialLocale` prop은 그대로 두되 `[market]`
  레이아웃이 값을 넘긴다. `setLocale`·`toggleLocale`과 쿠키·localStorage 쓰기는 제거한다.
  로케일은 이제 이동으로만 바뀐다.
- `src/shared/i18n/types.ts` — `LOCALE_COOKIE_KEY` 제거
- `src/app/layout.tsx` — 쿠키를 읽어 초기 로케일을 정하던 코드 제거
- `src/features/locale-toggle/` — `market-switcher` 슬라이스로 대체. 사용처는
  `SignupView`, `SigninView`, `ConsentView`, `widgets/header/NavDrawer` 네 곳이다.

`MarketSwitcher`는 **현재 경로를 유지한 채** 마켓만 바꾼다 (`/jp/products/girl-top` →
`/kr/products/girl-top`).

## URL 구조

```
/jp, /jp/products, /jp/cart, /jp/checkout, /jp/signin …   일본 마켓
/kr, /kr/products, /kr/cart, /kr/checkout, /kr/signin …   한국 마켓
/admin/…                                                   마켓 무관 (공용)
```

`src/app/(main)/`, `signin/`, `signup/`, `auth/`를 `src/app/[market]/` 아래로 옮긴다.
인증까지 마켓 경로에 넣는 이유는 로그인 후 "어느 마켓 홈으로 돌아가는가"의 모호함을 없애기
위해서다. `admin`은 정적 세그먼트라 Next.js가 `[market]`보다 먼저 매칭하므로 충돌하지 않는다.

`/`는 `Accept-Language`로 **기본값만** 정해 리다이렉트한다. 추정이 틀려도 헤더의 마켓 전환으로
바꿀 수 있어 사용자가 갇히지 않는다.

`[market]` 레이아웃이 `MarketProvider`와 `LocaleProvider`를 함께 감싸며, 경로에서 얻은 마켓으로
두 값을 동시에 정한다 (`jp` → `ja`, `kr` → `ko`).

## 마켓별 정책

| | 일본 마켓 | 한국 마켓 |
|---|---|---|
| 가격 출처 | `products.price_jpy` | `products.price_krw` |
| 표기 | `¥12,000` | `12,000원` |
| 무료배송 기준 | 5,000엔 | 30,000원 **(잠정)** |
| 배송비 | 550엔 | 3,000원 **(잠정)** |
| 우편번호 | `123-4567` (7자리) | `12345` (5자리) |
| 후리가나 | 필수 (카타카나) | 입력란 없음 |
| 주소 입력 | 수동 | 도로명주소 검색 + 상세주소 |
| 전화번호 | `090-1234-5678` | `010-1234-5678` |

## 마이그레이션

```sql
-- 가격: 기존 엔화 컬럼을 명시적으로 개명하고 원화를 추가
alter table products rename column price to price_jpy;
alter table products rename column list_price to list_price_jpy;
alter table products add column if not exists price_krw integer;
alter table products add column if not exists list_price_krw integer;

-- 주문: 마켓 기록, 후리가나는 한국에서 쓰지 않으므로 nullable
alter table orders add column if not exists market text not null default 'jp'
  check (market in ('jp', 'kr'));
alter table orders alter column recipient_furigana drop not null;

-- 주문 스냅샷: 한국어 상품명도 박제
alter table order_items add column if not exists product_name_ko text;
```

`price_krw`와 `list_price_krw`는 **항상 함께 채우거나 함께 비운다.** 한쪽만 있으면 할인율
계산이 깨진다. DB 제약 대신 관리자 폼의 zod 스키마에서 검증한다 — 에러 문구를 사용자에게
보여줄 수 있는 곳이 거기이기 때문이다.

`price_krw`를 nullable로 두는 것이 핵심이다. 원화 가격이 없는 상품은 `/kr` 카탈로그에서
제외되므로 **한국 마켓을 상품 단위로 점진 오픈**할 수 있다. 전 상품 가격을 한 번에 정하지
않아도 출시가 가능하다.

기존 주문은 `market` 기본값 `'jp'`로 채워진다 — 전부 일본 주문이었으므로 정확하다.
`total_price`의 통화는 `market`이 1:1로 결정하므로 별도 통화 컬럼을 두지 않고 주석으로 남긴다.

## 다섯 접점

마켓을 알아야 하는 곳은 다섯 군데뿐이다. 이 다섯을 각각 함수 하나로 가두면 나머지 코드는
마켓을 모른다.

| 접점 | 구현 |
|---|---|
| 가격 선택 | `catalog.mappers.ts`가 매핑 시점에 `price_jpy`/`price_krw` 중 하나를 골라 `product.price`에 넣는다. `/kr` 조회는 `catalog.ts`에서 `price_krw is not null`로 거른다 |
| 통화 표기 | `formatYen(v)` → `formatPrice(v, market)`. 호출부 9곳은 `useMarket()`에서 마켓을 받는다 |
| 배송 정책 | `constants.ts`의 상수 2개를 `MARKET_CONFIG`로 흡수한다. 사용처 4곳 |
| 주소 스키마 | `checkoutSchema(market)`가 마켓별 zod 스키마를 돌려준다 |
| 주문 스냅샷 | 체크아웃 시 `product_name_ja`·`product_name_ko`를 함께 채운다 |

`ProductCard`·`CartView`·`ProductDetail`·`ProductBrowser`는 바뀌지 않는다. 매퍼가 이미 고른
`product.price`를 그대로 쓴다. 가격을 참조하는 23개 파일 중 실제로 손대는 것은 매퍼·관리자·
체크아웃 쪽뿐이다.

## 코드 구조

**`src/shared/config/markets.ts`** — 정책이 모이는 단 하나의 파일

```ts
export type Market = "jp" | "kr";

export const MARKET_CONFIG: Record<Market, MarketConfig> = {
  jp: { currency: "JPY", priceColumn: "price_jpy",
        freeShippingThreshold: 5000, shippingFee: 550 },
  // 잠정값 — 배송비 정책이 확정되면 이 두 줄만 고치면 된다
  kr: { currency: "KRW", priceColumn: "price_krw",
        freeShippingThreshold: 30000, shippingFee: 3000 },
};
```

**`src/shared/lib/format.ts`** — `formatPrice(value, market)`는 마켓을 인자로 받는 **순수 함수**다.
서버 컴포넌트와 테스트가 훅 없이 쓸 수 있어야 하기 때문이다.

**`src/shared/market/MarketProvider.tsx`** — 기존 `src/shared/i18n/LocaleProvider.tsx`와 같은
모양. `useMarket()`이 `{ market, config, formatPrice }`를 돌려주며, 여기서 노출하는
`formatPrice`는 마켓이 이미 묶인 `(value) => string` 형태다. 클라이언트 컴포넌트가 매번
마켓을 넘기지 않도록 하는 편의일 뿐, 위 순수 함수를 대체하지 않는다.

**`src/app/[market]/layout.tsx`** — 파라미터를 검증하고(아니면 `notFound()`) `MarketProvider`로
감싼다.

**`<MarketLink>`** — 내부 링크 20곳을 처리하는 얇은 `next/link` 래퍼. `/admin` 링크는 기존
`Link`를 유지한다. `router.push`/`replace` 10곳도 마켓 접두사가 필요하다.

## 도로명주소 검색

> **구현 시 변경됨 (2026-08-31).** 아래 설계는 juso **검색 API**(`addrLinkApi.do`)를
> 프록시해 화면 안에서 목록을 보여주는 방식이었다. 실제로는 juso가 제공하는
> **팝업 API**(`addrLinkUrl.do`)로 갔다. 이유는 두 가지다.
> (1) 승인키가 API별로 따로 발급되는데 우리가 받은 건 팝업 API 키다.
> (2) 한국 사용자가 아는 주소 입력은 별도 창이 뜨는 그 화면이다.
> 지금 구조는 `/api/address/juso` 한 라우트가 GET(팝업 열기)과 POST(주소 돌려받기)를
> 모두 맡고, 고른 주소는 `postMessage`로 주문서에 전달된다.

검색 결과를 고르면 우편번호·시도·시군구·도로명주소가 자동으로 채워지고, 사용자는 상세주소만
입력한다. (이 부분은 팝업 방식에서도 그대로다.)

## 외부 설정

**Supabase Redirect URLs 허용목록에 `/jp/auth/callback`과 `/kr/auth/callback`을 추가해야 한다.**
카카오·Google·LINE 콘솔은 Supabase 콜백(`https://<project>.supabase.co/auth/v1/callback`)을
가리키므로 손대지 않아도 된다.

## 엣지 케이스

**장바구니를 담고 마켓을 바꾸면.** 장바구니는 **마켓별로 나누지 않고 하나를 공유한다.**
`productId + color + size + 수량`만 들고 있어 가격은 마켓에 따라 재계산되기 때문이다.
다만 `price_krw`가 없는 상품은 `/kr`에서 취급하지 않으므로, 전환 시 해당 상품을 빼고
**무엇이 빠졌는지 사용자에게 알린다.** 조용히 사라지면 안 된다.

**체크아웃 가격 위조.** 서버가 이미 DB에서 가격을 다시 조회하므로 안전하다. 마켓만 추가로
검증한다.

**기존 주문 조회.** `market='jp'`로 채워지고 `product_name_ko`는 `null`이므로, 한국어로 볼 때
일본어 상품명으로 폴백한다.

**잘못된 마켓 경로.** `/xx/products` 같은 요청은 `[market]` 레이아웃에서 `notFound()`로 처리한다.

**해당 마켓에 없는 상품 페이지에서 마켓을 바꾸면.** `MarketSwitcher`가 경로를 유지하므로
`/jp/products/girl-top/<id>`에서 `/kr`로 바꿨을 때 그 상품에 `price_krw`가 없을 수 있다.
이때는 404로 떨구지 않고 **해당 카테고리 목록으로 보내고 "이 마켓에서는 취급하지 않는
상품"이라고 알린다.** 언어를 바꾸려다 빈 화면을 만나는 것이 가장 나쁜 결과다.

## 범위에서 제외

- **결제** — 현재도 미구현이다 (`status`가 `pending_payment` 고정). 별개 프로젝트다.
- **일본 우편번호 자동완성** — 수동 입력이 이미 동작한다.
- **통관·국제배송비** — 일본 구매대행의 실제 물류는 별도 주제다.
- **관리자 화면의 마켓 분리** — 관리자는 두 마켓 가격을 한 폼에서 함께 입력한다. 관리자는
  `admin.mappers.ts`로 카탈로그와 분리된 타입을 쓰므로, 여기서만 네 가격 컬럼을 모두 노출한다.
  카탈로그용 `Product`는 지금처럼 `price`/`listPrice` 하나씩만 유지한다.
- **마켓별 상품 노출 제어 UI** — `price_krw`의 null 여부로 자연히 갈린다. 별도 토글을 두지 않는다.

## 테스트

기존 `schema.test.ts`·`mappers.test.ts` 패턴을 따라 vitest로 작성한다.

- `src/shared/config/markets.test.ts` — 마켓 판별, 설정 조회
- `src/shared/lib/format.test.ts` — `formatPrice` 마켓별 표기
- `src/features/checkout-form/model/schema.test.ts` — 일본은 후리가나 필수·7자리 우편번호,
  한국은 후리가나 없음·5자리 (기존 파일 확장)
- `src/shared/api/supabase/catalog.mappers.test.ts` — 마켓에 맞는 가격 컬럼 선택,
  `price_krw` null 상품 제외 (기존 파일 확장)
- 배송비 계산 — 마켓별 무료배송 기준 경계값
- 마켓 → 로케일 매핑 (`jp`→`ja`, `kr`→`ko`)
- `MarketSwitcher`의 경로 변환 (`/jp/products/x` → `/kr/products/x`, 접두사만 교체)

## 준비가 필요한 외부 항목

- juso.go.kr **팝업 API** 키 (`JUSO_API_KEY`) — 검색 API 키와 다르다
- 한국 배송비 확정값 (없으면 잠정값으로 진행)
- Supabase Redirect URLs에 마켓별 콜백 경로 추가
