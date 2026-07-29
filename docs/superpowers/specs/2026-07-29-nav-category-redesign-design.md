# 메뉴(NavDrawer) 카테고리 구조 개편 — 설계

## 배경 / 목표

현재 MENU 드로어의 카테고리 목록은 이모지가 붙은 평면 목록(`rompers`, `innerwear`, `tops`, `bottoms`, `outer`, `accessories`, `gift`)이다. 이를 아래 구조로 교체한다.

```
All
girl   ▾ (펼침 전용, 링크 아님)
    Top / Set up / Bottom / Dress / Home wear / Swim wear
boy    ▾ (펼침 전용, 링크 아님)
    Top / Set up / Bottom / Home wear / Swim wear   (Dress 없음)
mom
accessory
★ gift
```

이모지는 네비게이션에서 전부 제거한다. 이번 개편은 UI뿐 아니라 상품 데이터 모델(성별 축 `audience` + 의류 타입 축 `type`)까지 함께 바꾸는 전면 개편이다.

## 데이터 모델

`src/lib/types.ts`

```ts
export type Audience = "girl" | "boy" | "mom" | "accessory" | "gift";
export type ClothingType = "top" | "setup" | "bottom" | "dress" | "homewear" | "swimwear";

export type CategorySlug =
  | "girl-top" | "girl-setup" | "girl-bottom" | "girl-dress" | "girl-homewear" | "girl-swimwear"
  | "boy-top" | "boy-setup" | "boy-bottom" | "boy-homewear" | "boy-swimwear"
  | "mom" | "accessory" | "gift";

export type Product = {
  id: string;
  name: Localized;
  brand: string;
  category: CategorySlug;   // 기존 필드 재사용, 값 체계만 교체
  price: number;
  listPrice: number;
  colors: string[];
  sizes: string[];
  season: "ss" | "aw" | "all";
  isNew: boolean;
  isBest: boolean;
  soldOut: boolean;
  rating: number;
  reviewCount: number;
  description: Localized;
};
```

`Category`(nav 표시용) 타입은 제거하고, 대신 아래 두 가지로 분리한다.

1. **메뉴 트리** (`NavDrawer`가 렌더링) — girl/boy는 펼침 전용 그룹, 나머지는 단일 링크.
2. **카테고리 표시 정보(타이틀)** — `/products/[category]` 페이지 타이틀 조회용, 플랫 맵.

`girl`/`boy` 자체는 클릭 시 펼침/접힘만 하고 URL로 연결되지 않는다. 실제 상품 목록 URL은 항상 `audience-type` 합성 슬러그(`girl-top`, `boy-setup` …) 또는 `mom`/`accessory`/`gift` 단독이다. 기존 `/products/[category]` 라우트를 그대로 재사용하며 새 동적 세그먼트는 추가하지 않는다.

## `src/lib/categories.ts`

```ts
export const CLOTHING_TYPES: { key: ClothingType; label: string }[] = [
  { key: "top", label: "Top" },
  { key: "setup", label: "Set up" },
  { key: "bottom", label: "Bottom" },
  { key: "dress", label: "Dress" },
  { key: "homewear", label: "Home wear" },
  { key: "swimwear", label: "Swim wear" },
];

export const menu = [
  { kind: "link", slug: "all" as const },
  { kind: "group", key: "girl" as const, types: CLOTHING_TYPES },
  { kind: "group", key: "boy" as const, types: CLOTHING_TYPES.filter((t) => t.key !== "dress") },
  { kind: "link", slug: "mom" as const },
  { kind: "link", slug: "accessory" as const },
  { kind: "link", slug: "gift" as const, starred: true },
];

// 카테고리 타이틀 조회 (상품 목록 페이지 헤더용)
// "girl-top" -> "girl / Top", "mom" -> "mom" 처럼 audience(+type) 라벨을 조합해 반환한다.
export const getCategoryTitle = (slug: CategorySlug): string => {
  const [audience, typeKey] = slug.split("-") as [Audience, ClothingType | undefined];
  if (!typeKey) return audience; // mom / accessory / gift
  const type = CLOTHING_TYPES.find((t) => t.key === typeKey);
  return `${audience} / ${type?.label ?? typeKey}`;
};
```

라벨은 브랜드 톤(`New`, `Most loved`와 동일하게)에 맞춰 **ja/ko 공통으로 영문 그대로** 사용한다 (`girl`, `boy`, `mom`, `accessory`, `gift`, `Top`, `Set up`, `Bottom`, `Dress`, `Home wear`, `Swim wear`). 별도 사전(dictionary) 번역 키를 만들지 않는다.

