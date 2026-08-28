"use client";

import { useEffect } from "react";
import { MarketLink, useMarketRouter } from "@/shared/market";
import { useCart, useCartHydrated, enrichCartLines, type CartItem, type EnrichedCartItem } from "@/entities/cart";
import { useProducts, type Product } from "@/entities/product";
import { useSession } from "@/entities/auth";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { formatYen } from "@/shared/lib/format";
import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/shared/lib/constants";
import { QueryGuard } from "@/shared/ui/QueryGuard";
import { CheckoutForm, type CheckoutFormValues } from "@/features/checkout-form";

export function CheckoutView() {
  const router = useMarketRouter();
  const items = useCart((s) => s.items);
  const hydrated = useCartHydrated();
  const { user, loading: sessionLoading } = useSession();
  const { data: products = [], isLoading, error } = useProducts();

  useEffect(() => {
    if (hydrated && items.length === 0) {
      router.replace("/cart");
    }
  }, [hydrated, items.length, router]);

  return (
    <QueryGuard isLoading={!hydrated || sessionLoading || isLoading} error={error}>
      <CheckoutBody
        items={items}
        products={products}
        userId={user?.id ?? null}
        prefill={buildPrefill(user)}
      />
    </QueryGuard>
  );
}

function buildPrefill(
  user: { email?: string | null; user_metadata: Record<string, unknown> } | null,
): Partial<CheckoutFormValues> {
  if (!user) {
    return {};
  }
  const field = (key: string) =>
    typeof user.user_metadata[key] === "string" ? (user.user_metadata[key] as string) : "";
  return {
    recipientName: field("name"),
    recipientFurigana: field("furigana"),
    phone: field("phone"),
    email: user.email ?? "",
  };
}

function CheckoutBody({
  items,
  products,
  userId,
  prefill,
}: {
  items: CartItem[];
  products: Product[];
  userId: string | null;
  prefill: Partial<CheckoutFormValues>;
}) {
  const { d } = useLocale();
  const router = useMarketRouter();
  const lines = enrichCartLines(items, products);
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);

  return (
    <div className="mx-auto max-w-480 px-6 py-8 sm:px-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">{d.checkout.title}</h1>
      {!userId && <GuestOrLoginBanner />}
      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        <CheckoutForm
          items={items}
          prefill={prefill}
          onSuccess={(orderNumber) => router.replace(`/checkout/complete?order=${orderNumber}`)}
        />
        <OrderSummary lines={lines} subtotal={subtotal} />
      </div>
    </div>
  );
}

function GuestOrLoginBanner() {
  const { d } = useLocale();
  return (
    <p className="mb-6 border border-border bg-sand px-4 py-3 text-sm text-foreground">
      {d.checkout.guestLabel}
      {" · "}
      <MarketLink href="/signin?redirect=/checkout" className="underline underline-offset-2">
        {d.checkout.loginLabel}
      </MarketLink>
    </p>
  );
}

function OrderSummary({ lines, subtotal }: { lines: EnrichedCartItem[]; subtotal: number }) {
  const { locale, d } = useLocale();
  const free = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shipping = free ? 0 : SHIPPING_FEE;

  return (
    <aside className="h-fit bg-surface p-5 ring-1 ring-border">
      <h2 className="mb-3 text-sm font-medium text-foreground">{d.checkout.orderSummaryTitle}</h2>
      <ul className="divide-y divide-border">
        {lines.map((line) => (
          <li key={line.id} className="flex items-center justify-between py-2 text-sm">
            <span className="text-foreground">
              {line.product.name[locale]} · {line.size} × {line.quantity}
            </span>
            <span className="text-foreground">{formatYen(line.product.price * line.quantity)}</span>
          </li>
        ))}
      </ul>
      <div className="my-3 border-t border-border" />
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">{d.cart.subtotal}</span>
        <span className="text-foreground">{formatYen(subtotal)}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">{d.cart.shipping}</span>
        <span className="text-foreground">{free ? d.cart.shippingFree : formatYen(shipping)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
        <span className="text-sm font-medium text-foreground">{d.cart.total}</span>
        <span className="text-lg font-bold text-foreground">{formatYen(subtotal + shipping)}</span>
      </div>
    </aside>
  );
}
