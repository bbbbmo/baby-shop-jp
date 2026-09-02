# 이용약관 · 개인정보처리방침 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 회원가입에서 동의를 받는 두 문서를 실제 내용으로 채우고, 가입 흐름을 벗어나지 않고 모달로 읽을 수 있게 한다.

**Architecture:** 본문은 `entities/legal` 한 곳에 두고 모달과 페이지가 같은 데이터를 렌더한다. 사업자 정보도 한 모듈로 모아 푸터와 문서가 같은 값을 본다. 아직 모르는 값은 감추지 않고 `［항목명 미입력］`으로 본문에 드러낸다. Next의 인터셉팅 라우트는 쓰지 않는다 — 모달이 URL을 바꾸면 가입 도중 새로고침에 입력값이 날아간다.

**Tech Stack:** Next.js 16 (App Router) · TypeScript · react-hook-form · vitest

**설계 문서:** [`docs/specs/2026-09-01-legal-documents-design.md`](../specs/2026-09-01-legal-documents-design.md)

---

## 시작 전에 읽을 것

- `src/features/look-modal/LookModal.tsx` — 이 저장소의 모달 패턴. `useEscapeToClose`·`useBodyScrollLock`을 쓰고, 오버레이 클릭으로 닫고, 열 때 닫기 버튼에 포커스를 주고 닫을 때 원래 자리로 돌려준다. 새 모달도 같은 방식이다
- `src/shared/lib/useEscapeToClose.ts` · `useBodyScrollLock.ts` — 그대로 재사용한다
- `src/widgets/footer/Footer.tsx` — 사업자 정보가 하드코딩돼 있다. Task 2에서 걷어낸다
- `src/features/signup-form/SignupForm.tsx`와 `src/features/consent-form/ConsentForm.tsx` — **`LegalLinks` 함수가 두 파일에 글자 그대로 복제돼 있다.** Task 7에서 하나로 합친다

**CLAUDE.md 제약:** 함수 15줄 · 중첩 3단계 · `border-radius: 0`(`rounded-*` 금지) · 컨테이너 `max-w-480` + `px-6 sm:px-10` · CTA는 `bg-foreground` · 한국어 주석으로 **왜**를 적는다.

**이 문서는 법률 자문이 아니다.** 초안은 전자상거래법·개인정보보호법의 요구 항목을 따르지만 최종본은 전문가 검토를 받아야 한다. 구현자는 본문을 임의로 고치지 말고 계획에 적힌 그대로 넣는다.

---

## 파일 구조

**설계서와 다른 점.** 설계서는 `model/documents.ts` 하나에 타입·조회·빈칸 검출을 다 넣었지만,
실제로는 `types.ts` · `placeholders.ts` · `documents.ts` 셋으로 나눈다. 빈칸 검출은
`businessInfo.ts`가 import하는데, 그게 문서 조회까지 들어 있는 파일이면 순환 참조가 된다.

### 새로 만드는 파일

| 파일 | 책임 |
| --- | --- |
| `src/entities/legal/model/types.ts` | `LegalDocument` · `LegalSection` 타입 |
| `src/entities/legal/model/placeholders.ts` | `［… 미입력］` 검출 (순수) |
| `src/entities/legal/model/placeholders.test.ts` | 위 테스트 |
| `src/entities/legal/model/businessInfo.ts` | 사업자 정보 한 곳. 푸터와 문서가 공유 |
| `src/entities/legal/model/documents.ts` | 로케일 · 문서 id → `LegalDocument` 조회 |
| `src/entities/legal/model/documents.test.ts` | 두 로케일 정합성 테스트 |
| `src/entities/legal/content/terms.ko.ts` | 이용약관 (한국어) |
| `src/entities/legal/content/terms.ja.ts` | 利用規約 (일본어) |
| `src/entities/legal/content/privacy.ko.ts` | 개인정보처리방침 (한국어) |
| `src/entities/legal/content/privacy.ja.ts` | プライバシーポリシー (일본어) |
| `src/entities/legal/LegalDocumentBody.tsx` | 본문 렌더 + 개발용 미입력 배너 |
| `src/entities/legal/LegalModal.tsx` | 모달 껍데기 |
| `src/entities/legal/LegalConsentLinks.tsx` | 동의 체크박스 아래 「약관」「개인정보」 버튼 (모달을 연다) |
| `src/entities/legal/index.ts` | 슬라이스 공개 API |
| `src/shared/lib/useHistoryBackToClose.ts` | 모바일 뒤로가기로 모달 닫기 |

### 고치는 파일

| 파일 | 무엇을 |
| --- | --- |
| `src/app/[market]/(main)/terms/page.tsx` | 「준비 중」 → 실제 문서 |
| `src/app/[market]/(main)/privacy/page.tsx` | 같음 |
| `src/widgets/footer/Footer.tsx` | 사업자 정보를 `businessInfo`에서 읽고, 약관·개인정보 링크 추가 |
| `src/features/signup-form/SignupForm.tsx` | 지역 `LegalLinks` 삭제 → `LegalConsentLinks` |
| `src/features/consent-form/ConsentForm.tsx` | 같음 |
| `src/shared/i18n/dictionaries.ts` | `legal` 블록 확장 |

---

## Task 1: 문서 타입과 빈칸 검출

아직 모르는 사업자 정보는 감추지 않고 본문에 드러낸다. 조용히 빼면 법정 기재사항이 빠진 줄 모르고 배포한다. 검출을 순수 함수로 빼야 테스트로 고정할 수 있다.

**Files:**
- Create: `src/entities/legal/model/types.ts`
- Create: `src/entities/legal/model/placeholders.ts`
- Test: `src/entities/legal/model/placeholders.test.ts`

- [ ] **Step 1: 타입을 만든다**

`src/entities/legal/model/types.ts`:

```ts
export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export type LegalDocumentId = "terms" | "privacy";

export type LegalDocument = {
  id: LegalDocumentId;
  title: string;
  // user_consents.terms_version과 같은 값이어야 한다. 개정하면 둘을 함께 올린다.
  version: string;
  effectiveDate: string;
  sections: LegalSection[];
};
```

- [ ] **Step 2: 실패하는 테스트를 쓴다**

`src/entities/legal/model/placeholders.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { findPlaceholders, placeholder } from "./placeholders";
import type { LegalDocument } from "./types";

const doc = (paragraphs: string[]): LegalDocument => ({
  id: "terms",
  title: "이용약관",
  version: "v1",
  effectiveDate: "2026-09-01",
  sections: [{ heading: "제1조", paragraphs }],
});

describe("placeholder", () => {
  it("wraps a label in the agreed marker", () => {
    expect(placeholder("사업자등록번호")).toBe("［사업자등록번호 미입력］");
  });
});

describe("findPlaceholders", () => {
  it("finds the labels that still need filling in", () => {
    const result = findPlaceholders(
      doc([`사업자등록번호: ${placeholder("사업자등록번호")}`, `대표자: ${placeholder("대표자명")}`]),
    );
    expect(result).toEqual(["사업자등록번호", "대표자명"]);
  });

  it("returns nothing when every value is filled in", () => {
    expect(findPlaceholders(doc(["사업자등록번호: 123-45-67890"]))).toEqual([]);
  });

  it("reports each label once even if it appears several times", () => {
    // 같은 값이 여러 조항에 나온다. 목록이 중복되면 무엇이 남았는지 세기 어렵다.
    const twice = placeholder("주소");
    expect(findPlaceholders(doc([`배송지: ${twice}`, `반품지: ${twice}`]))).toEqual(["주소"]);
  });

  it("looks in headings too", () => {
    const withHeading: LegalDocument = {
      ...doc(["본문"]),
      sections: [{ heading: `제1조 ${placeholder("상호")}`, paragraphs: ["본문"] }],
    };
    expect(findPlaceholders(withHeading)).toEqual(["상호"]);
  });

  it("ignores ordinary square brackets", () => {
    // 본문에 [필수] 같은 대괄호가 나온다. 전각 대괄호로 표기를 고정한 이유다.
    expect(findPlaceholders(doc(["[필수] 동의 항목입니다", "［참고］ 안내"]))).toEqual([]);
  });
});
```

- [ ] **Step 3: 실패를 확인한다**

Run: `npx vitest run src/entities/legal/model/placeholders.test.ts`
Expected: FAIL — `Cannot find module './placeholders'`

- [ ] **Step 4: 구현한다**

`src/entities/legal/model/placeholders.ts`:

```ts
import type { LegalDocument } from "./types";

// 아직 모르는 사업자 정보는 감추지 않고 본문에 그대로 드러낸다. 조용히 빼면
// 법정 기재사항이 빠진 줄 모르고 배포한다. 눈에 보이면 채우게 된다.
//
// 전각 대괄호를 쓰는 이유는 본문에 "[필수]" 같은 일반 대괄호가 나오기 때문이다.
// 같은 기호를 쓰면 멀쩡한 문구를 미입력으로 잘못 잡는다.
export function placeholder(label: string): string {
  return `［${label} 미입력］`;
}

const PLACEHOLDER_PATTERN = /［([^］]+)\s미입력］/g;

// 문서에 남은 미입력 항목 이름을 중복 없이, 나온 순서대로 돌려준다.
export function findPlaceholders(document: LegalDocument): string[] {
  const text = document.sections
    .flatMap((section) => [section.heading, ...section.paragraphs])
    .join("\n");
  const labels = [...text.matchAll(PLACEHOLDER_PATTERN)].map((match) => match[1]!);
  return [...new Set(labels)];
}
```

- [ ] **Step 5: 통과를 확인한다**

Run: `npx vitest run src/entities/legal/model/placeholders.test.ts`
Expected: PASS — 6 tests

- [ ] **Step 6: 커밋**

```bash
git add src/entities/legal
git commit -m "feat(legal): 문서 타입과 미입력 항목 검출을 만든다

- 아직 모르는 사업자 정보를 감추지 않고 본문에 드러낸다. 조용히 빼면
  법정 기재사항이 빠진 줄 모르고 배포한다
- 전각 대괄호로 표기를 고정했다. 본문에 '[필수]' 같은 일반 대괄호가 나와서,
  같은 기호를 쓰면 멀쩡한 문구를 미입력으로 잘못 잡는다"
```

