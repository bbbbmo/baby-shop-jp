import { describe, expect, it } from "vitest";
import { checkoutSchema, type CheckoutFormValues } from "./schema";

const valid: CheckoutFormValues = {
  recipientName: "山田太郎",
  recipientFurigana: "ヤマダタロウ",
  phone: "090-1234-5678",
  email: "yamada@example.com",
  postalCode: "123-4567",
  prefecture: "東京都",
  city: "渋谷区",
  addressLine: "1-2-3",
  building: "",
  memo: "",
};

function issueMessage(
  values: CheckoutFormValues,
  field: keyof CheckoutFormValues,
): string | undefined {
  const result = checkoutSchema.safeParse(values);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("checkoutSchema", () => {
  it("accepts valid input", () => {
    expect(checkoutSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts valid input with empty optional fields", () => {
    expect(checkoutSchema.safeParse({ ...valid, building: undefined, memo: undefined }).success).toBe(true);
  });

  it("rejects an empty recipient name", () => {
    expect(issueMessage({ ...valid, recipientName: "" }, "recipientName")).toBe("required");
  });

  it("rejects furigana written in hiragana", () => {
    expect(issueMessage({ ...valid, recipientFurigana: "やまだ" }, "recipientFurigana")).toBe(
      "furiganaInvalid",
    );
  });

  it("rejects an invalid phone number", () => {
    expect(issueMessage({ ...valid, phone: "abc" }, "phone")).toBe("invalidPhone");
  });

  it("rejects an invalid email", () => {
    expect(issueMessage({ ...valid, email: "not-an-email" }, "email")).toBe("invalidEmail");
  });

  it("rejects a postal code without the right shape", () => {
    expect(issueMessage({ ...valid, postalCode: "12345" }, "postalCode")).toBe(
      "invalidPostalCode",
    );
  });

  it("accepts a postal code without a hyphen", () => {
    expect(checkoutSchema.safeParse({ ...valid, postalCode: "1234567" }).success).toBe(true);
  });

  it("rejects an empty address line", () => {
    expect(issueMessage({ ...valid, addressLine: "" }, "addressLine")).toBe("required");
  });
});
