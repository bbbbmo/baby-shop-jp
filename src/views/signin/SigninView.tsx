"use client";

import { MarketLink, useMarketRouter } from "@/shared/market";
import { useSearchParams } from "next/navigation";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { SigninForm } from "@/features/signin-form";
import { AuthErrorBanner } from "@/entities/auth";
import { MarketSwitcher } from "@/features/market-switcher";

export function SigninView() {
  const { d } = useLocale();
  const router = useMarketRouter();
  const searchParams = useSearchParams();
  const authError = searchParams.get("authError");
  const rawRedirect = searchParams.get("redirect");
  const redirect =
    rawRedirect?.startsWith("/") && !rawRedirect.startsWith("//") ? rawRedirect : "/";

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
        <div className="mb-6 w-32">
          <MarketSwitcher />
        </div>
        <h1 className="mb-6 text-2xl font-bold text-foreground">{d.signin.title}</h1>
        {authError && (
          <AuthErrorBanner code={authError} errors={d.signin.errors as Record<string, string>} />
        )}
        <SigninForm onSuccess={() => router.replace(redirect)} />
      </div>
    </div>
  );
}
