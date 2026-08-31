"use client";

import { MarketLink } from "@/shared/market";
import { useCart, useCartHydrated, enrichCartLines, type CartItem, type EnrichedCartItem } from "@/entities/cart";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { useProducts } from "@/entities/product";
import { formatPrice } from "@/shared/lib/format";
import { MARKET_CONFIG, marketCurrency, shippingFeeFor } from "@/shared/config/markets";
import { useMarket } from "@/shared/market";
import type { Product } from "@/entities/product";
import { ProductThumb } from "@/entities/product";
import { QuantityStepper } from "@/entities/cart";
import { QueryGuard } from "@/shared/ui/QueryGuard";

export function CartView() {
  const items = useCart((s) => s.items);
  const hydrated = useCartHydrated();
  const { data: products = [], isLoading, error } = useProducts();

  return (
    <QueryGuard isLoading={!hydrated || isLoading} error={error}>
      <CartBody items={items} products={products} />
    </QueryGuard>
  );
}

function CartBody({ items, products }: { items: CartItem[]; products: Product[] }) {
  const { d } = useLocale();
  const { lines, droppedCount } = enrichCartLines(items, products);
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.quantity, 0);

  return (
    <div className="mx-auto max-w-480 px-6 py-8 sm:px-10">
      <h1 className="mb-6 text-2xl font-bold text-foreground">{d.cart.title}</h1>
      <DroppedNotice count={droppedCount} />
      {lines.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <ul className="divide-y divide-border">
            {lines.map((line) => (
              <CartLine key={line.id} line={line} />
            ))}
          </ul>
          <CartSummary subtotal={subtotal} />
        </div>
      )}
    </div>
  );
}

function DroppedNotice({ count }: { count: number }) {
  const { d } = useLocale();
  if (count === 0) {
    return null;
  }
  return (
    <p className="mb-4 border border-border bg-sand px-4 py-3 text-sm text-foreground">
      {d.cart.droppedNotice.replace("{count}", String(count))}
    </p>
  );
}

function EmptyState() {
  const { d } = useLocale();
  return (
    <div className="py-20 text-center">
      <p className="text-4xl">🧺</p>
      <p className="mt-4 text-sm text-muted">{d.cart.empty}</p>
      <MarketLink
        href="/products"
        className="mt-6 inline-flex rounded-full bg-foreground px-6 py-2.5 text-sm text-white hover:opacity-90"
      >
        {d.cart.continue}
      </MarketLink>
    </div>
  );
}

function CartLine({ line }: { line: EnrichedCartItem }) {
  const { locale, d } = useLocale();
  const { updateQuantity, remove } = useCart();
  const currency = marketCurrency(useMarket());
  return (
    <li className="flex gap-4 py-5">
      <ProductThumb
        category={line.product.category}
        color={line.color}
        className="h-24 w-24 shrink-0 rounded-2xl"
      />
      <div className="flex flex-1 flex-col">
        <p className="text-xs text-muted">{line.product.brand}</p>
        <p className="text-sm text-foreground">{line.product.name[locale]}</p>
        <p className="mt-0.5 text-xs text-muted">
          {d.product.size} {line.size}
        </p>
        <div className="mt-auto flex items-center justify-between pt-3">
          <QuantityStepper
            value={line.quantity}
            onChange={(q) => updateQuantity(line.id, q)}
          />
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-foreground">
              {formatPrice(line.product.price * line.quantity, currency)}
            </span>
            <button
              type="button"
              onClick={() => remove(line.id)}
              className="text-xs text-muted underline-offset-2 hover:text-sale hover:underline"
            >
              {d.cart.remove}
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

function CartSummary({ subtotal }: { subtotal: number }) {
  const { d } = useLocale();
  const market = useMarket();
  const currency = marketCurrency(market);
  const shipping = shippingFeeFor(market, subtotal);
  const free = shipping === 0;

  return (
    <aside className="h-fit rounded-2xl bg-surface p-5 ring-1 ring-border">
      <FreeShippingBar subtotal={subtotal} free={free} />
      <SummaryRow label={d.cart.subtotal} value={formatPrice(subtotal, currency)} />
      <SummaryRow
        label={d.cart.shipping}
        value={free ? d.cart.shippingFree : formatPrice(shipping, currency)}
      />
      <div className="my-3 border-t border-border" />
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{d.cart.total}</span>
        <span className="text-lg font-bold text-foreground">
          {formatPrice(subtotal + shipping, currency)}
        </span>
      </div>
      <MarketLink
        href="/checkout"
        className="mt-5 block w-full rounded-full bg-foreground py-3 text-center text-sm font-medium text-white hover:opacity-90"
      >
        {d.cart.checkout}
      </MarketLink>
      <p className="mt-3 text-[11px] leading-relaxed text-muted">
        {d.cart.demoNotice}
      </p>
    </aside>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1 text-sm">
      <span className="text-muted">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

function FreeShippingBar({
  subtotal,
  free,
}: {
  subtotal: number;
  free: boolean;
}) {
  const { d } = useLocale();
  const market = useMarket();
  const currency = marketCurrency(market);
  const threshold = MARKET_CONFIG[market].freeShippingThreshold;
  const remain = Math.max(threshold - subtotal, 0);
  const pct = Math.min((subtotal / threshold) * 100, 100);
  const message = free
    ? d.cart.freeShipMet
    : d.cart.freeShipRemain.replace("{amount}", formatPrice(remain, currency));

  return (
    <div className="mb-4">
      <p className="mb-2 text-xs text-foreground">{message}</p>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-sand">
        <div
          className="h-full rounded-full bg-sage transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
