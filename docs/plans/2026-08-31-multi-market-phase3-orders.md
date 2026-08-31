# 다국가 마켓 3단계 — 주소 · 주문 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 한국 고객이 도로명주소로 배송지를 입력해 주문을 완료할 수 있게 한다. 주문에 마켓을 기록해 내역이 올바른 통화·언어로 보이게 한다.

**Architecture:** 주소 컬럼은 양국에 이미 대응되므로 그대로 두고, 검증만 마켓별로 가른다. 폼 값 타입은 하나로 유지하고 `superRefine`으로 마켓별 규칙을 얹는다. 한국은 도로명주소 검색으로 주소를 채우고 상세주소만 입력한다. 주문에 `market`을 기록해 이후 표시가 주문 당시 통화를 따르게 한다.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Supabase, react-hook-form, zod, Tailwind, vitest

**설계 문서:** [`docs/specs/2026-08-28-multi-market-orders-design.md`](../specs/2026-08-28-multi-market-orders-design.md)
**진행 상황:** [`docs/multi-market-status.md`](../multi-market-status.md)

---

## 이 계획의 위치

| 단계 | 내용 | 상태 |
|---|---|---|
| 1단계 | 마켓 라우팅, 언어 경로 고정 | ✅ 완료 · 머지 |
| 2단계 | 가격 · 통화 · 배송비 | ✅ 완료 · 머지 |
| **3단계 (이 계획)** | 주소 폼 · 주소 검색 · 주문 | 이번 |

---

## 1·2단계에서 확인된 사실 (이 계획의 전제)

- `useMarket()`은 `Market`(`"jp" | "kr"`)을 돌려준다. `[market]` 경로 안에서만 동작한다.
- **`/admin`은 `[market]` 밖이라 `useMarket()`을 부르면 throw한다.**
- `MARKET_CONFIG`, `marketCurrency(market)`, `shippingFeeFor(market, subtotal)`, `isMarket(v)`가 `src/shared/config/markets.ts`에 있다.
- `formatPrice(value, currency)` — **마켓이 아니라 통화를 받는다.**
- 체크아웃 API(`src/app/api/checkout/route.ts`)는 이미 요청에서 `market`을 받아 `isMarket`으로 검증하고, 가격을 마켓별 컬럼에서 다시 조회한다. **다만 `orders`에 저장하지는 않는다** — 그게 이번 단계다.
- **주문 주소를 화면에 표시하는 곳이 없다.** 마이페이지와 주문조회는 금액·상품만 보여준다. 주소 표시를 마켓별로 만들 일은 없다.
- 현재 테스트 **133개 통과**. `adminServer.test.ts` 1개 스위트는 `.env.local` 부재로 실패하며 무관하다.
- `pnpm lint`에 `src/shared/i18n/FontModeProvider.tsx:36` 기존 경고 1건. 고치지 않는다.
- **`.next` 캐시 주의:** `tsc`가 이상한 경로 에러를 내면 먼저 `rm -rf .next`.
- 첫 컴파일에 30~40초 걸린다. 무한 로딩이 아니다.

---

## 핵심 설계 결정

### 폼 값 타입은 하나로 유지한다

주소 필드는 마켓별로 **검증만** 다르고 모양은 같다. `checkoutSchema`를 함수로 만들되, 기반 `z.object`는 하나로 두고 `superRefine`으로 마켓 규칙을 얹는다. 그래야 `CheckoutFormValues` 타입이 안정적이고 react-hook-form이 흔들리지 않는다.

| | 일본 | 한국 |
|---|---|---|
| `recipientFurigana` | 필수 · 카타카나 | **입력란 없음** (빈 값 허용) |
| `postalCode` | `\d{3}-?\d{4}` | `\d{5}` |
| `prefecture` / `city` / `addressLine` | 수동 입력 | 도로명주소 검색이 채움 |
| `building` | 건물명 (선택) | 상세주소 (선택) |

### 주문에 마켓을 기록한다

`orders.market`이 있어야 주문 내역이 **주문 당시 통화**로 보인다. 2단계에서 `formatPrice(v, "JPY")`로 박아둔 곳들이 이걸로 바뀐다.

`order_items.product_name_ko`도 함께 저장한다. 한국 고객의 주문 내역이 일본어 상품명으로 남으면 안 된다. 기존 행은 `null`이므로 표시할 때 일본어로 폴백한다.

### 주소 파싱은 순수 함수로 뺀다

