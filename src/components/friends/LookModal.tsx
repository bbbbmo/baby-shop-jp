"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { FriendLook, Product } from "@/lib/types";
import { lookAlt, lookProducts } from "@/lib/friends";
import { useLocale } from "@/i18n/LocaleProvider";
import { useEscapeToClose } from "@/lib/useEscapeToClose";
import { formatYen } from "@/lib/format";
import { CloseIcon } from "@/components/ui/icons";
import { ProductThumb } from "@/components/product/ProductThumb";
import { LookImage } from "./LookImage";

type Props = {
  look: FriendLook | null;
  onClose: () => void;
};

export function LookModal({ look, onClose }: Props) {
  const { locale, d } = useLocale();
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = look !== null;

  useEscapeToClose(open, onClose);
  useBodyScrollLock(open);

  useEffect(() => {
    if (open) {
      closeRef.current?.focus();
    }
  }, [open]);

  if (!look) {
    return null;
  }

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className="como-fade-in fixed inset-0 z-50 bg-black/40"
      />
      {/*
        래퍼는 pointer-events-none 이다. sm 이상에서 이 래퍼가 화면 전체를
        덮으므로, 클릭을 통과시켜야 패널 바깥 클릭이 아래 오버레이에 닿아
        모달이 닫힌다. 패널만 pointer-events-auto 로 되돌린다.
      */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-center sm:inset-0 sm:items-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={lookAlt(look, locale)}
          className="como-sheet-up pointer-events-auto flex max-h-[90vh] w-full flex-col overflow-y-auto bg-surface shadow-xl sm:max-h-[85vh] sm:max-w-160 overscroll-contain"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-foreground">{look.handle}</span>
            <button
              ref={closeRef}
              type="button"
              aria-label={d.friends.close}
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center text-foreground hover:bg-sand"
            >
              <CloseIcon />
            </button>
          </div>

          <LookImage
            look={look}
            alt={lookAlt(look, locale)}
            className="max-h-[60vh] shrink-0"
          />

          <div className="px-4 pt-4">
            <p className="text-xs text-muted">{look.modelInfo[locale]}</p>
          </div>

          <div className="px-4 pb-6 pt-6">
            <h3 className="mb-3 text-xs uppercase tracking-wider text-muted">
              {d.friends.wearing}
            </h3>
            <ul className="space-y-3">
              {lookProducts(look).map((product) => (
                <WornItem
                  key={product.id}
                  product={product}
                  label={d.friends.viewProduct}
                  onNavigate={onClose}
                />
              ))}
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

function WornItem({
  product,
  label,
  onNavigate,
}: {
  product: Product;
  label: string;
  onNavigate: () => void;
}) {
  const { locale } = useLocale();

  return (
    <li className="flex items-center gap-3 border-t border-border pt-3">
      <div className="h-16 w-16 shrink-0 bg-sand">
        <ProductThumb
          category={product.category}
          color={product.colors[0]}
          className="h-full w-full"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wider text-muted">
          {product.brand}
        </p>
        <p className="truncate text-sm text-foreground">
          {product.name[locale]}
        </p>
        <p className="text-sm font-bold text-foreground">
          {formatYen(product.price)}
        </p>
      </div>
      <Link
        href={`/products/${product.category}/${product.id}`}
        onClick={onNavigate}
        className="shrink-0 border border-foreground px-3 py-2 text-xs text-foreground hover:bg-sand"
      >
        {label}
      </Link>
    </li>
  );
}

/** 모달이 열려 있는 동안 배경 스크롤을 잠근다. */
function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}
