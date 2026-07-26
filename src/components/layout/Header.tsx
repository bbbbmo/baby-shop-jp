"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/LocaleProvider";
import { SearchBar } from "./SearchBar";
import { CartButton } from "./CartButton";
import { LocaleToggle } from "./LocaleToggle";
import { CategoryNav } from "./CategoryNav";
import { MobileMenu } from "./MobileMenu";

export function Header() {
  const { d } = useLocale();

  return (
    <header className="sticky top-0 z-40 bg-background/90 backdrop-blur">
      <div className="bg-sage py-2 text-center text-xs text-white">
        {d.announcement}
      </div>
      <div className="relative mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <MobileMenu />
        <Link href="/" className="flex flex-col leading-none md:w-40">
          <span className="text-xl font-bold tracking-tight text-foreground">
            {d.brandName}
          </span>
          <span className="hidden text-[11px] text-muted md:block">
            {d.tagline}
          </span>
        </Link>
        <SearchBar className="hidden flex-1 md:block" />
        <div className="ml-auto flex items-center gap-2 md:w-40 md:justify-end">
          <LocaleToggle />
          <CartButton />
        </div>
      </div>
      <CategoryNav />
    </header>
  );
}
