import { describe, expect, it } from "vitest";
import { mapDbProductToProduct, mapDbFriendLookToFriendLook, mapVariantRow } from "./catalog.mappers";

describe("mapDbProductToProduct", () => {
  it("maps a DB row to the Product shape, deduping variant colors/sizes", () => {
    const row = {
      id: "11111111-1111-1111-1111-111111111111",
      category: "boy-setup" as const,
      name_ja: "くも柄 長袖ロンパース",
      name_ko: "구름무늬 긴팔 롬퍼",
      description_ja: "やわらかな綿100%。",
      description_ko: "부드러운 면 100%.",
      price_jpy: 2980,
      list_price_jpy: 3800,
      price_krw: 27500,
      list_price_krw: 35000,
      season: "aw" as const,
      is_new: true,
      is_best: true,
      sold_out: false,
      rating: 4.8,
      review_count: 132,
      brands: { name_ja: "hinata" },
      product_variants: [
        { colors: { hex: "#e9dfd2" }, sizes: { value: "70" } },
        { colors: { hex: "#e9dfd2" }, sizes: { value: "80" } },
        { colors: { hex: "#dfe5d9" }, sizes: { value: "70" } },
      ],
      product_images: [
        { url: "https://x/2.jpg", sort_order: 2 },
        { url: "https://x/1.jpg", sort_order: 1 },
      ],
    };

    expect(mapDbProductToProduct(row, "jp")).toEqual({
      id: "11111111-1111-1111-1111-111111111111",
      name: { ja: "くも柄 長袖ロンパース", ko: "구름무늬 긴팔 롬퍼" },
      brand: "hinata",
      category: "boy-setup",
      price: 2980,
      listPrice: 3800,
      colors: ["#dfe5d9", "#e9dfd2"],
      sizes: ["70", "80"],
      season: "aw",
      isNew: true,
      isBest: true,
      soldOut: false,
      rating: 4.8,
      reviewCount: 132,
      description: { ja: "やわらかな綿100%。", ko: "부드러운 면 100%." },
      images: ["https://x/1.jpg", "https://x/2.jpg"],
    });
  });

  it("falls back to empty strings when description is null, and to an empty images array when there are none", () => {
    const row = {
      id: "22222222-2222-2222-2222-222222222222",
      category: "gift" as const,
      name_ja: "季節の福袋",
      name_ko: "시즌 럭키백",
      description_ja: null,
      description_ko: null,
      price_jpy: 5000,
      list_price_jpy: 9800,
      price_krw: 46000,
      list_price_krw: 89000,
      season: "all" as const,
      is_new: true,
      is_best: false,
      sold_out: false,
      rating: 4.7,
      review_count: 128,
      brands: { name_ja: "hinata" },
      product_variants: [{ colors: { hex: "#e9dfd2" }, sizes: { value: "70" } }],
      product_images: [],
    };

    const result = mapDbProductToProduct(row, "jp");
    expect(result.description).toEqual({ ja: "", ko: "" });
    expect(result.images).toEqual([]);
  });

  it("returns colors/sizes in a stable order regardless of variant row order", () => {
    const baseRow = {
      id: "55555555-5555-5555-5555-555555555555",
      category: "girl-setup" as const,
      name_ja: "テスト",
      name_ko: "테스트",
      description_ja: null,
      description_ko: null,
      price_jpy: 1000,
      list_price_jpy: 1000,
      price_krw: 9000,
      list_price_krw: 9000,
      season: "all" as const,
      is_new: false,
      is_best: false,
      sold_out: false,
      rating: 4.5,
      review_count: 1,
      brands: { name_ja: "hinata" },
      product_images: [],
    };

    const scrambled = mapDbProductToProduct(
      {
        ...baseRow,
        product_variants: [
          { colors: { hex: "#f4e2df" }, sizes: { value: "90" } },
          { colors: { hex: "#dfe5d9" }, sizes: { value: "50-60" } },
          { colors: { hex: "#e9dfd2" }, sizes: { value: "80" } },
          { colors: { hex: "#dfe5d9" }, sizes: { value: "70" } },
          { colors: { hex: "#f4e2df" }, sizes: { value: "95" } },
        ],
      },
      "jp",
    );

    expect(scrambled.colors).toEqual(["#dfe5d9", "#e9dfd2", "#f4e2df"]);
    expect(scrambled.sizes).toEqual(["50-60", "70", "80", "90", "95"]);
  });

  it("filters out a variant with a missing color/size join (mid-save null) instead of exposing a blank option", () => {
    const row = {
      id: "66666666-6666-6666-6666-666666666666",
      category: "girl-setup" as const,
      name_ja: "テスト",
      name_ko: "테스트",
      description_ja: null,
      description_ko: null,
      price_jpy: 1000,
      list_price_jpy: 1000,
      price_krw: 9000,
      list_price_krw: 9000,
      season: "all" as const,
      is_new: false,
      is_best: false,
      sold_out: false,
      rating: 4.5,
      review_count: 1,
      brands: { name_ja: "hinata" },
      product_variants: [
        { colors: { hex: "#e9dfd2" }, sizes: { value: "70" } },
        { colors: null, sizes: null },
      ],
      product_images: [],
    };

    const result = mapDbProductToProduct(row, "jp");
    expect(result.colors).toEqual(["#e9dfd2"]);
    expect(result.sizes).toEqual(["70"]);
  });

  const marketBaseRow = {
    id: "77777777-7777-7777-7777-777777777777",
    category: "boy-setup" as const,
    name_ja: "テスト",
    name_ko: "테스트",
    description_ja: null,
    description_ko: null,
    price_jpy: 12000,
    list_price_jpy: 15000,
    price_krw: 35000,
    list_price_krw: 42000,
    season: "all" as const,
    is_new: false,
    is_best: false,
    sold_out: false,
    rating: 4.5,
    review_count: 1,
    brands: { name_ja: "hinata" },
    product_variants: [{ colors: { hex: "#e9dfd2" }, sizes: { value: "70" } }],
    product_images: [],
  };

  it("takes the japanese price for the japanese market", () => {
    const product = mapDbProductToProduct(marketBaseRow, "jp");
    expect(product.price).toBe(12000);
    expect(product.listPrice).toBe(15000);
  });

  it("takes the korean price for the korean market", () => {
    const product = mapDbProductToProduct(marketBaseRow, "kr");
    expect(product.price).toBe(35000);
    expect(product.listPrice).toBe(42000);
  });

  it("falls back to zero when the market has no price", () => {
    const noKrw = { ...marketBaseRow, price_krw: null, list_price_krw: null };
    const product = mapDbProductToProduct(noKrw, "kr");
    expect(product.price).toBe(0);
    expect(product.listPrice).toBe(0);
  });
});

