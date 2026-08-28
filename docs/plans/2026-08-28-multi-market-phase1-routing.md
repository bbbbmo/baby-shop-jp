# 다국가 마켓 1단계 — 마켓 라우팅 기반 Implementation Plan

> **상태: 완료 · main에 머지됨** (2026-08-28)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 모든 사용자 화면을 `/jp` · `/kr` 경로 아래로 옮기고, 경로가 표시 언어를 결정하게 한다. 가격·배송비·주소는 이 단계에서 바꾸지 않는다.

**Architecture:** 경로 첫 세그먼트가 마켓을 결정한다. `[market]` 레이아웃이 값을 검증해 `MarketProvider`와 `LocaleProvider`에 동시에 넘긴다. 내부 링크는 `MarketLink`가 접두사를 스스로 붙이므로 호출부의 `href` 문자열은 고치지 않는다. 언어 토글은 마켓 전환으로 대체되고 로케일 쿠키는 사라진다.

**Tech Stack:** Next.js 16 (App Router, Turbopack), TypeScript, Tailwind, vitest

**설계 문서:** `docs/superpowers/specs/2026-08-28-multi-market-orders-design.md`
**미결 항목:** `docs/open-decisions.md`

---

## 전체 3단계 중 이 계획의 위치

| 단계 | 내용 | 결과 |
|---|---|---|
| **1단계 (이 계획)** | 마켓 라우팅, 로케일 고정 | `/jp`는 일본어, `/kr`는 한국어로 동작. 가격은 아직 공통 |
| 2단계 | 가격·통화·배송비 | 마켓별 가격이 보임 |
| 3단계 | 주소 폼·주소 검색·주문 | 한국 고객이 주문을 완료할 수 있음 |

**이 단계에는 DB 마이그레이션이 없다.** 가격 컬럼은 2단계, 주문 컬럼은 3단계에서 그 코드와 함께 바꾼다.

---

## 사전 지식 (이 코드베이스를 처음 보는 사람을 위해)

**FSD 레이어** — `app` → `views` → `widgets` → `features` → `entities` → `shared` 순으로만 import한다. 역방향 금지.

**Next.js 16** — 미들웨어 파일 이름이 `middleware.ts`가 아니라 `proxy.ts`다. 이 저장소는 `src/proxy.ts`에 두고 Supabase 세션 갱신에 쓰고 있다. 이 계획에서는 건드리지 않는다.

**정적 세그먼트 우선순위** — `src/app/admin/`은 정적이라 `src/app/[market]/`보다 먼저 매칭된다. `/admin`이 `[market]="admin"`으로 잡히지 않는다.

**함수 크기** — 최대 15줄, 중첩 최대 3단계.

**디자인** — 전역 `border-radius: 0 !important`. `rounded-*` 금지. 색상은 CSS 변수 토큰(`text-foreground`, `text-muted`, `bg-surface`, `border-border`, `bg-sage`).

**테스트** — vitest, `src/**/*.test.ts`만 수집한다 (`.tsx`는 수집 안 됨). 실행은 `pnpm test`.

**기존 실패** — `src/shared/api/supabase/adminServer.test.ts` 1개 스위트는 `.env.local`이 없으면 실패한다. 기존 상태이며 이 작업과 무관하다. `pnpm lint`도 `src/shared/i18n/FontModeProvider.tsx:36`에 기존 경고 1건이 있다. 둘 다 고치지 않는다.

**현재 테스트 수** — 90개 통과.

---

## File Structure

| 파일 | 책임 |
|---|---|
| `src/shared/config/markets.ts` | 마켓 목록·판별·로케일 매핑 |
| `src/shared/market/MarketProvider.tsx` | 현재 마켓을 하위 트리에 공급 |
| `src/shared/market/marketPath.ts` | 경로에 마켓 접두사를 붙이는 순수 함수 |
| `src/shared/market/MarketLink.tsx` | 접두사를 자동으로 붙이는 `next/link` 래퍼 |
| `src/shared/market/useMarketRouter.ts` | `router.push`/`replace`의 마켓 대응 |
| `src/shared/market/index.ts` | 슬라이스 public API |
| `src/features/market-switcher/` | 마켓(=언어) 전환 UI. `locale-toggle`을 대체 |
| `src/app/[market]/layout.tsx` | 마켓 검증 + 프로바이더 |
| `src/app/page.tsx` | `/` 진입 시 기본 마켓으로 보냄 |

