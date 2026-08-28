"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { useMarket } from "./MarketProvider";
import { marketPath } from "./marketPath";

type MarketLinkProps = Omit<ComponentProps<typeof Link>, "href"> & { href: string };

// 접두사를 이 컴포넌트가 붙이므로 호출부는 "/cart" 같은 기존 경로를 그대로 쓴다.
export function MarketLink({ href, ...props }: MarketLinkProps) {
  const market = useMarket();
  return <Link href={marketPath(market, href)} {...props} />;
}
