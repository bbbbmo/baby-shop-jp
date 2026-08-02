"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { useCart } from "@/store/cart";
import { CartIcon } from "@/shared/ui/icons";

export function CartButton() {
  const items = useCart((s) => s.items);
  const hydrated = useCartHydrated();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link href="/cart" aria-label="cart" className="relative text-foreground">
      <CartIcon className="h-6 w-6" />
      {hydrated && count > 0 && (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center bg-blush px-1 text-[11px] font-medium text-white">
          {count}
        </span>
      )}
    </Link>
  );
}

function useCartHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useCart.persist.onFinishHydration(onChange),
    () => useCart.persist.hasHydrated(),
    () => false,
  );
}
