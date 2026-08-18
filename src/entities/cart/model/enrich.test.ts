import { describe, expect, it } from "vitest";
import { enrichCartLines } from "./enrich";
import type { CartItem } from "./store";
import type { Product } from "@/entities/product";

const product = (overrides: Partial<Product>): Product => ({
  id: "p1",
  name: { ja: "商品", ko: "상품" },
  brand: "hinata",
  category: "boy-setup",
  price: 1000,
  listPrice: 1000,
  colors: ["#fff"],
  sizes: ["70"],
  season: "all",
  isNew: false,
  isBest: false,
  soldOut: false,
  rating: 4.5,
  reviewCount: 10,
  description: { ja: "説明", ko: "설명" },
  images: [],
  ...overrides,
});

const item = (overrides: Partial<CartItem>): CartItem => ({
  id: "line1",
  productId: "p1",
  color: "#fff",
  size: "70",
  quantity: 1,
  ...overrides,
});

describe("enrichCartLines", () => {
  it("attaches matching product data to each cart item", () => {
    const result = enrichCartLines([item({})], [product({ id: "p1" })]);
    expect(result).toHaveLength(1);
    expect(result[0].product.id).toBe("p1");
  });

  it("drops lines whose product no longer exists", () => {
    const result = enrichCartLines(
      [item({ productId: "missing" })],
      [product({ id: "p1" })],
    );
    expect(result).toEqual([]);
  });
});
