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
  selectedIds: string[];
  checkoutIds: string[];
  add: (item: Omit<CartItem, "id" | "quantity">, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  toggleSelected: (id: string) => void;
  setItemsSelected: (ids: string[], selected: boolean) => void;
  prepareCheckout: (ids: string[]) => void;
  clearCheckout: () => void;
  clear: () => void;
};

const lineId = (productId: string, color: string, size: string): string =>
  `${productId}__${color}__${size}`;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      selectedIds: [],
      checkoutIds: [],
      add: (item, quantity = 1) => {
        set((state) => addItem(state, item, quantity));
      },
      updateQuantity: (id, quantity) => {
        set((state) => updateCartQuantity(state, id, quantity));
      },
      remove: (id) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
          selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
          checkoutIds: state.checkoutIds.filter((checkoutId) => checkoutId !== id),
        }));
      },
      toggleSelected: (id) => set((state) => ({ selectedIds: toggleId(state.selectedIds, id) })),
      setItemsSelected: (ids, selected) => set((state) => ({
        selectedIds: updateSelection(state.selectedIds, ids, selected),
      })),
      prepareCheckout: (ids) => set({ checkoutIds: ids }),
      clearCheckout: () => set((state) => ({
        items: state.items.filter((item) => !state.checkoutIds.includes(item.id)),
        selectedIds: state.selectedIds.filter((id) => !state.checkoutIds.includes(id)),
        checkoutIds: [],
      })),
      clear: () => set({ items: [], selectedIds: [], checkoutIds: [] }),
    }),
    { name: "komo.cart", version: 2, migrate: migrateCart },
  ),
);

function addItem(
  state: Pick<CartState, "items" | "selectedIds">,
  item: Omit<CartItem, "id" | "quantity">,
  quantity: number,
) {
  const items = addLine(state.items, item, quantity);
  const id = lineId(item.productId, item.color, item.size);
  return { items, selectedIds: state.selectedIds.includes(id) ? state.selectedIds : [...state.selectedIds, id] };
}

function updateCartQuantity(state: CartState, id: string, quantity: number) {
  if (quantity > 0) return { items: setQuantity(state.items, id, quantity) };
  return {
    items: setQuantity(state.items, id, quantity),
    selectedIds: state.selectedIds.filter((selectedId) => selectedId !== id),
    checkoutIds: state.checkoutIds.filter((checkoutId) => checkoutId !== id),
  };
}

function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
}

function updateSelection(current: string[], ids: string[], selected: boolean): string[] {
  const targets = new Set(ids);
  if (!selected) return current.filter((id) => !targets.has(id));
  return [...new Set([...current, ...ids])];
}

function migrateCart(persisted: unknown): Pick<CartState, "items" | "selectedIds" | "checkoutIds"> {
  const state = persisted as { items?: CartItem[]; selectedIds?: string[] } | null;
  const items = Array.isArray(state?.items) ? state.items : [];
  const validIds = new Set(items.map((item) => item.id));
  const selected = Array.isArray(state?.selectedIds) ? state.selectedIds : items.map((item) => item.id);
  return { items, selectedIds: selected.filter((id) => validIds.has(id)), checkoutIds: [] };
}

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
