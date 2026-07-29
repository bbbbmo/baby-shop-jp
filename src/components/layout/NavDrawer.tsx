"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { menu, type MenuGroup } from "@/lib/categories";
import { useLocale } from "@/i18n/LocaleProvider";
import { CloseIcon, ChevronDownIcon } from "@/components/ui/icons";
import { SearchBar } from "./SearchBar";
import { LocaleToggle } from "./LocaleToggle";

type NavDrawerProps = { open: boolean; onClose: () => void };

export function NavDrawer({ open, onClose }: NavDrawerProps) {
  const { d } = useLocale();
  const [expandedGroup, setExpandedGroup] = useState<"girl" | "boy" | null>(
    null,
  );

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
            className="flex h-9 w-9 items-center justify-center text-foreground hover:bg-sand"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="px-4">
          <SearchBar />
        </div>
        <nav className="mt-4 flex-1 px-2">
          <ul className="space-y-1 text-sm">
            {menu.map((entry) =>
              entry.kind === "link" ? (
                <DrawerItem
                  key={entry.href}
                  href={entry.href}
                  label={entry.starred ? `★ ${entry.label}` : entry.label}
                  onNavigate={onClose}
                />
              ) : (
                <MenuGroupItem
                  key={entry.key}
                  entry={entry}
                  expanded={expandedGroup === entry.key}
                  onToggle={() =>
                    setExpandedGroup((cur) =>
                      cur === entry.key ? null : entry.key,
                    )
                  }
                  onNavigate={onClose}
                />
              ),
            )}
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

function DrawerItem({
  href,
  label,
  onNavigate,
}: {
  href: string;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        className="block px-3 py-2.5 hover:bg-sand"
      >
        {label}
      </Link>
    </li>
  );
}

function MenuGroupItem({
  entry,
  expanded,
  onToggle,
  onNavigate,
}: {
  entry: MenuGroup;
  expanded: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-sand"
      >
        {entry.label}
        <ChevronDownIcon
          className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && (
        <ul className="space-y-1 pb-1 pl-6">
          {entry.children.map((child) => (
            <li key={child.slug}>
              <Link
                href={`/products/${child.slug}`}
                onClick={onNavigate}
                className="block px-3 py-2 text-muted hover:bg-sand hover:text-foreground"
              >
                {child.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
