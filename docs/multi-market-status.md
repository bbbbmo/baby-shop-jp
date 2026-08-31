# 다국가 마켓 전환 — 진행 상황과 남은 일

일본·한국 두 마켓을 지원하기까지의 전체 진행표입니다.
작업을 다시 시작할 때 이 문서부터 보세요.

마지막 갱신: 2026-08-28

---

## 한눈에

| 단계 | 내용 | 상태 |
| --- | --- | --- |
| 회원가입 최소 수집 + 동의 기록 | 가입 항목 축소, 동의 기록 | ✅ 완료 · main 머지 |
| **1단계** | 마켓 라우팅, 언어 경로 고정 | ✅ 완료 · main 머지 |
| **2단계** | 가격 · 통화 · 배송비 | ✅ 완료 · main 머지 |
| **3단계** | 주소 폼 · 주소 검색 · 주문 | 📋 계획 완료 · 미착수 |
| 결제 | 결제대행사 연동 | ⬜ 미착수 (조사 단계) |

---

## 지금 동작하는 것

- `/` — 일본어 / 한국어 선택 화면
- `/jp` — 일본어 · 엔화
- `/kr` — 한국어 · **아직 엔화** (2단계 완료 시 원화)
- `/admin` — 마켓 무관, 공용
- 푸터의 `日本語 / 한국어` 링크로 선택 화면 복귀

---

## 2단계 — 이어서 할 일

**브랜치:** `feat/multi-market-pricing` (main에 머지 안 됨)
**계획서:** [`docs/plans/2026-08-28-multi-market-phase2-pricing.md`](./plans/2026-08-28-multi-market-phase2-pricing.md)

### 끝난 것

| Task | 내용 | 커밋 |
| --- | --- | --- |
| 1 | 마켓별 통화 · 가격 컬럼 · 배송 정책 설정 | `2243e71` |
| 2 | 통화별 금액 표기 `formatPrice` | `a5371e3` |
| 3 | 금액 표기 호출부 19곳 교체 | `bbd1fea` |
| 4 | 가격 컬럼 마이그레이션 SQL | `27b7261` |
| 5 | 카탈로그가 마켓 가격을 고름 | `7efa50f` |
| 6 | 관리자에서 두 마켓 가격 입력 | `6cce85e` |

### 남은 것

| Task | 내용 | 규모 |
| --- | --- | --- |
| 7 | 배송비를 마켓 정책으로 (`constants.ts` 삭제, 체크아웃 API가 마켓 받기) | 중 |
| 8 | 장바구니에서 빠진 상품 알리기 | 중 |
| 9 | 한국어 화면의 첫 응답 언어 표시 (`proxy.ts`) | 소 · 주의 |
| 10 | 문서 갱신 | 소 |

계획서에 각 태스크의 코드가 전부 적혀 있습니다. 남은 체크박스는 31개입니다.

### Task 9는 조심하세요

`src/proxy.ts`를 건드립니다. 그 파일은 **로그인 세션 갱신**을 맡고 있고 과거에 한 번 깨졌다 고친 곳입니다.
계획서에 수동 로그인 확인 4단계가 있으니 반드시 거치고, **하나라도 실패하면 그 커밋을 되돌리세요.**
화면이 뜬 뒤 자바스크립트가 언어를 바로잡으므로 일반 사용자에게는 문제가 없는 항목입니다. 무리할 이유가 없습니다.

---

## 재개하는 법

```bash
git checkout feat/multi-market-pricing
rm -rf .next          # 라우트가 옮겨져서 캐시가 옛 경로를 물고 있으면 헛에러가 난다
pnpm dev
```

**첫 컴파일에 30~40초 걸립니다.** 무한 로딩이 아닙니다. 구글 폰트 8개 패밀리를 받아오느라 그렇습니다.

`tsc`가 이동 전 경로(`src/app/signin/page.js` 등)를 못 찾는다고 하면 `.next`를 지우세요.

---

## 먼저 확인할 것

### 마이그레이션이 적용됐는지

Task 5부터 코드가 `price_jpy`를 조회합니다. **적용 전에는 상품 목록이 통째로 에러를 냅니다.**

Supabase 대시보드 → SQL Editor:

```sql
select column_name from information_schema.columns
where table_name = 'products' and column_name like '%price%';
```

`price_jpy`, `list_price_jpy`, `price_krw`, `list_price_krw` 네 개가 나와야 합니다.
없으면 [`supabase/migrations/20260829000000_market_prices.sql`](../supabase/migrations/20260829000000_market_prices.sql)을 실행하세요.

**이 마이그레이션은 개명을 포함해 되돌리기가 번거롭습니다.** 되돌리려면 반대로 개명해야 합니다.

### 소셜 로그인 복귀 주소가 등록됐는지

1단계에서 주소가 바뀌었습니다. 등록 전까지 소셜 로그인이 실패합니다.

Supabase 대시보드 → Authentication → URL Configuration → Redirect URLs

```
http://localhost:3000/jp/auth/callback
http://localhost:3000/kr/auth/callback
```

카카오 · 구글 · 라인 콘솔은 손대지 않아도 됩니다. 그쪽은 Supabase 주소를 봅니다.

---

## 3단계 — 계획까지 완료

**계획서:** [`docs/plans/2026-08-31-multi-market-phase3-orders.md`](./plans/2026-08-31-multi-market-phase3-orders.md)
**설계:** [`docs/specs/2026-08-28-multi-market-orders-design.md`](./specs/2026-08-28-multi-market-orders-design.md)

태스크 8개입니다.

| Task | 내용 | 비고 |
| --- | --- | --- |
| 1 | 주문 마이그레이션 (마켓 · 후리가나 nullable · 한국어 상품명) | |
| 2 | 도로명주소 응답 → 폼 값 순수 함수 | API 키 불필요 |
| 3 | 마켓별 주소 검증 | |
| 4 | 체크아웃 폼 마켓별 (후리가나 감추기) | |
| 5 | 도로명주소 검색 | **`JUSO_API_KEY` 필요** |
| 6 | 주문에 마켓 · 한국어 상품명 저장 | |
| 7 | 주문 내역을 주문 당시 통화 · 언어로 | |
| 8 | 문서 | |

**Task 5만 API 키를 요구합니다.** 키가 없으면 그 태스크를 건너뛰고 나머지를 먼저 해도 됩니다.
발급은 juso.go.kr 회원가입 후 신청하며 무료입니다.

## 결제 — 조사 단계

[`docs/payment-plan-explainer.md`](./payment-plan-explainer.md) 참고.

현재 주문은 `결제대기` 상태로만 만들어지고 실제 결제는 붙어 있지 않습니다.

가장 급한 확인 사항은 **법인사업자인지 개인사업자인지**입니다.
일본 편의점 결제는 법인만 가능해서, 여기에 따라 일본 진출 시점이 달라질 수 있습니다.

---

## 아직 정하지 않은 것들

[`docs/open-decisions.md`](./open-decisions.md)에 모아뒀습니다.

당장 필요한 두 가지

- **한국 배송비** — 잠정값 30,000원 이상 무료 / 3,000원. 확정되면 `src/shared/config/markets.ts`의 두 줄만 고치면 됩니다
- **상품별 원화 가격** — 관리자 화면에 입력란이 생겼습니다. 전부 정할 필요 없이, **가격을 넣은 상품만 `/kr`에 노출**되므로 몇 개부터 시작할 수 있습니다
