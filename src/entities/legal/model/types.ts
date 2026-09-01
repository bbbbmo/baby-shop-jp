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