---

## Task 1: 마켓 설정 모듈

**Files:**
- Create: `src/shared/config/markets.ts`
- Create: `src/shared/config/markets.test.ts`

- [x] **Step 1: 실패하는 테스트 작성**

`src/shared/config/markets.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DEFAULT_MARKET, MARKETS, isMarket, marketLocale } from "./markets";

describe("isMarket", () => {
  it("accepts the two known markets", () => {
    expect(isMarket("jp")).toBe(true);
    expect(isMarket("kr")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isMarket("us")).toBe(false);
    expect(isMarket("admin")).toBe(false);
    expect(isMarket("")).toBe(false);
    expect(isMarket(undefined)).toBe(false);
    expect(isMarket(null)).toBe(false);
    expect(isMarket(0)).toBe(false);
  });
});

describe("marketLocale", () => {
  it("maps each market to its fixed language", () => {
    expect(marketLocale("jp")).toBe("ja");
    expect(marketLocale("kr")).toBe("ko");
  });
});

describe("market constants", () => {
  it("lists every market", () => {
    expect([...MARKETS]).toEqual(["jp", "kr"]);
  });

  it("defaults to the japanese market", () => {
    expect(DEFAULT_MARKET).toBe("jp");
  });

  it("has a locale for every market", () => {
    for (const market of MARKETS) {
      expect(marketLocale(market)).toMatch(/^(ja|ko)$/);
    }
  });
});
```

- [x] **Step 2: 테스트가 실패하는지 확인**

Run: `pnpm test src/shared/config/markets.test.ts`
Expected: FAIL — `Failed to resolve import "./markets"`

- [x] **Step 3: 최소 구현**

`src/shared/config/markets.ts`:

```ts
import type { Locale } from "@/shared/i18n/types";

// 경로 첫 세그먼트가 마켓을 결정한다. 마켓은 통화·배송·주소 형식과
// 표시 언어를 함께 결정하므로 별도의 언어 토글을 두지 않는다.
export type Market = "jp" | "kr";

export const MARKETS = ["jp", "kr"] as const;

// 브라우저 언어가 일본어·한국어 어느 쪽도 아닐 때 보낼 곳.
// 기존 서비스가 일본 대상이었으므로 일본 마켓을 기본으로 둔다.
export const DEFAULT_MARKET: Market = "jp";

const MARKET_LOCALE: Record<Market, Locale> = {
  jp: "ja",
  kr: "ko",
};

export function isMarket(value: unknown): value is Market {
  return value === "jp" || value === "kr";
}

export function marketLocale(market: Market): Locale {
  return MARKET_LOCALE[market];
}
```

- [x] **Step 4: 테스트 통과 확인**

Run: `pnpm test src/shared/config/markets.test.ts`
Expected: PASS — 6 tests

- [x] **Step 5: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (exit 0)

- [x] **Step 6: Commit**

```bash
git add src/shared/config/markets.ts src/shared/config/markets.test.ts
git commit -m "feat(market): 마켓 설정 모듈 추가

- 마켓이 통화·배송·언어를 함께 결정하므로 판별과 로케일 매핑을 한 곳에 모은다"
```

---

## Task 2: 마켓 경로 유틸과 프로바이더

**Files:**
- Create: `src/shared/market/marketPath.ts`
- Create: `src/shared/market/marketPath.test.ts`
- Create: `src/shared/market/MarketProvider.tsx`
- Create: `src/shared/market/MarketLink.tsx`
- Create: `src/shared/market/useMarketRouter.ts`
- Create: `src/shared/market/index.ts`

- [x] **Step 1: 실패하는 테스트 작성**

