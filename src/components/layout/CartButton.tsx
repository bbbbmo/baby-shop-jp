"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/store/cart";
import { CartIcon } from "@/components/ui/icons";

export function CartButton() {
  const items = useCart((s) => s.items);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link
      href="/cart"
      aria-label="cart"
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-sand"
    >
      <CartIcon />
      {mounted && count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-blush px-1 text-[11px] font-medium text-white">
          {count}
        </span>
      )}
    </Link>
  );
}
