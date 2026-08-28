# 다국가 마켓 2단계 — 가격 · 통화 · 배송비 Implementation Plan

> **상태: Task 6까지 완료 · Task 7부터 남음**
> 브랜치 `feat/multi-market-pricing`. 이어서 하는 법은 `docs/multi-market-status.md` 참고.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `/kr`에서 원화 가격과 한국 배송비가 보이게 한다. 주소 폼과 주문은 3단계다.

**Architecture:** 상품 가격을 마켓별 컬럼으로 나누고, 매퍼가 조회 시점에 한쪽을 골라 기존 `Product.price`에 넣는다. 그래서 상품 카드·장바구니·상세는 바뀌지 않는다. 통화 표기와 배송 정책은 각각 함수 하나·설정 파일 하나로 가둔다.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Supabase, TanStack Query, Tailwind, vitest

**설계 문서:** `docs/superpowers/specs/2026-08-28-multi-market-orders-design.md`
**미결 항목:** `docs/open-decisions.md`
**1단계:** `2026-08-28-multi-market-phase1-routing.md` (완료·머지됨)

---

## 이 계획의 위치

| 단계 | 내용 | 상태 |
|---|---|---|
| 1단계 | 마켓 라우팅, 언어 경로 고정 | ✅ 완료 |
| **2단계 (이 계획)** | 가격·통화·배송비 | 이번 |
| 3단계 | 주소 폼·주소 검색·주문 | 다음 |

---

## 1단계에서 확인된 사실 (이 계획의 전제)

- `useMarket()`은 `Market`(`"jp" | "kr"`)을 그대로 돌려준다. 이 계획에서 **시그니처를 바꾸지 않는다** — 호출부 4곳이 깨진다.
- **`/admin`은 `[market]` 밖이라 `MarketProvider`가 없다.** 관리자 화면에서 `useMarket()`을 부르면 throw한다.
- 카탈로그는 **브라우저에서 TanStack Query로** 가져온다 (`useProducts`, `useProduct`). 서버 컴포넌트가 아니다.
- `enrichCartLines`는 카탈로그에 없는 상품을 **조용히 걸러낸다** (`src/entities/cart/model/enrich.ts`).
- 현재 테스트 **107개 통과**. `adminServer.test.ts` 1개 스위트는 `.env.local` 부재로 실패하며 무관하다.
- `pnpm lint`에 `src/shared/i18n/FontModeProvider.tsx:36` 기존 경고 1건. 고치지 않는다.
- 라우트 이동 뒤 `.next` 캐시가 옛 경로를 물고 있으면 `tsc`가 헛에러를 낸다. **에러가 이상하면 먼저 `rm -rf .next`.**

---

## 핵심 설계 결정

### 통화는 마켓이 아니라 통화로 넘긴다

`formatPrice(value, currency)` 형태로 만든다. `formatPrice(value, market)`이 아니다.

주문 내역(마이페이지·주문 조회)에 찍히는 금액은 **주문 당시의 통화**이지 지금 보고 있는 마켓의 통화가 아니다. `orders`에 마켓 컬럼이 생기는 것은 3단계이므로, 2단계에서 기존 주문은 전부 엔화다. 호출부에서 `formatPrice(v, "JPY")`로 **명시**하면 3단계에서 무엇을 고쳐야 하는지 바로 보인다.

### 조회 캐시 키에 마켓이 들어가야 한다

`useProducts`는 TanStack Query를 쓴다. `queryKey`가 `["products"]`로 고정이면 `/jp`에서 받아온 엔화 가격이 캐시에 남아 **`/kr`에서 그대로 재사용된다.** 키에 마켓을 넣어야 한다.

### 관리자는 두 가격을 함께 보여준다

관리자는 마켓 밖이라 `useMarket()`을 쓸 수 없고, 애초에 두 마켓 가격을 함께 다뤄야 한다. 네 컬럼을 모두 노출한다.

---

## File Structure

| 파일 | 이번 단계의 책임 |
|---|---|
| `src/shared/config/markets.ts` | 마켓별 통화·가격 컬럼·배송 정책을 추가 |
| `src/shared/lib/format.ts` | `formatPrice(value, currency)` |
| `src/shared/lib/constants.ts` | 배송비 상수 제거 (설정으로 흡수) |
| `src/shared/api/supabase/catalog.mappers.ts` | 마켓에 맞는 가격 컬럼 선택 |
| `src/shared/api/supabase/catalog.ts` | 네 컬럼 조회, `/kr`은 원화 없는 상품 제외 |
| `src/entities/cart/model/enrich.ts` | 걸러진 상품을 함께 돌려준다 |
| `supabase/migrations/20260829000000_market_prices.sql` | 가격 컬럼 |

---

## Task 1: 마켓 설정에 통화·가격 컬럼·배송 정책 추가

**Files:**
- Modify: `src/shared/config/markets.ts`
- Modify: `src/shared/config/markets.test.ts`

- [x] **Step 1: 실패하는 테스트 추가**

`src/shared/config/markets.test.ts` 맨 끝에 추가한다. 기존 테스트는 지우지 않는다:

```ts
describe("MARKET_CONFIG", () => {
  it("gives each market its own currency", () => {
    expect(MARKET_CONFIG.jp.currency).toBe("JPY");
    expect(MARKET_CONFIG.kr.currency).toBe("KRW");
  });

  it("points each market at its own price columns", () => {
    expect(MARKET_CONFIG.jp.priceColumn).toBe("price_jpy");
    expect(MARKET_CONFIG.jp.listPriceColumn).toBe("list_price_jpy");
    expect(MARKET_CONFIG.kr.priceColumn).toBe("price_krw");
    expect(MARKET_CONFIG.kr.listPriceColumn).toBe("list_price_krw");
  });

  it("keeps the existing japanese shipping policy", () => {
    expect(MARKET_CONFIG.jp.freeShippingThreshold).toBe(5000);
    expect(MARKET_CONFIG.jp.shippingFee).toBe(550);
  });

  it("has a shipping policy for every market", () => {
    for (const market of MARKETS) {
      expect(MARKET_CONFIG[market].shippingFee).toBeGreaterThan(0);
      expect(MARKET_CONFIG[market].freeShippingThreshold).toBeGreaterThan(0);
    }
  });
});

describe("shippingFeeFor", () => {
  it("charges the fee below the threshold", () => {
    expect(shippingFeeFor("jp", 4999)).toBe(550);
  });

  it("is free at exactly the threshold", () => {
    expect(shippingFeeFor("jp", 5000)).toBe(0);
  });

  it("is free above the threshold", () => {
    expect(shippingFeeFor("jp", 5001)).toBe(0);
  });

  it("uses the korean policy for the korean market", () => {
    expect(shippingFeeFor("kr", 29999)).toBe(3000);
    expect(shippingFeeFor("kr", 30000)).toBe(0);
  });
});
```

