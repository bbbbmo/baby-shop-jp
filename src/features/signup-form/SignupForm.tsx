"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import type { Dictionary } from "@/shared/i18n/dictionaries";
import { useSignupForm } from "./model/useSignupForm";
import { SocialLoginButtons } from "@/entities/auth";
import type { SignupFormErrors } from "./model/schema";

type ErrorDict = Dictionary["signup"]["errors"];

type SignupFormProps = { onSuccess: () => void };

export function SignupForm({ onSuccess }: SignupFormProps) {
  const { d } = useLocale();
  const { values, errors, status, submitError, setField, submit } = useSignupForm();
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
        label={d.signup.emailLabel}
        type="email"
        value={values.email}
        error={errorText(errors, "email", d.signup.errors)}
        onChange={(v) => setField("email", v)}
      />
      <TextField
        label={d.signup.passwordLabel}
        type="password"
        value={values.password}
        error={errorText(errors, "password", d.signup.errors)}
        onChange={(v) => setField("password", v)}
      />
      <TextField
        label={d.signup.passwordConfirmLabel}
        type="password"
        value={values.passwordConfirm}
        error={errorText(errors, "passwordConfirm", d.signup.errors)}
        onChange={(v) => setField("passwordConfirm", v)}
      />
      <TextField
        label={d.signup.nameLabel}
        type="text"
        value={values.name}
        placeholder={d.signup.namePlaceholder}
        error={errorText(errors, "name", d.signup.errors)}
        onChange={(v) => setField("name", v)}
      />
      <TextField
        label={d.signup.furiganaLabel}
        type="text"
        value={values.furigana}
        placeholder={d.signup.furiganaPlaceholder}
        error={errorText(errors, "furigana", d.signup.errors)}
        onChange={(v) => setField("furigana", v)}
      />
      <TextField
        label={d.signup.phoneLabel}
        type="tel"
        value={values.phone}
        placeholder={d.signup.phonePlaceholder}
        error={errorText(errors, "phone", d.signup.errors)}
        onChange={(v) => setField("phone", v)}
      />
      <Checkbox
        label={d.signup.agreeRequiredLabel}
        checked={values.agreeRequired}
        error={errorText(errors, "agreeRequired", d.signup.errors)}
        onChange={(v) => setField("agreeRequired", v)}
      />
      <LegalLinks />
      <Checkbox
        label={d.signup.agreeMarketingLabel}
        checked={values.agreeMarketing}
        onChange={(v) => setField("agreeMarketing", v)}
      />
      {submitError && (
        <p className="text-sm text-sale">{d.signup.errors[submitError as keyof ErrorDict]}</p>
      )}
      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full bg-foreground py-3 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {status === "submitting" ? d.signup.submitting : d.signup.submit}
      </button>
      <SigninLink />
      <Divider label={d.signup.orDivider} />
      {oauthError && <p className="text-sm text-sale">{oauthError}</p>}
      <SocialLoginButtons
        from="signup"
        googleLabel={d.signup.googleButton}
        lineLabel={d.signup.lineButton}
        errors={d.signup.errors as Record<string, string>}
        onError={setOauthError}
      />
    </form>
  );
}

function errorText(
  errors: SignupFormErrors,
  field: keyof SignupFormErrors,
  dict: ErrorDict,
): string | undefined {
  const key = errors[field];
  return key ? dict[key as keyof ErrorDict] : undefined;
}

function TextField({
  label,
  type,
  value,
  placeholder,
  error,
  onChange,
}: {
  label: string;
  type: string;
  value: string;
  placeholder?: string;
  error?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm text-foreground">
      {label}
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-11 w-full border border-border bg-surface px-3 text-sm outline-none placeholder:text-muted focus:border-sage"
      />
      {error && <span className="mt-1 block text-xs text-sale">{error}</span>}
    </label>
  );
}

function Checkbox({
  label,
  checked,
  error,
  onChange,
}: {
  label: string;
  checked: boolean;
  error?: string;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-2 text-sm text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-foreground"
      />
      <span>
        {label}
        {error && <span className="mt-1 block text-xs text-sale">{error}</span>}
      </span>
    </label>
  );
}

function LegalLinks() {
  const { d } = useLocale();
  return (
    <div className="-mt-2 flex gap-3 pl-6 text-xs text-muted">
      <Link href="/terms" target="_blank" className="underline underline-offset-2 hover:text-foreground">
        {d.legal.termsTitle}
      </Link>
      <Link href="/privacy" target="_blank" className="underline underline-offset-2 hover:text-foreground">
        {d.legal.privacyTitle}
      </Link>
    </div>
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
      <Link href="/signin" className="underline underline-offset-2 text-foreground">
        {d.signup.signinLink}
      </Link>
    </p>
  );
}
