"use client";

import Link from "next/link";
import { useEffect } from "react";
import { categories } from "@/lib/categories";
import { useLocale } from "@/i18n/LocaleProvider";
import { CloseIcon } from "@/components/ui/icons";
import { SearchBar } from "./SearchBar";
import { LocaleToggle } from "./LocaleToggle";

type NavDrawerProps = { open: boolean; onClose: () => void };

export function NavDrawer({ open, onClose }: NavDrawerProps) {
  const { locale, d } = useLocale();

  useEscapeToClose(open, onClose);

  return (
    <>
      <div aria-hidden onClick={onClose} className={overlayClass(open)} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={d.nav.all}
        className={panelClass(open)}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-xl font-bold tracking-tight text-foreground">
            {d.brandName}
          </span>
          <button
            type="button"
            aria-label="close"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-foreground hover:bg-sand"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="px-4">
          <SearchBar />
        </div>
        <nav className="mt-4 flex-1 px-2">
          <ul className="space-y-1 text-sm" onClick={onClose}>
            <DrawerItem href="/products" label={d.nav.all} />
            {categories.map((c) => (
              <DrawerItem
                key={c.slug}
                href={`/products/${c.slug}`}
                label={`${c.emoji}  ${c.name[locale]}`}
              />
            ))}
          </ul>
        </nav>
        <div className="border-t border-border px-4 py-4">
          <LocaleToggle />
        </div>
      </aside>
    </>
  );
}

function useEscapeToClose(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
}

function overlayClass(open: boolean): string {
  const vis = open ? "opacity-100" : "pointer-events-none opacity-0";
  return `fixed inset-0 z-50 bg-black/40 transition-opacity ${vis}`;
}

function panelClass(open: boolean): string {
  const pos = open ? "translate-x-0" : "-translate-x-full";
  return `fixed inset-y-0 left-0 z-50 flex w-72 max-w-[80%] flex-col bg-surface shadow-xl transition-transform ${pos}`;
}

function DrawerItem({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link href={href} className="block rounded-lg px-3 py-2.5 hover:bg-sand">
        {label}
      </Link>
    </li>
  );
}
