"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { SigninForm } from "@/features/signin-form";
import { AuthErrorBanner } from "@/entities/auth";
import { LocaleToggle } from "@/features/locale-toggle";

export function SigninView() {
  const { d } = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const authError = searchParams.get("authError");

  return (
    <div className="mx-auto w-full max-w-480 px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-md">
        <div className="mb-6 w-32">
          <LocaleToggle />
        </div>
        <h1 className="mb-6 text-2xl font-bold text-foreground">{d.signin.title}</h1>
        {authError && (
          <AuthErrorBanner code={authError} errors={d.signin.errors as Record<string, string>} />
        )}
        <SigninForm onSuccess={() => router.replace("/")} />
      </div>
    </div>
  );
}