---

## Task 2: 사업자 정보를 한 곳으로

푸터에 상호·대표자·연락처가 하드코딩돼 있다. 약관과 처리방침도 같은 값을 적어야 하는데, 세 곳에 따로 두면 하나만 고치는 사고가 난다. **법정 기재사항이 화면마다 다르면 그 자체가 문제다.**

**Files:**
- Create: `src/entities/legal/model/businessInfo.ts`
- Modify: `src/widgets/footer/Footer.tsx`

- [ ] **Step 1: 사업자 정보 모듈을 만든다**

값은 현재 푸터에 적혀 있는 것을 그대로 옮긴다. 없는 것은 `placeholder()`로 둔다.

`src/entities/legal/model/businessInfo.ts`:

```ts
import { placeholder } from "./placeholders";

// 상호·대표자·연락처는 푸터에도 나오고 약관·처리방침에도 나온다. 세 곳에
// 따로 적으면 하나만 고치는 사고가 나는데, 법정 기재사항이 화면마다 다르면
// 그 자체가 문제다. 한 곳에서 읽는다.
//
// 아직 모르는 값은 placeholder로 둔다. 화면에 「미입력」이 그대로 보이고,
// findPlaceholders가 목록으로 뽑아준다.
export const BUSINESS_INFO = {
  companyName: "COMO",
  ownerName: "Lee Jinwoo",
  privacyOfficer: "Ikeya Moeri",
  email: "como@gmail.com",
  phoneJp: "080-4969-7532",
  phoneKr: placeholder("한국 연락처"),
  address: placeholder("사업장 주소"),
  registrationNumber: placeholder("사업자등록번호"),
  mailOrderNumber: placeholder("통신판매업 신고번호"),
  // 국외 이전 고지에 필요하다. Supabase 대시보드 → Settings → General → Region.
  dataRegion: placeholder("데이터 보관 리전"),
} as const;
```

- [ ] **Step 2: 푸터가 이 모듈을 읽게 한다**

`src/widgets/footer/Footer.tsx`에서 하드코딩된 블록을 바꾼다.

import에 추가:
```ts
import { BUSINESS_INFO } from "@/entities/legal";
```

그리고 다음 블록 전체를

```tsx
        <div className="mt-6 text-sm text-black">
          <p>Company Name : como | Owner : Lee Jinwoo</p>
          <p>Personal Info Manager :  Ikeya Moeri</p>
          <p className="mt-4">customer</p>
          <p>JP : 080-4969-7532</p>
          <p>KR：</p>
          <p>Email : como@gmail.com</p>
        </div>
```

이것으로 교체한다:

```tsx
        <div className="mt-6 text-sm text-black">
          <p>
            Company Name : {BUSINESS_INFO.companyName} | Owner : {BUSINESS_INFO.ownerName}
          </p>
          <p>Personal Info Manager : {BUSINESS_INFO.privacyOfficer}</p>
          <p>Business Registration : {BUSINESS_INFO.registrationNumber}</p>
          <p>Mail-order Sales : {BUSINESS_INFO.mailOrderNumber}</p>
          <p>Address : {BUSINESS_INFO.address}</p>
          <p className="mt-4">customer</p>
          <p>JP : {BUSINESS_INFO.phoneJp}</p>
          <p>KR : {BUSINESS_INFO.phoneKr}</p>
          <p>Email : {BUSINESS_INFO.email}</p>
        </div>
```

사업자등록번호·통신판매업 신고번호·주소를 새로 넣은 이유는 **전자상거래법이 요구하는 표시 항목**이기 때문이다. 지금은 「미입력」으로 보이지만, 항목 자체가 없는 것보다 낫다.

- [ ] **Step 3: 슬라이스 공개 API를 만든다**

`src/entities/legal/index.ts`:

```ts
export { BUSINESS_INFO } from "./model/businessInfo";
export { findPlaceholders, placeholder } from "./model/placeholders";
export type { LegalDocument, LegalDocumentId, LegalSection } from "./model/types";
```

- [ ] **Step 4: 확인**

Run: `npx tsc --noEmit && npx eslint src`
Expected: tsc 통과. eslint는 `src/shared/i18n/FontModeProvider.tsx`의 기존 오류 1건만 — 새 오류가 나오면 고쳐라.

Run: `npx vitest run`
Expected: 기존 테스트 전부 통과 + Task 1의 6개. `src/shared/api/supabase/adminServer.test.ts` 1건 실패는 `.env.local`이 없어서 나는 **기존 실패**다. 그대로 두라.

- [ ] **Step 5: 커밋**

```bash
git add src/entities/legal src/widgets/footer/Footer.tsx
git commit -m "feat(legal): 사업자 정보를 한 곳에 모은다

- 푸터에 하드코딩돼 있던 값을 모듈로 옮겼다. 약관·처리방침도 같은 값을 적어야
  하는데 세 곳에 따로 두면 하나만 고치는 사고가 난다. 법정 기재사항이
  화면마다 다르면 그 자체가 문제다
- 사업자등록번호·통신판매업 신고번호·주소를 푸터에 새로 넣었다. 전자상거래법이
  요구하는 표시 항목인데 빠져 있었다. 아직 값이 없어 '미입력'으로 보이지만
  항목 자체가 없는 것보다 낫다"
```

---

## Task 3: 이용약관 본문

**본문을 임의로 고치지 마라.** 아래 텍스트를 그대로 넣는다. 이 가게는 한국에서는 직접 판매, 일본에서는 구매대행이라 제9조·제10조가 마켓별로 갈린다.

**Files:**
- Create: `src/entities/legal/content/terms.ko.ts`
- Create: `src/entities/legal/content/terms.ja.ts`

- [ ] **Step 1: 한국어 약관을 만든다**

`src/entities/legal/content/terms.ko.ts`:

