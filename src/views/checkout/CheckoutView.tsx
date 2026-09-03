"use client";

import { Suspense, useEffect, useState } from "react";
import { MarketLink, useMarketRouter } from "@/shared/market";
import { useCart, useCartHydrated, enrichCartLines, DroppedNotice, type CartItem, type EnrichedCartItem } from "@/entities/cart";
import { useProducts, type Product } from "@/entities/product";
import { useSession } from "@/entities/auth";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { formatPrice } from "@/shared/lib/format";
import { marketCurrency, shippingFeeFor } from "@/shared/config/markets";
import { useMarket } from "@/shared/market";
import { QueryGuard } from "@/shared/ui/QueryGuard";
import { CheckoutForm, type CheckoutFormValues } from "@/features/checkout-form";
import { PaymentErrorBanner, PaymentMethodPicker, useStartPayment } from "@/features/payment-method";
import { paymentMethodsFor } from "@/shared/api/payments/catalog";

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
  const market = useMarket();
  const { lines, droppedCount } = enrichCartLines(items, products);
  // 기본값을 "mock"으로 박으면 운영 빌드에서 목록이 비었을 때도 그 값이 남아
  // 시작 라우트가 400을 낸다. 목록의 첫 항목에서 끌어온다.
  const methods = paymentMethodsFor(market);
  const [methodId, setMethodId] = useState(methods[0]?.id ?? "");
  const { start, payError } = useStartPayment();
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);

  return (
    <div className="mx-auto max-w-480 px-6 py-8 sm:px-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">{d.checkout.title}</h1>
      <DroppedNotice count={droppedCount} />
      <Suspense fallback={null}>
        <PaymentErrorBanner code={payError ?? undefined} />
      </Suspense>
      {!userId && <GuestOrLoginBanner />}
      <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
        {/* lines를 넘겨야 한다. items(원본 장바구니)를 넘기면 이 마켓에서 취급하지
            않는 상품까지 서버로 가고, 서버는 그 한 줄 때문에 주문 전체를 거절한다.
            화면에는 "뺐습니다"라고 알려놓고 제출은 그대로 하는 모순이 된다. */}
        <div>
          <PaymentMethodPicker value={methodId} onChange={setMethodId} />
          <CheckoutForm
            items={lines}
            prefill={prefill}
            onSuccess={(orderNumber, email) => start(orderNumber, email, methodId)}
          />
        </div>
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
  const market = useMarket();
  const currency = marketCurrency(market);
  const shipping = shippingFeeFor(market, subtotal);
  const free = shipping === 0;

  return (
    <aside className="h-fit bg-surface p-5 ring-1 ring-border">
      <h2 className="mb-3 text-sm font-medium text-foreground">{d.checkout.orderSummaryTitle}</h2>
      <ul className="divide-y divide-border">
        {lines.map((line) => (
          <li key={line.id} className="flex items-center justify-between py-2 text-sm">
            <span className="text-foreground">
              {line.product.name[locale]} · {line.size} × {line.quantity}
            </span>
            <span className="text-foreground">{formatPrice(line.product.price * line.quantity, currency)}</span>
          </li>
        ))}
      </ul>
      <div className="my-3 border-t border-border" />
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">{d.cart.subtotal}</span>
        <span className="text-foreground">{formatPrice(subtotal, currency)}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted">{d.cart.shipping}</span>
        <span className="text-foreground">{free ? d.cart.shippingFree : formatPrice(shipping, currency)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
        <span className="text-sm font-medium text-foreground">{d.cart.total}</span>
        <span className="text-lg font-bold text-foreground">{formatPrice(subtotal + shipping, currency)}</span>
      </div>
    </aside>
  );
}
