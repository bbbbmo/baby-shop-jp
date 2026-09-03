"use client";

import { useSearchParams } from "next/navigation";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { isPaymentOutcomeCode } from "@/shared/api/payments/types";

// 복귀 라우트가 ?payError=<code>로 되돌려 보낸다.
// useSearchParams를 쓰므로 호출부에서 Suspense로 감싼다.
export function PaymentErrorBanner({ code }: { code?: string }) {
  const { d } = useLocale();
  const params = useSearchParams();
  const errorCode = code ?? params.get("payError");
  if (!errorCode) {
    return null;
  }
  // errorCode는 쿼리스트링 원문이다. 사전을 직접 인덱싱하면
  // ?payError=constructor 같은 값이 Object.prototype을 가리켜 화면이 죽는다.
  const message = isPaymentOutcomeCode(errorCode)
    ? d.payment.errors[errorCode]
    : d.payment.errors.unknown;
  return <p className="mb-6 border border-border bg-sand px-4 py-3 text-sm text-sale">{message}</p>;
}
