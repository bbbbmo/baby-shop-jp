import { describe, expect, it } from "vitest";
import { mapAdminProductListRow, mapAdminProductDetailRow } from "./admin.mappers";

describe("mapAdminProductListRow", () => {
  it("sums variant stock and picks the lowest sort_order image", () => {
    const row = {
      id: "p1",
      name_ja: "テスト商品",
      category: "boy-setup" as const,
      price_jpy: 1000,
      price_krw: 8000,
      sold_out: false,
      brands: { name_ja: "hinata" },
      product_variants: [{ stock: 3 }, { stock: 5 }],
      product_images: [
        { url: "https://x/2.jpg", sort_order: 2 },
        { url: "https://x/1.jpg", sort_order: 1 },
      ],
    };

    expect(mapAdminProductListRow(row)).toEqual({
      id: "p1",
      nameJa: "テスト商品",
      brandName: "hinata",
      category: "boy-setup",
      priceJpy: 1000,
      priceKrw: 8000,
      soldOut: false,
      totalStock: 8,
      thumbnailUrl: "https://x/1.jpg",
    });
  });

  it("returns null thumbnailUrl and 0 stock when there are none", () => {
    const row = {
      id: "p2",
      name_ja: "テスト商品2",
      category: "gift" as const,
      price_jpy: 500,
      price_krw: null,
      sold_out: true,
      brands: null,
      product_variants: [],
      product_images: [],
    };

    const result = mapAdminProductListRow(row);
    expect(result.thumbnailUrl).toBeNull();
    expect(result.totalStock).toBe(0);
    expect(result.brandName).toBe("");
  });
});

describe("mapAdminProductDetailRow", () => {
  it("maps a DB row to AdminProductDetail, defaulting null descriptions to empty strings", () => {
    const row = {
      id: "p1",
      brand_id: "b1",
      category: "girl-dress" as const,
      name_ja: "ワンピース",
      name_ko: "원피스",
      description_ja: null,
      description_ko: null,
      price_jpy: 3000,
      list_price_jpy: 4000,
      price_krw: 25000,
      list_price_krw: 30000,
      season: "ss" as const,
      is_new: true,
      is_best: false,
      sold_out: false,
    };

    expect(mapAdminProductDetailRow(row)).toEqual({
      id: "p1",
      brandId: "b1",
      category: "girl-dress",
      nameJa: "ワンピース",
      nameKo: "원피스",
      descriptionJa: "",
      descriptionKo: "",
      priceJpy: 3000,
      listPriceJpy: 4000,
      priceKrw: 25000,
      listPriceKrw: 30000,
      season: "ss",
      isNew: true,
      isBest: false,
      soldOut: false,
    });
  });
});
