import { describe, expect, it } from "vitest";
import { consentSchema, initialConsentFormValues, type ConsentFormValues } from "./schema";

const valid: ConsentFormValues = {
  agreeTerms: true,
  agreePrivacy: true,
  agreeMarketing: false,
};

function issueMessage(
  values: ConsentFormValues,
  field: keyof ConsentFormValues,
): string | undefined {
  const result = consentSchema.safeParse(values);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("consentSchema", () => {
  it("accepts the two required consents", () => {
    expect(consentSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts the optional marketing consent", () => {
    expect(consentSchema.safeParse({ ...valid, agreeMarketing: true }).success).toBe(true);
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

  it("reports both required consents when neither is checked", () => {
    const result = consentSchema.safeParse(initialConsentFormValues);
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues.map((issue) => issue.message).sort()).toEqual([
      "agreePrivacyRequired",
      "agreeTermsRequired",
    ]);
  });

  it("starts with every box unchecked", () => {
    expect(initialConsentFormValues).toEqual({
      agreeTerms: false,
      agreePrivacy: false,
      agreeMarketing: false,
    });
  });
});
