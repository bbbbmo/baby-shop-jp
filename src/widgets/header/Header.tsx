"use client";

import Link from "next/link";
import { MarketLink } from "@/shared/market";
import { useEffect, useRef, useState } from "react";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { useSession } from "@/entities/auth";
import { isAdminEmail } from "@/shared/lib/adminAuth";
import { MenuIcon, ProfileIcon, ShieldIcon } from "@/shared/ui/icons";
import { CartButton } from "./CartButton";
import { NavDrawer } from "./NavDrawer";

export function Header() {
  const { d } = useLocale();
  const { user } = useSession();
  const isAdmin = isAdminEmail(user?.email);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = headerRef.current;
    if (!el) {
      return;
    }
    const setHeaderHeightVar = () => {
      document.documentElement.style.setProperty(
        "--header-h",
        `${el.offsetHeight}px`,
      );
    };
    setHeaderHeightVar();
    const observer = new ResizeObserver(setHeaderHeightVar);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <header
        ref={headerRef}
        className="sticky top-0 z-40 bg-background/90 backdrop-blur"
      >
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
          <MarketLink
            href="/"
            style={{ fontFamily: "var(--font-noto-jp)" }}
            className="absolute left-1/2 -translate-x-1/2 text-2xl font-bold tracking-tight text-foreground md:text-3xl"
          >
            {d.brandName}
          </MarketLink>
          <div className="flex items-center gap-5">
            {isAdmin && (
              <Link
                href="/admin"
                aria-label={d.admin.title}
                className="p-2 -m-2 text-foreground"
              >
                <ShieldIcon className="h-6 w-6" />
              </Link>
            )}
            <CartButton />
            <MarketLink
              href={user ? "/mypage" : "/signin"}
              aria-label={user ? d.mypage.title : d.signin.title}
              className="p-2 -m-2 text-foreground"
            >
              <ProfileIcon className="h-6 w-6" />
            </MarketLink>
          </div>
        </div>
      </header>
      <NavDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
