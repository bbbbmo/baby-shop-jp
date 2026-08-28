import { z } from "zod";

// 한국 개인정보보호법은 필수 항목이라도 약관과 개인정보 수집·이용을
// 각각 따로 동의받도록 요구한다. 하나로 묶지 말 것.
export const consentSchema = z
  .object({
    agreeTerms: z.boolean(),
    agreePrivacy: z.boolean(),
    agreeMarketing: z.boolean(),
  })
  .refine((data) => data.agreeTerms, {
    message: "agreeTermsRequired",
    path: ["agreeTerms"],
  })
  .refine((data) => data.agreePrivacy, {
    message: "agreePrivacyRequired",
    path: ["agreePrivacy"],
  });

export type ConsentFormValues = z.infer<typeof consentSchema>;

export const initialConsentFormValues: ConsentFormValues = {
  agreeTerms: false,
  agreePrivacy: false,
  agreeMarketing: false,
};
