import { z } from "zod";

const KATAKANA_PATTERN = /^[ァ-ヶー\s]+$/;

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
