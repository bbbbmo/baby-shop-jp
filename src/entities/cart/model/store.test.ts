import { beforeEach, describe, expect, it } from "vitest";
import { useCart } from "./store";

const FIRST = { productId: "product-1", color: "#fff", size: "70" };
const SECOND = { productId: "product-2", color: "#000", size: "80" };

beforeEach(() => {
  useCart.getState().clear();
});

describe("cart selection", () => {
  it("selects a newly added item", () => {
    useCart.getState().add(FIRST);
    expect(useCart.getState().selectedIds).toEqual([useCart.getState().items[0].id]);
  });

  it("removes only the items prepared for a completed checkout", () => {
    useCart.getState().add(FIRST);
    useCart.getState().add(SECOND);
    const [firstId, secondId] = useCart.getState().items.map((item) => item.id);
    useCart.getState().setItemsSelected([secondId], false);
    useCart.getState().prepareCheckout([firstId]);

    useCart.getState().clearCheckout();

    expect(useCart.getState().items.map((item) => item.id)).toEqual([secondId]);
    expect(useCart.getState().checkoutIds).toEqual([]);
  });

  it("removes selection state when quantity reaches zero", () => {
    useCart.getState().add(FIRST);
    const id = useCart.getState().items[0].id;
    useCart.getState().prepareCheckout([id]);

    useCart.getState().updateQuantity(id, 0);

    expect(useCart.getState().items).toEqual([]);
    expect(useCart.getState().selectedIds).toEqual([]);
    expect(useCart.getState().checkoutIds).toEqual([]);
  });
});
