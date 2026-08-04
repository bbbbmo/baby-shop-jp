"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import type { Dictionary } from "@/shared/i18n/dictionaries";
import { useSigninForm } from "./model/useSigninForm";
import { SocialLoginButtons } from "@/entities/auth";
import type { SigninFormErrors } from "./model/schema";

type ErrorDict = Dictionary["signin"]["errors"];

type SigninFormProps = { onSuccess: () => void };

export function SigninForm({ onSuccess }: SigninFormProps) {
  const { d } = useLocale();
  const { values, errors, status, submitError, setField, submit } = useSigninForm();
  const [oauthError, setOauthError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "success") onSuccess();
  }, [status, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submit();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <TextField
        label={d.signin.emailLabel}
        type="email"
        value={values.email}
        error={errorText(errors, "email", d.signin.errors)}
        onChange={(v) => setField("email", v)}
      />
      <TextField
        label={d.signin.passwordLabel}
        type="password"
        value={values.password}
        error={errorText(errors, "password", d.signin.errors)}
        onChange={(v) => setField("password", v)}
      />
      {submitError && (
        <p className="text-sm text-sale">{d.signin.errors[submitError as keyof ErrorDict]}</p>
      )}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full bg-foreground py-3 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {status === "submitting" ? d.signin.submitting : d.signin.submit}
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

function errorText(
  errors: SigninFormErrors,
  field: keyof SigninFormErrors,
  dict: ErrorDict,
): string | undefined {
  const key = errors[field];
  return key ? dict[key as keyof ErrorDict] : undefined;
}

function TextField({
  label,
  type,
  value,
  error,
  onChange,
}: {
  label: string;
  type: string;
  value: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm text-foreground">
      {label}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-11 w-full border border-border bg-surface px-3 text-sm outline-none placeholder:text-muted focus:border-sage"
      />
      {error && <span className="mt-1 block text-xs text-sale">{error}</span>}
    </label>
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
