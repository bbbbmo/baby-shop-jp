"use client";

import { useState } from "react";
import type { Product } from "@/entities/product";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { useCart } from "@/entities/cart";
import { discountRate, formatYen } from "@/shared/lib/format";
import { useProducts, getByCategory } from "@/entities/product";
import { ProductThumb } from "@/entities/product";
import { ColorPicker, SizePicker } from "@/features/product-options";
import { RatingStars } from "@/entities/product";
import { ProductGrid } from "@/entities/product";
import { SectionHeader } from "@/shared/ui/SectionHeader";

export function ProductDetail({ product }: { product: Product }) {
  const { locale, d } = useLocale();
  const add = useCart((s) => s.add);
  const [color, setColor] = useState(product.colors[0]);
  const [size, setSize] = useState("");
  const [added, setAdded] = useState(false);

  const rate = discountRate(product.price, product.listPrice);
  const canAdd = !product.soldOut && size !== "";

  const handleAdd = () => {
    add({ productId: product.id, color, size });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  };

  return (
    <div className="mx-auto max-w-480 px-6 py-8 sm:px-10">
      <div className="grid gap-8 md:grid-cols-2">
        <ProductThumb
          category={product.category}
          color={color}
          className="aspect-square rounded-3xl"
        />
        <div>
          <p className="text-xs uppercase tracking-wider text-muted">
            {product.brand}
          </p>
          <h1 className="mt-1 text-2xl font-bold text-foreground">
            {product.name[locale]}
          </h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted">
            <RatingStars rating={product.rating} />
            <span>
              {product.rating.toFixed(1)} · {product.reviewCount}
              {d.product.reviews}
            </span>
          </div>
          <PriceBlock product={product} rate={rate} taxLabel={d.product.taxIncluded} />
          <div className="mt-6 space-y-5">
            <Field label={d.product.color}>
              <ColorPicker colors={product.colors} selected={color} onSelect={setColor} />
            </Field>
            <Field label={d.product.size}>
              <SizePicker sizes={product.sizes} selected={size} onSelect={setSize} />
            </Field>
          </div>
          <AddToCartBar
            canAdd={canAdd}
            soldOut={product.soldOut}
            added={added}
            onAdd={handleAdd}
            labels={d.product}
          />
        </div>
      </div>

      <section className="mt-14 max-w-3xl">
        <h2 className="text-lg font-bold text-foreground">
          {d.product.description}
        </h2>
        <p className="mt-3 leading-relaxed text-muted">
          {product.description[locale]}
        </p>
      </section>

      <RelatedSection product={product} title={d.product.relatedTitle} />
    </div>
  );
}

function PriceBlock({
  product,
  rate,
  taxLabel,
}: {
  product: Product;
  rate: number;
  taxLabel: string;
}) {
  return (
    <div className="mt-5 flex items-end gap-3">
      {rate > 0 && (
        <span className="text-xl font-bold text-sale">{rate}%</span>
      )}
      <span className="text-2xl font-bold text-foreground">
        {formatYen(product.price)}
      </span>
      <span className="pb-0.5 text-xs text-muted">{taxLabel}</span>
      {rate > 0 && (
        <span className="pb-0.5 text-sm text-muted line-through">
          {formatYen(product.listPrice)}
        </span>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-foreground">{label}</p>
      {children}
    </div>
  );
}

type BarProps = {
  canAdd: boolean;
  soldOut: boolean;
  added: boolean;
  onAdd: () => void;
  labels: { addToCart: string; soldOut: string; selectOption: string };
};

function AddToCartBar({ canAdd, soldOut, added, onAdd, labels }: BarProps) {
  return (
    <div className="mt-8">
      <button
        type="button"
        disabled={!canAdd}
        onClick={onAdd}
        className="w-full rounded-full bg-foreground py-3.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {barLabel({ canAdd, soldOut, added, labels })}
      </button>
    </div>
  );
}

function barLabel({ canAdd, soldOut, added, labels }: Omit<BarProps, "onAdd">) {
  if (soldOut) {
    return labels.soldOut;
  }
  if (added) {
    return "✓";
  }
  return canAdd ? labels.addToCart : labels.selectOption;
}

function RelatedSection({
  product,
  title,
}: {
  product: Product;
  title: string;
}) {
  const { data: products = [] } = useProducts();
  const related = getByCategory(products, product.category)
    .filter((p) => p.id !== product.id)
    .slice(0, 4);
  if (related.length === 0) {
    return null;
  }
  return (
    <section className="mt-16">
      <SectionHeader title={title} />
      <ProductGrid products={related} />
    </section>
  );
}