`src/shared/market/marketPath.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { marketPath, stripMarket } from "./marketPath";

describe("marketPath", () => {
  it("prefixes a root path", () => {
    expect(marketPath("kr", "/")).toBe("/kr");
  });

  it("prefixes a nested path", () => {
    expect(marketPath("jp", "/products/girl-top")).toBe("/jp/products/girl-top");
  });

  it("keeps the query string", () => {
    expect(marketPath("kr", "/search?q=%EC%98%B7")).toBe("/kr/search?q=%EC%98%B7");
  });

  it("does not double-prefix an already prefixed path", () => {
    expect(marketPath("kr", "/kr/cart")).toBe("/kr/cart");
  });

  it("re-points a path that carries the other market", () => {
    expect(marketPath("kr", "/jp/cart")).toBe("/kr/cart");
  });

  it("leaves an external url alone", () => {
    expect(marketPath("kr", "https://example.com")).toBe("https://example.com");
  });

  it("leaves an admin path alone", () => {
    expect(marketPath("kr", "/admin/products")).toBe("/admin/products");
  });
});

describe("stripMarket", () => {
  it("removes a market prefix", () => {
    expect(stripMarket("/jp/products")).toBe("/products");
  });

  it("returns root when the path is only a market", () => {
    expect(stripMarket("/kr")).toBe("/");
  });

  it("leaves a path without a market prefix alone", () => {
    expect(stripMarket("/admin/products")).toBe("/admin/products");
  });
});
```

- [x] **Step 2: 테스트가 실패하는지 확인**

Run: `pnpm test src/shared/market/marketPath.test.ts`
Expected: FAIL — `Failed to resolve import "./marketPath"`

- [x] **Step 3: 최소 구현**

`src/shared/market/marketPath.ts`:

```ts
import { isMarket, type Market } from "@/shared/config/markets";

// /admin은 마켓과 무관한 공용 화면이라 접두사를 붙이지 않는다.
const MARKET_FREE_PREFIXES = ["/admin"];

// 링크 호출부가 href 문자열을 고치지 않아도 되도록, 접두사 판단을 여기서 전부 한다.
// 이미 마켓이 붙은 경로는 목적 마켓으로 갈아끼운다 — 마켓 전환 시 현재 경로를 유지하는 데 쓴다.
export function marketPath(market: Market, path: string): string {
  if (!path.startsWith("/")) {
    return path;
  }
  if (MARKET_FREE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
    return path;
  }
  // stripMarket이 루트를 "/"로 돌려주므로 그대로 이으면 "/kr/"가 된다.
  const rest = stripMarket(path);
  return rest === "/" ? `/${market}` : `/${market}${rest}`;
}

export function stripMarket(path: string): string {
  const [, first, ...rest] = path.split("/");
  if (!isMarket(first)) {
    return path;
  }
  return rest.length > 0 ? `/${rest.join("/")}` : "/";
}
```

- [x] **Step 4: 테스트 통과 확인**

Run: `pnpm test src/shared/market/marketPath.test.ts`
Expected: PASS — 10 tests

- [x] **Step 5: 프로바이더 작성**

`src/shared/market/MarketProvider.tsx`:

```tsx
"use client";

import { createContext, useContext } from "react";
import type { Market } from "@/shared/config/markets";

const MarketContext = createContext<Market | null>(null);

export function MarketProvider({
  market,
  children,
}: {
  market: Market;
  children: React.ReactNode;
}) {
  return <MarketContext.Provider value={market}>{children}</MarketContext.Provider>;
}

export function useMarket(): Market {
  const market = useContext(MarketContext);
  if (!market) {
    throw new Error("useMarket은 MarketProvider 안에서만 쓸 수 있습니다");
  }
  return market;
}
```

- [x] **Step 6: 링크 래퍼 작성**

`src/shared/market/MarketLink.tsx`. `next/link`의 props를 그대로 받고 `href`만 가공한다:

```tsx
"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useMarket } from "./MarketProvider";
import { marketPath } from "./marketPath";

type MarketLinkProps = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

// 접두사를 이 컴포넌트가 붙이므로 호출부는 "/cart" 같은 기존 경로를 그대로 쓴다.
export function MarketLink({ href, ...props }: MarketLinkProps) {
  const market = useMarket();
  return <Link href={marketPath(market, href)} {...props} />;
}
```

- [x] **Step 7: 라우터 훅 작성**

`src/shared/market/useMarketRouter.ts`:

