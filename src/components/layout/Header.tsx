"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/i18n/LocaleProvider";
import { MenuIcon } from "@/components/ui/icons";
import { SearchBar } from "./SearchBar";
import { CartButton } from "./CartButton";
import { LocaleToggle } from "./LocaleToggle";
import { NavDrawer } from "./NavDrawer";

export function Header() {
  const { d } = useLocale();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur">
        <div className="bg-sage py-2 text-center text-xs text-white">
          {d.announcement}
        </div>
        <div className="relative flex items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="menu"
              onClick={() => setDrawerOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-sand"
            >
              <MenuIcon />
            </button>
            <SearchBar className="hidden w-52 md:block lg:w-64" />
          </div>
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 text-xl font-bold tracking-tight text-foreground"
          >
            {d.brandName}
          </Link>
          <div className="flex items-center gap-2">
            <LocaleToggle />
            <CartButton />
          </div>
        </div>
      </header>
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