juso 응답을 폼 값으로 옮기는 규칙은 문자열 처리다. API 키 없이도 테스트할 수 있게 순수 함수로 분리한다. **세종특별자치시처럼 시군구가 없는 곳**이 실제 함정이다.

---

## File Structure

| 파일 | 책임 |
|---|---|
| `supabase/migrations/20260831000000_order_market.sql` | 주문 마켓 · 후리가나 nullable · 한국어 상품명 |
| `src/features/checkout-form/model/schema.ts` | 마켓별 주소 검증 |
| `src/features/address-search/model/jusoAddress.ts` | juso 응답 → 폼 값 (순수 함수) |
| `src/features/address-search/AddressSearch.tsx` | 한국 주소 검색 UI |
| `src/app/api/address/search/route.ts` | juso 프록시 (API 키를 감춘다) |

---

## Task 1: 주문 마이그레이션

**Files:**
- Create: `supabase/migrations/20260831000000_order_market.sql`

**이 SQL을 실제 DB에 적용하지 마라.** 자격증명이 없다. `npx supabase db push`, `supabase link`, `psql`을 실행하지 마라. 파일 작성과 커밋까지가 범위다.

- [ ] **Step 1: 마이그레이션 파일 작성**

```sql
-- 주문 당시의 마켓. 내역을 어느 통화·언어로 보여줄지가 여기서 정해진다.
-- 기존 주문은 전부 일본 마켓이었다.
alter table orders add column if not exists market text not null default 'jp'
  check (market in ('jp', 'kr'));

-- 후리가나는 일본에만 있는 개념이다. 한국 주문에는 넣을 값이 없다.
alter table orders alter column recipient_furigana drop not null;

-- 주문 시점의 상품명을 두 언어로 박제한다. 기존 행은 null이라
-- 표시할 때 일본어로 폴백한다.
alter table order_items add column if not exists product_name_ko text;
```

- [ ] **Step 2: 파일 확인**

Run: `cat supabase/migrations/20260831000000_order_market.sql`
Expected: 위 내용과 일치

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260831000000_order_market.sql
git commit -m "feat(order): 주문에 마켓과 한국어 상품명을 기록한다

- 주문 내역은 주문 당시 통화로 보여야 하므로 마켓을 함께 남긴다
- 후리가나는 일본에만 있는 개념이라 한국 주문에는 넣을 값이 없다"
```

---

## Task 2: juso 응답을 폼 값으로 옮기는 순수 함수

API 키 없이 만들 수 있는 부분이다. 검색 UI보다 먼저 한다.

**Files:**
- Create: `src/features/address-search/model/jusoAddress.ts`
- Create: `src/features/address-search/model/jusoAddress.test.ts`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/features/address-search/model/jusoAddress.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { jusoToAddressFields, type JusoAddress } from "./jusoAddress";

const base: JusoAddress = {
  zipNo: "06232",
  roadAddrPart1: "서울특별시 강남구 테헤란로 152",
  siNm: "서울특별시",
  sggNm: "강남구",
};

describe("jusoToAddressFields", () => {
  it("splits the road address into region, city and the rest", () => {
    expect(jusoToAddressFields(base)).toEqual({
      postalCode: "06232",
      prefecture: "서울특별시",
      city: "강남구",
      addressLine: "테헤란로 152",
    });
  });

  it("handles a region with no city level", () => {
    // 세종특별자치시는 시군구가 없어 sggNm이 빈 문자열로 온다.
    // 접두사를 그대로 이으면 공백이 겹쳐 잘려나가지 않는다.
    const sejong: JusoAddress = {
      zipNo: "30151",
      roadAddrPart1: "세종특별자치시 한누리대로 2130",
      siNm: "세종특별자치시",
      sggNm: "",
    };
    expect(jusoToAddressFields(sejong)).toEqual({
      postalCode: "30151",
      prefecture: "세종특별자치시",
      city: "",
      addressLine: "한누리대로 2130",
    });
  });

  it("keeps the road address whole when it does not start with the region", () => {
    const odd: JusoAddress = { ...base, roadAddrPart1: "테헤란로 152" };
    expect(jusoToAddressFields(odd).addressLine).toBe("테헤란로 152");
  });

  it("handles a district with a space in its name", () => {
    const withSpace: JusoAddress = {
      zipNo: "13529",
      roadAddrPart1: "경기도 성남시 분당구 판교역로 235",
      siNm: "경기도",
      sggNm: "성남시 분당구",
    };
    expect(jusoToAddressFields(withSpace).addressLine).toBe("판교역로 235");
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `pnpm test src/features/address-search/model/jusoAddress.test.ts`
Expected: FAIL — `Failed to resolve import "./jusoAddress"`

- [ ] **Step 3: 구현**

`src/features/address-search/model/jusoAddress.ts`:

```ts
// 도로명주소 API가 돌려주는 항목 중 우리가 쓰는 것만 추린 모양.
export type JusoAddress = {
  zipNo: string;
  roadAddrPart1: string;
  siNm: string;
  sggNm: string;
};