import 줄에 `MARKET_CONFIG`와 `shippingFeeFor`를 추가한다:

```ts
import {
  DEFAULT_MARKET,
  MARKETS,
  MARKET_CONFIG,
  isMarket,
  marketLocale,
  shippingFeeFor,
} from "./markets";
```

- [x] **Step 2: 테스트가 실패하는지 확인**

Run: `pnpm test src/shared/config/markets.test.ts`
Expected: FAIL — `MARKET_CONFIG`와 `shippingFeeFor`를 export하지 않음

- [x] **Step 3: 구현**

`src/shared/config/markets.ts`의 `marketLocale` 함수 **아래에** 추가한다. 기존 내용은 그대로 둔다:

```ts
export type Currency = "JPY" | "KRW";

type MarketConfig = {
  currency: Currency;
  priceColumn: "price_jpy" | "price_krw";
  listPriceColumn: "list_price_jpy" | "list_price_krw";
  freeShippingThreshold: number;
  shippingFee: number;
};

export const MARKET_CONFIG: Record<Market, MarketConfig> = {
  jp: {
    currency: "JPY",
    priceColumn: "price_jpy",
    listPriceColumn: "list_price_jpy",
    freeShippingThreshold: 5000,
    shippingFee: 550,
  },
  kr: {
    currency: "KRW",
    priceColumn: "price_krw",
    listPriceColumn: "list_price_krw",
    // 잠정값 — 한국 배송비 정책이 확정되면 이 두 줄만 고친다.
    // docs/open-decisions.md A-1 참고.
    freeShippingThreshold: 30000,
    shippingFee: 3000,
  },
};

export function marketCurrency(market: Market): Currency {
  return MARKET_CONFIG[market].currency;
}

export function shippingFeeFor(market: Market, subtotal: number): number {
  const { freeShippingThreshold, shippingFee } = MARKET_CONFIG[market];
  return subtotal >= freeShippingThreshold ? 0 : shippingFee;
}
```

- [x] **Step 4: 테스트 통과 확인**

Run: `pnpm test src/shared/config/markets.test.ts`
Expected: PASS — 14 tests (기존 6 + 새 8)

- [x] **Step 5: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (exit 0)

- [x] **Step 6: Commit**

```bash
git add src/shared/config/markets.ts src/shared/config/markets.test.ts
git commit -m "feat(market): 마켓별 통화·가격 컬럼·배송 정책을 설정에 모은다

- 배송비가 앱 곳곳의 상수로 흩어져 있으면 정책이 바뀔 때 빠뜨리는 곳이 생긴다
- 한국 배송비는 아직 미정이라 잠정값에 표시를 남긴다"
```

---

## Task 2: 통화별 금액 표기

**Files:**
- Modify: `src/shared/lib/format.ts`
- Create: `src/shared/lib/format.test.ts`

- [x] **Step 1: 실패하는 테스트 작성**

`src/shared/lib/format.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { discountRate, formatPrice } from "./format";

describe("formatPrice", () => {
  it("formats japanese yen with a leading symbol", () => {
    expect(formatPrice(12000, "JPY")).toBe("¥12,000");
  });

  it("formats korean won with a trailing unit", () => {
    expect(formatPrice(35000, "KRW")).toBe("35,000원");
  });

  it("groups thousands in both currencies", () => {
    expect(formatPrice(1234567, "JPY")).toBe("¥1,234,567");
    expect(formatPrice(1234567, "KRW")).toBe("1,234,567원");
  });

  it("handles zero", () => {
    expect(formatPrice(0, "JPY")).toBe("¥0");
    expect(formatPrice(0, "KRW")).toBe("0원");
  });
});

describe("discountRate", () => {
  it("returns the rounded percentage off", () => {
    expect(discountRate(8000, 10000)).toBe(20);
  });

  it("returns zero when there is no discount", () => {
    expect(discountRate(10000, 10000)).toBe(0);
    expect(discountRate(12000, 10000)).toBe(0);
  });

  it("returns zero when the list price is missing", () => {
    expect(discountRate(8000, 0)).toBe(0);
  });
});
```

- [x] **Step 2: 테스트가 실패하는지 확인**

Run: `pnpm test src/shared/lib/format.test.ts`
Expected: FAIL — `formatPrice`를 export하지 않음

- [x] **Step 3: 구현**

`src/shared/lib/format.ts`에서 `formatYen`을 아래로 **교체**한다. `discountRate`와 `localeTag`는 그대로 둔다:

```ts
import type { Currency } from "@/shared/config/markets";

// 마켓이 아니라 통화를 받는다. 주문 내역에 찍히는 금액은 "지금 보고 있는 마켓"이
// 아니라 "주문 당시의 통화"이기 때문이다. 호출부에서 명시하게 두면
// 3단계에서 주문에 마켓 컬럼이 생길 때 무엇을 고쳐야 하는지 바로 드러난다.
export const formatPrice = (value: number, currency: Currency): string =>
  currency === "KRW"
    ? `${value.toLocaleString("ko-KR")}원`
    : `¥${value.toLocaleString("ja-JP")}`;
```

`formatYen`은 남기지 않는다. 다음 태스크에서 호출부를 전부 옮긴다.

- [x] **Step 4: 테스트 통과 확인**

Run: `pnpm test src/shared/lib/format.test.ts`
Expected: PASS — 7 tests

`npx tsc --noEmit`은 이 시점에 **`formatYen`을 찾지 못해 실패한다.** 정상이다. 다음 태스크에서 호출부를 옮긴다.

- [x] **Step 5: Commit**

