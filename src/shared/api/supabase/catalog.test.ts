import { describe, expect, it } from "vitest";
import { mapDbProductToProduct, mapDbFriendLookToFriendLook } from "./catalog";

describe("mapDbProductToProduct", () => {
  it("maps a DB row to the Product shape, deduping variant colors/sizes", () => {
    const row = {
      id: "11111111-1111-1111-1111-111111111111",
      category: "boy-setup" as const,
      name_ja: "くも柄 長袖ロンパース",
      name_ko: "구름무늬 긴팔 롬퍼",
      description_ja: "やわらかな綿100%。",
      description_ko: "부드러운 면 100%.",
      price: 2980,
      list_price: 3800,
      season: "aw" as const,
      is_new: true,
      is_best: true,
      sold_out: false,
      rating: 4.8,
      review_count: 132,
      brands: { name_ja: "hinata" },
      product_variants: [
        { color: "#e9dfd2", size: "70" },
        { color: "#e9dfd2", size: "80" },
        { color: "#dfe5d9", size: "70" },
      ],
    };

    expect(mapDbProductToProduct(row)).toEqual({
      id: "11111111-1111-1111-1111-111111111111",
      name: { ja: "くも柄 長袖ロンパース", ko: "구름무늬 긴팔 롬퍼" },
      brand: "hinata",
      category: "boy-setup",
      price: 2980,
      listPrice: 3800,
      colors: ["#e9dfd2", "#dfe5d9"],
      sizes: ["70", "80"],
      season: "aw",
      isNew: true,
      isBest: true,
      soldOut: false,
      rating: 4.8,
      reviewCount: 132,
      description: { ja: "やわらかな綿100%。", ko: "부드러운 면 100%." },
    });
  });

  it("falls back to empty strings when description is null", () => {
    const row = {
      id: "22222222-2222-2222-2222-222222222222",
      category: "gift" as const,
      name_ja: "季節の福袋",
      name_ko: "시즌 럭키백",
      description_ja: null,
      description_ko: null,
      price: 5000,
      list_price: 9800,
      season: "all" as const,
      is_new: true,
      is_best: false,
      sold_out: false,
      rating: 4.7,
      review_count: 128,
      brands: { name_ja: "hinata" },
      product_variants: [{ color: "#e9dfd2", size: "70" }],
    };

    expect(mapDbProductToProduct(row).description).toEqual({ ja: "", ko: "" });
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