export type AddressFields = {
  postalCode: string;
  prefecture: string;
  city: string;
  addressLine: string;
};

// roadAddrPart1은 "서울특별시 강남구 테헤란로 152"처럼 시도·시군구를 포함한다.
// 그대로 넣으면 prefecture·city와 중복되므로 앞부분을 떼어낸다.
// 세종특별자치시처럼 시군구가 없는 곳은 sggNm이 빈 문자열로 오므로,
// 빈 값을 걸러 접두사를 만들어야 공백이 겹치지 않는다.
export function jusoToAddressFields(juso: JusoAddress): AddressFields {
  const prefix = `${[juso.siNm, juso.sggNm].filter(Boolean).join(" ")} `;
  const addressLine = juso.roadAddrPart1.startsWith(prefix)
    ? juso.roadAddrPart1.slice(prefix.length)
    : juso.roadAddrPart1;
  return {
    postalCode: juso.zipNo,
    prefecture: juso.siNm,
    city: juso.sggNm,
    addressLine,
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `pnpm test src/features/address-search/model/jusoAddress.test.ts`
Expected: PASS — 4 tests

- [ ] **Step 5: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (exit 0)

- [ ] **Step 6: Commit**

```bash
git add src/features/address-search
git commit -m "feat(address): 도로명주소 응답을 폼 값으로 옮기는 규칙을 분리한다

- 문자열 처리라 API 키 없이 검증할 수 있게 순수 함수로 뺀다
- 세종특별자치시처럼 시군구가 없는 곳에서 접두사 제거가 어긋나기 쉽다"
```

---

## Task 3: 마켓별 주소 검증

**Files:**
- Modify: `src/features/checkout-form/model/schema.ts`
- Modify: `src/features/checkout-form/model/schema.test.ts`

- [ ] **Step 1: 기존 파일을 먼저 읽어라**

`schema.ts`의 현재 구조와 `schema.test.ts`의 픽스처 이름을 파악하라. 지금은 `checkoutSchema`가 함수가 아니라 스키마 객체다.

- [ ] **Step 2: 실패하는 테스트 추가**

기존 테스트에서 `checkoutSchema.safeParse(...)` 호출을 `checkoutSchema("jp").safeParse(...)`로 바꾸고, 아래를 추가한다. 픽스처 이름은 기존 파일에 맞춰라:

```ts
describe("checkoutSchema — 한국 마켓", () => {
  const krValues = {
    ...validValues,
    recipientFurigana: "",
    postalCode: "06232",
    prefecture: "서울특별시",
    city: "강남구",
    addressLine: "테헤란로 152",
  };

  it("accepts an address with no furigana", () => {
    expect(checkoutSchema("kr").safeParse(krValues).success).toBe(true);
  });

  it("accepts a five digit postal code", () => {
    expect(checkoutSchema("kr").safeParse(krValues).success).toBe(true);
  });

  it("rejects a japanese postal code", () => {
    const jp = { ...krValues, postalCode: "150-0001" };
    expect(checkoutSchema("kr").safeParse(jp).success).toBe(false);
  });

  it("still requires the recipient name and address", () => {
    expect(checkoutSchema("kr").safeParse({ ...krValues, recipientName: "" }).success).toBe(false);
    expect(checkoutSchema("kr").safeParse({ ...krValues, addressLine: "" }).success).toBe(false);
  });
});

describe("checkoutSchema — 일본 마켓", () => {
  it("still requires katakana furigana", () => {
    const noFurigana = { ...validValues, recipientFurigana: "" };
    expect(checkoutSchema("jp").safeParse(noFurigana).success).toBe(false);
  });

  it("rejects a five digit postal code", () => {
    const kr = { ...validValues, postalCode: "06232" };
    expect(checkoutSchema("jp").safeParse(kr).success).toBe(false);
  });
});
```

- [ ] **Step 3: 테스트가 실패하는지 확인**

Run: `pnpm test src/features/checkout-form/model/schema.test.ts`
Expected: FAIL — `checkoutSchema is not a function`

- [ ] **Step 4: 구현**

`src/features/checkout-form/model/schema.ts`를 아래로 바꾼다. **`CheckoutFormValues` 타입은 하나로 유지한다** — 마켓마다 타입이 달라지면 react-hook-form이 흔들린다:

```ts
import { z } from "zod";
import type { Market } from "@/shared/config/markets";

// views/mypage/model/schema.ts와 동일한 규칙 — 한쪽만 고치지 말 것
const KATAKANA_PATTERN = /^[ァ-ヶー\s]+$/;
const PHONE_PATTERN = /^[0-9\-\s]+$/;
const JP_POSTAL_PATTERN = /^\d{3}-?\d{4}$/;
const KR_POSTAL_PATTERN = /^\d{5}$/;

function isValidPhoneDigitCount(phone: string): boolean {
  return phone.replace(/[^0-9]/g, "").length >= 9;
}

// 주소 필드는 마켓별로 검증만 다르고 모양은 같다. 기반 객체를 하나로 두고
// superRefine으로 마켓 규칙을 얹어야 폼 값 타입이 안정적이다.
const checkoutFields = z.object({
  recipientName: z.string().min(1, "required"),
  recipientFurigana: z.string().default(""),
  phone: z
    .string()
    .min(1, "required")
    .regex(PHONE_PATTERN, "invalidPhone")
    .refine(isValidPhoneDigitCount, { message: "invalidPhone" }),
  email: z.string().min(1, "required").email("invalidEmail"),
  postalCode: z.string().min(1, "required"),
  prefecture: z.string().min(1, "required"),
  // 세종특별자치시는 시군구가 없다. 일본에서만 필수로 건다.
  city: z.string(),
  addressLine: z.string().min(1, "required"),
  building: z.string().optional(),
  memo: z.string().optional(),
});

export type CheckoutFormValues = z.infer<typeof checkoutFields>;

export function checkoutSchema(market: Market) {
  return checkoutFields.superRefine((v, ctx) => {
    applyPostalRule(market, v.postalCode, ctx);
    if (market === "jp") {
      applyFuriganaRule(v.recipientFurigana, ctx);
    }
  });
}

function applyPostalRule(market: Market, postalCode: string, ctx: z.RefinementCtx): void {
  const pattern = market === "jp" ? JP_POSTAL_PATTERN : KR_POSTAL_PATTERN;
  if (!pattern.test(postalCode)) {
    ctx.addIssue({ code: "custom", message: "invalidPostalCode", path: ["postalCode"] });
  }
}

// 후리가나는 일본에만 있는 개념이라 한국 마켓에서는 검사하지 않는다.
function applyFuriganaRule(furigana: string, ctx: z.RefinementCtx): void {
  if (furigana.length === 0) {
    ctx.addIssue({ code: "custom", message: "required", path: ["recipientFurigana"] });
    return;
  }
  if (!KATAKANA_PATTERN.test(furigana)) {
    ctx.addIssue({ code: "custom", message: "furiganaInvalid", path: ["recipientFurigana"] });
  }
}

export const initialCheckoutFormValues: CheckoutFormValues = {
  recipientName: "",
  recipientFurigana: "",
  phone: "",
  email: "",
  postalCode: "",
  prefecture: "",
  city: "",
  addressLine: "",
  building: "",
  memo: "",
};
```

**`city`는 기반 객체에서 필수로 두지 않는다.** 세종특별자치시는 시군구가 없어 검색 결과의
`sggNm`이 빈 문자열로 오고, `min(1)`을 걸면 세종 주소를 고른 사람이 주문할 수 없다.
일본은 市区町村이 반드시 있으므로 `superRefine`에서 일본 마켓일 때만 요구한다.

위 코드에서 `city`를 `z.string()`으로 두고, `checkoutSchema`의 `superRefine`에 한 줄을 더한다:

```ts
    if (market === "jp" && v.city.length === 0) {
      ctx.addIssue({ code: "custom", message: "required", path: ["city"] });
    }
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `pnpm test src/features/checkout-form/model/schema.test.ts`
Expected: PASS

- [ ] **Step 6: 호출부 반영**

Run: `grep -rn "checkoutSchema" src/`

`useCheckoutForm.ts`의 `resolver: zodResolver(checkoutSchema)`를 `zodResolver(checkoutSchema(market))`로 바꾼다. `market`은 이미 그 훅 안에 있다.

`src/app/api/checkout/route.ts`의 `checkoutSchema.safeParse(body.shipping)`도 `checkoutSchema(market).safeParse(...)`로 바꾼다. **서버도 마켓 규칙으로 검증해야 한다** — 클라이언트 검증만으로는 일본 우편번호가 한국 주문에 들어올 수 있다.

- [ ] **Step 7: 타입 체크와 테스트**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (exit 0)

Run: `pnpm test`
Expected: 새로 실패하는 스위트 없음

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(checkout): 주소 검증을 마켓별로 가른다

- 후리가나는 일본에만 있는 개념이고 우편번호 자릿수도 다르다
- 폼 값 타입은 하나로 유지해 react-hook-form이 흔들리지 않게 한다
- 서버도 같은 마켓 규칙으로 검증한다. 클라이언트만 믿으면 뚫린다"
```

---

## Task 4: 체크아웃 폼을 마켓별로

**Files:**
- Modify: `src/features/checkout-form/CheckoutForm.tsx`
- Modify: `src/shared/i18n/dictionaries.ts`

- [ ] **Step 1: 후리가나 입력란을 일본 마켓에만 보이게**

`src/features/checkout-form/CheckoutForm.tsx`에서 컴포넌트 최상위에 마켓을 얻고, 후리가나 `FormField`를 조건부로 만든다:

```tsx
import { useMarket } from "@/shared/market";
```

```tsx
  const market = useMarket();
```

```tsx
      {market === "jp" && (
        <FormField
          label={d.checkout.recipientFuriganaLabel}
          registration={register("recipientFurigana")}
          error={errorText(errors.recipientFurigana?.message)}
        />
      )}
```

- [ ] **Step 2: 우편번호 안내 문구를 마켓별로**

`d.checkout.postalCodePlaceholder`가 **ja·ko 양쪽 모두 `"123-4567"`** 로 되어 있다 (일본 형식).
마켓과 로케일이 1:1이므로 한국어 사전 값만 한국 형식으로 바꾸면 된다:

```ts
      postalCodePlaceholder: "06232",
```

일본어 쪽은 그대로 둔다.

- [ ] **Step 3: 타입 체크와 테스트**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (exit 0)

Run: `pnpm test`
Expected: 새로 실패하는 스위트 없음

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(checkout): 한국 마켓에서 후리가나 입력란을 감춘다

- 한국 고객에게는 넣을 값이 없는 항목이다"
```

---

## Task 5: 도로명주소 검색

**이 태스크는 `JUSO_API_KEY`가 있어야 완료할 수 있다.** 키가 없으면 여기서 멈추고 보고하라. Task 6 이후는 이 태스크 없이도 진행할 수 있다.

키 발급: juso.go.kr 회원가입 후 신청. 무료.

**Files:**
- Create: `src/app/api/address/search/route.ts`
- Create: `src/features/address-search/AddressSearch.tsx`
- Create: `src/features/address-search/index.ts`
- Modify: `src/features/checkout-form/CheckoutForm.tsx`
- Modify: `src/shared/i18n/dictionaries.ts`
- Modify: `.env.local.example`

- [ ] **Step 1: 서버 라우트 작성**

API 키를 클라이언트에 노출하지 않기 위해 서버에서 프록시한다.

`src/app/api/address/search/route.ts`:

```ts
import { NextResponse } from "next/server";
import type { JusoAddress } from "@/features/address-search/model/jusoAddress";

const JUSO_ENDPOINT = "https://business.juso.go.kr/addrlink/addrLinkApi.do";

export async function GET(request: Request): Promise<NextResponse> {
  const keyword = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (keyword.length === 0) {
    return NextResponse.json({ addresses: [] });
  }
  const apiKey = process.env.JUSO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "notConfigured" }, { status: 500 });
  }
  try {
    return NextResponse.json({ addresses: await searchJuso(apiKey, keyword) });
  } catch {
    return NextResponse.json({ error: "searchFailed" }, { status: 502 });
  }
}