```bash
git add src/shared/lib/format.ts src/shared/lib/format.test.ts
git commit -m "feat(market): 금액 표기를 통화별로 나눈다

- 주문 금액은 보고 있는 마켓이 아니라 주문 당시 통화로 찍혀야 한다"
```

---

## Task 3: 금액 표기 호출부 교체

이 태스크를 마쳐야 `tsc`가 다시 통과한다.

**Files:**
- Modify: `src/entities/product/ui/ProductCard.tsx`
- Modify: `src/features/look-modal/WornItem.tsx`
- Modify: `src/views/product-detail/ProductDetail.tsx`
- Modify: `src/views/cart/CartView.tsx`
- Modify: `src/views/checkout/CheckoutView.tsx`
- Modify: `src/views/mypage/MypageView.tsx`
- Modify: `src/features/order-lookup-form/OrderLookupForm.tsx`
- Modify: `src/views/admin-product-list/AdminProductListView.tsx`

- [x] **Step 1: 마켓 화면 5개 교체**

아래 다섯 파일은 `[market]` 안에서 렌더되므로 `useMarket()`을 쓸 수 있다.

- `src/entities/product/ui/ProductCard.tsx`
- `src/features/look-modal/WornItem.tsx`
- `src/views/product-detail/ProductDetail.tsx`
- `src/views/cart/CartView.tsx`
- `src/views/checkout/CheckoutView.tsx`

각 파일에서 import를 바꾼다:

```tsx
import { formatPrice } from "@/shared/lib/format";
import { marketCurrency } from "@/shared/config/markets";
import { useMarket } from "@/shared/market";
```

`formatYen`을 쓰는 컴포넌트 본문 맨 위에 추가한다:

```tsx
  const currency = marketCurrency(useMarket());
```

그리고 `formatYen(x)` → `formatPrice(x, currency)`로 바꾼다.

**주의:** `formatYen`을 쓰는 곳이 컴포넌트 함수 밖(모듈 상수 등)이면 훅을 쓸 수 없다. 그런 경우가 있으면 **추측해서 고치지 말고 보고하라.**

**주의:** 한 파일 안에 여러 컴포넌트가 있고 그중 일부만 `formatYen`을 쓸 수 있다. 훅은 그 컴포넌트 안에 넣는다.

- [x] **Step 2: 주문 내역 2개는 엔화로 명시**

주문에 마켓 컬럼이 생기는 것은 3단계다. 지금 저장된 주문은 전부 엔화이므로 **통화를 직접 적는다.**

`src/views/mypage/MypageView.tsx`와 `src/features/order-lookup-form/OrderLookupForm.tsx`:

```tsx
import { formatPrice } from "@/shared/lib/format";
```

`formatYen(x)` → `formatPrice(x, "JPY")`

각 파일의 첫 교체 지점 위에 주석을 남긴다:

```tsx
// 주문은 아직 마켓을 기록하지 않는다(3단계). 지금까지의 주문은 전부 엔화다.
```

- [x] **Step 3: 관리자 목록은 엔화로 명시**

`src/views/admin-product-list/AdminProductListView.tsx`는 **`[market]` 밖이라 `useMarket()`을 쓰면 throw한다.**

```tsx
import { formatPrice } from "@/shared/lib/format";
```

`formatYen(product.price)` → `formatPrice(product.price, "JPY")`

Task 6에서 원화 열을 추가한다. 지금은 통화만 명시한다.

- [x] **Step 4: 잔재 확인**

Run: `grep -rn "formatYen" src/`
Expected: 결과 없음 (exit 1)

- [x] **Step 5: 타입 체크와 테스트**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (exit 0)

Run: `pnpm test`
Expected: `Tests 122 passed (122)` — 기존 107 + Task 1의 8 + Task 2의 7.
`format.ts`에는 기존 테스트가 없었으므로 빠지는 것은 없다.
`adminServer.test.ts` 1개 스위트만 기존대로 실패한다.

- [x] **Step 6: Commit**

```bash
git add -A
git commit -m "refactor(market): 금액 표기를 통화 명시 방식으로 옮긴다

- 마켓 화면은 현재 마켓의 통화를, 주문 내역과 관리자 목록은 엔화를 명시한다
- 관리자는 [market] 밖이라 마켓 컨텍스트를 쓸 수 없다"
```

---

## Task 4: 가격 컬럼 마이그레이션

**Files:**
- Create: `supabase/migrations/20260829000000_market_prices.sql`

**이 SQL을 실제 DB에 적용하지 마라.** 자격증명이 없다. `npx supabase db push`, `supabase link`, `psql`을 실행하지 마라. 파일 작성과 커밋까지가 범위다.

- [x] **Step 1: 마이그레이션 파일 작성**

`supabase/migrations/20260829000000_market_prices.sql`:

```sql
-- 마켓별 가격. 기존 컬럼이 엔화라는 것을 이름에 드러내고 원화를 추가한다.
-- price 하나만 있으면 다음 사람이 "그냥 가격"으로 오해한다.
alter table products rename column price to price_jpy;
alter table products rename column list_price to list_price_jpy;

-- 원화는 nullable이다. 값이 비어 있으면 한국 마켓 카탈로그에서 제외되므로
-- 가격을 정한 상품부터 순서대로 한국 마켓을 열 수 있다.
alter table products add column if not exists price_krw integer;
alter table products add column if not exists list_price_krw integer;
```

- [x] **Step 2: 파일 확인**

Run: `cat supabase/migrations/20260829000000_market_prices.sql`
Expected: 위 내용과 일치

- [x] **Step 3: Commit**

```bash
git add supabase/migrations/20260829000000_market_prices.sql
git commit -m "feat(market): 상품 가격을 마켓별 컬럼으로 나눈다

- 한국은 국내 판매라 대행 수수료·국제배송비가 빠져 가격 구조가 다르다
- 원화를 nullable로 두어 가격을 정한 상품부터 한국 마켓을 열 수 있게 한다"
```

---

## Task 5: 카탈로그를 마켓 인지로

이 태스크를 마치면 **Task 4의 마이그레이션을 적용해야 앱이 동작한다.** 적용 전에는 `price` 컬럼이 없다는 DB 에러가 난다.

