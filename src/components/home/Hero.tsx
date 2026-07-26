"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/LocaleProvider";

export function Hero() {
  const { d } = useLocale();

  return (
    <section className="mx-auto max-w-6xl px-4 pt-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sage-soft via-background to-blush-soft px-6 py-16 md:px-16 md:py-24">
        <div className="max-w-lg">
          <p className="mb-3 text-sm font-medium tracking-wide text-sage">
            {d.brandName} · baby wear
          </p>
          <h1 className="whitespace-pre-line text-3xl font-bold leading-snug text-foreground md:text-5xl md:leading-tight">
            {d.home.heroTitle}
          </h1>
          <p className="mt-4 text-sm text-muted md:text-base">
            {d.home.heroSubtitle}
          </p>
          <Link
            href="/products"
            className="mt-8 inline-flex items-center rounded-full bg-foreground px-7 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            {d.home.heroCta}
          </Link>
        </div>
        <span className="pointer-events-none absolute -right-6 bottom-0 select-none text-[9rem] opacity-70 md:text-[13rem]">
          🧺
        </span>
      </div>
    </section>
  );
}
