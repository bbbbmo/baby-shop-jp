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