**Files:**
- Modify: `src/shared/api/supabase/catalog.mappers.ts`
- Modify: `src/shared/api/supabase/catalog.test.ts`
- Modify: `src/shared/api/supabase/catalog.ts`
- Modify: `src/entities/product/model/useProducts.ts`
- Modify: `src/entities/product/model/useProduct.ts`

- [x] **Step 1: 매퍼 테스트를 마켓 인지로 바꾸기**

먼저 `src/shared/api/supabase/catalog.test.ts`를 읽어 기존 `ProductRow` 픽스처를 파악하라.

픽스처의 `price: N, list_price: M`을 아래로 바꾼다:

```ts
  price_jpy: 12000,
  list_price_jpy: 15000,
  price_krw: 35000,
  list_price_krw: 42000,
```

`mapDbProductToProduct(row)` 호출을 `mapDbProductToProduct(row, "jp")`로 바꾸고, 아래 테스트를 파일 끝의 적절한 describe 안에 추가한다:

```ts
  it("takes the japanese price for the japanese market", () => {
    const product = mapDbProductToProduct(baseRow, "jp");
    expect(product.price).toBe(12000);
    expect(product.listPrice).toBe(15000);
  });

  it("takes the korean price for the korean market", () => {
    const product = mapDbProductToProduct(baseRow, "kr");
    expect(product.price).toBe(35000);
    expect(product.listPrice).toBe(42000);
  });

  it("falls back to zero when the market has no price", () => {
    const noKrw = { ...baseRow, price_krw: null, list_price_krw: null };
    const product = mapDbProductToProduct(noKrw, "kr");
    expect(product.price).toBe(0);
    expect(product.listPrice).toBe(0);
  });
```

이 파일에는 **이름 없는 픽스처가 네 군데 인라인으로** 들어 있다 (`list_price`가 4번 나온다).
각각의 `price`/`list_price`를 위 네 컬럼으로 바꾸고, 새 테스트에는 그중 하나를 상수로 빼내
`baseRow`로 쓰거나 새 픽스처를 만든다.

- [x] **Step 2: 테스트가 실패하는지 확인**

Run: `pnpm test src/shared/api/supabase/catalog.test.ts`
Expected: FAIL — 인자 개수 불일치와 가격 불일치

- [x] **Step 3: 매퍼 구현**

`src/shared/api/supabase/catalog.mappers.ts`에서 `ProductRow`의 가격 필드를 바꾼다:

```ts
  price_jpy: number;
  list_price_jpy: number;
  price_krw: number | null;
  list_price_krw: number | null;
```

`mapDbProductToProduct`를 아래로 바꾼다:

```ts
// 매퍼가 마켓에 맞는 가격을 골라 Product.price에 넣는다. 그래서 상품 카드·
// 장바구니·상세는 마켓을 몰라도 되고, 가격 분기가 이 한 곳에만 남는다.
export function mapDbProductToProduct(row: ProductRow, market: Market): Product {
  const { priceColumn, listPriceColumn } = MARKET_CONFIG[market];
  return {
    id: row.id,
    name: { ja: row.name_ja, ko: row.name_ko },
    brand: row.brands?.name_ja ?? "",
    category: row.category,
    price: row[priceColumn] ?? 0,
    listPrice: row[listPriceColumn] ?? 0,
    colors: uniqueColors(row.product_variants.map((v) => v.colors?.hex ?? "")),
    sizes: uniqueSizes(row.product_variants.map((v) => v.sizes?.value ?? "")),
    season: row.season,
    isNew: row.is_new,
    isBest: row.is_best,
    soldOut: row.sold_out,
    rating: row.rating,
    reviewCount: row.review_count,
    description: { ja: row.description_ja ?? "", ko: row.description_ko ?? "" },
    images: sortedImageUrls(row.product_images),
  };
}
```

파일 상단에 import를 추가한다:

```ts
import { MARKET_CONFIG, type Market } from "@/shared/config/markets";
```

- [x] **Step 4: 테스트 통과 확인**

Run: `pnpm test src/shared/api/supabase/catalog.test.ts`
Expected: PASS

- [x] **Step 5: 조회 함수에 마켓 반영**

`src/shared/api/supabase/catalog.ts`의 `PRODUCT_SELECT`에서 `price, list_price`를 네 컬럼으로 바꾼다:

```ts
const PRODUCT_SELECT = `
  id, category, name_ja, name_ko, description_ja, description_ko,
  price_jpy, list_price_jpy, price_krw, list_price_krw,
  season, is_new, is_best, sold_out, rating, review_count,
  brands ( name_ja ),
  product_variants ( colors ( hex ), sizes ( value ) ),
  product_images ( url, sort_order )
`;
```

`listProducts`와 `getProduct`를 아래로 바꾼다. **원화 가격이 없는 상품은 한국 마켓에서
취급하지 않는다** — 가격을 채운 상품부터 순서대로 공개할 수 있게 하는 장치다:

```ts
export async function listProducts(market: Market): Promise<Product[]> {
  let query = supabase.from("products").select(PRODUCT_SELECT);
  if (market === "kr") {
    query = query.not("price_krw", "is", null);
  }
  const { data, error } = await query.order("created_at", { ascending: true });
  if (error) {
    throw new Error(error.message);
  }
  return (data as unknown as ProductRow[]).map((row) => mapDbProductToProduct(row, market));
}

export async function getProduct(id: string, market: Market): Promise<Product | null> {
  let query = supabase.from("products").select(PRODUCT_SELECT).eq("id", id);
  if (market === "kr") {
    query = query.not("price_krw", "is", null);
  }
  const { data, error } = await query.maybeSingle();
  if (error) {
    throw new Error(error.message);
  }
  return data ? mapDbProductToProduct(data as unknown as ProductRow, market) : null;
}
```

import에 `Market`을 추가한다:

```ts
import type { Market } from "@/shared/config/markets";
```

- [x] **Step 6: 조회 훅에 마켓과 캐시 키 반영**

`src/entities/product/model/useProducts.ts`:

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { listProducts } from "@/shared/api/supabase/catalog";
import { useMarket } from "@/shared/market";

