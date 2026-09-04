"use client";

import { useState } from "react";
import { MarketLink } from "@/shared/market";
import type { UseFormRegisterReturn } from "react-hook-form";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import type { Dictionary } from "@/shared/i18n/dictionaries";
import { useSignupForm } from "./model/useSignupForm";
import { SocialLoginButtons } from "@/entities/auth";
import { FormField } from "@/shared/ui/FormField";
import { LegalConsentLinks } from "@/entities/legal";

type ErrorDict = Dictionary["signup"]["errors"];

type SignupFormProps = { onSuccess: () => void };

export function SignupForm({ onSuccess }: SignupFormProps) {
  const { d } = useLocale();
  const { register, errors, isSubmitting, submitError, onSubmit } =
    useSignupForm(onSuccess);
  const [oauthError, setOauthError] = useState<string | null>(null);

  const errorText = (key: string | undefined) =>
    key ? d.signup.errors[key as keyof ErrorDict] : undefined;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormField
        label={d.signup.emailLabel}
        type="email"
        registration={register("email")}
        error={errorText(errors.email?.message)}
      />
      <FormField
        label={d.signup.passwordLabel}
        type="password"
        registration={register("password")}
        error={errorText(errors.password?.message)}
      />
      <FormField
        label={d.signup.passwordConfirmLabel}
        type="password"
        registration={register("passwordConfirm")}
        error={errorText(errors.passwordConfirm?.message)}
      />
      <FormField
        label={d.signup.nameLabel}
        registration={register("name")}
        error={errorText(errors.name?.message)}
      />
      <Checkbox
        label={d.signup.agreeTermsLabel}
        registration={register("agreeTerms")}
        error={errorText(errors.agreeTerms?.message)}
      />
      <Checkbox
        label={d.signup.agreePrivacyLabel}
        registration={register("agreePrivacy")}
        error={errorText(errors.agreePrivacy?.message)}
      />
      <LegalConsentLinks />
      <Checkbox
        label={d.signup.agreeMarketingLabel}
        registration={register("agreeMarketing")}
      />
      {submitError && (
        <p className="text-sm text-sale">
          {d.signup.errors[submitError as keyof ErrorDict] ??
            d.signup.errors.unknownError}
        </p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-foreground py-3 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSubmitting ? d.signup.submitting : d.signup.submit}
      </button>
      <SigninLink />
      <Divider label={d.signup.orDivider} />
      {oauthError && <p className="text-sm text-sale">{oauthError}</p>}
      <SocialLoginButtons
        from="signup"
        googleLabel={d.signup.googleButton}
        lineLabel={d.signup.lineButton}
        kakaoLabel={d.signup.kakaoButton}
        errors={d.signup.errors as Record<string, string>}
        onError={setOauthError}
      />
    </form>
  );
}

function Checkbox({
  label,
  registration,
  error,
}: {
  label: string;
  registration: UseFormRegisterReturn;
  error?: string;
}) {
  return (
    <label className="flex items-start gap-2 text-sm text-foreground">
      <input
        type="checkbox"
        {...registration}
        className="mt-0.5 h-4 w-4 shrink-0 accent-foreground"
      />
      <span>
        {label}
        {error && <span className="mt-1 block text-xs text-sale">{error}</span>}
      </span>
    </label>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs text-muted">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

function SigninLink() {
  const { d } = useLocale();
  return (
    <p className="text-center text-xs text-muted">
      {d.signup.hasAccountLabel}{" "}
      <MarketLink
        href="/signin"
        className="underline underline-offset-2 text-foreground"
      >
        {d.signup.signinLink}
      </MarketLink>
    </p>
  );
}