```ts
"use client";

import { useRouter } from "next/navigation";
import { useMarket } from "./MarketProvider";
import { marketPath } from "./marketPath";

// router.push/replace에도 같은 접두사 규칙을 적용한다.
export function useMarketRouter() {
  const router = useRouter();
  const market = useMarket();
  return {
    push: (path: string) => router.push(marketPath(market, path)),
    replace: (path: string) => router.replace(marketPath(market, path)),
  };
}
```

- [x] **Step 8: public API 작성**

`src/shared/market/index.ts`:

```ts
export { MarketProvider, useMarket } from "./MarketProvider";
export { MarketLink } from "./MarketLink";
export { useMarketRouter } from "./useMarketRouter";
export { marketPath, stripMarket } from "./marketPath";
```

- [x] **Step 9: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (exit 0)

- [x] **Step 10: Commit**

```bash
git add src/shared/market
git commit -m "feat(market): 마켓 경로 유틸과 프로바이더 추가

- 접두사 판단을 MarketLink 안에 두어 링크 호출부의 href를 고치지 않아도 되게 한다
- 이미 마켓이 붙은 경로는 갈아끼워, 마켓 전환 시 현재 위치를 유지할 수 있게 한다"
```

---

## Task 3: 라우트를 `[market]` 아래로 이동

이 태스크는 중간에 멈추면 사이트가 동작하지 않는다. **Step 1부터 Step 8까지 한 번에 끝내고 커밋한다.**

**Files:**
- Move: `src/app/(main)` → `src/app/[market]/(main)`
- Move: `src/app/signin`, `src/app/signup`, `src/app/auth` → `src/app/[market]/` 아래
- Create: `src/app/[market]/layout.tsx`
- Create: `src/app/page.tsx`
- Modify: `src/app/layout.tsx`

- [x] **Step 1: 라우트 파일 이동**

```bash
mkdir -p "src/app/[market]"
git mv "src/app/(main)" "src/app/[market]/(main)"
git mv src/app/signin "src/app/[market]/signin"
git mv src/app/signup "src/app/[market]/signup"
git mv src/app/auth "src/app/[market]/auth"
```

Run: `find src/app -name "page.tsx" -o -name "layout.tsx" | sort`
Expected: `src/app/[market]/...` 아래에 (main)·signin·signup·auth가 있고, `src/app/admin/`과 `src/app/layout.tsx`는 그대로다.

- [x] **Step 2: 마켓 레이아웃 작성**

`src/app/[market]/layout.tsx`:

```tsx
import { notFound } from "next/navigation";
import { isMarket, marketLocale } from "@/shared/config/markets";
import { MarketProvider } from "@/shared/market";
import { LocaleProvider } from "@/shared/i18n/LocaleProvider";

export default async function MarketLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ market: string }>;
}) {
  const { market } = await params;
  if (!isMarket(market)) {
    notFound();
  }
  return (
    <MarketProvider market={market}>
      <LocaleProvider initialLocale={marketLocale(market)}>{children}</LocaleProvider>
    </MarketProvider>
  );
}
```

Next.js 16에서 `params`는 Promise다. `await` 없이 쓰면 안 된다.

- [x] **Step 3: 루트 리다이렉트 작성**

`src/app/page.tsx`:

```tsx
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DEFAULT_MARKET, type Market } from "@/shared/config/markets";

export default async function RootPage() {
  const acceptLanguage = (await headers()).get("accept-language") ?? "";
  redirect(`/${preferredMarket(acceptLanguage)}`);
}

// 브라우저 언어는 기본값을 정하는 데만 쓴다. 추정이 틀려도 화면 위쪽의
// 마켓 전환으로 바꿀 수 있으므로 사용자가 갇히지 않는다.
function preferredMarket(acceptLanguage: string): Market {
  const lower = acceptLanguage.toLowerCase();
  if (lower.startsWith("ko")) {
    return "kr";
  }
  if (lower.startsWith("ja")) {
    return "jp";
  }
  return DEFAULT_MARKET;
}
```

- [x] **Step 4: 루트 레이아웃에서 로케일 쿠키 읽기 제거**

`src/app/layout.tsx`에서 아래를 삭제한다:

```tsx
import { cookies } from "next/headers";
```