describe("mapVariantRow", () => {
  it("maps a joined variant row to the flat ProductVariantRow shape", () => {
    const row = { id: "v1", stock: 5, colors: { hex: "#e9dfd2" }, sizes: { value: "70" } };
    expect(mapVariantRow(row)).toEqual({ id: "v1", color: "#e9dfd2", size: "70", stock: 5 });
  });

  it("falls back to empty strings when the color or size join is missing", () => {
    const row = { id: "v2", stock: 3, colors: null, sizes: null };
    expect(mapVariantRow(row)).toEqual({ id: "v2", color: "", size: "", stock: 3 });
  });
});

describe("mapDbFriendLookToFriendLook", () => {
  it("maps a DB row to the FriendLook shape", () => {
    const row = {
      id: "33333333-3333-3333-3333-333333333333",
      handle: "@hana_mam",
      image_src: "/friends/look-01.svg",
      model_info_ja: "24ヶ月 / 88cm",
      model_info_ko: "24개월 / 88cm",
      friend_look_products: [
        { product_id: "11111111-1111-1111-1111-111111111111" },
        { product_id: "44444444-4444-4444-4444-444444444444" },
      ],
    };

    expect(mapDbFriendLookToFriendLook(row)).toEqual({
      id: "33333333-3333-3333-3333-333333333333",
      handle: "@hana_mam",
      imageSrc: "/friends/look-01.svg",
      modelInfo: { ja: "24ヶ月 / 88cm", ko: "24개월 / 88cm" },
      productIds: [
        "11111111-1111-1111-1111-111111111111",
        "44444444-4444-4444-4444-444444444444",
      ],
    });
  });
});
