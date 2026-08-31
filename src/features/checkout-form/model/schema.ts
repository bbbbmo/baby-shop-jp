import { z } from "zod";
import type { Market } from "@/shared/config/markets";

// views/mypage/model/schema.ts와 동일한 규칙 — 한쪽만 고치지 말 것
const KATAKANA_PATTERN = /^[ァ-ヶー\s]+$/;
const PHONE_PATTERN = /^[0-9\-\s]+$/;
const JP_POSTAL_PATTERN = /^\d{3}-?\d{4}$/;
const KR_POSTAL_PATTERN = /^\d{5}$/;

function isValidPhoneDigitCount(phone: string): boolean {
  return phone.replace(/[^0-9]/g, "").length >= 9;
}

// 주소 필드는 마켓별로 검증만 다르고 모양은 같다. 기반 객체를 하나로 두고
// superRefine으로 마켓 규칙을 얹어야 폼 값 타입이 안정적이다.
const checkoutFields = z.object({
  recipientName: z.string().min(1, "required"),
  recipientFurigana: z.string(),
  phone: z
    .string()
    .min(1, "required")
    .regex(PHONE_PATTERN, "invalidPhone")
    .refine(isValidPhoneDigitCount, { message: "invalidPhone" }),
  email: z.string().min(1, "required").email("invalidEmail"),
  postalCode: z.string().min(1, "required"),
  prefecture: z.string().min(1, "required"),
  // 세종특별자치시는 시군구가 없다. 일본에서만 필수로 건다.
  city: z.string(),
  addressLine: z.string().min(1, "required"),
  building: z.string().optional(),
  memo: z.string().optional(),
});

export type CheckoutFormValues = z.infer<typeof checkoutFields>;

export function checkoutSchema(market: Market) {
  return checkoutFields.superRefine((v, ctx) => {
    applyPostalRule(market, v.postalCode, ctx);
    if (market !== "jp") {
      return;
    }
    applyFuriganaRule(v.recipientFurigana, ctx);
    if (v.city.length === 0) {
      ctx.addIssue({ code: "custom", message: "required", path: ["city"] });
    }
  });
}

function applyPostalRule(market: Market, postalCode: string, ctx: z.RefinementCtx): void {
  const pattern = market === "jp" ? JP_POSTAL_PATTERN : KR_POSTAL_PATTERN;
  if (!pattern.test(postalCode)) {
    ctx.addIssue({ code: "custom", message: "invalidPostalCode", path: ["postalCode"] });
  }
}

// 후리가나는 일본에만 있는 개념이라 한국 마켓에서는 검사하지 않는다.
function applyFuriganaRule(furigana: string, ctx: z.RefinementCtx): void {
  if (furigana.length === 0) {
    ctx.addIssue({ code: "custom", message: "required", path: ["recipientFurigana"] });
    return;
  }
  if (!KATAKANA_PATTERN.test(furigana)) {
    ctx.addIssue({ code: "custom", message: "furiganaInvalid", path: ["recipientFurigana"] });
  }
}

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