```tsx
import { LocaleProvider } from "@/shared/i18n/LocaleProvider";
import { LOCALE_COOKIE_KEY, isLocale } from "@/shared/i18n/types";
```

그리고 `RootLayout` 본문의 이 세 줄을 삭제한다:

```tsx
  const cookieStore = await cookies();
  const storedLocale = cookieStore.get(LOCALE_COOKIE_KEY)?.value;
  const locale = isLocale(storedLocale) ? storedLocale : "ja";
```

`<html lang={locale}` 를 아래로 바꾼다. 언어는 `[market]` 레이아웃이 정하므로 루트에서는 중립값을 둔다:

```tsx
    <html lang="ja"
```

`LocaleProvider` 래핑을 걷어낸다. 기존:

```tsx
            <LocaleProvider initialLocale={locale}>
              <FontModeProvider>{children}</FontModeProvider>
            </LocaleProvider>
```

교체 후:

```tsx
            <FontModeProvider>{children}</FontModeProvider>
```

`RootLayout`은 이제 `async`일 필요가 없지만, 그대로 두어도 동작한다. 시그니처는 건드리지 않는다.

- [x] **Step 5: 마켓 화면의 Link를 MarketLink로 교체**

아래 파일에서 `next/link`의 `Link` import를 `@/shared/market`의 `MarketLink`로 바꾸고, JSX의 `<Link` → `<MarketLink`, `</Link>` → `</MarketLink>`로 바꾼다. **`href` 문자열은 고치지 않는다.**

- `src/features/consent-form/ConsentForm.tsx`
- `src/features/signin-form/SigninForm.tsx`
- `src/features/signup-form/SignupForm.tsx`
- `src/views/signup/SignupView.tsx`
- `src/views/signin/SigninView.tsx`
- `src/views/consent/ConsentView.tsx`
- `src/views/checkout/CheckoutView.tsx`
- `src/views/checkout-complete/CheckoutCompleteView.tsx`
- `src/views/cart/CartView.tsx`
- `src/widgets/header/CartButton.tsx`
- `src/widgets/header/NavDrawer.tsx`
- `src/widgets/home-hero/HeroCarousel.tsx`
- `src/features/look-modal/WornItem.tsx`
- `src/entities/product/ui/ProductCard.tsx`
- `src/shared/ui/SectionHeader.tsx`

import 예시:

```tsx
import { MarketLink } from "@/shared/market";
```

**`src/widgets/header/Header.tsx`는 섞여 있다.** 브랜드 링크(`/`)와 마이페이지 링크(`/mypage` 또는 `/signin`)는 `MarketLink`로 바꾸고, **`/admin` 링크는 `next/link`의 `Link`를 그대로 둔다.** 두 import를 함께 둔다:

```tsx
import Link from "next/link";
import { MarketLink } from "@/shared/market";
```

**바꾸지 않는 파일** (관리자 전용):
- `src/app/admin/layout.tsx`
- `src/features/admin-product-form/ui/AdminProductForm.tsx`
- `src/views/admin-product-list/AdminProductListView.tsx`

다만 `src/app/admin/layout.tsx`의 `href="/"`는 루트 리다이렉트를 거치게 되어 한 번 더 이동한다. 그대로 두어도 동작하므로 이 태스크에서는 건드리지 않는다.

- [x] **Step 6: router.push / replace 교체**

아래 파일에서 `useRouter`를 `useMarketRouter`로 바꾼다. **경로 문자열은 고치지 않는다.**

`src/features/search/SearchBar.tsx`:

```ts
import { useMarketRouter } from "@/shared/market";
```

```ts
  const router = useMarketRouter();
```

같은 방식으로 아래도 바꾼다.

- `src/views/checkout/CheckoutView.tsx` — `router.replace("/cart")`, `router.replace(\`/checkout/complete?order=${orderNumber}\`)`
- `src/views/consent/ConsentView.tsx` — `router.replace("/signin")`, `router.replace("/")`
- `src/views/mypage/MypageView.tsx` — `router.replace("/signin")`, `router.replace("/")`
- `src/views/signin/SigninView.tsx` — `router.replace(redirect)`

