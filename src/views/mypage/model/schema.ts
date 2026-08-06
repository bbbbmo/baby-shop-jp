import { z } from "zod";

const KATAKANA_PATTERN = /^[ァ-ヶー\s]+$/;
const PHONE_PATTERN = /^[0-9\-\s]+$/;

function isValidPhoneDigitCount(phone: string): boolean {
  return phone.replace(/[^0-9]/g, "").length >= 9;
}

export const profileSchema = z.object({
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
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
export type ProfileFormField = keyof ProfileFormValues;
export type ProfileFormErrors = Partial<Record<ProfileFormField, string>>;

export function validateProfileForm(values: ProfileFormValues): ProfileFormErrors {
  const result = profileSchema.safeParse(values);
  if (result.success) return {};
  return collectFieldErrors(result.error.issues);
}

function collectFieldErrors(
  issues: readonly { path: PropertyKey[]; message: string }[],
): ProfileFormErrors {
  const errors: ProfileFormErrors = {};
  for (const issue of issues) {
    const field = issue.path[0] as ProfileFormField | undefined;
    if (field && !errors[field]) {
      errors[field] = issue.message;
    }
  }
  return errors;
}
