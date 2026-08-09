import { z } from "zod";

// views/mypage/model/schema.ts, features/signup-form/model/schema.ts와 동일한
// 규칙 — 셋 중 하나만 고치지 말 것
const KATAKANA_PATTERN = /^[ァ-ヶー\s]+$/;
const PHONE_PATTERN = /^[0-9\-\s]+$/;
const POSTAL_CODE_PATTERN = /^\d{3}-?\d{4}$/;

function isValidPhoneDigitCount(phone: string): boolean {
  return phone.replace(/[^0-9]/g, "").length >= 9;
}

export const checkoutSchema = z.object({
  recipientName: z.string().min(1, "required"),
  recipientFurigana: z
    .string()
    .min(1, "required")
    .regex(KATAKANA_PATTERN, "furiganaInvalid"),
  phone: z
    .string()
    .min(1, "required")
    .regex(PHONE_PATTERN, "invalidPhone")
    .refine(isValidPhoneDigitCount, { message: "invalidPhone" }),
  email: z.string().min(1, "required").email("invalidEmail"),
  postalCode: z
    .string()
    .min(1, "required")
    .regex(POSTAL_CODE_PATTERN, "invalidPostalCode"),
  prefecture: z.string().min(1, "required"),
  city: z.string().min(1, "required"),
  addressLine: z.string().min(1, "required"),
  building: z.string().optional(),
  memo: z.string().optional(),
});

export type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export const initialCheckoutFormValues: CheckoutFormValues = {
  recipientName: "",
  recipientFurigana: "",
  phone: "",
  email: "",
  postalCode: "",
  prefecture: "",
  city: "",
  addressLine: "",
  building: "",
  memo: "",
};
