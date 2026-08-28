import { describe, expect, it } from "vitest";
import {
  productFieldsSchema,
  productFormSchema,
  variantInputSchema,
  variantsRequestSchema,
} from "./schema";

const validFields = {
  brandId: "11111111-1111-1111-1111-111111111111",
  category: "boy-setup",
  nameJa: "テスト商品",
  nameKo: "테스트 상품",
  priceJpy: 1000,
  listPriceJpy: 1200,
  priceKrw: 0,
  listPriceKrw: 0,
  season: "all",
  isNew: false,
  isBest: false,
  soldOut: false,
};

describe("productFieldsSchema", () => {
  it("accepts valid input", () => {
    expect(productFieldsSchema.safeParse(validFields).success).toBe(true);
  });

  it("rejects an unknown category slug", () => {
    expect(
      productFieldsSchema.safeParse({ ...validFields, category: "not-a-category" }).success,
    ).toBe(false);
  });

  it("rejects a zero price", () => {
    expect(productFieldsSchema.safeParse({ ...validFields, priceJpy: 0 }).success).toBe(false);
  });

  it("rejects an empty Japanese name", () => {
    expect(productFieldsSchema.safeParse({ ...validFields, nameJa: "" }).success).toBe(false);
  });

  it("defaults description fields to empty strings when omitted", () => {
    const result = productFieldsSchema.parse(validFields);
    expect(result.descriptionJa).toBe("");
    expect(result.descriptionKo).toBe("");
  });

  it("accepts a product with only japanese prices", () => {
    const values = { ...validFields, priceKrw: 0, listPriceKrw: 0 };
    expect(productFieldsSchema.safeParse(values).success).toBe(true);
  });

  it("accepts a product with both markets priced", () => {
    const values = { ...validFields, priceKrw: 35000, listPriceKrw: 42000 };
    expect(productFieldsSchema.safeParse(values).success).toBe(true);
  });

  it("rejects a korean sale price without a list price", () => {
    const values = { ...validFields, priceKrw: 35000, listPriceKrw: 0 };
    expect(productFieldsSchema.safeParse(values).success).toBe(false);
  });

  it("rejects a korean list price without a sale price", () => {
    const values = { ...validFields, priceKrw: 0, listPriceKrw: 42000 };
    expect(productFieldsSchema.safeParse(values).success).toBe(false);
  });
});

describe("variantInputSchema", () => {
  it("accepts a new variant without an id", () => {
    expect(variantInputSchema.safeParse({ color: "#fff", size: "70", stock: 0 }).success).toBe(true);
  });

  it("accepts an existing variant with an id", () => {
    expect(
      variantInputSchema.safeParse({ id: "v1", color: "#fff", size: "70", stock: 4 }).success,
    ).toBe(true);
  });

  it("rejects a negative stock value", () => {
    expect(variantInputSchema.safeParse({ color: "#fff", size: "70", stock: -1 }).success).toBe(
      false,
    );
  });

  it("rejects a non-integer stock value", () => {
    expect(variantInputSchema.safeParse({ color: "#fff", size: "70", stock: 1.5 }).success).toBe(
      false,
    );
  });

  it("rejects an empty color", () => {
    expect(variantInputSchema.safeParse({ color: "", size: "70", stock: 0 }).success).toBe(false);
  });
});

describe("variantsRequestSchema", () => {
  it("rejects an empty variants array", () => {
    expect(variantsRequestSchema.safeParse({ variants: [] }).success).toBe(false);
  });

  it("accepts a non-empty variants array", () => {
    expect(
      variantsRequestSchema.safeParse({ variants: [{ color: "#fff", size: "70", stock: 0 }] })
        .success,
    ).toBe(true);
  });

  it("rejects two variants sharing the same color and size", () => {
    expect(
      variantsRequestSchema.safeParse({
        variants: [
          { color: "#fff", size: "70", stock: 1 },
          { color: "#fff", size: "70", stock: 2 },
        ],
      }).success,
    ).toBe(false);
  });

  it("accepts variants that differ only by color or only by size", () => {
    expect(
      variantsRequestSchema.safeParse({
        variants: [
          { color: "#fff", size: "70", stock: 1 },
          { color: "#fff", size: "80", stock: 1 },
          { color: "#000", size: "70", stock: 1 },
        ],
      }).success,
    ).toBe(true);
  });
});

describe("productFormSchema", () => {
  it("rejects duplicate (color, size) on the client side too", () => {
    const result = productFormSchema.safeParse({
      ...validFields,
      variants: [
        { id: "v1", color: "white", size: "70", stock: 5 },
        { id: "v2", color: "white", size: "70", stock: 3 },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("does not confuse a color/size pair split differently", () => {
    const result = productFormSchema.safeParse({
      ...validFields,
      variants: [
        { color: "a b", size: "c", stock: 1 },
        { color: "a", size: "b c", stock: 1 },
      ],
    });
    expect(result.success).toBe(true);
  });
});
