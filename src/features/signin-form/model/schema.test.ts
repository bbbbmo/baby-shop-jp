import { describe, expect, it } from "vitest";
import { initialSigninFormValues, signinSchema, type SigninFormValues } from "./schema";

const valid: SigninFormValues = {
  email: "user@example.com",
  password: "password123",
};

function issueMessage(
  values: SigninFormValues,
  field: keyof SigninFormValues,
): string | undefined {
  const result = signinSchema.safeParse(values);
  if (result.success) return undefined;
  return result.error.issues.find((issue) => issue.path[0] === field)?.message;
}

describe("signinSchema", () => {
  it("accepts valid input", () => {
    expect(signinSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects an empty email", () => {
    expect(issueMessage({ ...valid, email: "" }, "email")).toBe("required");
  });

  it("rejects an invalid email format", () => {
    expect(issueMessage({ ...valid, email: "not-an-email" }, "email")).toBe(
      "invalidEmail",
    );
  });

  it("rejects an empty password", () => {
    expect(issueMessage({ ...valid, password: "" }, "password")).toBe("required");
  });

  it("initialSigninFormValues starts empty", () => {
    expect(initialSigninFormValues.email).toBe("");
    expect(initialSigninFormValues.password).toBe("");
  });
});
