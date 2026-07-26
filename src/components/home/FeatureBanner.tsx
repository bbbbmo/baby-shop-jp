"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/LocaleProvider";

export function FeatureBanner() {
  const { d } = useLocale();

  return (
    <section className="mx-auto max-w-480 px-6 pt-16 sm:px-10">
      <div className="flex flex-col items-center gap-4 overflow-hidden rounded-3xl bg-blush-soft px-6 py-12 text-center md:flex-row md:justify-between md:px-16 md:text-left">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {d.home.featureTitle}
          </h2>
          <p className="mt-2 text-sm text-muted">{d.home.featureText}</p>
        </div>
        <Link
          href="/products/gift"
          className="inline-flex items-center rounded-full bg-black px-7 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          {d.home.featureCta}
        </Link>
      </div>
    </section>
  );
}
