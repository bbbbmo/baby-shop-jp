"use client";

import { useLocale } from "@/shared/i18n/LocaleProvider";
import { OrderLookupForm } from "@/features/order-lookup-form";

export function OrderLookupView() {
  const { d } = useLocale();
  return (
    <div className="mx-auto max-w-480 px-6 py-10 sm:px-10">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-2xl font-bold text-foreground">{d.orderLookup.title}</h1>
        <OrderLookupForm />
      </div>
    </div>
  );
}
