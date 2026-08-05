import { z } from "zod";

export const signinSchema = z.object({
  email: z.string().min(1, "required").email("invalidEmail"),
  password: z.string().min(1, "required"),
});

export type SigninFormValues = z.infer<typeof signinSchema>;
export type SigninFormField = keyof SigninFormValues;
export type SigninFormErrors = Partial<Record<SigninFormField, string>>;

export const initialSigninFormValues: SigninFormValues = {
  email: "",
  password: "",
};

export function validateSigninForm(values: SigninFormValues): SigninFormErrors {
  const result = signinSchema.safeParse(values);
  if (result.success) return {};
  return collectFieldErrors(result.error.issues);
}

function collectFieldErrors(
  issues: readonly { path: PropertyKey[]; message: string }[],
): SigninFormErrors {
  const errors: SigninFormErrors = {};
  for (const issue of issues) {
    const field = issue.path[0] as SigninFormField | undefined;
    if (field && !errors[field]) {
      errors[field] = issue.message;
    }
  }
  return errors;
}
