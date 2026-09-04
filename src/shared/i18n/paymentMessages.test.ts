import { describe, expect, it } from "vitest";
import { dictionaries } from "./dictionaries";
import { PAYMENT_OUTCOME_CODES } from "@/shared/api/payments/types";

// 화면에 닿는 코드에 문구가 없으면 손님이 빈 자리를 본다.
// 한국 마켓 기능이라도 일본어를 빠뜨리면 그 화면이 깨진다.
describe("결제 실패 문구", () => {
  for (const locale of ["ja", "ko"] as const) {
    it(`${locale}: 모든 결과 코드에 문구가 있다`, () => {
      for (const code of PAYMENT_OUTCOME_CODES) {
        expect(dictionaries[locale].payment.errors[code], code).toBeTruthy();
      }
    });
  }
});