export function useProducts() {
  const market = useMarket();
  // 캐시 키에 마켓이 없으면 /jp에서 받아온 엔화 가격이 /kr에서 그대로 재사용된다.
  return useQuery({
    queryKey: ["products", market],
    queryFn: () => listProducts(market),
  });
}
```

`src/entities/product/model/useProduct.ts`:

```ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getProduct } from "@/shared/api/supabase/catalog";
import { useMarket } from "@/shared/market";

export function useProduct(id: string) {
  const market = useMarket();
  return useQuery({
    queryKey: ["product", id, market],
    queryFn: () => getProduct(id, market),
  });
}
```

- [x] **Step 7: 타입 체크와 테스트**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (exit 0)

Run: `pnpm test`
Expected: 새로 실패하는 스위트 없음

- [x] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(market): 카탈로그가 마켓에 맞는 가격을 고르게 한다

- 매퍼에서 한 번 고르면 상품 카드·장바구니·상세는 마켓을 몰라도 된다
- 조회 캐시 키에 마켓을 넣지 않으면 다른 마켓의 가격이 그대로 재사용된다
- 원화 가격이 없는 상품은 한국 카탈로그에서 제외한다"
```

---

## Task 6: 관리자에서 두 마켓 가격 입력

**Files:**
- Modify: `src/features/admin-product-form/model/schema.ts`
- Modify: `src/features/admin-product-form/model/schema.test.ts`
- Modify: `src/features/admin-product-form/ui/AdminProductForm.tsx`
- Modify: `src/shared/api/supabase/admin.mappers.ts`
- Modify: `src/shared/api/supabase/admin.mappers.test.ts`
- Modify: `src/shared/api/supabase/admin.ts`
- Modify: `src/views/admin-product-edit/model/buildFormDefaults.ts`
- Modify: `src/views/admin-product-list/AdminProductListView.tsx`

- [x] **Step 1: 관련 파일을 모두 읽어 현재 구조 파악**

`price`/`listPrice`가 어떻게 흐르는지 먼저 확인하라. 폼 값 → zod → DB row 변환이 `schema.ts` 안에 있다.

- [x] **Step 2: 폼 스키마 테스트 추가**

`src/features/admin-product-form/model/schema.test.ts`에 추가한다:

```ts
  it("accepts a product with only japanese prices", () => {
    const values = { ...validValues, priceKrw: 0, listPriceKrw: 0 };
    expect(adminProductSchema.safeParse(values).success).toBe(true);
  });

  it("accepts a product with both markets priced", () => {
    const values = { ...validValues, priceKrw: 35000, listPriceKrw: 42000 };
    expect(adminProductSchema.safeParse(values).success).toBe(true);
  });

  it("rejects a korean sale price without a list price", () => {
    const values = { ...validValues, priceKrw: 35000, listPriceKrw: 0 };
    const result = adminProductSchema.safeParse(values);
    expect(result.success).toBe(false);
  });

  it("rejects a korean list price without a sale price", () => {
    const values = { ...validValues, priceKrw: 0, listPriceKrw: 42000 };
    const result = adminProductSchema.safeParse(values);
    expect(result.success).toBe(false);
  });
```

`validValues`는 기존 픽스처 이름으로 바꿔 쓰고, 거기에 `priceKrw: 0, listPriceKrw: 0`을 넣는다. 기존 `price`/`listPrice` 필드명은 `priceJpy`/`listPriceJpy`로 바꾼다.

- [x] **Step 3: 폼 스키마 구현**

`src/features/admin-product-form/model/schema.ts`에서 `price`/`listPrice`를 `priceJpy`/`listPriceJpy`로 바꾸고 원화 두 개를 추가한다. 원화는 0을 "값 없음"으로 쓴다 (숫자 입력에서 빈 값을 다루기보다 단순하다):

```ts
  priceJpy: positiveInt("priceInvalid"),
  listPriceJpy: positiveInt("priceInvalid"),
  priceKrw: z.number().int().min(0, "priceInvalid"),
  listPriceKrw: z.number().int().min(0, "priceInvalid"),
```

스키마 맨 끝에 refine을 추가한다. **둘 중 하나만 채우면 할인율 계산이 깨지므로 함께 채우거나 함께 비운다:**

```ts
  .refine(
    (v) => (v.priceKrw > 0) === (v.listPriceKrw > 0),
    { message: "krwPricePair", path: ["priceKrw"] },
  )
```

`initialAdminProductFormValues`에 `priceJpy: 0, listPriceJpy: 0, priceKrw: 0, listPriceKrw: 0`을 반영한다.

DB row로 변환하는 부분에서 원화는 **0이면 null로** 보낸다:

```ts
    price_jpy: v.priceJpy,
    list_price_jpy: v.listPriceJpy,
    price_krw: v.priceKrw > 0 ? v.priceKrw : null,
    list_price_krw: v.listPriceKrw > 0 ? v.listPriceKrw : null,
```

- [x] **Step 4: 폼 UI에 입력란 추가**

`src/features/admin-product-form/ui/AdminProductForm.tsx`에서 기존 가격 입력 두 개의 이름을 `priceJpy`/`listPriceJpy`로 바꾸고, 그 아래에 원화 두 개를 같은 모양으로 추가한다. 라벨은 관리자 전용 화면이므로 한국어로 직접 적는다:

```
판매가 (엔) / 정가 (엔) / 판매가 (원) / 정가 (원)
```

원화 입력 아래에 안내 문구를 둔다:

```
비워두면(0) 한국 마켓에 노출되지 않습니다.
```

- [x] **Step 5: 관리자 매퍼와 조회 반영**

`src/shared/api/supabase/admin.mappers.ts`의 `AdminProductListRow`와 `AdminProductListItem`에 네 가격을 반영한다. 목록은 두 통화를 함께 보여주므로 둘 다 필요하다:

```ts
  price_jpy: number;
  price_krw: number | null;
```

```ts
  priceJpy: number;
  priceKrw: number | null;
```

상세 조회 쪽(`AdminProductRow` 계열)도 네 컬럼을 담도록 바꾼다. `src/shared/api/supabase/admin.ts`의 select 문자열에서 `price, list_price`를 네 컬럼으로 바꾼다.

`src/shared/api/supabase/admin.mappers.test.ts`의 픽스처도 함께 고친다.