`getByCategory(slug)` 는 기존과 동일하게 `products.filter(p => p.category === slug)`.

## 기존 상품 재매핑

타입 매핑: `rompers→setup`, `innerwear→homewear`, `outer→top`, `tops→top`, `bottoms→bottom`.

성별 배분(색상/브랜드 기준, girl/boy 6개씩 균등):

| 상품 id | 기존 category | 새 category |
|---|---|---|
| romper-bear | rompers | girl-setup |
| romper-cloud | rompers | boy-setup |
| romper-knit | rompers | boy-setup |
| inner-organic-2set | innerwear | girl-homewear |
| inner-short | innerwear | girl-homewear |
| inner-longsleeve | innerwear | boy-homewear |
| top-frill | tops | girl-top |
| top-stripe-tee | tops | boy-top |
| bottom-baggy | bottoms | boy-bottom |
| bottom-leggings | bottoms | girl-bottom |
| outer-fleece | outer | boy-top |
| outer-vest | outer | girl-top |

`accessories`(3개) → `accessory`, `gift`(2개) → `gift`는 카테고리 값만 이름 변경. `mom`, `*-dress`, `*-swimwear`는 매칭 상품이 없어 빈 카테고리로 시작한다 — `ProductBrowser`의 기존 빈 상태 문구(`d.filter.empty`)가 그대로 노출되며 별도 처리는 하지 않는다.

## 상품 카드 이모지 (`ProductThumb`)

네비게이션과 분리해서 유지한다. `category`가 아니라 `type`(있으면) 또는 `audience`(mom/accessory/gift)로 조회하는 별도 맵을 둔다.

```ts
const EMOJI_BY_TYPE: Record<ClothingType, string> = {
  top: "🎽", setup: "🧸", bottom: "🩳", dress: "👗", homewear: "🌿", swimwear: "🏊",
};
const EMOJI_BY_LEAF_AUDIENCE: Record<"mom" | "accessory" | "gift", string> = {
  mom: "👚", accessory: "🧦", gift: "🎁",
};
```

`CategorySlug`에서 `type`과 `audience`를 파싱해 조회한다 (예: `girl-top` → type `top`).

## NavDrawer UI

- girl/boy 행: 라벨 + 우측 `ChevronDown` 아이콘(펼치면 180도 회전). 클릭하면 `useState<"girl" | "boy" | null>`로 아코디언 토글(하나만 열림).
- 펼쳐진 하위 목록: 들여쓰기(`pl-6`)된 `Link` 목록, 클릭 시 드로어 닫힘(기존 동작 유지).
- `mom`/`accessory`/`gift`는 기존 `DrawerItem`과 동일한 단순 링크.
- `gift`만 라벨 앞에 `★ ` 접두(텍스트, 별도 아이콘·색상 없음 — 무채색 규칙 유지).
- `src/components/ui/icons.tsx`에 lucide `ChevronDown` 기반 `ChevronDownIcon` 추가.

## 영향 범위

- `src/lib/types.ts` — `Audience`/`ClothingType`/`CategorySlug`/`Product.category` 변경, `Category` 타입 제거
- `src/lib/categories.ts` — 메뉴 트리 + 타이틀 조회로 전면 교체
- `src/lib/products.ts` — 12개 상품 `category` 값 재매핑
- `src/components/layout/NavDrawer.tsx` — 아코디언 메뉴 UI
- `src/components/ui/icons.tsx` — `ChevronDownIcon` 추가
- `src/components/product/ProductThumb.tsx` — 이모지 조회 로직을 타입/오디언스 기반으로 교체
- `src/app/products/[category]/page.tsx` — `getCategory` → `getCategoryTitle`로 교체
- `src/i18n/dictionaries.ts` — 변경 없음 (새 라벨은 영문 리터럴이라 사전 키 불필요)

## 테스트 관점

- `npx tsc --noEmit` 통과 (모든 `category` 값이 새 `CategorySlug` 유니온에 속함)
- 헤드리스 브라우저로 확인: MENU 드로어에서 girl/boy 펼침·접힘, 하위 카테고리 클릭 시 올바른 상품 목록 표시, mom 진입 시 빈 상태 문구, gift에 `★` 표시, 이모지 미노출
- 상품 상세/그리드에서 `ProductThumb` 이모지가 여전히 표시되는지 확인
