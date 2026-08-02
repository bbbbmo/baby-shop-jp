"use client";

import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string;
  productId: string;
  color: string;
  size: string;
  quantity: number;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "id" | "quantity">, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const lineId = (productId: string, color: string, size: string): string =>
  `${productId}__${color}__${size}`;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item, quantity = 1) => {
        set((state) => ({ items: addLine(state.items, item, quantity) }));
      },
      updateQuantity: (id, quantity) => {
        set((state) => ({ items: setQuantity(state.items, id, quantity) }));
      },
      remove: (id) => {
        set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
      },
      clear: () => set({ items: [] }),
    }),
    { name: "komo.cart" },
  ),
);

function addLine(
  items: CartItem[],
  item: Omit<CartItem, "id" | "quantity">,
  quantity: number,
): CartItem[] {
  const id = lineId(item.productId, item.color, item.size);
  const existing = items.find((i) => i.id === id);
  if (existing) {
    return items.map((i) =>
      i.id === id ? { ...i, quantity: i.quantity + quantity } : i,
    );
  }
  return [...items, { ...item, id, quantity }];
}

function setQuantity(
  items: CartItem[],
  id: string,
  quantity: number,
): CartItem[] {
  if (quantity <= 0) {
    return items.filter((i) => i.id !== id);
  }
  return items.map((i) => (i.id === id ? { ...i, quantity } : i));
}

export function useCartHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useCart.persist.onFinishHydration(onChange),
    () => useCart.persist.hasHydrated(),
    () => false,
  );
}