`src/views/admin-product-edit/model/buildFormDefaults.ts`가 폼 기본값을 만들므로 새 필드명을 반영한다. 원화가 null이면 0으로 채운다.

- [x] **Step 6: 관리자 목록에 원화 열 추가**

`src/views/admin-product-list/AdminProductListView.tsx`에서 가격 셀을 두 줄로 만든다:

```tsx
      <td className="py-2 pr-3">
        <div>{formatPrice(product.priceJpy, "JPY")}</div>
        <div className="text-xs text-muted">
          {product.priceKrw === null ? "—" : formatPrice(product.priceKrw, "KRW")}
        </div>
      </td>
```

표 머리글도 함께 손본다. `—`는 한국 마켓 미노출을 뜻한다.

- [x] **Step 7: 타입 체크와 테스트**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (exit 0)

Run: `pnpm test`
Expected: 새로 실패하는 스위트 없음

- [x] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(admin): 관리자에서 두 마켓 가격을 함께 입력한다

- 관리자는 마켓 밖이라 컨텍스트를 쓸 수 없고 애초에 두 가격을 함께 다뤄야 한다
- 원화 판매가와 정가는 함께 채우거나 함께 비운다. 한쪽만 있으면 할인율이 깨진다
- 원화를 비우면 한국 마켓에 노출되지 않는다는 것을 폼에서 알린다"
```

---

## Task 7: 배송비를 마켓 정책으로

**Files:**
- Modify: `src/shared/lib/constants.ts`
- Modify: `src/views/cart/CartView.tsx`
- Modify: `src/views/checkout/CheckoutView.tsx`
- Modify: `src/app/api/checkout/route.ts`

- [ ] **Step 1: 상수 제거**

`src/shared/lib/constants.ts`에는 이 두 상수밖에 없다. **파일째 삭제한다:**

```bash
git rm src/shared/lib/constants.ts
```

import하던 세 파일(`CartView`, `CheckoutView`, `app/api/checkout/route.ts`)에서 그 import 줄도 지운다.

- [ ] **Step 2: 장바구니 반영**

`src/views/cart/CartView.tsx`에서 import를 바꾸고:

```tsx
import { MARKET_CONFIG, marketCurrency, shippingFeeFor } from "@/shared/config/markets";
```

`const free = subtotal >= FREE_SHIPPING_THRESHOLD; const shipping = free ? 0 : SHIPPING_FEE;`를 아래로 바꾼다:

```tsx
  const shipping = shippingFeeFor(market, subtotal);
  const free = shipping === 0;
```

무료배송 진행바(`remain`, `pct`)에서 쓰는 `FREE_SHIPPING_THRESHOLD`를 `MARKET_CONFIG[market].freeShippingThreshold`로 바꾼다. 그 컴포넌트가 `market`을 모르면 props로 넘기거나 그 안에서 `useMarket()`을 부른다.

- [ ] **Step 3: 체크아웃 화면 반영**

`src/views/checkout/CheckoutView.tsx`에서 같은 방식으로 바꾼다.

- [ ] **Step 4: 체크아웃 API 반영**

`src/app/api/checkout/route.ts`는 서버 라우트라 마켓 컨텍스트가 없다. **요청 본문에서 마켓을 받아야 한다.**

`CheckoutRequestBody`에 마켓을 추가한다:

```ts
type CheckoutRequestBody = { items: CheckoutItem[]; shipping: unknown; market?: unknown };
```

`POST` 안에서 검증한다:

```ts
    const body = (await request.json()) as CheckoutRequestBody;
    if (!isMarket(body.market)) {
      return NextResponse.json({ error: "invalidInput" }, { status: 400 });
    }
```

배송비 계산을 바꾼다:

```ts
  const shippingFee = shippingFeeFor(market, subtotal);
```

`market`을 `processCheckout` → `createOrder`로 전달한다. import를 추가한다:

```ts
import { isMarket, shippingFeeFor } from "@/shared/config/markets";
```

**상품 가격도 마켓에 맞게 조회해야 한다.** `fetchVariantWithProduct`가 `products ( name_ja, price )`를 선택하고 있으므로 `price`를 네 컬럼으로 바꾸고, `buildResolvedItem`에서 마켓에 맞는 값을 쓴다. 원화가 없는 상품이 한국 주문에 들어오면 **주문을 거절한다** — 카탈로그에 없는 상품이기 때문이다.

`orders` 테이블에 마켓 컬럼을 넣는 것은 3단계다. 이번에는 계산에만 쓴다.

호출부(체크아웃 폼 제출)에서 `market`을 함께 보내도록 고친다. `src/features/checkout-form/`에서 fetch 본문을 만드는 곳을 찾아 `market`을 넣는다.

- [ ] **Step 5: 잔재 확인**

Run: `grep -rn "FREE_SHIPPING_THRESHOLD\|SHIPPING_FEE" src/`
Expected: 결과 없음 (exit 1)

- [ ] **Step 6: 타입 체크와 테스트**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (exit 0)

Run: `pnpm test`
Expected: 새로 실패하는 스위트 없음

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(market): 배송비를 마켓 정책에서 가져온다

- 상수 한 쌍으로는 두 나라의 서로 다른 정책을 담을 수 없다
- 체크아웃 API는 마켓 컨텍스트가 없으므로 요청에서 받아 검증한다
- 서버가 가격을 다시 조회할 때도 마켓에 맞는 컬럼을 쓴다"
```

---

## Task 8: 장바구니에서 빠진 상품 알리기

`enrichCartLines`는 카탈로그에 없는 상품을 **조용히 걸러낸다.** 한국 마켓으로 옮기면 원화 가격이 없는 상품이 장바구니에서 말없이 사라진다.

**Files:**
- Modify: `src/entities/cart/model/enrich.ts`
- Modify: `src/entities/cart/model/enrich.test.ts`
- Modify: `src/entities/cart/index.ts`
- Modify: `src/views/cart/CartView.tsx`
- Modify: `src/shared/i18n/dictionaries.ts`

- [ ] **Step 1: 실패하는 테스트 추가**

`src/entities/cart/model/enrich.test.ts`에 추가한다. 기존 테스트는 그대로 둔다:

