import { describe, expect, it } from "vitest";
import { initialSignupFormValues, signupSchema, type SignupFormValues } from "./schema";

const valid: SignupFormValues = {
  email: "user@example.com",
  password: "password123",
  passwordConfirm: "password123",
  name: "山田太郎",
  agreeTerms: true,
  agreePrivacy: true,
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
    expect(issueMessage({ ...valid, email: "not-an-email" }, "email")).toBe("invalidEmail");
  });

  it("rejects a password shorter than 8 characters", () => {
    expect(
      issueMessage({ ...valid, password: "short1", passwordConfirm: "short1" }, "password"),
    ).toBe("passwordTooShort");
  });

  it("rejects a mismatched password confirmation", () => {
    expect(issueMessage({ ...valid, passwordConfirm: "different1" }, "passwordConfirm")).toBe(
      "passwordMismatch",
    );
  });

  it("rejects an empty name", () => {
    expect(issueMessage({ ...valid, name: "" }, "name")).toBe("required");
  });

  it("rejects a missing terms consent", () => {
    expect(issueMessage({ ...valid, agreeTerms: false }, "agreeTerms")).toBe(
      "agreeTermsRequired",
    );
  });

  it("rejects a missing privacy consent", () => {
    expect(issueMessage({ ...valid, agreePrivacy: false }, "agreePrivacy")).toBe(
      "agreePrivacyRequired",
    );
  });

  it("accepts the optional marketing consent", () => {
    expect(signupSchema.safeParse({ ...valid, agreeMarketing: true }).success).toBe(true);
  });

  it("no longer collects furigana or phone", () => {
    expect(Object.keys(initialSignupFormValues).sort()).toEqual([
      "agreeMarketing",
      "agreePrivacy",
      "agreeTerms",
      "email",
      "name",
      "password",
      "passwordConfirm",
    ]);
  });
});
