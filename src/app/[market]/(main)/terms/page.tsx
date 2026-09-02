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