**`src/features/admin-product-form/model/useAdminProductForm.ts`는 바꾸지 않는다** (관리자 경로).

- [x] **Step 7: OAuth 콜백의 목적지에 마켓 접두사 적용**

`src/app/[market]/auth/callback/page.tsx`의 `handleCallback`이 만든 목적지에 접두사를 붙여야 한다.
콜백은 `/[market]/auth/callback`에 있으므로 현재 경로에서 마켓을 읽는다.

`AuthCallbackHandler`를 아래로 바꾼다:

```tsx
function AuthCallbackHandler() {
  const searchParams = useSearchParams();
  const market = useMarket();
  const handled = useRef(false);

  useEffect(() => {
    // React StrictMode(dev)가 effect를 두 번 실행하는데, OAuth code는
    // 한 번 쓰면 무효화되는 일회용 값이라 두 번째 exchange는 항상 실패한다.
    // ref로 막아 실제 처리가 한 번만 일어나게 한다.
    if (handled.current) return;
    handled.current = true;
    handleCallback(searchParams, market);
  }, [searchParams, market]);

  return <div className="mx-auto max-w-480 px-6 py-20 sm:px-10" />;
}
```

`handleCallback`의 시그니처와 마지막 줄을 바꾼다:

```tsx
async function handleCallback(
  searchParams: ReadonlyURLSearchParams,
  market: Market,
): Promise<void> {
  const from = searchParams.get("from") === "signin" ? "signin" : "signup";
  const oauthError = searchParams.get("error");
  const hasCode = searchParams.get("code") !== null;
  // 여기서 code를 직접 교환하면 안 된다. supabase-js가 detectSessionInUrl로
  // 이 화면에서 이미 교환을 끝내고 일회용 code_verifier를 삭제하기 때문에,
  // 두 번째 교환은 항상 pkce_code_verifier_not_found로 실패한다.
  const session = oauthError || !hasCode ? false : await hasSession();
  const consent = session ? await readConsent() : false;
  const destination = resolvePostAuthDestination({
    from,
    oauthError,
    hasCode,
    hasSession: session,
    hasConsent: consent,
  });
  window.location.replace(marketPath(market, destination));
}
```

import를 추가한다:

```tsx
import { marketPath, useMarket } from "@/shared/market";
import type { Market } from "@/shared/config/markets";
```

**`signInWithOAuth`의 `redirectTo`도 고쳐야 한다.** `src/shared/api/supabase/auth.ts`에서 콜백 주소가 `/auth/callback`으로 고정되어 있다. 마켓을 인자로 받도록 바꾼다:

```ts
export async function signInWithOAuth(
  provider: "google" | "line" | "kakao",
  from: "signup" | "signin",
  market: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: toSupabaseProvider(provider),
    options: {
      redirectTo: `${window.location.origin}/${market}/auth/callback?from=${from}`,
    },
  });
  return { error: error ? mapAuthError(error) : null };
}
```

`src/entities/auth/SocialLoginButtons.tsx`가 마켓을 넘기도록 바꾼다:

```tsx
import { useMarket } from "@/shared/market";
```

```tsx
  const market = useMarket();

  const handleClick = async (provider: OAuthProvider) => {
    const { error } = await signInWithOAuth(provider, from, market);
    if (error) onError(errors[error] ?? errors.unknownError);
  };
```

**이메일 가입 확인 링크는 그대로 둔다.** `signUpWithEmail`의 `emailRedirectTo`는
`window.location.origin`이라 확인 링크가 `/`로 돌아오고, 루트 리다이렉트가 마켓으로 보낸다.
한 번 더 이동하지만 정상 동작하므로 이 단계에서 손대지 않는다.

- [x] **Step 8: 타입 체크와 테스트**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (exit 0)

Run: `pnpm test`
Expected: `Tests 106 passed (106)` — 기존 90 + Task 1의 6 + Task 2의 10.
`adminServer.test.ts` 1개 스위트만 기존대로 실패한다. 그 외에 새로 실패하는 스위트가 있으면 문제다.

- [x] **Step 9: 경로 비교 로직 점검**

Run: `grep -rn "usePathname" src/ --include="*.tsx"`

