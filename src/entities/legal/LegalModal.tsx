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
