import { describe, expect, it } from "vitest";
import { checkoutSchema, type CheckoutFormValues } from "./schema";

const validValues: CheckoutFormValues = {
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
  const result = checkoutSchema("jp").safeParse(values);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("checkoutSchema", () => {
  it("accepts valid input", () => {
    expect(checkoutSchema("jp").safeParse(validValues).success).toBe(true);
  });

  it("accepts valid input with empty optional fields", () => {
    expect(
      checkoutSchema("jp").safeParse({ ...validValues, building: undefined, memo: undefined })
        .success,
    ).toBe(true);
  });

  it("rejects an empty recipient name", () => {
    expect(issueMessage({ ...validValues, recipientName: "" }, "recipientName")).toBe("required");
  });

  it("rejects furigana written in hiragana", () => {
    expect(issueMessage({ ...validValues, recipientFurigana: "やまだ" }, "recipientFurigana")).toBe(
      "furiganaInvalid",
    );
  });

  it("rejects an invalid phone number", () => {
    expect(issueMessage({ ...validValues, phone: "abc" }, "phone")).toBe("invalidPhone");
  });

  it("rejects an invalid email", () => {
    expect(issueMessage({ ...validValues, email: "not-an-email" }, "email")).toBe("invalidEmail");
  });

  it("rejects a postal code without the right shape", () => {
    expect(issueMessage({ ...validValues, postalCode: "12345" }, "postalCode")).toBe(
      "invalidPostalCode",
    );
  });

  it("accepts a postal code without a hyphen", () => {
    expect(checkoutSchema("jp").safeParse({ ...validValues, postalCode: "1234567" }).success).toBe(
      true,
    );
  });

  it("rejects an empty address line", () => {
    expect(issueMessage({ ...validValues, addressLine: "" }, "addressLine")).toBe("required");
  });
});

describe("checkoutSchema — 한국 마켓", () => {
  const krValues = {
    ...validValues,
    recipientFurigana: "",
    postalCode: "06232",
    prefecture: "서울특별시",
    city: "강남구",
    addressLine: "테헤란로 152",
  };

  it("accepts an address with no furigana", () => {
    expect(checkoutSchema("kr").safeParse(krValues).success).toBe(true);
  });

  it("rejects a japanese postal code", () => {
    expect(checkoutSchema("kr").safeParse({ ...krValues, postalCode: "150-0001" }).success).toBe(
      false,
    );
  });

  it("accepts an empty city for a region with no district", () => {
    const sejong = { ...krValues, prefecture: "세종특별자치시", city: "", postalCode: "30151" };
    expect(checkoutSchema("kr").safeParse(sejong).success).toBe(true);
  });

  it("still requires the recipient name and street address", () => {
    expect(checkoutSchema("kr").safeParse({ ...krValues, recipientName: "" }).success).toBe(false);
    expect(checkoutSchema("kr").safeParse({ ...krValues, addressLine: "" }).success).toBe(false);
  });
});

describe("checkoutSchema — 일본 마켓", () => {
  it("still requires katakana furigana", () => {
    expect(
      checkoutSchema("jp").safeParse({ ...validValues, recipientFurigana: "" }).success,
    ).toBe(false);
    expect(
      checkoutSchema("jp").safeParse({ ...validValues, recipientFurigana: "やまだ" }).success,
    ).toBe(false);
  });

  it("rejects a five digit postal code", () => {
    expect(checkoutSchema("jp").safeParse({ ...validValues, postalCode: "06232" }).success).toBe(
      false,
    );
  });

  it("still requires the city", () => {
    expect(checkoutSchema("jp").safeParse({ ...validValues, city: "" }).success).toBe(false);
  });
});