```ts
  it("reports items whose product is missing from the catalog", () => {
    const items = [
      { productId: "a", color: "#000", size: "70", quantity: 1 },
      { productId: "gone", color: "#000", size: "70", quantity: 2 },
    ];
    const result = enrichCartLines(items, [productA]);
    expect(result.lines).toHaveLength(1);
    expect(result.lines[0].productId).toBe("a");
    expect(result.droppedCount).toBe(1);
  });

  it("reports nothing dropped when every product is present", () => {
    const items = [{ productId: "a", color: "#000", size: "70", quantity: 1 }];
    const result = enrichCartLines(items, [productA]);
    expect(result.droppedCount).toBe(0);
  });
```

`productA`와 `items`의 모양은 기존 테스트 픽스처에 맞춘다.

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `pnpm test src/entities/cart/model/enrich.test.ts`
Expected: FAIL — 반환값이 배열이라 `.lines`가 없음

- [ ] **Step 3: 구현**

`src/entities/cart/model/enrich.ts`:

```ts
import type { CartItem } from "./store";
import type { Product } from "@/entities/product";

export type EnrichedCartItem = CartItem & { product: Product };

export type EnrichedCart = {
  lines: EnrichedCartItem[];
  droppedCount: number;
};

// 마켓을 옮기면 그 마켓에서 취급하지 않는 상품이 카탈로그에 없다.
// 조용히 지우면 사용자가 무엇이 사라졌는지 모르므로 개수를 함께 돌려준다.
export const enrichCartLines = (
  items: CartItem[],
  products: Product[],
): EnrichedCart => {
  const byId = new Map(products.map((p) => [p.id, p]));
  const lines = items
    .map((item) => ({ ...item, product: byId.get(item.productId) }))
    .filter((item): item is EnrichedCartItem => Boolean(item.product));
  return { lines, droppedCount: items.length - lines.length };
};
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test src/entities/cart/model/enrich.test.ts`
Expected: PASS

- [ ] **Step 5: 호출부와 public API 반영**

`src/entities/cart/index.ts`에 `EnrichedCart` 타입을 export에 추가한다.

`enrichCartLines`를 쓰는 곳을 찾아 `.lines`를 쓰도록 고친다:

Run: `grep -rn "enrichCartLines" src/`

- [ ] **Step 6: 장바구니 화면에 안내 추가**

`src/views/cart/CartView.tsx`에서 `droppedCount > 0`이면 목록 위에 안내를 띄운다:

```tsx
      {droppedCount > 0 && (
        <p className="mb-4 border border-border bg-sand px-4 py-3 text-sm text-foreground">
          {d.cart.droppedNotice.replace("{count}", String(droppedCount))}
        </p>
      )}
```

- [ ] **Step 7: 문구 추가**

`src/shared/i18n/dictionaries.ts`의 **ja와 ko 양쪽** `cart` 섹션에 추가한다. 한쪽만 넣으면 `Dictionary` 타입이 어긋나 `tsc`가 잡는다:

ja:

```ts
      droppedNotice: "この地域でお取り扱いのない商品{count}点をカートから外しました。",
```

ko:

```ts
      droppedNotice: "이 지역에서 판매하지 않는 상품 {count}개를 장바구니에서 뺐어요.",
```

- [ ] **Step 8: 타입 체크와 테스트**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (exit 0)

Run: `pnpm test`
Expected: 새로 실패하는 스위트 없음

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat(cart): 마켓에서 취급하지 않는 상품이 빠졌음을 알린다

