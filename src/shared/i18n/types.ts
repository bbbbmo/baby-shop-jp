export type Locale = "ja" | "ko";

export type Localized = {
  ja: string;
  ko: string;
};

export const LOCALE_COOKIE_KEY = "komo_locale";

export const isLocale = (value: unknown): value is Locale =>
  value === "ja" || value === "ko";
