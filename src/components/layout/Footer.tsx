"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/LocaleProvider";

export function Footer() {
  const { d } = useLocale();
  const links = [
    d.footer.about,
    d.footer.contact,
    d.footer.shipping,
    d.footer.returns,
    d.footer.law,
  ];

  return (
    <footer className="mt-20 border-t border-border bg-sand">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-lg font-bold text-foreground">{d.brandName}</p>
            <p className="mt-1 text-sm text-muted">{d.tagline}</p>
          </div>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            {links.map((label) => (
              <li key={label}>
                <Link href="#" className="hover:text-foreground">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-10 text-xs text-muted">
          © {new Date().getFullYear()} {d.brandName}. {d.footer.note}
        </p>
      </div>
    </footer>
  );
}