- 장바구니 줄이 말없이 사라지면 사용자가 결제 직전에 금액 차이를 발견한다"
```

---

## Task 9: 한국어 화면의 첫 응답 언어 표시 고치기 (D-6)

**이 태스크는 `src/proxy.ts`를 건드린다.** 그 파일은 로그인 세션 갱신을 맡고 있고 과거에 한 번 깨졌다 고친 곳이다. **로그인이 깨지면 이 커밋을 되돌려라.** 클라이언트 쪽 보정이 이미 있어 일반 사용자에게는 문제가 없다.

**Files:**
- Modify: `src/proxy.ts`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: 현재 proxy.ts를 정독**

Supabase가 쿠키를 쓸 때 `NextResponse.next({ request })`를 다시 만드는 구조다. 이 구조를 깨지 않고 요청 헤더만 얹어야 한다.

- [ ] **Step 2: proxy.ts에서 마켓을 요청 헤더로 넘기기**

`src/proxy.ts`의 `proxy` 함수를 아래로 바꾼다:

```ts
export async function proxy(request: NextRequest): Promise<NextResponse> {
  // 루트 레이아웃이 <html lang>을 정하려면 경로의 마켓을 알아야 하는데,
  // 레이아웃은 자기 아래 세그먼트의 params를 볼 수 없다. 요청 헤더로 넘긴다.
  const requestHeaders = new Headers(request.headers);
  const segment = request.nextUrl.pathname.split("/")[1];
  if (isMarket(segment)) {
    requestHeaders.set(MARKET_HEADER, segment);
  }
  const nextResponse = () => NextResponse.next({ request: { headers: requestHeaders } });

  let response = nextResponse();

  const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        requestHeaders.set("cookie", request.cookies.toString());
        response = nextResponse();
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // 세션이 있으면 필요 시 갱신해 쿠키에 반영한다. 실패(비로그인 포함)해도
  // 요청은 막지 않는다 — 실제 접근 차단은 /mypage, /admin, /api/admin/**가
  // 각자 담당한다.
  await supabase.auth.getClaims();

  return response;
}
```

import를 추가한다:

```ts
import { isMarket } from "@/shared/config/markets";
import { MARKET_HEADER } from "@/shared/config/markets";
```

`src/shared/config/markets.ts`에 헤더 이름을 추가한다:

```ts
// proxy가 경로에서 읽은 마켓을 루트 레이아웃에 넘기는 통로.
export const MARKET_HEADER = "x-market";
```

**`requestHeaders.set("cookie", ...)` 한 줄이 중요하다.** 헤더를 새로 만들어 넘기므로, Supabase가 갱신한 쿠키가 그 헤더에 반영되지 않으면 세션이 유실된다.

- [ ] **Step 3: 루트 레이아웃에서 헤더 읽기**

`src/app/layout.tsx`의 `RootLayout`을 바꾼다:

```tsx
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const market = (await headers()).get(MARKET_HEADER);
  const lang = isMarket(market) ? marketLocale(market) : "ja";

  return (
    <html lang={lang} className={...}>
```

import를 추가한다:

```tsx
import { headers } from "next/headers";
import { MARKET_HEADER, isMarket, marketLocale } from "@/shared/config/markets";
```

- [ ] **Step 4: 타입 체크와 테스트**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (exit 0)

Run: `pnpm test`
Expected: 새로 실패하는 스위트 없음

- [ ] **Step 5: 로그인이 살아있는지 반드시 확인**

이 태스크는 세션 갱신 경로를 건드렸다. **자동 테스트로는 확인되지 않으므로 수동 확인이 필요하다.**

Run: `rm -rf .next && pnpm dev`

1. `/jp/signin`에서 이메일로 로그인
2. `/jp/mypage`로 이동 → 로그인 상태가 유지되는가
3. 새로고침 → 여전히 로그인 상태인가
4. `/kr`로 옮겨도 로그인 상태인가

**하나라도 실패하면 이 커밋을 되돌리고 보고하라.** `git revert`로 되돌리고 D-6은 미결로 남긴다.

- [ ] **Step 6: 언어 표시 확인**

```bash
curl -s http://localhost:3000/jp | grep -o '<html lang="[a-z]*"'
curl -s http://localhost:3000/kr | grep -o '<html lang="[a-z]*"'
```

Expected: `/jp`는 `lang="ja"`, `/kr`는 `lang="ko"`

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "fix(i18n): 한국어 화면의 첫 응답에 언어를 바르게 표시한다

- 루트 레이아웃은 아래 세그먼트의 params를 볼 수 없어 proxy가 헤더로 넘긴다
- 자바스크립트를 실행하지 않는 검색 로봇과 화면 낭독기가 /kr를 일본어로 읽던 문제"
```

---

## Task 10: 문서 갱신

**Files:**
- Modify: `docs/open-decisions.md`
- Modify: `docs/data-schema.md`

- [ ] **Step 1: 미결 항목 갱신**

`docs/open-decisions.md`에서:

- **A-1(한국 배송비)** 항목 끝에 추가:

```markdown
**코드는 준비되었습니다.** `src/shared/config/markets.ts`의 `MARKET_CONFIG.kr`에
잠정값(30,000원 / 3,000원)이 들어 있습니다. 확정되면 그 두 줄만 고치면 됩니다.
```

- **A-3(상품별 원화 가격)** 항목 끝에 추가:

```markdown
**입력할 수 있게 되었습니다.** 관리자 상품 등록·수정 화면에 「판매가 (원)」과
「정가 (원)」이 생겼습니다. 비워두면(0) 그 상품은 한국 마켓에 노출되지 않습니다.
```

- **D-6(SSR 언어 표시)** 항목의 상태를 `**해결됨**`으로 바꾸고 끝에 추가 (Task 9를 되돌렸다면 이 단계는 건너뛴다):

```markdown
`src/proxy.ts`가 경로에서 읽은 마켓을 요청 헤더로 넘기고, 루트 레이아웃이 그것으로
`lang`을 정합니다.
```

- [ ] **Step 2: 스키마 문서 갱신**

`docs/data-schema.md`의 Product 표에서 `price`/`list_price` 행을 네 행으로 바꾼다:

```markdown
| `price_jpy`      | `number`        | 일본 마켓 판매가 (엔)                 |
| `list_price_jpy` | `number`        | 일본 마켓 정가 (엔)                   |
| `price_krw`      | `number \| null`| 한국 마켓 판매가 (원). 없으면 미노출   |
| `list_price_krw` | `number \| null`| 한국 마켓 정가 (원)                   |
```

표 아래에 한 문단을 덧붙인다:

```markdown
원화 가격이 비어 있으면 그 상품은 한국 마켓 카탈로그에서 제외됩니다.
가격을 정한 상품부터 순서대로 한국 마켓을 열 수 있게 하려는 장치입니다.
판매가와 정가는 함께 채우거나 함께 비웁니다.
```

- [ ] **Step 3: Commit**

```bash
git add docs/
git commit -m "docs: 2단계 구현으로 정리된 항목 반영"
```

---

## 최종 검증

- [ ] **Step 1: 타입 체크**

Run: `rm -rf .next && npx tsc --noEmit`
Expected: 에러 없음 (exit 0)

- [ ] **Step 2: 전체 테스트**

Run: `pnpm test`
Expected: `adminServer.test.ts` 1개 스위트만 기존대로 실패

- [ ] **Step 3: 린트**

Run: `pnpm lint`
Expected: `src/shared/i18n/FontModeProvider.tsx:36` 1건만

- [ ] **Step 4: 마이그레이션 적용 (사용자가 직접)**

Supabase 대시보드 → SQL Editor에서 `supabase/migrations/20260829000000_market_prices.sql` 실행.

적용 후 확인:

```sql
select column_name from information_schema.columns
where table_name = 'products' and column_name like '%price%';
```

Expected: `price_jpy`, `list_price_jpy`, `price_krw`, `list_price_krw` 네 개

**적용 전에는 앱이 동작하지 않는다.** 코드가 `price_jpy`를 조회하는데 컬럼이 없기 때문이다.

- [ ] **Step 5: 수동 확인**

Run: `pnpm dev` (첫 컴파일 30~40초)

1. `/admin/products`에서 상품 하나에 원화 가격을 넣고 저장
2. `/kr/products` → 원화 가격을 넣은 상품만 보이고, 금액이 `35,000원` 형태
3. `/jp/products` → 모든 상품이 보이고, 금액이 `¥12,000` 형태
4. `/kr` 장바구니에 담고 무료배송 진행바가 **30,000원** 기준인지 확인
5. `/jp` 장바구니는 **5,000엔** 기준인지 확인
6. `/jp`에서 원화 없는 상품을 담고 `/`를 거쳐 `/kr` 장바구니로 가면 **빠졌다는 안내**가 뜨는지
7. `/kr` 상품 상세를 열고 `/jp`로 옮겨도 가격이 섞이지 않는지 (캐시 키 확인)
8. `<html lang>`이 `/jp`는 `ja`, `/kr`는 `ko`인지
