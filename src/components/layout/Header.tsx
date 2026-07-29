"use client";

import Link from "next/link";
import { useState } from "react";
import { useLocale } from "@/i18n/LocaleProvider";
import { MenuIcon } from "@/components/ui/icons";
import { CartButton } from "./CartButton";
import { NavDrawer } from "./NavDrawer";

export function Header() {
  const { d } = useLocale();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur">
        <div className="relative mx-auto flex max-w-480 items-center justify-between px-6 py-3 sm:px-10">
          <span
            role="button"
            tabIndex={0}
            aria-label="menu"
            onClick={() => setDrawerOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setDrawerOpen(true);
              }
            }}
            className="inline-flex cursor-pointer items-center gap-2 text-foreground"
          >
            <MenuIcon className="h-6 w-6" />
            <span className="text-sm font-medium tracking-wide">MENU</span>
          </span>
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 text-2xl font-bold tracking-tight text-foreground md:text-3xl"
          >
            {d.brandName}
          </Link>
          <div className="flex items-center gap-2">
            <CartButton />
          </div>
        </div>
      </header>
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
