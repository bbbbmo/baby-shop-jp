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
