"use client";

import { useState } from "react";
import { MarketLink } from "@/shared/market";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { ForgotPasswordForm } from "@/features/password";

export function ForgotPasswordView() {
  const { d } = useLocale();
  const [sent, setSent] = useState(false);

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
        <h1 className="mb-6 text-2xl font-bold text-foreground">
          {sent ? d.password.forgot.sentTitle : d.password.forgot.title}
        </h1>
        {sent ? <SentNotice /> : <ForgotPasswordForm onSent={() => setSent(true)} />}
      </div>
    </div>
  );
}

// 가입된 주소든 아니든 같은 화면을 보여준다. 여기서 구분하면 아무나 이메일을
// 넣어보며 회원 목록을 모을 수 있다.
function SentNotice() {
  const { d } = useLocale();
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">{d.password.forgot.sentDescription}</p>
      <MarketLink
        href="/signin"
        className="block w-full border border-border py-3 text-center text-sm font-medium text-foreground hover:bg-sand"
      >
        {d.password.forgot.backToSignin}
      </MarketLink>
    </div>
  );
}