경로에 마켓 접두사가 생겼으므로, `pathname === "/products"` 같은 **정확히 일치** 비교로
현재 메뉴를 표시하던 곳이 있으면 더 이상 맞지 않는다.
발견되면 `stripMarket(pathname)`으로 접두사를 떼고 비교하도록 고친다:

```ts
import { stripMarket } from "@/shared/market";
```

```ts
const path = stripMarket(pathname);
```

해당하는 코드가 없으면 그대로 넘어간다.

- [x] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(market): 사용자 화면을 /jp · /kr 경로 아래로 옮긴다

- 마켓이 통화·배송·언어를 결정하므로 URL에 드러나야 링크 공유가 안전하다
- 인증 화면까지 마켓 경로에 넣어 로그인 후 돌아갈 마켓의 모호함을 없앤다
- 접두사 판단을 MarketLink와 useMarketRouter에 가둬 호출부 경로를 그대로 둔다"
```

---

## Task 4: 언어를 경로에 고정

**Files:**
- Modify: `src/shared/i18n/LocaleProvider.tsx`
- Modify: `src/shared/i18n/types.ts`
- Create: `src/features/market-switcher/MarketSwitcher.tsx`
- Create: `src/features/market-switcher/index.ts`
- Delete: `src/features/locale-toggle/`
- Modify: `src/views/signup/SignupView.tsx`, `src/views/signin/SigninView.tsx`, `src/views/consent/ConsentView.tsx`, `src/widgets/header/NavDrawer.tsx`

- [x] **Step 1: LocaleProvider에서 전환 기능 제거**

`src/shared/i18n/LocaleProvider.tsx`에서 아래를 없앤다.

- `setLocale`, `toggleLocale` 함수와 컨텍스트 값
- `useState` 대신 prop을 그대로 쓴다 (경로가 바뀌면 레이아웃이 다시 렌더된다)
- `STORAGE_KEY` 상수와 `localStorage` 쓰기
- `document.cookie` 쓰기
- `LOCALE_COOKIE_KEY` import

교체 후 파일 상단부:

```tsx
"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import type { Locale } from "./types";
import { dictionaries, type Dictionary } from "./dictionaries";