```ts
import { BUSINESS_INFO as B } from "../model/businessInfo";
import type { LegalDocument } from "../model/types";

export const TERMS_KO: LegalDocument = {
  id: "terms",
  title: "이용약관",
  version: "v1",
  effectiveDate: "2026-09-01",
  sections: [
    {
      heading: "제1조 (목적)",
      paragraphs: [
        `이 약관은 ${B.companyName}(이하 "회사")가 운영하는 온라인 쇼핑몰에서 제공하는 서비스의 이용조건과 절차, 회사와 이용자의 권리·의무·책임사항을 정함을 목적으로 합니다.`,
      ],
    },
    {
      heading: "제2조 (정의)",
      paragraphs: [
        '1. "서비스"란 회사가 운영하는 온라인 쇼핑몰에서 제공하는 상품 판매 및 구매대행 서비스를 말합니다.',
        '2. "회원"이란 이 약관에 동의하고 계정을 만든 자를 말합니다.',
        '3. "비회원"이란 계정 없이 서비스를 이용하는 자를 말합니다.',
        '4. "마켓"이란 이용자가 선택한 국가별 판매 구역을 말하며, 한국(/kr)과 일본(/jp)으로 구분됩니다. 마켓에 따라 표시 통화·배송 조건·계약 형태가 다릅니다.',
        '5. "구매대행"이란 회사가 이용자의 위임을 받아 한국 내 판매자로부터 상품을 구매하고, 이를 이용자에게 배송하는 것을 말합니다. 일본 마켓의 주문은 구매대행으로 제공됩니다.',
      ],
    },
    {
      heading: "제3조 (약관의 명시와 개정)",
      paragraphs: [
        "1. 회사는 이 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 화면에 게시합니다.",
        "2. 회사는 관련 법령을 위배하지 않는 범위에서 이 약관을 개정할 수 있습니다.",
        "3. 회사가 약관을 개정할 때에는 적용일자와 개정사유를 밝혀 적용일자 7일 전부터 공지합니다. 다만 이용자에게 불리한 변경의 경우에는 30일 전부터 공지하고, 회원에게는 전자우편 등으로 개별 통지합니다.",
        "4. 이용자가 개정 약관에 동의하지 않는 경우 회원 탈퇴를 할 수 있습니다. 공지된 적용일자까지 거부 의사를 표시하지 않으면 동의한 것으로 봅니다.",
      ],
    },
    {
      heading: "제4조 (서비스의 제공 및 변경)",
      paragraphs: [
        "1. 회사는 상품 정보 제공, 구매 계약의 체결, 배송, 그 밖에 회사가 정하는 업무를 수행합니다.",
        "2. 회사는 상품이 품절되거나 사양이 변경된 경우 그 사유를 이용자에게 통지하고 해당 상품의 제공을 변경하거나 중단할 수 있습니다.",
        "3. 회사는 시스템 점검, 설비 장애, 천재지변 등 부득이한 사유가 있는 경우 서비스 제공을 일시적으로 중단할 수 있으며, 사전에 공지합니다. 다만 예측할 수 없는 사유인 경우 사후에 공지할 수 있습니다.",
      ],
    },
    {
      heading: "제5조 (회원가입과 계정)",
      paragraphs: [
        "1. 이용자는 회사가 정한 가입 양식에 정보를 기입하고 이 약관과 개인정보 수집·이용에 동의함으로써 회원가입을 신청합니다.",
        "2. 회사는 다음 각 호에 해당하는 신청을 승낙하지 않거나 사후에 이용계약을 해지할 수 있습니다.",
        "  가. 타인의 명의를 이용한 경우",
        "  나. 허위 정보를 기재하거나 회사가 요구하는 내용을 기재하지 않은 경우",
        "  다. 이전에 이 약관 위반으로 회원 자격을 상실한 적이 있는 경우",
        "3. 회원은 계정 정보를 스스로 관리할 책임이 있으며, 이를 제3자에게 이용하게 해서는 안 됩니다.",
        "4. 회원은 소셜 로그인(카카오·Google·LINE)으로 가입할 수 있습니다. 이 경우 해당 서비스 제공자의 계정 관리 정책이 함께 적용됩니다.",
      ],
    },
    {
      heading: "제6조 (회원 탈퇴 및 이용 제한)",
      paragraphs: [
        "1. 회원은 언제든지 탈퇴를 요청할 수 있으며, 회사는 관련 법령이 정한 보존 의무가 있는 경우를 제외하고 지체 없이 처리합니다.",
        "2. 회사는 회원이 이 약관을 위반하거나 서비스의 정상적인 운영을 방해한 경우 이용을 제한하거나 회원 자격을 상실시킬 수 있습니다.",
        "3. 회사가 회원 자격을 상실시키는 경우 그 사유와 함께 회원에게 통지하고, 소명할 기회를 부여합니다.",
      ],
    },
    {
      heading: "제7조 (구매 신청과 계약의 성립)",
      paragraphs: [
        "1. 이용자는 서비스 화면에서 상품·수량·옵션·배송지·결제방법을 선택하여 구매를 신청합니다.",
        "2. 구매 계약은 회사가 이용자의 구매 신청에 대한 수신확인을 통지하고, 그 통지가 이용자에게 도달한 때에 성립합니다.",
        "3. 회사는 다음 각 호에 해당하면 구매 신청을 승낙하지 않을 수 있습니다.",
        "  가. 신청 내용에 허위 기재가 있거나 필요한 정보가 누락된 경우",
        "  나. 재고가 없는 경우",
        "  다. 그 밖에 구매 신청을 승낙하는 것이 회사의 기술상 현저히 지장이 있는 경우",
        "4. 미성년자가 구매하는 경우 법정대리인의 동의가 필요하며, 동의가 없는 계약은 본인 또는 법정대리인이 취소할 수 있습니다.",
      ],
    },
    {
      heading: "제8조 (대금의 지급)",
      paragraphs: [
        "1. 상품 대금의 지급 방법은 서비스 화면에 표시된 방법 중에서 이용자가 선택합니다.",
        "2. 한국 마켓의 상품 가격은 원화(KRW)로, 일본 마켓의 상품 가격은 엔화(JPY)로 표시됩니다. 결제 시 적용되는 통화는 이용자가 선택한 마켓의 통화입니다.",
        "3. 이용자가 지급한 대금에 대해 회사에 귀책사유가 없는 한, 결제 수단 제공자의 정책에 따른 수수료는 이용자가 부담합니다.",
      ],
    },
    {
      heading: "제9조 (배송)",
      paragraphs: [
        "1. 한국 마켓의 주문은 회사가 이용자에게 직접 판매하고 국내로 배송합니다.",
        "2. 일본 마켓의 주문은 구매대행으로 제공됩니다. 회사는 이용자의 위임에 따라 한국 내 판매자로부터 상품을 구매하고 일본으로 배송합니다.",
        "3. 회사는 이용자가 구매한 상품에 대해 배송 수단, 수단별 배송비, 배송 기간을 명시합니다.",
        "4. 구매대행 상품의 통관 및 수입 절차에서 발생하는 관세·소비세 등 공과금은 관련 법령이 정하는 바에 따르며, 그 부담 주체는 주문 화면에 표시합니다.",
        `5. 배송 지연이 예상되는 경우 회사는 그 사유와 예정일을 ${B.email} 또는 주문 시 입력한 연락처로 안내합니다.`,
      ],
    },
    {
      heading: "제10조 (청약철회 및 반품)",
      paragraphs: [
        "1. 이용자는 상품을 배송받은 날부터 7일 이내에 청약철회를 할 수 있습니다.",
        "2. 다음 각 호의 경우에는 청약철회가 제한됩니다.",
        "  가. 이용자의 책임 있는 사유로 상품이 멸실되거나 훼손된 경우. 다만 내용을 확인하기 위하여 포장을 훼손한 경우는 제외합니다.",
        "  나. 이용자의 사용 또는 일부 소비로 상품의 가치가 현저히 감소한 경우",
        "  다. 시간이 지나 다시 판매하기 곤란할 정도로 상품의 가치가 현저히 감소한 경우",
        "3. 구매대행 상품은 이용자의 개별 위임에 따라 회사가 대리 구매하는 것이므로, 제2항 각 호에 해당하지 않더라도 판매자의 반품 정책에 따라 청약철회가 제한될 수 있습니다. 이 경우 회사는 주문 화면에 그 사실을 명시합니다.",
        "4. 상품의 내용이 표시·광고와 다르거나 계약 내용과 다르게 이행된 경우, 이용자는 상품을 받은 날부터 3개월 이내, 그 사실을 안 날 또는 알 수 있었던 날부터 30일 이내에 청약철회를 할 수 있습니다.",
        `5. 반품 배송비의 부담 주체와 반품지 주소는 ${B.address} 및 주문 화면의 안내에 따릅니다.`,
      ],
    },
    {
      heading: "제11조 (환급)",
      paragraphs: [
        "1. 회사는 이용자로부터 청약철회의 의사표시를 받은 날부터 3영업일 이내에 이미 지급받은 대금을 환급합니다.",
        "2. 회사가 환급을 지연한 경우 관련 법령이 정하는 지연이자를 지급합니다.",
        "3. 환급은 원칙적으로 결제한 수단과 같은 방법으로 합니다. 같은 방법으로 환급이 불가능한 경우에는 이용자와 협의한 방법으로 합니다.",
      ],
    },
    {
      heading: "제12조 (개인정보 보호)",
      paragraphs: [
        "1. 회사는 서비스 제공에 필요한 최소한의 개인정보를 수집합니다.",
        "2. 개인정보의 수집 항목, 이용 목적, 보유 기간, 제3자 제공 및 처리위탁에 관한 사항은 별도의 개인정보처리방침에서 정합니다.",
        `3. 개인정보 보호책임자는 ${B.privacyOfficer}이며, 연락처는 ${B.email}입니다.`,
      ],
    },
    {
      heading: "제13조 (분쟁 해결과 관할)",
      paragraphs: [
        "1. 회사는 이용자가 제기하는 의견과 불만을 처리하기 위해 노력합니다.",
        `2. 이용자는 ${B.email}로 불만을 접수할 수 있으며, 회사는 접수 후 신속히 처리하고 그 결과를 통보합니다.`,
        "3. 회사와 이용자 사이에 발생한 분쟁에 관한 소송은 제소 당시 이용자의 주소지를 관할하는 법원을 전속관할로 합니다. 다만 이용자의 주소가 분명하지 않은 경우에는 민사소송법에 따릅니다.",
        "4. 회사와 이용자 사이에 제기된 소송에는 대한민국 법을 적용합니다.",
      ],
    },
    {
      heading: "부칙",
      paragraphs: [
        `이 약관은 2026년 9월 1일부터 시행합니다. (버전 v1)`,
        `상호: ${B.companyName} | 대표자: ${B.ownerName}`,
        `사업자등록번호: ${B.registrationNumber}`,
        `통신판매업 신고번호: ${B.mailOrderNumber}`,
        `주소: ${B.address}`,
        `이메일: ${B.email} | 전화: ${B.phoneKr}`,
      ],
    },
  ],
};
```

- [ ] **Step 2: 일본어 약관을 만든다**

한국어판의 번역이 아니라 같은 사실을 일본 관행에 맞춰 쓴다. **조항 수와 `version`은 한국어판과 같아야 한다** — Task 4의 테스트가 이를 검사한다.

`src/entities/legal/content/terms.ja.ts`:

