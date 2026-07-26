# こはる (Koharu) — 日本向けベビー服ショップ (フロントエンドデモ)

일본 시장을 겨냥한 아기옷 쇼핑몰 프론트엔드입니다. Next.js(App Router) 기반이며 백엔드 없이 목업 데이터로 동작합니다.

## 특징

- **내추럴 파스텔 디자인**: 오프화이트 배경 + 세이지/블러시 포인트, Noto Sans JP/KR
- **일본어 ↔ 한국어 전환**: 헤더 토글, 선택값은 localStorage에 저장
- **엔화(¥) / 税込 표기**, 세일가·정가 병기, 할인율 배지
- **페이지 구성**
  - 홈: 히어로 · 카테고리 · 베스트셀러 · 시즌 럭키백 · 신상품
  - 상품 목록(`/products`, `/products/[category]`): 시즌·사이즈 필터, 정렬
  - 상품 상세(`/products/[category]/[id]`): 색상/사이즈 선택, 장바구니 담기, 추천 상품
  - 장바구니(`/cart`): 수량 조절, 무료배송 진행바, 합계 (Zustand + localStorage 유지)
  - 검색(`/search`)

## 기술 스택

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4
- Zustand (장바구니 상태)

## 실행

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # 프로덕션 빌드
```

## 폴더 구조

```
src/
  app/            라우트 (home, products, cart, search)
  components/     layout · product · cart · home · ui
  i18n/           딕셔너리 + LocaleProvider
  lib/            타입 · 목업 데이터 · 포맷 유틸 · 상수
  store/          장바구니(zustand)
```

> ⚠️ 결제/배송은 실제로 동작하지 않는 데모용 프론트엔드입니다. 상품 이미지는 파스텔 그라디언트 + 이모지 플레이스홀더입니다.
