"use client";

import { createContext, useContext, useEffect, useMemo } from "react";
import type { Locale } from "./types";
import { dictionaries, type Dictionary } from "./dictionaries";

type LocaleContextValue = {
  locale: Locale;
  d: Dictionary;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

// 로케일은 경로(/jp · /kr)가 정한다. 화면에서 바꾸는 수단을 두지 않으므로
// 상태를 들고 있을 필요가 없다 — 마켓 전환이 곧 언어 전환이다.
export function LocaleProvider({
  children,
  initialLocale = "ja",
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const locale = initialLocale;

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, d: dictionaries[locale] }),
    [locale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
