import { z } from "zod";

// features/checkout-form/model/schema.ts와 동일한 규칙 — 한쪽만 고치지 말 것
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
