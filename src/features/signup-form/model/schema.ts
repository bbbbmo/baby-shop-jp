import { z } from "zod";

// 후리가나·전화번호는 배송에만 쓰이므로 체크아웃에서 받는다.
// 한국 개인정보보호법은 약관과 개인정보 수집·이용 동의를 각각 요구하므로
// 하나로 묶지 않는다.
export const signupSchema = z
  .object({
    email: z.string().min(1, "required").email("invalidEmail"),
    password: z.string().min(8, "passwordTooShort"),
    passwordConfirm: z.string().min(1, "required"),
    name: z.string().min(1, "required"),
    agreeTerms: z.boolean(),
    agreePrivacy: z.boolean(),
    agreeMarketing: z.boolean(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "passwordMismatch",
    path: ["passwordConfirm"],
  })
  .refine((data) => data.agreeTerms, {
    message: "agreeTermsRequired",
    path: ["agreeTerms"],
  })
  .refine((data) => data.agreePrivacy, {
    message: "agreePrivacyRequired",
    path: ["agreePrivacy"],
  });

export type SignupFormValues = z.infer<typeof signupSchema>;

export const initialSignupFormValues: SignupFormValues = {
  email: "",
  password: "",
  passwordConfirm: "",
  name: "",
  agreeTerms: false,
  agreePrivacy: false,
  agreeMarketing: false,
};
