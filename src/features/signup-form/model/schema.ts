import { z } from "zod";

// views/mypage/model/schema.ts와 동일한 규칙 — 한쪽만 고치지 말 것
const KATAKANA_PATTERN = /^[ァ-ヶー\s]+$/;
const PHONE_PATTERN = /^[0-9\-\s]+$/;

function isValidPhoneDigitCount(phone: string): boolean {
  return phone.replace(/[^0-9]/g, "").length >= 9;
}

export const signupSchema = z
  .object({
    email: z.string().min(1, "required").email("invalidEmail"),
    password: z.string().min(8, "passwordTooShort"),
    passwordConfirm: z.string().min(1, "required"),
    name: z.string().min(1, "required"),
    furigana: z
      .string()
      .min(1, "required")
      .regex(KATAKANA_PATTERN, "furiganaInvalid"),
    phone: z
      .string()
      .min(1, "required")
      .regex(PHONE_PATTERN, "invalidPhone")
      .refine(isValidPhoneDigitCount, { message: "invalidPhone" }),
    agreeRequired: z.boolean(),
    agreeMarketing: z.boolean(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "passwordMismatch",
    path: ["passwordConfirm"],
  })
  .refine((data) => data.agreeRequired, {
    message: "agreeRequired",
    path: ["agreeRequired"],
  });

export type SignupFormValues = z.infer<typeof signupSchema>;
export type SignupFormField = keyof SignupFormValues;
export type SignupFormErrors = Partial<Record<SignupFormField, string>>;

export const initialSignupFormValues: SignupFormValues = {
  email: "",
  password: "",
  passwordConfirm: "",
  name: "",
  furigana: "",
  phone: "",
  agreeRequired: false,
  agreeMarketing: false,
};

export function validateSignupForm(values: SignupFormValues): SignupFormErrors {
  const result = signupSchema.safeParse(values);
  if (result.success) return {};
  return collectFieldErrors(result.error.issues);
}

function collectFieldErrors(
  issues: readonly { path: PropertyKey[]; message: string }[],
): SignupFormErrors {
  const errors: SignupFormErrors = {};
  for (const issue of issues) {
    const field = issue.path[0] as SignupFormField | undefined;
    if (field && !errors[field]) {
      errors[field] = issue.message;
    }
  }
  return errors;
}
