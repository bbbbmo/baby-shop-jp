"use client";

import { useLocale } from "@/shared/i18n/LocaleProvider";
import type { Dictionary } from "@/shared/i18n/dictionaries";
import { useOrderLookupForm } from "./model/useOrderLookupForm";
import { FormField } from "@/shared/ui/FormField";
import { formatPrice } from "@/shared/lib/format";
import { marketCurrency } from "@/shared/config/markets";
import type { Order, OrderItem } from "@/entities/order";

type ErrorDict = Dictionary["orderLookup"]["errors"];

export function OrderLookupForm() {
  const { d } = useLocale();
  const { register, errors, isSubmitting, notFound, result, onSubmit } = useOrderLookupForm();
  const errorText = (key: string | undefined) =>
    key ? d.orderLookup.errors[key as keyof ErrorDict] : undefined;

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormField label={d.orderLookup.orderNumberLabel} registration={register("orderNumber")} error={errorText(errors.orderNumber?.message)} />
        <FormField label={d.orderLookup.emailLabel} type="email" registration={register("email")} error={errorText(errors.email?.message)} />
        {notFound && <p className="text-sm text-sale">{d.orderLookup.notFound}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-foreground py-3 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isSubmitting ? d.orderLookup.submitting : d.orderLookup.submit}
        </button>
      </form>
      {result && <OrderResult order={result} />}
    </div>
  );
}

function OrderResult({ order }: { order: Order }) {
  const { d } = useLocale();
  const currency = marketCurrency(order.market);
  return (
    <div className="border border-border bg-surface p-5 text-sm">
      <p className="text-muted">{d.orderLookup.statusLabel}</p>
      <p className="mb-3 font-medium text-foreground">{d.orderLookup.statusPendingPayment}</p>
      <ul className="divide-y divide-border">
        {order.items.map((item) => (
          <OrderResultItem key={item.id} item={item} currency={currency} />
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <span className="font-medium text-foreground">{d.cart.total}</span>
        <span className="text-lg font-bold text-foreground">
          {formatPrice(order.totalPrice, currency)}
        </span>
      </div>
    </div>
  );
}

function OrderResultItem({
  item,
  currency,
}: {
  item: OrderItem;
  currency: ReturnType<typeof marketCurrency>;
}) {
  const { locale } = useLocale();
  const name = locale === "ko" ? (item.productNameKo ?? item.productNameJa) : item.productNameJa;
  return (
    <li className="flex items-center justify-between py-2">
      <span className="text-foreground">
        {name} · {item.color} · {item.size} × {item.quantity}
      </span>
      <span className="text-foreground">{formatPrice(item.unitPrice * item.quantity, currency)}</span>
    </li>
  );
}