async function searchJuso(apiKey: string, keyword: string): Promise<JusoAddress[]> {
  const url = new URL(JUSO_ENDPOINT);
  url.searchParams.set("confmKey", apiKey);
  url.searchParams.set("currentPage", "1");
  url.searchParams.set("countPerPage", "10");
  url.searchParams.set("keyword", keyword);
  url.searchParams.set("resultType", "json");

  const res = await fetch(url, { cache: "no-store" });
  const body = (await res.json()) as JusoResponse;
  if (body.results?.common?.errorCode !== "0") {
    throw new Error(body.results?.common?.errorMessage ?? "unknown");
  }
  return body.results.juso ?? [];
}

type JusoResponse = {
  results?: {
    common?: { errorCode?: string; errorMessage?: string };
    juso?: JusoAddress[];
  };
};
```

**주의:** 이 라우트는 `[market]` 밖이라 마켓 컨텍스트가 없다. 마켓을 받을 필요도 없다 — 한국 주소만 다룬다.

- [ ] **Step 2: 검색 UI 작성**

`src/features/address-search/AddressSearch.tsx`. 입력 + 결과 목록 + 선택 시 콜백. **각진 테두리, 무채색 토큰만 쓴다:**

```tsx
"use client";

import { useState } from "react";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { jusoToAddressFields, type AddressFields, type JusoAddress } from "./model/jusoAddress";

