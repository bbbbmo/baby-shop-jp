"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { categories } from "@/lib/categories";
import { useLocale } from "@/i18n/LocaleProvider";

export function CategoryNav() {
  const { locale, d } = useLocale();
  const pathname = usePathname();

  return (
    <nav className="hidden border-t border-border md:block">
      <ul className="mx-auto flex max-w-6xl items-center justify-center gap-7 px-4 py-3 text-sm">
        <li>
          <NavItem href="/products" label={d.nav.all} active={pathname === "/products"} />
        </li>
        {categories.map((c) => (
          <li key={c.slug}>
            <NavItem
              href={`/products/${c.slug}`}
              label={c.name[locale]}
              active={pathname === `/products/${c.slug}`}
            />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function NavItem({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  const cls = active ? "text-sage font-medium" : "text-foreground";
  return (
    <Link href={href} className={`transition-colors hover:text-sage ${cls}`}>
      {label}
    </Link>
  );
}
