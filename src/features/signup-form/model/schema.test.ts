import { describe, expect, it } from "vitest";
import { initialSignupFormValues, signupSchema, type SignupFormValues } from "./schema";

const valid: SignupFormValues = {
  email: "user@example.com",
  password: "password123",
  passwordConfirm: "password123",
  name: "山田太郎",
  furigana: "ヤマダタロウ",
  phone: "090-1234-5678",
  agreeRequired: true,
  agreeMarketing: false,
};

function issueMessage(
  values: SignupFormValues,
  field: keyof SignupFormValues,
): string | undefined {
  const result = signupSchema.safeParse(values);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("signupSchema", () => {
  it("accepts valid input", () => {
    expect(signupSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an invalid email format", () => {
    expect(issueMessage({ ...valid, email: "not-an-email" }, "email")).toBe(
      "invalidEmail",
    );
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(
      issueMessage(
        { ...valid, password: "short1", passwordConfirm: "short1" },
        "password",
      ),
    ).toBe("passwordTooShort");
  });

  it("rejects mismatched password confirmation", () => {
    expect(
      issueMessage({ ...valid, passwordConfirm: "different123" }, "passwordConfirm"),
    ).toBe("passwordMismatch");
  });

  it("rejects an empty name", () => {
    expect(issueMessage({ ...valid, name: "" }, "name")).toBe("required");
  });

  it("rejects furigana written in hiragana instead of katakana", () => {
    expect(issueMessage({ ...valid, furigana: "やまだたろう" }, "furigana")).toBe(
      "furiganaInvalid",
    );
  });

  it("rejects furigana written in kanji", () => {
    expect(issueMessage({ ...valid, furigana: "山田太郎" }, "furigana")).toBe(
      "furiganaInvalid",
    );
  });

  it("accepts furigana with a space between family and given name", () => {
    expect(
      issueMessage({ ...valid, furigana: "ヤマダ タロウ" }, "furigana"),
    ).toBeUndefined();
  });

  it("rejects an empty phone number", () => {
    expect(issueMessage({ ...valid, phone: "" }, "phone")).toBe("required");
  });

  it("rejects a phone number with letters", () => {
    expect(issueMessage({ ...valid, phone: "090-abcd-5678" }, "phone")).toBe(
      "invalidPhone",
    );
  });

  it("rejects a phone number that is too short", () => {
    expect(issueMessage({ ...valid, phone: "090-123" }, "phone")).toBe("invalidPhone");
  });

  it("accepts a phone number without hyphens", () => {
    expect(issueMessage({ ...valid, phone: "09012345678" }, "phone")).toBeUndefined();
  });

  it("accepts a phone number with spaces instead of hyphens", () => {
    expect(
      issueMessage({ ...valid, phone: "090 1234 5678" }, "phone"),
    ).toBeUndefined();
  });

  it("rejects when the required agreement checkbox is unchecked", () => {
    expect(
      issueMessage({ ...valid, agreeRequired: false }, "agreeRequired"),
    ).toBe("agreeRequired");
  });

  it("initialSignupFormValues starts empty and unchecked", () => {
    expect(initialSignupFormValues.email).toBe("");
    expect(initialSignupFormValues.agreeRequired).toBe(false);
  });
});