```ts
import { BUSINESS_INFO as B } from "../model/businessInfo";
import type { LegalDocument } from "../model/types";

export const TERMS_JA: LegalDocument = {
  id: "terms",
  title: "利用規約",
  version: "v1",
  effectiveDate: "2026-09-01",
  sections: [
    {
      heading: "第1条（目的）",
      paragraphs: [
        `本規約は、${B.companyName}（以下「当社」）が運営するオンラインショップにおいて提供するサービスの利用条件および手続、ならびに当社と利用者の権利・義務・責任事項を定めることを目的とします。`,
      ],
    },
    {
      heading: "第2条（定義）",
      paragraphs: [
        "1.「本サービス」とは、当社が運営するオンラインショップにおいて提供する商品販売および購入代行サービスをいいます。",
        "2.「会員」とは、本規約に同意しアカウントを作成した方をいいます。",
        "3.「非会員」とは、アカウントを作成せずに本サービスを利用する方をいいます。",
        "4.「マーケット」とは、利用者が選択した国別の販売区分をいい、韓国（/kr）と日本（/jp）に分かれます。マーケットにより表示通貨・配送条件・契約形態が異なります。",
        "5.「購入代行」とは、当社が利用者の委任を受けて韓国国内の販売者から商品を購入し、利用者へ配送することをいいます。日本マーケットのご注文は購入代行として提供されます。",
      ],
    },
    {
      heading: "第3条（規約の明示と改定）",
      paragraphs: [
        "1. 当社は、本規約の内容を利用者が容易に確認できるよう、サービス画面に掲示します。",
        "2. 当社は、関係法令に違反しない範囲で本規約を改定することができます。",
        "3. 本規約を改定する場合、適用日および改定理由を明示し、適用日の7日前から告知します。ただし利用者に不利な変更の場合は30日前から告知し、会員には電子メール等で個別に通知します。",
        "4. 利用者が改定後の規約に同意しない場合、退会することができます。告知された適用日までに拒否の意思表示がない場合、同意したものとみなします。",
      ],
    },
    {
      heading: "第4条（サービスの提供および変更）",
      paragraphs: [
        "1. 当社は、商品情報の提供、購入契約の締結、配送その他当社が定める業務を行います。",
        "2. 商品が在庫切れとなった場合または仕様が変更された場合、当社はその理由を利用者に通知し、当該商品の提供を変更または中止することができます。",
        "3. システム点検、設備障害、天災地変等やむを得ない事由がある場合、当社はサービスの提供を一時的に中断することがあります。この場合、事前に告知しますが、予測できない事由による場合は事後に告知することがあります。",
      ],
    },
    {
      heading: "第5条（会員登録とアカウント）",
      paragraphs: [
        "1. 利用者は、当社所定の登録フォームに情報を入力し、本規約および個人情報の収集・利用に同意することにより会員登録を申し込みます。",
        "2. 当社は、次の各号に該当する申込みを承諾しないことがあり、また事後に利用契約を解除することがあります。",
        "  ア. 他人の名義を利用した場合",
        "  イ. 虚偽の情報を記載し、または当社が求める内容を記載しなかった場合",
        "  ウ. 過去に本規約違反により会員資格を喪失したことがある場合",
        "3. 会員は、アカウント情報を自ら管理する責任を負い、第三者に利用させてはなりません。",
        "4. 会員は、ソーシャルログイン（カカオ・Google・LINE）により登録することができます。この場合、当該サービス提供者のアカウント管理方針も併せて適用されます。",
      ],
    },
    {
      heading: "第6条（退会および利用制限）",
      paragraphs: [
        "1. 会員はいつでも退会を申し出ることができ、当社は関係法令上の保存義務がある場合を除き、遅滞なく処理します。",
        "2. 当社は、会員が本規約に違反し、またはサービスの正常な運営を妨げた場合、利用を制限し、または会員資格を喪失させることがあります。",
        "3. 会員資格を喪失させる場合、当社はその理由とともに会員に通知し、弁明の機会を与えます。",
      ],
    },
    {
      heading: "第7条（購入申込みと契約の成立）",
      paragraphs: [
        "1. 利用者は、サービス画面において商品・数量・オプション・配送先・決済方法を選択して購入を申し込みます。",
        "2. 購入契約は、当社が利用者の購入申込みに対する受信確認を通知し、その通知が利用者に到達した時に成立します。",
        "3. 当社は、次の各号に該当する場合、購入申込みを承諾しないことがあります。",
        "  ア. 申込内容に虚偽の記載があり、または必要な情報が欠けている場合",
        "  イ. 在庫がない場合",
        "  ウ. その他購入申込みの承諾が当社の技術上著しく支障となる場合",
        "4. 未成年者が購入する場合は法定代理人の同意が必要であり、同意のない契約は本人または法定代理人が取り消すことができます。",
      ],
    },
    {
      heading: "第8条（代金の支払）",
      paragraphs: [
        "1. 商品代金の支払方法は、サービス画面に表示された方法の中から利用者が選択します。",
        "2. 韓国マーケットの商品価格はウォン（KRW）、日本マーケットの商品価格は円（JPY）で表示されます。決済時に適用される通貨は、利用者が選択したマーケットの通貨です。",
        "3. 当社に帰責事由がない限り、決済手段提供者の方針による手数料は利用者が負担します。",
      ],
    },
    {
      heading: "第9条（配送）",
      paragraphs: [
        "1. 韓国マーケットのご注文は、当社が利用者へ直接販売し、韓国国内へ配送します。",
        "2. 日本マーケットのご注文は購入代行として提供されます。当社は利用者の委任に基づき韓国国内の販売者から商品を購入し、日本へ配送します。",
        "3. 当社は、利用者が購入した商品について、配送手段、手段別の送料および配送期間を明示します。",
        "4. 購入代行商品の通関および輸入手続において生じる関税・消費税等の公租公課は関係法令の定めるところにより、その負担者は注文画面に表示します。",
        `5. 配送の遅延が見込まれる場合、当社はその理由と予定日を ${B.email} またはご注文時にご入力いただいた連絡先へご案内します。`,
      ],
    },
    {
      heading: "第10条（申込みの撤回および返品）",
      paragraphs: [
        "1. 利用者は、商品の引渡しを受けた日から7日以内に申込みの撤回をすることができます。",
        "2. 次の各号の場合、申込みの撤回が制限されます。",
        "  ア. 利用者の責めに帰すべき事由により商品が滅失または毀損した場合。ただし内容を確認するために包装を毀損した場合を除きます。",
        "  イ. 利用者の使用または一部消費により商品の価値が著しく減少した場合",
        "  ウ. 時間の経過により再販売が困難な程度に商品の価値が著しく減少した場合",
        "3. 購入代行商品は、利用者の個別の委任に基づき当社が代理購入するものであるため、前項各号に該当しない場合であっても、販売者の返品方針により申込みの撤回が制限されることがあります。この場合、当社は注文画面にその旨を明示します。",
        "4. 商品の内容が表示・広告と異なり、または契約内容と異なって履行された場合、利用者は商品を受け取った日から3か月以内、その事実を知った日または知り得た日から30日以内に申込みの撤回をすることができます。",
        `5. 返品送料の負担者および返品先住所は ${B.address} および注文画面のご案内によります。`,
      ],
    },
    {
      heading: "第11条（返金）",
      paragraphs: [
        "1. 当社は、利用者から申込撤回の意思表示を受けた日から3営業日以内に、既に受領した代金を返金します。",
        "2. 返金が遅延した場合、当社は関係法令の定める遅延利息を支払います。",
        "3. 返金は原則として決済した手段と同じ方法で行います。同じ方法での返金ができない場合は、利用者と協議した方法によります。",
      ],
    },
    {
      heading: "第12条（個人情報の保護）",
      paragraphs: [
        "1. 当社は、サービス提供に必要な最小限の個人情報を収集します。",
        "2. 個人情報の収集項目、利用目的、保有期間、第三者提供および取扱いの委託に関する事項は、別途のプライバシーポリシーで定めます。",
        `3. 個人情報保護責任者は ${B.privacyOfficer}、連絡先は ${B.email} です。`,
      ],
    },
    {
      heading: "第13条（紛争解決および管轄）",
      paragraphs: [
        "1. 当社は、利用者から寄せられる意見および苦情の処理に努めます。",
        `2. 利用者は ${B.email} へ苦情を申し出ることができ、当社は受付後速やかに処理し、その結果を通知します。`,
        "3. 当社と利用者との間に生じた紛争に関する訴訟は、提訴時における利用者の住所地を管轄する裁判所を専属的合意管轄とします。ただし利用者の住所が明らかでない場合は民事訴訟法によります。",
        "4. 当社と利用者との間に提起された訴訟には大韓民国法を適用します。",
      ],
    },
    {
      heading: "附則",
      paragraphs: [
        "本規約は2026年9月1日から施行します。（バージョン v1）",
        `商号: ${B.companyName} | 代表者: ${B.ownerName}`,
        `事業者登録番号: ${B.registrationNumber}`,
        `通信販売業申告番号: ${B.mailOrderNumber}`,
        `住所: ${B.address}`,
        `メール: ${B.email} | 電話: ${B.phoneJp}`,
      ],
    },
  ],
};
```

- [ ] **Step 3: 확인하고 커밋**

Run: `npx tsc --noEmit`
Expected: 통과

```bash
git add src/entities/legal/content
git commit -m "feat(legal): 이용약관 본문을 넣는다

- 전자상거래 표준약관을 따르되 이 가게의 실제 사정에 맞췄다. 한국은 직접
  판매, 일본은 구매대행이라 배송(제9조)과 청약철회(제10조)가 갈린다.
  표준약관을 그대로 베끼면 실제 운영과 어긋난다
- 구매대행 상품은 판매자 반품 정책에 따라 청약철회가 제한될 수 있다는 조항을
  넣었다. 이 사실을 적지 않으면 나중에 분쟁이 난다
- 사업자 정보는 businessInfo에서 읽는다. 문서에 직접 적으면 푸터와 갈라진다"
```

---

## Task 4: 개인정보처리방침 본문

**수집 항목은 실제 코드와 일치해야 한다.** 아래 목록은 현재 코드 기준이다. 구현 시점에 달라졌으면 문서를 고쳐라 — 실제와 다르면 그 자체가 위반이다.

| 시점 | 수집 항목 | 근거 코드 |
| --- | --- | --- |
| 회원가입 | 이메일, 비밀번호, 이름 | `features/signup-form/model/schema.ts` |
| 소셜 로그인 | 제공자가 주는 이메일·이름 | `shared/api/supabase/auth.ts` |
| 주문 | 받는 분, 후리가나(일본), 전화번호, 이메일, 우편번호, 시도, 시군구, 도로명주소, 상세주소, 배송 메모 | `features/checkout-form/model/schema.ts` |
| 동의 | 약관·개인정보·마케팅 동의 여부와 시각 | `supabase/migrations/20260828000000_user_consents.sql` |

**Files:**
- Create: `src/entities/legal/content/privacy.ko.ts`
- Create: `src/entities/legal/content/privacy.ja.ts`
- Create: `src/entities/legal/model/documents.ts`
- Test: `src/entities/legal/model/documents.test.ts`

- [ ] **Step 1: 한국어 처리방침을 만든다**

`src/entities/legal/content/privacy.ko.ts`:

