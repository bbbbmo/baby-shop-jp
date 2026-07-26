"use client";

import Link from "next/link";
import { useState } from "react";
import { categories } from "@/lib/categories";
import { useLocale } from "@/i18n/LocaleProvider";
import { MenuIcon } from "@/components/ui/icons";
import { SearchBar } from "./SearchBar";

export function MobileMenu() {
  const { locale, d } = useLocale();
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label="menu"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-sand"
      >
        <MenuIcon />
      </button>
      {open && (
        <div className="absolute inset-x-0 top-full z-40 border-t border-border bg-surface p-4 shadow-sm">
          <SearchBar className="mb-4" />
          <ul className="space-y-1 text-sm" onClick={() => setOpen(false)}>
            <MobileItem href="/products" label={d.nav.all} />
            {categories.map((c) => (
              <MobileItem
                key={c.slug}
                href={`/products/${c.slug}`}
                label={`${c.emoji}  ${c.name[locale]}`}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function MobileItem({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link
        href={href}
        className="block rounded-lg px-3 py-2.5 hover:bg-sand"
      >
        {label}
      </Link>
    </li>
  );
}
