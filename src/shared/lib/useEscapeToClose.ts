"use client";

import { useEffect } from "react";

/** active 인 동안 Escape 키 입력을 onClose 로 연결한다. */
export function useEscapeToClose(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, onClose]);
}
