import { z } from "zod";

// 회원가입(features/signup-form/model/schema.ts)과 같은 8자 규칙이어야 한다.
// 가입 때 통과한 비밀번호가 변경 화면에서 거부되면 사용자가 이유를 알 수 없다.
// 오류 코드도 가입과 같은 이름을 쓴다 — 사전 문구를 재활용할 수 있다.
const newPassword = z.string().min(8, "passwordTooShort");
const newPasswordConfirm = z.string().min(1, "required");

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "required").email("invalidEmail"),
});

export const resetPasswordSchema = z
  .object({ password: newPassword, passwordConfirm: newPasswordConfirm })
  .refine((v) => v.password === v.passwordConfirm, {
    message: "passwordMismatch",
    path: ["passwordConfirm"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "required"),
    password: newPassword,
    passwordConfirm: newPasswordConfirm,
  })
  .refine((v) => v.password === v.passwordConfirm, {
    message: "passwordMismatch",
    path: ["passwordConfirm"],
  })
  // 같은 값이면 Supabase가 same_password로 거절한다. 왕복 전에 잡는다.
  .refine((v) => v.currentPassword !== v.password, {
    message: "samePassword",
    path: ["password"],
  });

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

export const initialForgotPasswordFormValues: ForgotPasswordFormValues = { email: "" };

export const initialResetPasswordFormValues: ResetPasswordFormValues = {
  password: "",
  passwordConfirm: "",
};

export const initialChangePasswordFormValues: ChangePasswordFormValues = {
  currentPassword: "",
  password: "",
  passwordConfirm: "",
};
