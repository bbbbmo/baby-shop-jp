import { describe, expect, it } from "vitest";
import { productFieldsSchema, variantInputSchema, variantsRequestSchema } from "./schema";

const validFields = {
  brandId: "11111111-1111-1111-1111-111111111111",
  category: "boy-setup",
  nameJa: "テスト商品",
  nameKo: "테스트 상품",
  price: 1000,
  listPrice: 1200,
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
    expect(productFieldsSchema.safeParse({ ...validFields, price: 0 }).success).toBe(false);
  });

  it("rejects an empty Japanese name", () => {
    expect(productFieldsSchema.safeParse({ ...validFields, nameJa: "" }).success).toBe(false);
  });

  it("defaults description fields to empty strings when omitted", () => {
    const result = productFieldsSchema.parse(validFields);
    expect(result.descriptionJa).toBe("");
    expect(result.descriptionKo).toBe("");
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
});
