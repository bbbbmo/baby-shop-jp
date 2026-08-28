"use client";

import { createContext, useContext } from "react";
import type { Market } from "@/shared/config/markets";

const MarketContext = createContext<Market | null>(null);

export function MarketProvider({
  market,
  children,
}: {
  market: Market;
  children: React.ReactNode;
}) {
  return <MarketContext.Provider value={market}>{children}</MarketContext.Provider>;
}

export function useMarket(): Market {
  const market = useContext(MarketContext);
  if (!market) {
    throw new Error("useMarket은 MarketProvider 안에서만 쓸 수 있습니다");
  }
  return market;
}
