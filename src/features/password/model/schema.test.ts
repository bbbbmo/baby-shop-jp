import { describe, expect, it } from "vitest";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "./schema";

// zod는 첫 실패만 주는 게 아니라 issues 배열을 준다. 어떤 칸에서 어떤 코드가
// 났는지 봐야 화면 문구가 맞는지 알 수 있다.
function issue(schema: { safeParse: (v: unknown) => unknown }, values: unknown, field: string) {
  const result = schema.safeParse(values) as
    | { success: true }
    | { success: false; error: { issues: { path: (string | number)[]; message: string }[] } };
  if (result.success) return undefined;
  return result.error.issues.find((i) => i.path[0] === field)?.message;
}

describe("forgotPasswordSchema", () => {
  it("accepts an email address", () => {
    expect(forgotPasswordSchema.safeParse({ email: "a@example.com" }).success).toBe(true);
  });

  it("rejects an empty email", () => {
    expect(issue(forgotPasswordSchema, { email: "" }, "email")).toBe("required");
  });

  it("rejects a malformed email", () => {
    expect(issue(forgotPasswordSchema, { email: "not-an-email" }, "email")).toBe("invalidEmail");
  });
});

describe("resetPasswordSchema", () => {
  const valid = { password: "newpassword1", passwordConfirm: "newpassword1" };

  it("accepts a matching pair", () => {
    expect(resetPasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a password shorter than the signup rule", () => {
    // 회원가입이 8자를 요구한다. 여기서만 느슨하면 가입은 되는데 재설정은
    // 안 되는(또는 그 반대) 상황이 생긴다.
    const short = { password: "short1", passwordConfirm: "short1" };
    expect(issue(resetPasswordSchema, short, "password")).toBe("passwordTooShort");
  });

  it("reports a mismatch on the confirm field", () => {
    const mismatch = { password: "newpassword1", passwordConfirm: "newpassword2" };
    expect(issue(resetPasswordSchema, mismatch, "passwordConfirm")).toBe("passwordMismatch");
  });
});

describe("changePasswordSchema", () => {
  const valid = {
    currentPassword: "oldpassword1",
    password: "newpassword1",
    passwordConfirm: "newpassword1",
  };

  it("accepts a current password plus a new matching pair", () => {
    expect(changePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it("requires the current password", () => {
    expect(issue(changePasswordSchema, { ...valid, currentPassword: "" }, "currentPassword")).toBe(
      "required",
    );
  });

  it("rejects a new password identical to the current one", () => {
    // Supabase가 same_password로 거절한다. 왕복하기 전에 잡아야
    // 사용자가 네트워크를 기다린 끝에 거절당하지 않는다.
    const same = {
      currentPassword: "oldpassword1",
      password: "oldpassword1",
      passwordConfirm: "oldpassword1",
    };
    expect(issue(changePasswordSchema, same, "password")).toBe("samePassword");
  });

  it("still checks the new password rules", () => {
    const short = { currentPassword: "oldpassword1", password: "short1", passwordConfirm: "short1" };
    expect(issue(changePasswordSchema, short, "password")).toBe("passwordTooShort");
  });
});
