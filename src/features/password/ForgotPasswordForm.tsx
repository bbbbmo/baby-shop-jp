"use client";

import { useLocale } from "@/shared/i18n/LocaleProvider";
import { FormField } from "@/shared/ui/FormField";
import { useForgotPasswordForm } from "./model/useForgotPasswordForm";

export function ForgotPasswordForm({ onSent }: { onSent: () => void }) {
  const { d } = useLocale();
  const { register, errors, isSubmitting, onSubmit } = useForgotPasswordForm(onSent);
  const errorText = (key: string | undefined) =>
    key
      ? (d.password.errors[key as keyof typeof d.password.errors] ?? d.password.errors.unknownError)
      : undefined;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <p className="text-sm text-muted">{d.password.forgot.description}</p>
      <FormField
        label={d.password.forgot.emailLabel}
        type="email"
        registration={register("email")}
        error={errorText(errors.email?.message)}
      />
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-foreground py-3 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSubmitting ? d.password.forgot.submitting : d.password.forgot.submit}
      </button>
    </form>
  );
}
