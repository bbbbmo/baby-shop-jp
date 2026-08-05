# 외부 데이터 스키마 (Product / FriendLook)

Supabase 등 외부 백엔드에서 받아올 데이터의 형태입니다. 현재는
[`src/entities/product/model/products.ts`](../src/entities/product/model/products.ts),
[`src/entities/look/model/friends.ts`](../src/entities/look/model/friends.ts)에 목업으로
존재하며, 실제 백엔드 연동 시에도 이 형태를 그대로 따릅니다.
타입 원본: [`Product`](../src/entities/product/model/types.ts),
[`FriendLook`](../src/entities/look/model/types.ts),
[`CategorySlug`/`Audience`](../src/entities/category/model/types.ts),
[`Localized`](../src/shared/i18n/types.ts)

## Product (상품)

| 필드          | 타입                          | 설명                                  |
| ------------- | ----------------------------- | ------------------------------------- |
| `id`          | `string`                      | 상품 고유 ID (slug)                   |
| `name`        | `Localized`                   | 상품명 (ja/ko)                        |
| `brand`       | `string`                      | 브랜드 slug (예: `hinata`, `mori`)    |
| `category`    | `CategorySlug`                | 카테고리 (아래 참고)                  |
| `price`       | `number`                      | 판매가 (원)                           |
| `listPrice`   | `number`                      | 정가. `price`와 같으면 할인 없음      |
| `colors`      | `string[]`                    | 색상 스와치 (hex)                     |
| `sizes`       | `string[]`                    | 사이즈 목록 (예: `"50-60"`, `"70"`)   |
| `season`      | `"ss" \| "aw" \| "all"`       | 시즌                                  |
| `isNew`       | `boolean`                     | NEW 배지                              |
| `isBest`      | `boolean`                     | BEST 배지                             |
| `soldOut`     | `boolean`                     | 품절 여부                             |
| `rating`      | `number`                      | 평점 (0~5)                            |
| `reviewCount` | `number`                      | 리뷰 수                               |
| `description` | `Localized`                   | 상품 설명 (ja/ko)                     |

### CategorySlug

`girl-top` `girl-setup` `girl-bottom` `girl-dress` `girl-homewear` `girl-swimwear`
`boy-top` `boy-setup` `boy-bottom` `boy-homewear` `boy-swimwear`
`mom` `accessory` `gift`

## FriendLook (스타일 콘텐츠)

| 필드         | 타입         | 설명                                  |
| ------------ | ------------ | ------------------------------------- |
| `id`         | `string`     | 고유 ID                               |
| `handle`     | `string`     | 게시자 핸들                           |
| `imageSrc`   | `string`     | 이미지 URL                            |
| `modelInfo`  | `Localized`  | 모델 정보 (ja/ko)                     |
| `productIds` | `string[]`   | 착용 상품의 `Product.id` 목록         |

## 공통 타입

```ts
type Localized = { ja: string; ko: string };
type Audience = "girl" | "boy" | "mom" | "accessory" | "gift";
```

## 참고

- 외부 데이터 접근은 CLAUDE.md 방침에 따라 `shared/api`(Supabase 어댑터) 슬라이스에서만
  이뤄지며, 이 슬라이스가 위 스키마와 동일한 형태를 반환해야 합니다. (현재 `shared/api` 슬라이스는
  아직 없고, 목업 데이터를 각 entity가 직접 export합니다.)
- 런타임 검증이 필요해지면 이 표를 기준으로 `zod` 스키마를 작성하세요 (현재는 미작성).
