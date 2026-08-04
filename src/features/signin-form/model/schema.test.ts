import { describe, expect, it } from "vitest";
import {
  initialSigninFormValues,
  validateSigninForm,
  type SigninFormValues,
} from "./schema";

const valid: SigninFormValues = {
  email: "user@example.com",
  password: "password123",
};

describe("validateSigninForm", () => {
  it("returns no errors for valid input", () => {
    expect(validateSigninForm(valid)).toEqual({});
  });

  it("rejects an empty email", () => {
    const errors = validateSigninForm({ ...valid, email: "" });
    expect(errors.email).toBe("required");
  });

  it("rejects an invalid email format", () => {
    const errors = validateSigninForm({ ...valid, email: "not-an-email" });
    expect(errors.email).toBe("invalidEmail");
  });

  it("rejects an empty password", () => {
    const errors = validateSigninForm({ ...valid, password: "" });
    expect(errors.password).toBe("required");
  });

  it("initialSigninFormValues starts empty", () => {
    expect(initialSigninFormValues.email).toBe("");
    expect(initialSigninFormValues.password).toBe("");
  });
});