export function AddressSearch({ onSelect }: { onSelect: (fields: AddressFields) => void }) {
  const { d } = useLocale();
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<JusoAddress[]>([]);
  const [state, setState] = useState<"idle" | "searching" | "failed">("idle");

  const search = async () => {
    setState("searching");
    try {
      const res = await fetch(`/api/address/search?q=${encodeURIComponent(keyword)}`);
      const body = (await res.json()) as { addresses?: JusoAddress[] };
      setResults(body.addresses ?? []);
      setState(res.ok ? "idle" : "failed");
    } catch {
      setState("failed");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder={d.checkout.addressSearchPlaceholder}
          className="h-11 flex-1 border border-border bg-surface px-3 text-sm outline-none placeholder:text-muted focus:border-sage"
        />
        <button
          type="button"
          onClick={search}
          disabled={keyword.trim().length === 0 || state === "searching"}
          className="bg-foreground px-4 text-sm text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {d.checkout.addressSearchButton}
        </button>
      </div>
      {state === "failed" && <p className="text-sm text-sale">{d.checkout.addressSearchFailed}</p>}
      <AddressResults results={results} onSelect={(j) => onSelect(jusoToAddressFields(j))} />
    </div>
  );
}

function AddressResults({
  results,
  onSelect,
}: {
  results: JusoAddress[];
  onSelect: (juso: JusoAddress) => void;
}) {
  if (results.length === 0) {
    return null;
  }
  return (
    <ul className="max-h-60 divide-y divide-border overflow-y-auto border border-border">
      {results.map((juso) => (
        <li key={`${juso.zipNo}-${juso.roadAddrPart1}`}>
          <button
            type="button"
            onClick={() => onSelect(juso)}
            className="block w-full px-3 py-2 text-left text-sm text-foreground hover:bg-sand"
          >
            <span className="text-xs text-muted">{juso.zipNo}</span> {juso.roadAddrPart1}
          </button>
        </li>
      ))}
    </ul>
  );
}
```

`src/features/address-search/index.ts`:

```ts
export { AddressSearch } from "./AddressSearch";
export { jusoToAddressFields } from "./model/jusoAddress";
export type { AddressFields, JusoAddress } from "./model/jusoAddress";
```

- [ ] **Step 3: 체크아웃 폼에 붙이기**

`src/features/checkout-form/CheckoutForm.tsx`에서 한국 마켓일 때만 검색을 보여주고, 고르면 네 필드를 채운다. `setValue`가 필요하므로 `useCheckoutForm`이 그것을 돌려주도록 고친다:

```tsx
      {market === "kr" && (
        <AddressSearch
          onSelect={(fields) => {
            setValue("postalCode", fields.postalCode, { shouldValidate: true });
            setValue("prefecture", fields.prefecture, { shouldValidate: true });
            setValue("city", fields.city, { shouldValidate: true });
            setValue("addressLine", fields.addressLine, { shouldValidate: true });
          }}
        />
      )}
```

한국 마켓에서는 **우편번호·시도·시군구·도로명주소 입력란을 읽기 전용으로** 만든다. 손으로 고치면 검색 결과와 어긋난다. `FormField`가 `readOnly`를 받지 않으면 그 prop을 추가한다.

- [ ] **Step 4: 문구 추가**

`src/shared/i18n/dictionaries.ts`의 **ja와 ko 양쪽** `checkout` 섹션에 추가한다. 한쪽만 넣으면 `tsc`가 잡는다:

ko:

```ts
      addressSearchPlaceholder: "도로명, 건물명, 지번으로 검색",
      addressSearchButton: "주소 검색",
      addressSearchFailed: "주소를 불러오지 못했어요. 잠시 후 다시 시도해주세요",
```

ja (한국 마켓에서만 보이지만 타입을 맞추기 위해 필요하다):

```ts
      addressSearchPlaceholder: "住所を検索",
      addressSearchButton: "住所検索",
      addressSearchFailed: "住所を取得できませんでした。しばらくしてからお試しください",
```

- [ ] **Step 5: 환경변수 예시에 추가**

`.env.local.example`에 한 줄 추가:

```
JUSO_API_KEY=
```

- [ ] **Step 6: 타입 체크와 테스트**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (exit 0)

Run: `pnpm test`
Expected: 새로 실패하는 스위트 없음

- [ ] **Step 7: 실제 검색 확인 (키가 있을 때만)**

`.env`에 `JUSO_API_KEY`를 넣고:

Run: `rm -rf .next && pnpm dev`

`/kr/checkout`에서 "테헤란로"로 검색해 결과가 뜨고, 고르면 네 필드가 채워지는지 확인한다.

Run: `curl -s "http://localhost:3000/api/address/search?q=테헤란로" | head -c 300`
Expected: `{"addresses":[{...}]}`

**응답의 필드명이 `zipNo`·`roadAddrPart1`·`siNm`·`sggNm`과 다르면 `JusoAddress` 타입과 순수 함수를 실제 응답에 맞춰 고치고, Task 2의 테스트도 함께 고쳐라.**

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(address): 한국 마켓에 도로명주소 검색을 붙인다

- 한국에서는 주소를 손으로 치지 않는다. 검색이 없으면 주문 자체가 어렵다
- API 키를 감추려고 서버 라우트에서 프록시한다"
```

---

## Task 6: 주문에 마켓과 한국어 상품명 저장

**이 태스크를 마치면 Task 1의 마이그레이션을 적용해야 주문이 저장된다.**

**Files:**
- Modify: `src/app/api/checkout/route.ts`

- [ ] **Step 1: 상품 조회에 한국어 이름 추가**

`fetchVariantWithProduct`의 select를 바꾼다:

```ts
    .select("id, stock, products ( name_ja, name_ko, price_jpy, price_krw )")
```

`extractProduct`의 캐스팅과 `resolveOneItem`·`buildResolvedItem`의 시그니처에 `name_ko`를 흘린다.

`ResolvedItem` 타입에 `product_name_ko: string`을 추가하고, `insertOrderItems`가 그 값을 함께 넣게 한다.

- [ ] **Step 2: 주문에 마켓 저장**

`buildOrderPayload`의 반환에 추가한다:

```ts
    market,
```

`market`은 이미 그 함수의 인자로 들어와 있다.

- [ ] **Step 3: 타입 체크와 테스트**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (exit 0)

Run: `pnpm test`
Expected: 새로 실패하는 스위트 없음

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat(order): 주문에 마켓과 한국어 상품명을 남긴다

- 주문 내역을 주문 당시 통화와 언어로 보여주려면 그때 값을 박제해야 한다"
```

---

## Task 7: 주문 내역을 주문 당시 통화·언어로

**Files:**
- Modify: `src/entities/order/model/types.ts`
- Modify: `src/shared/api/supabase/orders.mappers.ts`
- Modify: `src/shared/api/supabase/orders.mappers.test.ts`
- Modify: `src/shared/api/supabase/orders.ts`
- Modify: `src/views/mypage/MypageView.tsx`
- Modify: `src/features/order-lookup-form/OrderLookupForm.tsx`

- [ ] **Step 1: 타입에 마켓과 한국어 상품명 추가**

`src/entities/order/model/types.ts`:

```ts
import type { Market } from "@/shared/config/markets";
```

`OrderItem`에 추가:

```ts
  productNameKo: string | null;
```

`Order`에 추가:

```ts
  market: Market;
```

`recipientFurigana`를 `string | null`로 바꾼다.

- [ ] **Step 2: 매퍼 테스트 추가**

`src/shared/api/supabase/orders.mappers.test.ts`의 픽스처에 `market: "jp"`, `product_name_ko: null`, 그리고 한국 주문 케이스를 추가한다. 아래를 적절한 describe에 넣는다:

```ts
  it("carries the order's market through", () => {
    const order = mapDbOrderToOrder({ ...baseRow, market: "kr" });
    expect(order.market).toBe("kr");
  });

  it("falls back to the japanese product name when korean is missing", () => {
    const order = mapDbOrderToOrder(baseRow);
    expect(order.items[0].productNameKo).toBeNull();
  });

  it("defaults an unknown market to the japanese market", () => {
    const order = mapDbOrderToOrder({ ...baseRow, market: "xx" });
    expect(order.market).toBe("jp");
  });
```

`baseRow`는 기존 픽스처 이름으로 바꿔 쓴다.

- [ ] **Step 3: 매퍼 구현**

`src/shared/api/supabase/orders.mappers.ts`의 `OrderRow`·`OrderItemRow`에 `market: string`, `product_name_ko: string | null`을 추가하고 매퍼에서 옮긴다.

**알 수 없는 마켓 값은 일본으로 떨어뜨린다.** DB에 체크 제약이 있어 정상적으로는 생기지 않지만, 매퍼가 방어해야 화면이 죽지 않는다:

```ts
    market: isMarket(row.market) ? row.market : "jp",
```

`src/shared/api/supabase/orders.ts`의 `ORDER_SELECT`에 `market`과 `product_name_ko`를 추가한다.

- [ ] **Step 4: 주문 내역 표시를 마켓 기준으로**

`src/views/mypage/MypageView.tsx`와 `src/features/order-lookup-form/OrderLookupForm.tsx`에서 2단계에 박아둔 `formatPrice(x, "JPY")`를 바꾼다:

```tsx
formatPrice(order.totalPrice, marketCurrency(order.market))
```

import를 추가한다:

```tsx
import { marketCurrency } from "@/shared/config/markets";
```

**`useMarket()`을 쓰면 안 된다.** 지금 보고 있는 마켓이 아니라 **주문 당시** 마켓이어야 한다. 한국 마켓에서 과거 일본 주문을 보면 엔화로 보여야 맞다.

상품명도 로케일에 따라 고른다. 한국어가 없으면 일본어로 폴백한다:

```tsx
const { locale } = useLocale();
const name = locale === "ko" ? (item.productNameKo ?? item.productNameJa) : item.productNameJa;
```

두 파일의 기존 주석("주문은 아직 마켓을 기록하지 않는다(3단계)")을 지운다.

- [ ] **Step 5: 타입 체크와 테스트**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (exit 0)

Run: `pnpm test`
Expected: 새로 실패하는 스위트 없음

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(order): 주문 내역을 주문 당시 통화와 언어로 보여준다

- 지금 보고 있는 마켓이 아니라 주문 당시 마켓을 따라야 한다
- 한국어 상품명이 없는 기존 주문은 일본어로 폴백한다"
```

---

## Task 8: 문서 갱신

**Files:**
- Modify: `docs/multi-market-status.md`
- Modify: `docs/open-decisions.md`
- Modify: `docs/data-schema.md`

- [ ] **Step 1: 진행표 갱신**

`docs/multi-market-status.md`의 표에서 3단계를 ✅로 바꾸고, "3단계 — 아직 시작 안 함" 절을 완료 내용으로 교체한다. 재개 절차와 확인 항목은 그대로 둔다.

- [ ] **Step 2: 미결 항목 갱신**

`docs/open-decisions.md`의 **B-1(도로명주소 API 키)** 항목에 상태를 반영한다. 키를 넣어 확인했으면 `**해결됨**`으로, Task 5를 건너뛰었으면 그대로 둔다.

- [ ] **Step 3: 스키마 문서 갱신**

`docs/data-schema.md`에 `orders.market`, `orders.recipient_furigana`가 nullable이 된 것, `order_items.product_name_ko`를 반영한다.

- [ ] **Step 4: Commit**

```bash
git add docs/
git commit -m "docs: 3단계 구현으로 정리된 항목 반영"
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

Supabase 대시보드 → SQL Editor에서 `supabase/migrations/20260831000000_order_market.sql` 실행.

확인:

```sql
select column_name, is_nullable from information_schema.columns
where table_name = 'orders' and column_name in ('market', 'recipient_furigana');
select column_name from information_schema.columns
where table_name = 'order_items' and column_name = 'product_name_ko';
```

Expected: `market`(NO), `recipient_furigana`(**YES**), `product_name_ko`

**적용 전에는 주문이 저장되지 않는다.**

- [ ] **Step 5: 수동 확인**

Run: `pnpm dev` (첫 컴파일 30~40초)

1. `/kr/checkout` — 후리가나 입력란이 **없다**
2. 주소 검색으로 주소를 고르면 우편번호·시도·시군구·도로명주소가 채워진다
3. 5자리 우편번호로 주문이 완료된다
4. 주문 후 장바구니가 비워진다 (기존 동작 — 회귀가 없는지만 확인)
5. `/kr/mypage`에서 그 주문이 **원화**로 보인다
6. `/jp/checkout` — 후리가나 입력란이 **있고 필수다**
7. 일본 주문 후 `/kr/mypage`에서 보면 그 주문은 **엔화**로 보인다
8. `/jp`에서 7자리, `/kr`에서 5자리 외의 우편번호는 거절된다
