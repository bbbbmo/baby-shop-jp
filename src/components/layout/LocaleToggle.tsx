"use client";

import { useLocale } from "@/i18n/LocaleProvider";
import type { Locale } from "@/lib/types";

const OPTIONS: { value: Locale; label: string }[] = [
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
];

export function LocaleToggle() {
  const { locale, setLocale } = useLocale();
  return (
    <div className="flex items-center rounded-full border border-border bg-surface p-0.5 text-xs">
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setLocale(opt.value)}
          className={buttonClass(opt.value === locale)}
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
  return `rounded-full px-2.5 py-1 transition-colors ${active ? activeCls : idleCls}`;
}
