"use client";

import { useLocale } from "@/shared/i18n/LocaleProvider";
import type { Dictionary } from "@/shared/i18n/dictionaries";
import { useMarket } from "@/shared/market";
import { useCheckoutForm } from "./model/useCheckoutForm";
import { FormField } from "@/shared/ui/FormField";
import { AddressSearch } from "@/features/address-search";
import type { CartItem } from "@/entities/cart";
import type { CheckoutFormValues } from "./model/schema";

type ErrorDict = Dictionary["checkout"]["errors"];

type CheckoutFormProps = {
  items: CartItem[];
  prefill: Partial<CheckoutFormValues>;
  onSuccess: (orderNumber: string) => void;
};

export function CheckoutForm({ items, prefill, onSuccess }: CheckoutFormProps) {
  const { d } = useLocale();
  const market = useMarket();
  const { register, setValue, errors, isSubmitting, submitError, onSubmit } = useCheckoutForm(
    items,
    prefill,
    onSuccess,
  );
  const isKr = market === "kr";
  const errorText = (key: string | undefined) =>
    key ? d.checkout.errors[key as keyof ErrorDict] : undefined;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormField label={d.checkout.recipientNameLabel} registration={register("recipientName")} error={errorText(errors.recipientName?.message)} />
      {market === "jp" && (
        <FormField
          label={d.checkout.recipientFuriganaLabel}
          registration={register("recipientFurigana")}
          error={errorText(errors.recipientFurigana?.message)}
        />
      )}
      <FormField label={d.checkout.phoneLabel} type="tel" registration={register("phone")} error={errorText(errors.phone?.message)} />
      <FormField label={d.checkout.emailLabel} type="email" registration={register("email")} error={errorText(errors.email?.message)} />
      {isKr && (
        <AddressSearch
          onSelect={(fields) => {
            setValue("postalCode", fields.postalCode, { shouldValidate: true });
            setValue("prefecture", fields.prefecture, { shouldValidate: true });
            setValue("city", fields.city, { shouldValidate: true });
            setValue("addressLine", fields.addressLine, { shouldValidate: true });
          }}
        />
      )}
      <FormField label={d.checkout.postalCodeLabel} placeholder={d.checkout.postalCodePlaceholder} readOnly={isKr} registration={register("postalCode")} error={errorText(errors.postalCode?.message)} />
      <FormField label={d.checkout.prefectureLabel} readOnly={isKr} registration={register("prefecture")} error={errorText(errors.prefecture?.message)} />
      <FormField label={d.checkout.cityLabel} readOnly={isKr} registration={register("city")} error={errorText(errors.city?.message)} />
      <FormField label={d.checkout.addressLineLabel} readOnly={isKr} registration={register("addressLine")} error={errorText(errors.addressLine?.message)} />
      <FormField label={d.checkout.buildingLabel} registration={register("building")} />
      <FormField label={d.checkout.memoLabel} registration={register("memo")} />
      {submitError && <SubmitErrorMessage submitError={submitError} errors={d.checkout.errors} />}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full bg-foreground py-3 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isSubmitting ? d.checkout.submitting : d.checkout.submit}
      </button>
    </form>
  );
}

function SubmitErrorMessage({
  submitError,
  errors,
}: {
  submitError: { code: string; productName?: string };
  errors: ErrorDict;
}) {
  const message =
    submitError.code === "soldOut" && submitError.productName
      ? errors.soldOut.replace("{name}", submitError.productName)
      : (errors[submitError.code as keyof ErrorDict] ?? errors.unknownError);
  return <p className="text-sm text-sale">{message}</p>;
}
