"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { MarketLink } from "@/shared/market";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { ResendConfirmationForm } from "@/features/resend-confirmation";

// /auth/confirm 라우트가 검증을 마치고 보내는 화면. 세션은 이미 쿠키에 있으므로
// 여기서는 결과만 알린다. ?error= 가 붙으면 링크가 만료·재사용된 경우다.
export function EmailConfirmedView() {
  const { d } = useLocale();
  const failed = useSearchParams().get("error") !== null;

  return (
    <div className="mx-auto w-full max-w-480 px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-md">
        <MarketLink
          href="/"
          className="font-brand mb-6 block text-center text-2xl font-bold tracking-tight text-foreground"
        >
          {d.brandName}
        </MarketLink>
        {failed ? <ExpiredNotice /> : <SuccessNotice />}
      </div>
    </div>
  );
}

function SuccessNotice() {
  const { d } = useLocale();
  return (
    <div className="py-10 text-center">
      <p className="text-4xl">✓</p>
      <h1 className="mt-4 text-lg font-bold text-foreground">{d.emailConfirmed.title}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">{d.emailConfirmed.body}</p>
      <div className="mt-6 flex flex-col gap-2">
        <MarketLink href="/" className={primaryButton}>
          {d.emailConfirmed.goHome}
        </MarketLink>
        <MarketLink href="/mypage" className={secondaryButton}>
          {d.emailConfirmed.goMypage}
        </MarketLink>
      </div>
    </div>
  );
}

function ExpiredNotice() {
  const { d } = useLocale();
  const [sent, setSent] = useState(false);
  if (sent) {
    return <ResentNotice />;
  }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">{d.emailConfirmed.expiredTitle}</h1>
      <p className="text-sm text-muted">{d.emailConfirmed.expiredBody}</p>
      <ResendConfirmationForm onSent={() => setSent(true)} />
    </div>
  );
}

function ResentNotice() {
  const { d } = useLocale();
  return (
    <div className="py-10 text-center">
      <p className="text-4xl">✉️</p>
      <h1 className="mt-4 text-lg font-bold text-foreground">{d.emailConfirmed.resendSentTitle}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">{d.emailConfirmed.resendSentBody}</p>
      <MarketLink href="/" className={`${primaryButton} mt-6 inline-flex w-auto px-6`}>
        {d.emailConfirmed.goHome}
      </MarketLink>
    </div>
  );
}

const primaryButton =
  "block w-full bg-foreground py-3 text-center text-sm font-medium text-white hover:opacity-90";
const secondaryButton =
  "block w-full border border-border py-3 text-center text-sm font-medium text-foreground hover:bg-sand";
