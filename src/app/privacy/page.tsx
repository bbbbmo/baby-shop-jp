"use client";

import { useLocale } from "@/shared/i18n/LocaleProvider";

export default function PrivacyPage() {
  const { d } = useLocale();
  return (
    <div className="mx-auto max-w-480 px-6 py-16 text-center sm:px-10">
      <h1 className="text-xl font-bold text-foreground">{d.legal.privacyTitle}</h1>
      <p className="mt-4 text-sm text-muted">{d.legal.comingSoon}</p>
    </div>
  );
}
