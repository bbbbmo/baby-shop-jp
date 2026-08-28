"use client";

import { MarketLink } from "@/shared/market";
import type { UseFormRegisterReturn } from "react-hook-form";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import type { Dictionary } from "@/shared/i18n/dictionaries";
import { useConsentForm } from "./model/useConsentForm";

type ErrorDict = Dictionary["consent"]["errors"];

type ConsentFormProps = { userId: string; onSuccess: () => void };

export function ConsentForm({ userId, onSuccess }: ConsentFormProps) {
  const { d } = useLocale();
  const { register, errors, isSubmitting, submitError, onSubmit } = useConsentForm(
    userId,
    onSuccess,
  );

  const errorText = (key: string | undefined) =>
    key ? d.consent.errors[key as keyof ErrorDict] : undefined;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <p className="text-sm leading-relaxed text-muted">{d.consent.description}</p>
      <Checkbox
        label={d.consent.agreeTermsLabel}
        registration={register("agreeTerms")}
        error={errorText(errors.agreeTerms?.message)}
      />
      <Checkbox
        label={d.consent.agreePrivacyLabel}
        registration={register("agreePrivacy")}
        error={errorText(errors.agreePrivacy?.message)}
      />
      <LegalLinks />
      <Checkbox
        label={d.consent.agreeMarketingLabel}
        registration={register("agreeMarketing")}
      />
      {submitError && (
        <p className="text-sm text-sale">{d.consent.errors.unknownError}</p>
      )}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-foreground py-3 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSubmitting ? d.consent.submitting : d.consent.submit}
      </button>
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

function LegalLinks() {
  const { d } = useLocale();
  return (
    <div className="-mt-2 flex gap-3 pl-6 text-xs text-muted">
      <MarketLink href="/terms" target="_blank" className="underline underline-offset-2 hover:text-foreground">
        {d.legal.termsTitle}
      </MarketLink>
      <MarketLink href="/privacy" target="_blank" className="underline underline-offset-2 hover:text-foreground">
        {d.legal.privacyTitle}
      </MarketLink>
    </div>
  );
}
