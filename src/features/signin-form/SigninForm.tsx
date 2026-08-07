"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import type { Dictionary } from "@/shared/i18n/dictionaries";
import { useSigninForm } from "./model/useSigninForm";
import { SocialLoginButtons } from "@/entities/auth";
import { FormField } from "@/shared/ui/FormField";

type ErrorDict = Dictionary["signin"]["errors"];

type SigninFormProps = { onSuccess: () => void };

export function SigninForm({ onSuccess }: SigninFormProps) {
  const { d } = useLocale();
  const { register, errors, isSubmitting, submitError, onSubmit } = useSigninForm(onSuccess);
  const [oauthError, setOauthError] = useState<string | null>(null);

  const errorText = (key: string | undefined) =>
    key ? d.signin.errors[key as keyof ErrorDict] : undefined;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormField
        label={d.signin.emailLabel}
        type="email"
        registration={register("email")}
        error={errorText(errors.email?.message)}
      />
      <FormField
        label={d.signin.passwordLabel}
        type="password"
        registration={register("password")}
        error={errorText(errors.password?.message)}
      />
      {submitError && (
        <p className="text-sm text-sale">
          {d.signin.errors[submitError as keyof ErrorDict] ?? d.signin.errors.unknownError}
        </p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-foreground py-3 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSubmitting ? d.signin.submitting : d.signin.submit}
      </button>
      <SignupLink />
      <Divider label={d.signin.orDivider} />
      {oauthError && <p className="text-sm text-sale">{oauthError}</p>}
      <SocialLoginButtons
        from="signin"
        googleLabel={d.signin.googleButton}
        lineLabel={d.signin.lineButton}
        errors={d.signin.errors as Record<string, string>}
        onError={setOauthError}
      />
    </form>
  );
}

function SignupLink() {
  const { d } = useLocale();
  return (
    <p className="text-center text-xs text-muted">
      {d.signin.noAccountLabel}{" "}
      <Link href="/signup" className="underline underline-offset-2 text-foreground">
        {d.signin.signupLink}
      </Link>
    </p>
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
