"use client";

import { useSearchParams } from "next/navigation";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import type { Dictionary } from "@/shared/i18n/dictionaries";

type PaymentErrors = Dictionary["payment"]["errors"];

// 복귀 라우트가 ?payError=<code>로 되돌려 보낸다.
// useSearchParams를 쓰므로 호출부에서 Suspense로 감싼다.
export function PaymentErrorBanner({ code }: { code?: string }) {
  const { d } = useLocale();
  const params = useSearchParams();
  const errorCode = code ?? params.get("payError");
  if (!errorCode) {
    return null;
  }
  const message =
    d.payment.errors[errorCode as keyof PaymentErrors] ?? d.payment.errors.unknown;
  return <p className="mb-6 border border-border bg-sand px-4 py-3 text-sm text-sale">{message}</p>;
}
