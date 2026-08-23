"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { SignupForm } from "@/features/signup-form";
import { AuthErrorBanner } from "@/entities/auth";
import { LocaleToggle } from "@/features/locale-toggle";

export function SignupView() {
  const { d } = useLocale();
  const [submitted, setSubmitted] = useState(false);
  const searchParams = useSearchParams();
  const authError = searchParams.get("authError");

  return (
    <div className="mx-auto w-full max-w-480 px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-md">
        <Link
          href="/"
          style={{ fontFamily: "var(--font-noto-jp)" }}
          className="mb-6 block text-center text-2xl font-bold tracking-tight text-foreground"
        >
          {d.brandName}
        </Link>
        <div className="mb-6 w-32">
          <LocaleToggle />
        </div>
        <h1 className="mb-6 text-2xl font-bold text-foreground">{d.signup.title}</h1>
        {authError && (
          <AuthErrorBanner code={authError} errors={d.signup.errors as Record<string, string>} />
        )}
        {submitted ? <SuccessNotice /> : <SignupForm onSuccess={() => setSubmitted(true)} />}
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
      <Link
        href="/"
        className="mt-6 inline-flex bg-foreground px-6 py-2.5 text-sm text-white hover:opacity-90"
      >
        {d.signup.backToHome}
      </Link>
    </div>
  );
}
