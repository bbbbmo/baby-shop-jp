"use client";

import { useRouter } from "next/navigation";
import { useMarket } from "./MarketProvider";
import { marketPath } from "./marketPath";

// router.push/replace에도 같은 접두사 규칙을 적용한다.
export function useMarketRouter() {
  const router = useRouter();
  const market = useMarket();
  return {
    push: (path: string) => router.push(marketPath(market, path)),
    replace: (path: string) => router.replace(marketPath(market, path)),
  };
}