```ts
import { BUSINESS_INFO as B } from "../model/businessInfo";
import type { LegalDocument } from "../model/types";

export const PRIVACY_KO: LegalDocument = {
  id: "privacy",
  title: "개인정보처리방침",
  version: "v1",
  effectiveDate: "2026-09-01",
  sections: [
    {
      heading: "1. 수집하는 개인정보 항목과 수집 방법",
      paragraphs: [
        `${B.companyName}(이하 "회사")는 서비스 제공에 필요한 최소한의 개인정보를 수집합니다.`,
        "가. 회원가입 시 — 이메일 주소, 비밀번호, 이름",
        "나. 소셜 로그인(카카오·Google·LINE) 시 — 해당 서비스가 제공하는 이메일 주소와 이름",
        "다. 주문 시 — 받는 분 성명, 후리가나(일본 마켓), 전화번호, 이메일 주소, 우편번호, 시도, 시군구, 도로명주소, 상세주소, 배송 메모",
        "라. 동의 기록 — 이용약관·개인정보 수집·이용·마케팅 수신에 대한 동의 여부와 동의 시각",
        "마. 서비스 이용 과정에서 자동으로 생성·수집되는 정보 — 접속 일시, 브라우저 종류, 쿠키",
        "회사는 사상·신념, 건강, 정치적 견해 등 민감정보를 수집하지 않습니다.",
      ],
    },
    {
      heading: "2. 개인정보의 이용 목적",
      paragraphs: [
        "가. 회원 식별과 계정 관리",
        "나. 상품 주문의 접수·처리, 대금 결제, 배송",
        "다. 구매대행 서비스의 제공 및 통관 절차 이행",
        "라. 고객 문의 응대와 분쟁 처리",
        "마. 법령상 의무 이행",
        "바. 마케팅 정보 발송 — 별도로 동의한 경우에 한합니다.",
      ],
    },
    {
      heading: "3. 개인정보의 보유 및 이용 기간",
      paragraphs: [
        "회사는 원칙적으로 개인정보 수집·이용 목적이 달성되면 지체 없이 파기합니다. 다만 관련 법령이 정한 기간 동안은 보존합니다.",
        "가. 계약 또는 청약철회 등에 관한 기록 — 5년 (전자상거래 등에서의 소비자보호에 관한 법률)",
        "나. 대금 결제 및 재화 등의 공급에 관한 기록 — 5년 (같은 법)",
        "다. 소비자 불만 또는 분쟁 처리에 관한 기록 — 3년 (같은 법)",
        "라. 표시·광고에 관한 기록 — 6개월 (같은 법)",
        "마. 회원 정보 — 회원 탈퇴 시까지. 탈퇴 후에는 위 각 호의 보존 의무가 있는 정보를 제외하고 지체 없이 파기합니다.",
      ],
    },
    {
      heading: "4. 개인정보의 제3자 제공",
      paragraphs: [
        "회사는 이용자의 개인정보를 제1항(수집 항목)과 제2항(이용 목적)에서 고지한 범위를 넘어 이용하거나 제3자에게 제공하지 않습니다.",
        "다만 다음의 경우에는 예외로 합니다.",
        "가. 이용자가 사전에 동의한 경우",
        "나. 법령의 규정에 의하거나 수사 목적으로 법령이 정한 절차와 방법에 따라 수사기관의 요구가 있는 경우",
      ],
    },
    {
      heading: "5. 개인정보 처리의 위탁",
      paragraphs: [
        "회사는 서비스 제공을 위해 아래와 같이 개인정보 처리 업무를 위탁하고 있습니다.",
        "가. Supabase Inc. — 회원 인증 및 데이터 보관. 위탁 기간은 회원 탈퇴 시 또는 위탁 계약 종료 시까지입니다.",
        `나. ${placeholderNotice("결제대행사")}`,
        `다. ${placeholderNotice("배송업체")}`,
        "회사는 위탁계약 체결 시 개인정보가 안전하게 관리되도록 필요한 사항을 규정하고 있으며, 위탁 업무의 내용이나 수탁자가 변경될 경우 이 방침을 통해 공개합니다.",
      ],
    },
    {
      heading: "6. 개인정보의 국외 이전",
      paragraphs: [
        `회사가 이용하는 Supabase Inc.의 데이터 보관 위치는 ${B.dataRegion}입니다.`,
        "이전되는 항목은 제1항에 기재된 개인정보 전부이며, 이전 목적은 회원 인증과 서비스 데이터 보관입니다. 보유 기간은 제3항과 같습니다.",
        `이용자는 국외 이전을 거부할 수 있습니다. 다만 거부하는 경우 회원 가입과 주문이 불가능합니다. 거부 의사는 ${B.email}로 알려주시기 바랍니다.`,
      ],
    },
    {
      heading: "7. 정보주체의 권리와 행사 방법",
      paragraphs: [
        "이용자는 언제든지 자신의 개인정보에 대해 열람·정정·삭제·처리정지를 요구할 수 있습니다.",
        "가. 열람과 정정 — 마이페이지에서 직접 확인하고 수정할 수 있습니다.",
        "나. 삭제 — 회원 탈퇴로 처리됩니다. 다만 제3항의 보존 의무가 있는 정보는 해당 기간 동안 보존합니다.",
        `다. 그 밖의 요구 — ${B.email}로 연락하시면 지체 없이 조치합니다.`,
        "이용자가 개인정보의 오류에 대해 정정을 요청한 경우, 회사는 정정을 완료하기 전까지 해당 개인정보를 이용하거나 제공하지 않습니다.",
        "만 14세 미만 아동의 개인정보는 수집하지 않습니다.",
      ],
    },
    {
      heading: "8. 개인정보의 파기 절차와 방법",
      paragraphs: [
        "회사는 보유 기간이 지나거나 처리 목적이 달성된 개인정보를 지체 없이 파기합니다.",
        "가. 파기 절차 — 파기 사유가 발생한 개인정보를 선정하고, 개인정보 보호책임자의 승인을 받아 파기합니다.",
        "나. 파기 방법 — 전자적 파일 형태의 정보는 복구할 수 없는 방법으로 삭제하고, 종이에 출력된 정보는 분쇄하거나 소각합니다.",
      ],
    },
    {
      heading: "9. 개인정보의 안전성 확보 조치",
      paragraphs: [
        "가. 비밀번호는 단방향 암호화하여 저장하며, 회사도 원본을 알 수 없습니다.",
        "나. 개인정보를 처리하는 데이터베이스에 대한 접근 권한을 최소한의 인원으로 제한하고 있습니다.",
        "다. 개인정보의 송수신 구간은 암호화된 통신(HTTPS)을 사용합니다.",
        "라. 개인정보 처리 시스템에 대한 접근 기록을 보관하고 있습니다.",
      ],
    },
    {
      heading: "10. 개인정보 보호책임자",
      paragraphs: [
        `개인정보 보호책임자: ${B.privacyOfficer}`,
        `연락처: ${B.email}`,
        "이용자는 서비스를 이용하면서 발생한 개인정보 보호 관련 문의를 위 연락처로 신고할 수 있습니다. 회사는 신고에 대해 지체 없이 답변하고 처리합니다.",
        "그 밖의 개인정보 침해에 대한 신고나 상담이 필요한 경우 개인정보침해신고센터(privacy.kisa.or.kr, 국번없이 118), 대검찰청 사이버수사과(www.spo.go.kr, 국번없이 1301), 경찰청 사이버수사국(ecrm.police.go.kr, 국번없이 182)에 문의할 수 있습니다.",
      ],
    },
    {
      heading: "11. 쿠키 등 자동 수집 장치의 운영",
      paragraphs: [
        "회사는 로그인 상태 유지와 장바구니 보관을 위해 쿠키와 브라우저 저장소를 사용합니다.",
        "이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있습니다. 다만 거부하는 경우 로그인이 필요한 서비스의 이용이 어려울 수 있습니다.",
        "회사는 광고 목적의 제3자 추적 쿠키를 사용하지 않습니다.",
      ],
    },
    {
      heading: "12. 처리방침의 변경",
      paragraphs: [
        "이 개인정보처리방침은 2026년 9월 1일부터 적용됩니다. (버전 v1)",
        "법령이나 서비스의 변경에 따라 내용이 추가·삭제·수정되는 경우에는 변경 사항의 시행 7일 전부터 서비스 화면을 통해 고지합니다. 다만 이용자 권리의 중대한 변경이 있는 경우에는 30일 전부터 고지합니다.",
      ],
    },
  ],
};

// 아직 정해지지 않은 수탁자를 문장 안에 자연스럽게 넣기 위한 도우미.
// 값이 정해지면 이 함수를 지우고 실제 상호·업무 내용을 적는다.
function placeholderNotice(label: string): string {
  return `［${label} 미입력］ — 위탁 업무의 내용과 수탁자를 확정한 뒤 기재해야 합니다.`;
}
```

- [ ] **Step 2: 일본어 처리방침을 만든다**

CLAUDE.md에 따라 개인정보 요건은 엄격한 쪽(한국 기준)을 따른다. 따라서 **수집 항목·보유 기간·권리 행사는 한국어판과 내용이 같다.** 항 수와 `version`도 같아야 한다.

`src/entities/legal/content/privacy.ja.ts`:

