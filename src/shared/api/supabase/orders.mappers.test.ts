import { describe, expect, it } from "vitest";
import { mapDbOrderToOrder } from "./orders.mappers";

describe("mapDbOrderToOrder", () => {
  const baseRow = {
    id: "11111111-1111-1111-1111-111111111111",
    order_number: "CM260809-AB12",
    status: "pending_payment",
    market: "jp",
    recipient_name: "山田太郎",
    recipient_furigana: "ヤマダタロウ",
    phone: "090-1234-5678",
    email: "yamada@example.com",
    postal_code: "123-4567",
    prefecture: "東京都",
    city: "渋谷区",
    address_line: "1-2-3",
    building: null,
    memo: null,
    total_price: 3530,
    created_at: "2026-08-09T00:00:00.000Z",
    order_items: [
      {
        id: "22222222-2222-2222-2222-222222222222",
        product_variant_id: "33333333-3333-3333-3333-333333333333",
        product_name_ja: "くも柄 長袖ロンパース",
        product_name_ko: null,
        color: "#e9dfd2",
        size: "70",
        unit_price: 2980,
        quantity: 1,
      },
    ],
  };

  it("maps a DB row (with nested order_items) to the Order shape", () => {
    expect(mapDbOrderToOrder(baseRow)).toEqual({
      id: "11111111-1111-1111-1111-111111111111",
      orderNumber: "CM260809-AB12",
      status: "pending_payment",
      market: "jp",
      recipientName: "山田太郎",
      recipientFurigana: "ヤマダタロウ",
      phone: "090-1234-5678",
      email: "yamada@example.com",
      postalCode: "123-4567",
      prefecture: "東京都",
      city: "渋谷区",
      addressLine: "1-2-3",
      building: null,
      memo: null,
      totalPrice: 3530,
      createdAt: "2026-08-09T00:00:00.000Z",
      items: [
        {
          id: "22222222-2222-2222-2222-222222222222",
          productVariantId: "33333333-3333-3333-3333-333333333333",
          productNameJa: "くも柄 長袖ロンパース",
          productNameKo: null,
          color: "#e9dfd2",
          size: "70",
          unitPrice: 2980,
          quantity: 1,
        },
      ],
    });
  });

  it("carries the order's market through", () => {
    expect(mapDbOrderToOrder({ ...baseRow, market: "kr" }).market).toBe("kr");
  });

  it("keeps a missing korean product name as null", () => {
    expect(mapDbOrderToOrder(baseRow).items[0].productNameKo).toBeNull();
  });

  it("defaults an unknown market to the japanese market", () => {
    expect(mapDbOrderToOrder({ ...baseRow, market: "xx" }).market).toBe("jp");
  });

  it("returns an empty items array when order_items is empty", () => {
    const row = {
      id: "id",
      order_number: "CM000000-0000",
      status: "pending_payment",
      market: "jp",
      recipient_name: "a",
      recipient_furigana: "ア",
      phone: "090-0000-0000",
      email: "a@example.com",
      postal_code: "000-0000",
      prefecture: "a",
      city: "a",
      address_line: "a",
      building: null,
      memo: null,
      total_price: 0,
      created_at: "2026-08-09T00:00:00.000Z",
      order_items: [],
    };
    expect(mapDbOrderToOrder(row).items).toEqual([]);
  });
});
