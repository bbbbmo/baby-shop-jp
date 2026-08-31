"use client";

import { useCallback } from "react";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import type { Dictionary } from "@/shared/i18n/dictionaries";
import { useMarket } from "@/shared/market";
import { useCheckoutForm } from "./model/useCheckoutForm";
import { FormField } from "@/shared/ui/FormField";
import { AddressSearchButton, useJusoPopup, type AddressFields } from "@/features/address-search";
import type { CartItem } from "@/entities/cart";
import type { CheckoutFormValues } from "./model/schema";
import type { UseFormSetValue } from "react-hook-form";

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
  // 한국 주소는 도로명주소 팝업으로만 채운다. 훅은 마켓과 무관하게 항상 부르고
  // (훅 규칙), 실제로 여는 건 아래 한국 전용 버튼과 주소 칸 클릭뿐이다.
  const { open: openAddressSearch, blocked: addressPopupBlocked } = useJusoPopup(
    useAddressFill(setValue),
  );
  const openIfKr = isKr ? openAddressSearch : undefined;
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
      {isKr && <AddressSearchButton blocked={addressPopupBlocked} onOpen={openAddressSearch} />}
      <FormField label={d.checkout.postalCodeLabel} placeholder={d.checkout.postalCodePlaceholder} readOnly={isKr} onClick={openIfKr} registration={register("postalCode")} error={errorText(errors.postalCode?.message)} />
      <FormField label={d.checkout.prefectureLabel} readOnly={isKr} onClick={openIfKr} registration={register("prefecture")} error={errorText(errors.prefecture?.message)} />
      <FormField label={d.checkout.cityLabel} readOnly={isKr} onClick={openIfKr} registration={register("city")} error={errorText(errors.city?.message)} />
      <FormField label={d.checkout.addressLineLabel} readOnly={isKr} onClick={openIfKr} registration={register("addressLine")} error={errorText(errors.addressLine?.message)} />
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

// 팝업이 돌려준 주소를 폼에 넣는다. useJusoPopup이 이 함수를 의존성으로 삼으므로
// 렌더마다 새로 만들면 message 리스너가 매번 다시 붙는다.
function useAddressFill(setValue: UseFormSetValue<CheckoutFormValues>) {
  return useCallback(
    (fields: AddressFields) => {
      setValue("postalCode", fields.postalCode, { shouldValidate: true });
      setValue("prefecture", fields.prefecture, { shouldValidate: true });
      setValue("city", fields.city, { shouldValidate: true });
      setValue("addressLine", fields.addressLine, { shouldValidate: true });
    },
    [setValue],
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