type LocaleContextValue = {
  locale: Locale;
  d: Dictionary;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

// 로케일은 경로(/jp · /kr)가 정한다. 화면에서 바꾸는 수단을 두지 않으므로
// 상태를 들고 있을 필요가 없다 — 마켓 전환이 곧 언어 전환이다.
export function LocaleProvider({
  children,
  initialLocale = "ja",
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const locale = initialLocale;

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, d: dictionaries[locale] }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
```

파일 하단의 `useLocale` 훅은 그대로 둔다.

- [x] **Step 2: 로케일 쿠키 키 제거**

`src/shared/i18n/types.ts`에서 아래 줄을 삭제한다:

```ts
export const LOCALE_COOKIE_KEY = "komo_locale";
```

`isLocale`과 `Locale`, `Localized`는 그대로 둔다.

- [x] **Step 3: 마켓 전환 UI 작성**

`src/features/market-switcher/MarketSwitcher.tsx`. 기존 `LocaleToggle`의 모양을 그대로 쓰되 동작만 이동으로 바꾼다:

```tsx
"use client";

import { usePathname, useRouter } from "next/navigation";
import { MARKETS, type Market } from "@/shared/config/markets";
import { marketPath, useMarket } from "@/shared/market";

const LABEL: Record<Market, string> = {
  jp: "日本語",
  kr: "한국어",
};

// 마켓 전환이 곧 언어 전환이다. 현재 경로를 유지한 채 접두사만 갈아끼운다.
export function MarketSwitcher() {
  const current = useMarket();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex w-full items-center border border-border bg-surface p-0.5 text-xs">
      {MARKETS.map((market) => (
        <button
          key={market}
          type="button"
          onClick={() => router.push(marketPath(market, pathname))}
          className={buttonClass(market === current)}
        >
          {LABEL[market]}
        </button>
      ))}
    </div>
  );
}

function buttonClass(active: boolean): string {
  const activeCls = "bg-sage text-white";
  const idleCls = "text-muted hover:text-foreground";
  return `flex-1 px-2.5 py-1.5 text-center transition-colors ${active ? activeCls : idleCls}`;
}
```

`src/features/market-switcher/index.ts`:

```ts
export { MarketSwitcher } from "./MarketSwitcher";
```

- [x] **Step 4: 사용처 교체**

아래 네 파일에서 `LocaleToggle`을 `MarketSwitcher`로 바꾼다.

- `src/views/signup/SignupView.tsx`
- `src/views/signin/SigninView.tsx`
- `src/views/consent/ConsentView.tsx`
- `src/widgets/header/NavDrawer.tsx`

import:

```tsx
import { MarketSwitcher } from "@/features/market-switcher";
```

JSX:

```tsx
<MarketSwitcher />
```

- [x] **Step 5: 옛 슬라이스 삭제**

```bash
git rm -r src/features/locale-toggle
```

- [x] **Step 6: 남은 참조 확인**

Run: `grep -rn "LocaleToggle\|LOCALE_COOKIE_KEY\|komo_locale\|toggleLocale\|setLocale" src/`
Expected: 결과 없음 (exit 1)

- [x] **Step 7: 타입 체크와 테스트**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (exit 0)

Run: `pnpm test`
Expected: 새로 실패하는 스위트 없음 (`adminServer.test.ts`만 기존대로 실패)

- [x] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(i18n): 언어를 경로에 고정하고 언어 토글을 마켓 전환으로 대체

- 마켓과 언어를 별개 축으로 두면 어긋난 조합을 계속 관리해야 한다
- 로케일이 URL에 있으므로 쿠키와 localStorage로 기억할 필요가 없어진다"
```

---

## Task 5: 문서 갱신

**Files:**
- Modify: `docs/open-decisions.md`

- [x] **Step 1: 완료된 항목 정리**

`docs/open-decisions.md`의 **B-3(Supabase 로그인 복귀 주소 추가)** 항목에 아래를 덧붙인다:

```markdown
**코드는 준비되었습니다.** 소셜 로그인이 `/jp/auth/callback`, `/kr/auth/callback`으로 돌아옵니다.
Supabase 대시보드에 이 두 주소를 등록하기 전까지 소셜 로그인이 실패합니다.
```

**C-2(첫 화면 기본 마켓)** 항목의 상태를 `결정됨(잠정)`에서 `구현됨`으로 바꾸고 아래를 덧붙인다:

```markdown
`src/app/page.tsx`에 구현되었습니다. 브라우저 언어가 `ko`로 시작하면 `/kr`,
`ja`로 시작하면 `/jp`, 그 외에는 `/jp`로 보냅니다.
```

- [x] **Step 2: Commit**

```bash
git add docs/open-decisions.md
git commit -m "docs: 1단계 구현으로 정리된 미결 항목 반영"
```

---

## 최종 검증

- [x] **Step 1: 타입 체크**

Run: `npx tsc --noEmit`
Expected: 에러 없음 (exit 0)

- [x] **Step 2: 전체 테스트**

Run: `pnpm test`
Expected: `adminServer.test.ts` 1개 스위트만 기존대로 실패. 나머지 전부 통과

- [x] **Step 3: 린트**

Run: `pnpm lint`
Expected: `src/shared/i18n/FontModeProvider.tsx:36` 1건만 남는다. 새 에러가 있으면 고친다

- [x] **Step 4: 수동 확인 (`.env.local` 필요)**

Run: `pnpm dev`

확인 항목:
1. `/` 접속 → 브라우저 언어에 따라 `/jp` 또는 `/kr`로 이동
2. `/jp` → 화면이 일본어. `/kr` → 화면이 한국어
3. `/xx` → 404
4. 헤더 드로어의 전환 버튼으로 `/jp/products` ↔ `/kr/products` 이동. **경로가 유지되는지** 확인
5. 장바구니·상품 상세·검색 링크가 모두 마켓 접두사를 달고 이동
6. `/admin` 접속 → 접두사 없이 그대로 열림
7. 소셜 로그인 (Supabase에 콜백 주소 등록 후) → `/jp/auth/callback`을 거쳐 `/jp`로 복귀
8. **가격은 아직 양쪽 모두 엔화로 보인다** — 2단계에서 바꾼다
