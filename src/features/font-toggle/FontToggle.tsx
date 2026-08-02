"use client";

import { useFontMode } from "@/shared/i18n/FontModeProvider";
import type { FontMode } from "@/shared/i18n/FontModeProvider";

const OPTIONS: { value: FontMode; label: string; previewFont: string }[] = [
  { value: "slab", label: "Slab", previewFont: "var(--font-zilla)" },
  { value: "mono", label: "Mono", previewFont: "var(--font-plex-mono)" },
];

export function FontToggle() {
  const { fontMode, setFontMode } = useFontMode();
  return (
    <div className="flex w-full items-center border border-border bg-surface p-0.5 text-xs">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setFontMode(opt.value)}
          style={{ fontFamily: opt.previewFont }}
          className={buttonClass(opt.value === fontMode)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function buttonClass(active: boolean): string {
  const activeCls = "bg-sage text-white";
  const idleCls = "text-muted hover:text-foreground";
  return `flex-1 px-2.5 py-1.5 text-center transition-colors ${active ? activeCls : idleCls}`;
}
