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
