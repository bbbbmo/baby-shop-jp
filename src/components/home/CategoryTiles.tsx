"use client";

import Link from "next/link";
import { categories } from "@/lib/categories";
import { useLocale } from "@/i18n/LocaleProvider";
import { SectionHeader } from "@/components/ui/SectionHeader";

export function CategoryTiles() {
  const { locale, d } = useLocale();

  return (
    <section className="mx-auto max-w-6xl px-4 pt-16">
      <SectionHeader title={d.home.categoryTitle} />
      <ul className="grid grid-cols-4 gap-3 md:grid-cols-7">
        {categories.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/products/${c.slug}`}
              className="flex flex-col items-center gap-2 rounded-2xl bg-surface py-5 ring-1 ring-border transition-colors hover:bg-sand"
            >
              <span className="text-2xl">{c.emoji}</span>
              <span className="text-center text-xs text-foreground">
                {c.name[locale]}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
