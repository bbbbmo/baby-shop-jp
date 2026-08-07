import { describe, expect, it } from "vitest";
import { profileSchema, type ProfileFormValues } from "./schema";

const valid: ProfileFormValues = {
  name: "山田太郎",
  furigana: "ヤマダタロウ",
  phone: "090-1234-5678",
};

function issueMessage(
  values: ProfileFormValues,
  field: keyof ProfileFormValues,
): string | undefined {
  const result = profileSchema.safeParse(values);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("profileSchema", () => {
  it("accepts valid input", () => {
    expect(profileSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an empty name", () => {
    expect(issueMessage({ ...valid, name: "" }, "name")).toBe("required");
  });

  it("rejects furigana written in hiragana instead of katakana", () => {
    expect(issueMessage({ ...valid, furigana: "やまだたろう" }, "furigana")).toBe(
      "furiganaInvalid",
    );
  });

  it("rejects an empty phone number", () => {
    expect(issueMessage({ ...valid, phone: "" }, "phone")).toBe("required");
  });

  it("rejects a phone number that is too short", () => {
    expect(issueMessage({ ...valid, phone: "090-123" }, "phone")).toBe("invalidPhone");
  });

  it("accepts a phone number without hyphens", () => {
    expect(issueMessage({ ...valid, phone: "09012345678" }, "phone")).toBeUndefined();
  });
});
