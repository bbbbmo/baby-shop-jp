"use client";

import Link from "next/link";
import type { Product } from "../model/types";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { discountRate, formatYen } from "@/shared/lib/format";
import { ProductThumb } from "./ProductThumb";

export function ProductCard({ product }: { product: Product }) {
  const { locale, d } = useLocale();
  const rate = discountRate(product.price, product.listPrice);
  const href = `/products/${product.category}/${product.id}`;

  return (
    <Link href={href} className="group block">
      <div className="relative aspect-square rounded-card bg-sand">
        {product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt=""
            className="h-full w-full rounded-card object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <ProductThumb
            category={product.category}
            color={product.colors[0]}
            className="h-full w-full rounded-card transition-transform duration-300 group-hover:scale-[1.03]"
          />
        )}
        <CardBadges product={product} labels={d.product} />
        {product.soldOut && (
          <div className="absolute inset-0 flex items-center justify-center rounded-card bg-white/55">
            <span className="text-sm font-medium tracking-wide text-foreground">
              {d.product.soldOut}
            </span>
          </div>
        )}
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-xs uppercase tracking-wider text-muted">
          {product.brand}
        </p>
        <h3 className="line-clamp-1 text-sm text-foreground">
          {product.name[locale]}
        </h3>
        <PriceRow product={product} rate={rate} />
        <ColorDots colors={product.colors} />
      </div>
    </Link>
  );
}

function CardBadges({
  product,
  labels,
}: {
  product: Product;
  labels: { new: string; best: string };
}) {
  return (
    <div className="absolute left-2.5 top-2.5 flex gap-1">
      {product.isNew && (
        <span className="rounded-full bg-[#8c9a83] px-2 py-0.5 text-[11px] font-medium text-white">
          {labels.new}
        </span>
      )}
      {product.isBest && (
        <span className="rounded-full bg-[#d99e97] px-2 py-0.5 text-[11px] font-medium text-white">
          {labels.best}
        </span>
      )}
    </div>
  );
}

function PriceRow({ product, rate }: { product: Product; rate: number }) {
  return (
    <div className="flex items-center gap-2">
      {rate > 0 && <span className="text-sm font-bold text-sale">{rate}%</span>}
      <span className="text-sm font-bold text-foreground">
        {formatYen(product.price)}
      </span>
      {rate > 0 && (
        <span className="text-xs text-muted line-through">
          {formatYen(product.listPrice)}
        </span>
      )}
    </div>
  );
}

function ColorDots({ colors }: { colors: string[] }) {
  return (
    <div className="flex gap-1 pt-0.5">
      {colors.map((c) => (
        <span
          key={c}
          className="h-3 w-3 ring-1 ring-black/5"
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  );
}
