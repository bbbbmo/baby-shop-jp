import { describe, expect, it } from "vitest";
import { validateProfileForm, type ProfileFormValues } from "./schema";

const valid: ProfileFormValues = {
  name: "山田太郎",
  furigana: "ヤマダタロウ",
  phone: "090-1234-5678",
};

describe("validateProfileForm", () => {
  it("returns no errors for valid input", () => {
    expect(validateProfileForm(valid)).toEqual({});
  });

  it("rejects an empty name", () => {
    const errors = validateProfileForm({ ...valid, name: "" });
    expect(errors.name).toBe("required");
  });

  it("rejects furigana written in hiragana instead of katakana", () => {
    const errors = validateProfileForm({ ...valid, furigana: "やまだたろう" });
    expect(errors.furigana).toBe("furiganaInvalid");
  });

  it("rejects an empty phone number", () => {
    const errors = validateProfileForm({ ...valid, phone: "" });
    expect(errors.phone).toBe("required");
  });

  it("rejects a phone number that is too short", () => {
    const errors = validateProfileForm({ ...valid, phone: "090-123" });
    expect(errors.phone).toBe("invalidPhone");
  });

  it("accepts a phone number without hyphens", () => {
    const errors = validateProfileForm({ ...valid, phone: "09012345678" });
    expect(errors.phone).toBeUndefined();
  });
});
