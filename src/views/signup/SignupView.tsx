"use client";

import { useState } from "react";
import { MarketLink, useMarketRouter } from "@/shared/market";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { SignupForm } from "@/features/signup-form";
import { AuthErrorBanner } from "@/entities/auth";

export function SignupView() {
  const { d } = useLocale();
  const router = useMarketRouter();
  const [submitted, setSubmitted] = useState(false);
  const searchParams = useSearchParams();
  const authError = searchParams.get("authError");
  // 서버가 세션을 바로 줬으면 확인할 메일이 없다. 동의 기록은 DB 트리거가
  // 이미 남겼으므로 곧장 홈으로 보낸다.
  const onSuccess = ({ confirmed }: { confirmed: boolean }) =>
    confirmed ? router.replace("/") : setSubmitted(true);

  return (
    <div className="mx-auto w-full max-w-480 px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-md">
        <MarketLink
          href="/"
          style={{ fontFamily: "var(--font-noto-jp)" }}
          className="mb-6 block text-center text-2xl font-bold tracking-tight text-foreground"
        >
          {d.brandName}
        </MarketLink>
        <h1 className="mb-6 text-2xl font-bold text-foreground">{d.signup.title}</h1>
        {authError && (
          <AuthErrorBanner code={authError} errors={d.signup.errors as Record<string, string>} />
        )}
        {submitted ? <SuccessNotice /> : <SignupForm onSuccess={onSuccess} />}
      </div>
    </div>
  );
}

function SuccessNotice() {
  const { d } = useLocale();
  return (
    <div className="py-10 text-center">
      <p className="text-4xl">✉️</p>
      <h2 className="mt-4 text-lg font-bold text-foreground">{d.signup.successTitle}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">{d.signup.successBody}</p>
      <MarketLink
        href="/"
        className="mt-6 inline-flex bg-foreground px-6 py-2.5 text-sm text-white hover:opacity-90"
      >
        {d.signup.backToHome}
      </MarketLink>
    </div>
  );
}
