import { describe, expect, it } from "vitest";
import { orderLookupSchema, type OrderLookupFormValues } from "./schema";

const valid: OrderLookupFormValues = {
  orderNumber: "CM260809-AB12",
  email: "yamada@example.com",
};

describe("orderLookupSchema", () => {
  it("accepts valid input", () => {
    expect(orderLookupSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an empty order number", () => {
    const result = orderLookupSchema.safeParse({ ...valid, orderNumber: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = orderLookupSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
  });
});
