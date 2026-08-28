"use client";

import { MarketLink } from "@/shared/market";
import type { Product } from "@/entities/product";
import { useLocale } from "@/shared/i18n/LocaleProvider";
import { formatPrice } from "@/shared/lib/format";
import { marketCurrency } from "@/shared/config/markets";
import { useMarket } from "@/shared/market";
import { ChevronRightIcon } from "@/shared/ui/icons";
import { ProductThumb } from "@/entities/product";

type Props = {
  product: Product;
  label: string;
  onNavigate: () => void;
};

/**
 * 착용 제품 한 줄.
 *
 * 행 전체가 링크다. 예전에는 우측에 별도 "상품 상세 보기" 버튼을 뒀는데,
 * 그 버튼이 약 104px(ko 기준)을 차지해 320px 짜리 제품 컬럼에서 제품명이
 * 들어갈 자리가 96px 밖에 남지 않았다. 버튼을 없애 그 폭을 회수하면
 * 썸네일을 96px 로 키우고도 텍스트 공간이 오히려 넓어진다.
 *
 * 버튼을 없앤다고 링크 목적까지 사라지면 안 되므로, viewProduct 문자열은
 * aria-label 로 옮겨 스크린리더가 "제품명 — 상품 상세 보기" 로 읽게 한다.
 */
export function WornItem({ product, label, onNavigate }: Props) {
  const { locale } = useLocale();
  const currency = marketCurrency(useMarket());

  return (
    <li className="border-t border-border">
      <MarketLink
        href={`/products/${product.category}/${product.id}`}
        onClick={onNavigate}
        aria-label={`${product.brand} ${product.name[locale]} ${formatPrice(product.price, currency)} — ${label}`}
        className="flex items-center gap-3 py-3 hover:bg-sand"
      >
        <div className="h-24 w-24 shrink-0 bg-sand">
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
            {formatPrice(product.price, currency)}
          </p>
        </div>
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted" />
      </MarketLink>
    </li>
  );
}
