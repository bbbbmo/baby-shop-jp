import { describe, expect, it } from "vitest";
import {
  initialSignupFormValues,
  validateSignupForm,
  type SignupFormValues,
} from "./schema";

const valid: SignupFormValues = {
  email: "user@example.com",
  password: "password123",
  passwordConfirm: "password123",
  name: "山田太郎",
  furigana: "ヤマダタロウ",
  agreeRequired: true,
  agreeMarketing: false,
};

describe("validateSignupForm", () => {
  it("returns no errors for valid input", () => {
    expect(validateSignupForm(valid)).toEqual({});
  });

  it("rejects an invalid email format", () => {
    const errors = validateSignupForm({ ...valid, email: "not-an-email" });
    expect(errors.email).toBe("invalidEmail");
  });

  it("rejects a password shorter than 8 characters", () => {
    const errors = validateSignupForm({
      ...valid,
      password: "short1",
      passwordConfirm: "short1",
    });
    expect(errors.password).toBe("passwordTooShort");
  });

  it("rejects mismatched password confirmation", () => {
    const errors = validateSignupForm({ ...valid, passwordConfirm: "different123" });
    expect(errors.passwordConfirm).toBe("passwordMismatch");
  });

  it("rejects an empty name", () => {
    const errors = validateSignupForm({ ...valid, name: "" });
    expect(errors.name).toBe("required");
  });

  it("rejects furigana written in hiragana instead of katakana", () => {
    const errors = validateSignupForm({ ...valid, furigana: "やまだたろう" });
    expect(errors.furigana).toBe("furiganaInvalid");
  });

  it("rejects furigana written in kanji", () => {
    const errors = validateSignupForm({ ...valid, furigana: "山田太郎" });
    expect(errors.furigana).toBe("furiganaInvalid");
  });

  it("accepts furigana with a space between family and given name", () => {
    const errors = validateSignupForm({ ...valid, furigana: "ヤマダ タロウ" });
    expect(errors.furigana).toBeUndefined();
  });

  it("rejects when the required agreement checkbox is unchecked", () => {
    const errors = validateSignupForm({ ...valid, agreeRequired: false });
    expect(errors.agreeRequired).toBe("agreeRequired");
  });

  it("initialSignupFormValues starts empty and unchecked", () => {
    expect(initialSignupFormValues.email).toBe("");
    expect(initialSignupFormValues.agreeRequired).toBe(false);
  });
});
