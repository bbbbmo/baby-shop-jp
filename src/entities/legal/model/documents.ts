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