```ts
import { BUSINESS_INFO as B } from "../model/businessInfo";
import type { LegalDocument } from "../model/types";

export const PRIVACY_JA: LegalDocument = {
  id: "privacy",
  title: "プライバシーポリシー",
  version: "v1",
  effectiveDate: "2026-09-01",
  sections: [
    {
      heading: "1. 収集する個人情報の項目と収集方法",
      paragraphs: [
        `${B.companyName}（以下「当社」）は、サービス提供に必要な最小限の個人情報を収集します。`,
        "ア. 会員登録時 — メールアドレス、パスワード、氏名",
        "イ. ソーシャルログイン（カカオ・Google・LINE）時 — 当該サービスが提供するメールアドレスおよび氏名",
        "ウ. ご注文時 — お届け先氏名、フリガナ、電話番号、メールアドレス、郵便番号、都道府県、市区町村、番地、建物名・部屋番号、配送メモ",
        "エ. 同意の記録 — 利用規約・個人情報の収集利用・マーケティング受信に対する同意の有無と同意日時",
        "オ. サービス利用の過程で自動的に生成・収集される情報 — アクセス日時、ブラウザの種類、クッキー",
        "当社は、思想・信条、健康、政治的見解等の機微情報を収集しません。",
      ],
    },
    {
      heading: "2. 個人情報の利用目的",
      paragraphs: [
        "ア. 会員の識別およびアカウント管理",
        "イ. 商品注文の受付・処理、代金決済、配送",
        "ウ. 購入代行サービスの提供および通関手続の履行",
        "エ. お問い合わせ対応および紛争処理",
        "オ. 法令上の義務の履行",
        "カ. マーケティング情報の送信 — 別途ご同意いただいた場合に限ります。",
      ],
    },
    {
      heading: "3. 個人情報の保有および利用期間",
      paragraphs: [
        "当社は、原則として個人情報の収集・利用目的が達成された場合、遅滞なく廃棄します。ただし関係法令が定める期間は保存します。",
        "ア. 契約または申込撤回等に関する記録 — 5年（電子商取引等における消費者保護に関する法律）",
        "イ. 代金決済および財貨等の供給に関する記録 — 5年（同法）",
        "ウ. 消費者の苦情または紛争処理に関する記録 — 3年（同法）",
        "エ. 表示・広告に関する記録 — 6か月（同法）",
        "オ. 会員情報 — 退会時まで。退会後は上記各号の保存義務がある情報を除き、遅滞なく廃棄します。",
      ],
    },
    {
      heading: "4. 個人情報の第三者提供",
      paragraphs: [
        "当社は、利用者の個人情報を第1項（収集項目）および第2項（利用目的）で告知した範囲を超えて利用し、または第三者に提供しません。",
        "ただし次の場合は例外とします。",
        "ア. 利用者が事前に同意した場合",
        "イ. 法令の規定による場合、または捜査目的で法令の定める手続と方法に従い捜査機関の要求があった場合",
      ],
    },
    {
      heading: "5. 個人情報の取扱いの委託",
      paragraphs: [
        "当社は、サービス提供のため、以下のとおり個人情報の取扱業務を委託しています。",
        "ア. Supabase Inc. — 会員認証およびデータ保管。委託期間は退会時または委託契約の終了時までです。",
        `イ. ${placeholderNotice("決済代行会社")}`,
        `ウ. ${placeholderNotice("配送業者")}`,
        "当社は、委託契約の締結にあたり個人情報が安全に管理されるよう必要な事項を定めており、委託業務の内容または受託者が変更された場合は本方針を通じて公開します。",
      ],
    },
    {
      heading: "6. 個人情報の国外移転",
      paragraphs: [
        `当社が利用する Supabase Inc. のデータ保管場所は ${B.dataRegion} です。`,
        "移転される項目は第1項に記載された個人情報のすべてであり、移転の目的は会員認証とサービスデータの保管です。保有期間は第3項のとおりです。",
        `利用者は国外移転を拒否することができます。ただし拒否される場合、会員登録およびご注文ができません。拒否のご意思は ${B.email} までお知らせください。`,
      ],
    },
    {
      heading: "7. 情報主体の権利と行使方法",
      paragraphs: [
        "利用者はいつでも、ご自身の個人情報について閲覧・訂正・削除・処理停止を求めることができます。",
        "ア. 閲覧および訂正 — マイページで直接確認・修正できます。",
        "イ. 削除 — 退会により処理されます。ただし第3項の保存義務がある情報は当該期間保存します。",
        `ウ. その他のご請求 — ${B.email} までご連絡いただければ遅滞なく対応します。`,
        "利用者が個人情報の誤りについて訂正を請求した場合、当社は訂正を完了するまで当該個人情報を利用または提供しません。",
        "満14歳未満の児童の個人情報は収集しません。",
      ],
    },
    {
      heading: "8. 個人情報の廃棄手続と方法",
      paragraphs: [
        "当社は、保有期間が経過し、または処理目的が達成された個人情報を遅滞なく廃棄します。",
        "ア. 廃棄手続 — 廃棄事由が生じた個人情報を選定し、個人情報保護責任者の承認を得て廃棄します。",
        "イ. 廃棄方法 — 電子ファイル形式の情報は復元できない方法で削除し、紙に出力された情報は裁断または焼却します。",
      ],
    },
    {
      heading: "9. 個人情報の安全性確保措置",
      paragraphs: [
        "ア. パスワードは一方向に暗号化して保存しており、当社も原文を知ることはできません。",
        "イ. 個人情報を扱うデータベースへのアクセス権限を最小限の人員に制限しています。",
        "ウ. 個人情報の送受信区間には暗号化通信（HTTPS）を使用しています。",
        "エ. 個人情報処理システムへのアクセス記録を保管しています。",
      ],
    },
    {
      heading: "10. 個人情報保護責任者",
      paragraphs: [
        `個人情報保護責任者: ${B.privacyOfficer}`,
        `連絡先: ${B.email}`,
        "利用者は、サービスのご利用にあたり生じた個人情報保護に関するお問い合わせを上記連絡先へお申し出いただけます。当社は遅滞なく回答し対応します。",
        "その他、個人情報の侵害に関する申告や相談が必要な場合は、韓国の個人情報侵害申告センター（privacy.kisa.or.kr、局番なし118）にお問い合わせいただけます。",
      ],
    },
    {
      heading: "11. クッキー等の自動収集装置の運用",
      paragraphs: [
        "当社は、ログイン状態の維持およびカートの保管のためにクッキーとブラウザストレージを使用します。",
        "利用者はブラウザの設定によりクッキーの保存を拒否できます。ただし拒否される場合、ログインが必要なサービスのご利用が困難になることがあります。",
        "当社は、広告目的の第三者トラッキングクッキーを使用しません。",
      ],
    },
    {
      heading: "12. 本方針の変更",
      paragraphs: [
        "本プライバシーポリシーは2026年9月1日から適用されます。（バージョン v1）",
        "法令またはサービスの変更に伴い内容が追加・削除・修正される場合は、変更事項の施行7日前からサービス画面を通じて告知します。ただし利用者の権利に重大な変更がある場合は30日前から告知します。",
      ],
    },
  ],
};

// まだ確定していない受託者を文中に自然に入れるための補助。
// 値が決まったらこの関数を削除し、実際の商号と業務内容を記載する。
function placeholderNotice(label: string): string {
  return `［${label} 미입력］ — 委託業務の内容と受託者を確定のうえ記載する必要があります。`;
}
```

**주의:** 일본어판의 `placeholderNotice`도 **`［… 미입력］`** 형태를 그대로 쓴다. 검출 정규식이 하나이므로 표기를 언어별로 바꾸면 일본어판의 미입력 항목을 놓친다.

- [ ] **Step 3: 문서 조회를 만든다**

`src/entities/legal/model/documents.ts`:

```ts
import type { Locale } from "@/shared/i18n/types";
import { TERMS_JA } from "../content/terms.ja";
import { TERMS_KO } from "../content/terms.ko";
import { PRIVACY_JA } from "../content/privacy.ja";
import { PRIVACY_KO } from "../content/privacy.ko";
import type { LegalDocument, LegalDocumentId } from "./types";

const DOCUMENTS: Record<Locale, Record<LegalDocumentId, LegalDocument>> = {
  ja: { terms: TERMS_JA, privacy: PRIVACY_JA },
  ko: { terms: TERMS_KO, privacy: PRIVACY_KO },
};

export function getLegalDocument(locale: Locale, id: LegalDocumentId): LegalDocument {
  return DOCUMENTS[locale][id];
}

// 테스트가 두 로케일을 나란히 비교하기 위해 쓴다.
export function allLegalDocuments(): LegalDocument[] {
  return Object.values(DOCUMENTS).flatMap((byId) => Object.values(byId));
}
```

- [ ] **Step 4: 정합성 테스트를 쓴다**

`src/entities/legal/model/documents.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { allLegalDocuments, getLegalDocument } from "./documents";
import { findPlaceholders } from "./placeholders";
import type { LegalDocumentId } from "./types";

const IDS: LegalDocumentId[] = ["terms", "privacy"];

describe("getLegalDocument", () => {
  it("returns a document for every locale and id", () => {
    for (const id of IDS) {
      expect(getLegalDocument("ko", id).id).toBe(id);
      expect(getLegalDocument("ja", id).id).toBe(id);
    }
  });

  it("keeps the two locales structurally identical", () => {
    // 한쪽 언어에만 조항을 추가하는 사고를 막는다. 같은 문서인데 내용이
    // 다르면 어느 쪽에 동의한 것인지 다툼이 생긴다.
    for (const id of IDS) {
      const ko = getLegalDocument("ko", id);
      const ja = getLegalDocument("ja", id);
      expect(ja.sections.length).toBe(ko.sections.length);
      expect(ja.version).toBe(ko.version);
      expect(ja.effectiveDate).toBe(ko.effectiveDate);
    }
  });

  it("matches the consent record version", () => {
    // user_consents.terms_version의 기본값이 'v1'이다. 문서 버전을 올릴 때는
    // 마이그레이션과 재동의 흐름이 함께 필요하다.
    for (const doc of allLegalDocuments()) {
      expect(doc.version).toBe("v1");
    }
  });

  it("has no empty section", () => {
    for (const doc of allLegalDocuments()) {
      for (const section of doc.sections) {
        expect(section.heading.length).toBeGreaterThan(0);
        expect(section.paragraphs.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("아직 채우지 못한 사업자 정보", () => {
  it("lists what still needs filling in", () => {
    // 이 테스트는 실패시키려는 게 아니라 남은 항목을 눈에 보이게 하려는 것이다.
    // 값을 채우면 목록이 줄어든다. 목록이 비면 이 기대값을 []로 바꿔라.
    const remaining = new Set(allLegalDocuments().flatMap(findPlaceholders));
    expect([...remaining].sort()).toEqual([
      "결제대행사",
      "決済代行会社",
      "配送業者",
      "데이터 보관 리전",
      "배송업체",
      "사업자등록번호",
      "사업장 주소",
      "통신판매업 신고번호",
      "한국 연락처",
    ].sort());
  });
});
```

- [ ] **Step 5: 실행하고 목록을 맞춘다**

Run: `npx vitest run src/entities/legal`

마지막 테스트가 실패하면 **실제 출력된 목록으로 기대값을 바꿔라.** 이 테스트의 목적은 남은 항목을 문서화하는 것이지 특정 목록을 강제하는 게 아니다. 다른 테스트가 실패하면 그건 진짜 문제이니 고쳐라.

- [ ] **Step 6: 커밋**

```bash
git add src/entities/legal
git commit -m "feat(legal): 개인정보처리방침 본문을 넣는다

- 수집 항목을 코드에서 확인해 맞췄다. 실제로 받는 것과 문서가 다르면
  그 자체가 위반이다
- 국외 이전 항을 뒀다. Supabase에 데이터가 보관되므로 고지 대상이다.
  리전은 아직 확인 전이라 미입력으로 남겼다
- 두 로케일의 조항 수와 버전이 같은지 테스트로 고정했다. 한쪽만 고치면
  어느 쪽에 동의한 것인지 다툼이 생긴다
- 미입력 항목 목록을 테스트로 남겼다. 값을 채우면 목록이 줄어든다"
```

---

## Task 5: 본문 렌더와 페이지

**Files:**
- Create: `src/entities/legal/LegalDocumentBody.tsx`
- Modify: `src/entities/legal/index.ts`
- Modify: `src/shared/i18n/dictionaries.ts`
- Modify: `src/app/[market]/(main)/terms/page.tsx`
- Modify: `src/app/[market]/(main)/privacy/page.tsx`

