"use client";

import { useLocale } from "@/shared/i18n/LocaleProvider";
import { FormField } from "@/shared/ui/FormField";
import { useResetPasswordForm } from "./model/useResetPasswordForm";

export function ResetPasswordForm({ onSuccess }: { onSuccess: () => void }) {
  const { d } = useLocale();
  const { register, errors, isSubmitting, submitError, onSubmit } =
    useResetPasswordForm(onSuccess);
  const errorText = (key: string | undefined) =>
    key
      ? (d.password.errors[key as keyof typeof d.password.errors] ?? d.password.errors.unknownError)
      : undefined;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormField
        label={d.password.reset.newLabel}
        type="password"
        registration={register("password")}
        error={errorText(errors.password?.message)}
      />
      <FormField
        label={d.password.reset.confirmLabel}
        type="password"
        registration={register("passwordConfirm")}
        error={errorText(errors.passwordConfirm?.message)}
      />
      {submitError && <p className="text-sm text-sale">{errorText(submitError)}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-foreground py-3 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSubmitting ? d.password.reset.submitting : d.password.reset.submit}
      </button>
    </form>
  );
}
