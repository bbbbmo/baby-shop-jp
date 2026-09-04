"use client";

import { useLocale } from "@/shared/i18n/LocaleProvider";
import { useMarket } from "@/shared/market";
import { paymentMethodsFor, type PaymentMethodOption } from "@/shared/api/payments/catalog";

type Props = { value: string; onChange: (methodId: string) => void };

export function PaymentMethodPicker({ value, onChange }: Props) {
  const { locale, d } = useLocale();
  const market = useMarket();
  const methods = paymentMethodsFor(market);

  if (methods.length <= 1) {
    return null;
  }

  return (
    <fieldset className="mb-6">
      <legend className="mb-2 text-sm font-medium text-foreground">
        {d.payment.methodTitle}
      </legend>
      <div className="divide-y divide-border border border-border">
        {methods.map((method) => (
          <MethodRow
            key={method.id}
            method={method}
            label={method.label[locale]}
            checked={value === method.id}
            onChange={onChange}
          />
        ))}
      </div>
    </fieldset>
  );
}

function MethodRow({
  method,
  label,
  checked,
  onChange,
}: {
  method: PaymentMethodOption;
  label: string;
  checked: boolean;
  onChange: (methodId: string) => void;
}) {
  return (
    <label
      className={`flex min-h-12 cursor-pointer items-center gap-3 px-4 py-3 text-sm ${
        checked ? "bg-sand text-foreground" : "text-muted"
      }`}
    >
      <input
        type="radio"
        name="paymentMethod"
        value={method.id}
        checked={checked}
        onChange={() => onChange(method.id)}
        className="h-4 w-4 accent-black"
      />
      {label}
    </label>
  );
}
