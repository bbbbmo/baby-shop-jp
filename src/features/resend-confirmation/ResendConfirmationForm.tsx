"use client";

import { useLocale } from "@/shared/i18n/LocaleProvider";
import { FormField } from "@/shared/ui/FormField";
import { useResendConfirmationForm } from "./model/useResendConfirmationForm";

export function ResendConfirmationForm({ onSent }: { onSent: () => void }) {
  const { d } = useLocale();
  const { register, errors, isSubmitting, submitError, onSubmit } =
    useResendConfirmationForm(onSent);
  const dict = d.emailConfirmed;
  const errorText = (key: string | undefined) =>
    key ? (dict.errors[key as keyof typeof dict.errors] ?? dict.errors.unknownError) : undefined;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormField
        label={dict.resendEmailLabel}
        type="email"
        registration={register("email")}
        error={errorText(errors.email?.message)}
      />
      {submitError && <p className="text-sm text-sale">{errorText(submitError)}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-foreground py-3 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSubmitting ? dict.resendSubmitting : dict.resendButton}
      </button>
    </form>
  );
}