- [ ] **Step 1: 사전에 문구를 추가한다**

두 사전의 `legal` 블록을 통째로 교체한다. `comingSoon`은 더 이상 쓰지 않으므로 뺀다.

일본어:
```ts
    legal: {
      termsTitle: "利用規約",
      privacyTitle: "プライバシーポリシー",
      effectiveDateLabel: "施行日",
      versionLabel: "バージョン",
      close: "閉じる",
      missingNotice: "未入力の事業者情報があります（開発環境のみ表示）",
    },
```

한국어:
```ts
    legal: {
      termsTitle: "이용약관",
      privacyTitle: "개인정보처리방침",
      effectiveDateLabel: "시행일",
      versionLabel: "버전",
      close: "닫기",
      missingNotice: "미입력 사업자 정보가 있습니다 (개발 환경에서만 표시)",
    },
```

- [ ] **Step 2: 본문 렌더를 만든다**

`src/entities/legal/LegalDocumentBody.tsx`:

```tsx
"use client";

import { useLocale } from "@/shared/i18n/LocaleProvider";
import { findPlaceholders } from "./model/placeholders";
import type { LegalDocument } from "./model/types";

export function LegalDocumentBody({ document }: { document: LegalDocument }) {
  const { d } = useLocale();
  return (
    <article className="space-y-8">
      <header className="space-y-1">
        <h1 className="text-xl font-bold text-foreground">{document.title}</h1>
        <p className="text-xs text-muted">
          {d.legal.effectiveDateLabel} {document.effectiveDate} · {d.legal.versionLabel}{" "}
          {document.version}
        </p>
      </header>
      <MissingInfoNotice document={document} />
      {document.sections.map((section) => (
        <section key={section.heading} className="space-y-2">
          <h2 className="text-sm font-medium text-foreground">{section.heading}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph} className="text-sm leading-relaxed text-muted">
              {paragraph}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}

// 미입력 항목은 본문에도 그대로 보이지만, 조항이 많아 지나치기 쉽다.
// 개발 환경에서만 맨 위에 모아 보여준다. 배포본에서는 띄우지 않는다 —
// 고객에게 보여줄 정보가 아니다.
function MissingInfoNotice({ document }: { document: LegalDocument }) {
  const { d } = useLocale();
  const missing = findPlaceholders(document);
  if (process.env.NODE_ENV === "production" || missing.length === 0) {
    return null;
  }
  return (
    <div className="border border-sale p-3 text-xs text-sale">
      <p className="font-medium">{d.legal.missingNotice}</p>
      <p className="mt-1">{missing.join(" · ")}</p>
    </div>
  );
}
```

- [ ] **Step 3: 공개 API에 추가한다**

`src/entities/legal/index.ts`:

```ts
export { BUSINESS_INFO } from "./model/businessInfo";
export { findPlaceholders, placeholder } from "./model/placeholders";
export { getLegalDocument } from "./model/documents";
export { LegalDocumentBody } from "./LegalDocumentBody";
export type { LegalDocument, LegalDocumentId, LegalSection } from "./model/types";
```

- [ ] **Step 4: 두 페이지를 바꾼다**

`src/app/[market]/(main)/terms/page.tsx` 전체:

```tsx
"use client";

import { useLocale } from "@/shared/i18n/LocaleProvider";
import { getLegalDocument, LegalDocumentBody } from "@/entities/legal";

export default function TermsPage() {
  const { locale } = useLocale();
  return (
    <div className="mx-auto max-w-480 px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <LegalDocumentBody document={getLegalDocument(locale, "terms")} />
      </div>
    </div>
  );
}
```

`src/app/[market]/(main)/privacy/page.tsx` 전체:

```tsx
"use client";

import { useLocale } from "@/shared/i18n/LocaleProvider";
import { getLegalDocument, LegalDocumentBody } from "@/entities/legal";

export default function PrivacyPage() {
  const { locale } = useLocale();
  return (
    <div className="mx-auto max-w-480 px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <LegalDocumentBody document={getLegalDocument(locale, "privacy")} />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: 확인하고 커밋**

Run: `npx tsc --noEmit && npx eslint src && npx vitest run`
Expected: tsc 통과, eslint 신규 오류 없음, 테스트 전부 통과(기존 `adminServer.test.ts` 1건 실패 제외)

`d.legal.comingSoon`을 아직 쓰는 곳이 있으면 tsc가 잡는다. 나오면 그 사용처를 지워라.

```bash
git add src/entities/legal "src/app/[market]/(main)/terms" "src/app/[market]/(main)/privacy" src/shared/i18n/dictionaries.ts
git commit -m "feat(legal): 약관·개인정보 페이지에 실제 내용을 띄운다

- '준비 중입니다'만 뜨던 껍데기를 실제 문서로 바꿨다. 동의 체크박스는 있는데
  무엇에 동의하는지 볼 수 없는 상태였다
- 미입력 항목 배너는 개발 환경에서만 띄운다. 조항이 많아 본문 속 '미입력'을
  지나치기 쉬운데, 고객에게 보여줄 정보는 아니다"
```

---

## Task 6: 모달

**Files:**
- Create: `src/shared/lib/useHistoryBackToClose.ts`
- Create: `src/entities/legal/LegalModal.tsx`
- Modify: `src/entities/legal/index.ts`

- [ ] **Step 1: 뒤로가기 훅을 만든다**

`src/shared/lib/useHistoryBackToClose.ts`:

```ts
"use client";

import { useEffect } from "react";

// 휴대폰 사용자는 모달을 뒤로가기로 닫으려 한다. 그대로 두면 뒤로가기가
// 화면 자체를 벗어나, 회원가입 도중이라면 입력값이 날아간다.
// 열 때 히스토리 항목을 하나 넣어 두면 뒤로가기가 그 항목만 소비한다.
export function useHistoryBackToClose(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) {
      return;
    }
    window.history.pushState({ modal: true }, "");
    const onPop = () => onClose();
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      // 뒤로가기가 아니라 닫기 버튼으로 닫은 경우, 넣어둔 항목이 남아 있다.
      // 그대로 두면 다음 뒤로가기가 아무 일도 안 하는 것처럼 보인다.
      if (window.history.state?.modal) {
        window.history.back();
      }
    };
  }, [active, onClose]);
}
```

- [ ] **Step 2: 모달을 만든다**

`LookModal`과 같은 구조다 — 오버레이 클릭으로 닫고, Escape로 닫고, 배경 스크롤을 잠그고, 열 때 닫기 버튼에 포커스를 주고 닫을 때 원래 자리로 돌려준다.

`src/entities/legal/LegalModal.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { useEscapeToClose } from "@/shared/lib/useEscapeToClose";
import { useBodyScrollLock } from "@/shared/lib/useBodyScrollLock";
import { useHistoryBackToClose } from "@/shared/lib/useHistoryBackToClose";
import { CloseIcon } from "@/shared/ui/icons";
import { getLegalDocument } from "./model/documents";
import { LegalDocumentBody } from "./LegalDocumentBody";
import type { LegalDocumentId } from "./model/types";

type Props = {
  documentId: LegalDocumentId | null;
  onClose: () => void;
};

export function LegalModal({ documentId, onClose }: Props) {
  const { locale, d } = useLocale();
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = documentId !== null;

  useEscapeToClose(open, onClose);
  useBodyScrollLock(open);
  useHistoryBackToClose(open, onClose);
  useReturnFocus(open, closeRef);

  if (!documentId) {
    return null;
  }
  return (
    <>
      <div aria-hidden onClick={onClose} className="fixed inset-0 z-50 bg-black/40" />
      <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-10">
        <div
          role="dialog"
          aria-modal="true"
          className="pointer-events-auto flex max-h-full w-full max-w-3xl flex-col bg-surface"
        >
          <div className="flex justify-end border-b border-border p-2">
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label={d.legal.close}
              className="p-2 text-foreground hover:opacity-70"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-y-auto px-6 py-6 sm:px-10">
            <LegalDocumentBody document={getLegalDocument(locale, documentId)} />
          </div>
        </div>
      </div>
    </>
  );
}

// 열 때 닫기 버튼으로 포커스를 옮기고, 닫을 때 원래 있던 곳으로 돌려준다.
// 키보드 사용자가 모달을 닫은 뒤 처음부터 다시 탐색하지 않게 한다.
function useReturnFocus(open: boolean, target: React.RefObject<HTMLButtonElement | null>) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const opener = document.activeElement as HTMLElement | null;
    target.current?.focus();
    return () => opener?.focus();
  }, [open, target]);
}
```

`CloseIcon`이 `src/shared/ui/icons`에 있는지 확인하라. `LookModal.tsx`가 같은 경로에서 가져온다.

- [ ] **Step 3: 공개 API에 추가한다**

`src/entities/legal/index.ts`에 한 줄 추가:

```ts
export { LegalModal } from "./LegalModal";
```

- [ ] **Step 4: 확인하고 커밋**

Run: `npx tsc --noEmit && npx eslint src`
Expected: tsc 통과, eslint 신규 오류 없음

```bash
git add src/entities/legal src/shared/lib/useHistoryBackToClose.ts
git commit -m "feat(legal): 약관을 모달로 볼 수 있게 한다

- 모달을 열 때 히스토리 항목을 하나 넣는다. 휴대폰에서 뒤로가기로 모달을
  닫으려다 회원가입 화면을 벗어나 입력값이 날아가는 걸 막는다
- 닫기 버튼으로 닫은 경우 넣어둔 항목을 되돌린다. 남겨두면 다음 뒤로가기가
  아무 일도 안 하는 것처럼 보인다"
```

---

## Task 7: 가입·동의 화면 연결과 중복 제거

`LegalLinks` 함수가 `SignupForm.tsx`와 `ConsentForm.tsx`에 **글자 그대로 복제**돼 있다. 하나로 합치면서 모달을 열게 바꾼다.

**Files:**
- Create: `src/entities/legal/LegalConsentLinks.tsx`
- Modify: `src/entities/legal/index.ts`
- Modify: `src/features/signup-form/SignupForm.tsx`
- Modify: `src/features/consent-form/ConsentForm.tsx`
- Modify: `src/widgets/footer/Footer.tsx`

- [ ] **Step 1: 공용 컴포넌트를 만든다**

`src/entities/legal/LegalConsentLinks.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { LegalModal } from "./LegalModal";
import type { LegalDocumentId } from "./model/types";

