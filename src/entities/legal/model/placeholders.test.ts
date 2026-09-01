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
