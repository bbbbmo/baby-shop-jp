import { describe, expect, it } from "vitest";
import { getByCategory, bestProducts, newProducts, searchProducts } from "./filters";
import type { Product } from "./types";

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

describe("getByCategory", () => {
  it("returns only products in the given category", () => {
    const products = [
      product({ id: "a", category: "boy-setup" }),
      product({ id: "b", category: "girl-top" }),
    ];
    expect(getByCategory(products, "boy-setup").map((p) => p.id)).toEqual(["a"]);
  });
});

describe("bestProducts", () => {
  it("returns only isBest products", () => {
    const products = [
      product({ id: "a", isBest: true }),
      product({ id: "b", isBest: false }),
    ];
    expect(bestProducts(products).map((p) => p.id)).toEqual(["a"]);
  });
});

describe("newProducts", () => {
  it("returns only isNew products", () => {
    const products = [
      product({ id: "a", isNew: true }),
      product({ id: "b", isNew: false }),
    ];
    expect(newProducts(products).map((p) => p.id)).toEqual(["a"]);
  });
});

describe("searchProducts", () => {
  it("matches on Japanese name, Korean name, or brand", () => {
    const products = [
      product({ id: "a", name: { ja: "くもロンパース", ko: "구름 롬퍼" }, brand: "hinata" }),
      product({ id: "b", name: { ja: "くまTシャツ", ko: "곰 티셔츠" }, brand: "mori" }),
    ];
    expect(searchProducts(products, "くも").map((p) => p.id)).toEqual(["a"]);
    expect(searchProducts(products, "곰").map((p) => p.id)).toEqual(["b"]);
    expect(searchProducts(products, "mori").map((p) => p.id)).toEqual(["b"]);
  });

  it("returns an empty array for a blank query", () => {
    expect(searchProducts([product({ id: "a" })], "   ")).toEqual([]);
  });
});