// 동의 체크박스 아래에 붙는 「이용약관」「개인정보처리방침」.
// 링크가 아니라 버튼인 이유는 페이지로 나가면 안 되기 때문이다 — 새 탭이든
// 이동이든 폼을 벗어나면 입력하던 값이 위태로워진다.
export function LegalConsentLinks() {
  const { d } = useLocale();
  const [openId, setOpenId] = useState<LegalDocumentId | null>(null);
  return (
    <div className="-mt-2 flex gap-3 pl-6 text-xs text-muted">
      <TriggerButton label={d.legal.termsTitle} onOpen={() => setOpenId("terms")} />
      <TriggerButton label={d.legal.privacyTitle} onOpen={() => setOpenId("privacy")} />
      <LegalModal documentId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

function TriggerButton({ label, onOpen }: { label: string; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="underline underline-offset-2 hover:text-foreground"
    >
      {label}
    </button>
  );
}
```

`type="button"`이 중요하다. 폼 안에 있으므로 빠뜨리면 약관을 열려다 가입이 제출된다.

- [ ] **Step 2: 공개 API에 추가한다**

`src/entities/legal/index.ts`에 한 줄:

```ts
export { LegalConsentLinks } from "./LegalConsentLinks";
```

- [ ] **Step 3: `SignupForm.tsx`를 고친다**

import에서 `MarketLink`가 다른 곳에도 쓰이는지 확인하라. `SigninLink`가 쓰고 있으므로 **`MarketLink` import는 그대로 둔다.**

추가:
```ts
import { LegalConsentLinks } from "@/entities/legal";
```

JSX에서 `<LegalLinks />`를 `<LegalConsentLinks />`로 바꾸고, 파일 아래쪽의 `function LegalLinks() { ... }` 정의를 **통째로 삭제**한다.

- [ ] **Step 4: `ConsentForm.tsx`를 고친다**

같은 방식이다. 다만 이 파일에서 `MarketLink`는 `LegalLinks`에서만 쓰이므로, 정의를 지운 뒤 **`MarketLink` import도 지워야 한다.** 남겨두면 eslint가 미사용으로 잡는다.

추가:
```ts
import { LegalConsentLinks } from "@/entities/legal";
```

JSX의 `<LegalLinks />` → `<LegalConsentLinks />`, 파일 아래 `function LegalLinks()` 삭제, `import { MarketLink } from "@/shared/market";` 삭제.

- [ ] **Step 5: 푸터에 링크를 추가한다**

푸터에서는 **모달이 아니라 페이지로 이동**한다. 푸터를 누르는 사람은 문서를 읽으러 온 것이고, 지킬 입력값도 없다. 또한 약관은 고정 주소로 열람할 수 있어야 한다.

`src/widgets/footer/Footer.tsx`의 import에 추가:
```ts
import { MarketLink } from "@/shared/market";
```

`日本語 / 한국어` 링크가 있는 `<Link>` **바로 앞**에 넣는다:

```tsx
        <div className="mt-8 flex gap-4 text-xs text-muted">
          <MarketLink href="/terms" className="underline underline-offset-2 hover:text-foreground">
            {d.legal.termsTitle}
          </MarketLink>
          <MarketLink href="/privacy" className="underline underline-offset-2 hover:text-foreground">
            {d.legal.privacyTitle}
          </MarketLink>
        </div>
```

`MarketLink`를 쓰는 이유는 마켓 접두사가 필요하기 때문이다. 아래 `日本語 / 한국어`가 일반 `Link`인 것은 그 링크만 마켓 밖(`/`)으로 나가야 해서다 — 주석에 적혀 있다. 헷갈리지 마라.

- [ ] **Step 6: 확인**

Run: `npx tsc --noEmit && npx eslint src && npx vitest run`
Expected: tsc 통과, eslint 신규 오류 없음(미사용 `MarketLink`가 남으면 여기서 잡힌다), 테스트 전부 통과

Run: `grep -rn "function LegalLinks" src`
Expected: 결과 없음 — 복제본이 둘 다 사라졌는지 확인한다

- [ ] **Step 7: 커밋**

```bash
git add src/entities/legal src/features/signup-form/SignupForm.tsx src/features/consent-form/ConsentForm.tsx src/widgets/footer/Footer.tsx
git commit -m "feat(legal): 가입·동의 화면에서 약관을 모달로 연다

- LegalLinks가 SignupForm과 ConsentForm에 글자 그대로 복제돼 있었다.
  하나로 합쳤다
- 링크가 아니라 버튼으로 바꿨다. 새 탭이든 이동이든 폼을 벗어나면 입력하던
  값이 위태로워진다. 약관을 읽는 것 때문에 가입을 다시 시작하게 할 수 없다
- 푸터에는 페이지 링크를 넣었다. 약관은 고정 주소로 상시 열람할 수 있어야
  하고, 푸터를 누르는 사람은 지킬 입력값이 없다"
```

---

## Task 8: 브라우저 확인

**코드가 아니라 실제 동작을 본다.** 이 기능의 핵심은 "모달을 열고 닫아도 입력값이 남는가"인데, 그건 타입 검사로 확인되지 않는다.

- [ ] **Step 1: 개발 서버를 띄운다**

```bash
pnpm dev
```

첫 컴파일에 30~40초 걸린다. 무한 로딩이 아니다 — 구글 CJK 폰트 7종을 받아온다.

폰트 관련 오류로 페이지가 500을 내면 잠시 뒤 다시 시도하라. 구글 폰트 CDN이 이 프로젝트의 폰트 수 때문에 간헐적으로 레이트 리밋을 건다. 우리 코드 문제가 아니다.

- [ ] **Step 2: 가입 화면에서 입력값이 지켜지는지 본다**

`http://localhost:3000/kr/signup`

1. 이메일·비밀번호·이름을 채운다
2. 「이용약관」을 누른다 → 모달이 뜨고 **URL이 그대로 `/kr/signup`인지 확인**한다
3. 닫기 버튼으로 닫는다 → **입력값이 그대로 남아 있어야 한다**
4. 다시 열고 Escape로 닫는다 → 같아야 한다
5. 다시 열고 오버레이(바깥 여백)를 클릭한다 → 닫혀야 한다
6. 다시 열고 **브라우저 뒤로가기**를 누른다 → 모달만 닫히고 가입 화면에 남아야 하며, 입력값도 그대로여야 한다

6번이 이 작업의 핵심이다. 뒤로가기로 가입 화면을 벗어나면 훅이 동작하지 않는 것이다.

- [ ] **Step 3: 두 문서와 두 언어를 본다**

- `/kr/signup`에서 「개인정보처리방침」 모달 → 12개 항이 보이는가
- `/jp/signup`에서 두 모달 → 일본어로 보이는가
- 개발 환경이므로 문서 위에 **미입력 항목 배너**가 보여야 한다

- [ ] **Step 4: 페이지와 푸터**

- `http://localhost:3000/kr/terms` 직접 접속 → 전체 페이지로 보이는가
- `http://localhost:3000/jp/privacy` → 일본어로 보이는가
- 아무 페이지나 열어 푸터의 「이용약관」 클릭 → `/kr/terms`로 이동하는가
- 푸터에 사업자등록번호·통신판매업 신고번호·주소가 **「미입력」으로 보이는가**

- [ ] **Step 5: 소셜 로그인 동의 화면**

`/kr/auth/consent`는 소셜 로그인 직후에만 도달한다. 접근이 어려우면 `ConsentForm`이 `LegalConsentLinks`를 쓰고 있는지 코드로 확인하는 것으로 갈음하고, **확인하지 못했다고 보고하라.** 확인한 척하지 마라.

- [ ] **Step 6: 프로덕션 빌드**

```bash
pnpm build
```

폰트 CDN 때문에 실패하면 45초쯤 기다렸다가 한 번 더 시도하라. 두 번 이상 실패하면 보고하라.

배포본에서는 미입력 배너가 뜨지 않아야 한다(`NODE_ENV === "production"`). 본문 속 「미입력」은 그대로 보이는 게 맞다.

---

## Task 9: 문서

**Files:**
- Modify: `docs/multi-market-status.md`

- [ ] **Step 1: 진행표에 항목을 추가한다**

「지금 동작하는 것」 절에 한 줄 추가한다.

```
- 이용약관 · 개인정보처리방침 — 가입 화면에서는 모달, 푸터에서는 페이지.
  **사업자 정보가 아직 미입력이라 그대로 배포하면 안 된다** —
  `src/entities/legal/model/businessInfo.ts`의 placeholder를 모두 채운 뒤 배포할 것
```

- [ ] **Step 2: 커밋**

```bash
git add docs/multi-market-status.md
git commit -m "docs: 약관 문서 상태를 진행표에 남긴다

- 사업자 정보가 미입력인 채로 배포하면 안 된다는 것을 눈에 띄게 적었다.
  화면에는 '미입력'이 보이지만 진행표만 보는 사람은 모른다"
```

---

## 마무리

- [ ] `npx tsc --noEmit` 통과
- [ ] `npx vitest run` — 신규 테스트 포함 전부 통과 (`adminServer.test.ts` 기존 실패 1건 제외)
- [ ] `npx eslint src` — 신규 오류 없음 (`FontModeProvider.tsx` 기존 오류 1건만)
- [ ] `pnpm build` 통과
- [ ] `grep -rn "function LegalLinks" src` — 결과 없음
- [ ] `grep -rn "comingSoon" src` — 결과 없음
- [ ] `git status` 깨끗함

`superpowers:finishing-a-development-branch`로 마무리한다.

**보고할 때 반드시 포함할 것:** `businessInfo.ts`에 남은 미입력 항목 목록. 이 값들이 채워지기 전에는 배포할 수 없다.
