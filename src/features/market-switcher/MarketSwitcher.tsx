"use client";

import { usePathname, useRouter } from "next/navigation";
import { MARKETS, type Market } from "@/shared/config/markets";
import { marketPath, useMarket } from "@/shared/market";

const LABEL: Record<Market, string> = {
  jp: "日本語",
  kr: "한국어",
};

// 마켓 전환이 곧 언어 전환이다. 현재 경로를 유지한 채 접두사만 갈아끼운다.
export function MarketSwitcher() {
  const current = useMarket();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="flex w-full items-center border border-border bg-surface p-0.5 text-xs">
      {MARKETS.map((market) => (
        <button
          key={market}
          type="button"
          onClick={() => router.push(marketPath(market, pathname))}
          className={buttonClass(market === current)}
        >
          {LABEL[market]}
        </button>
      ))}
    </div>
  );
}

function buttonClass(active: boolean): string {
  const activeCls = "bg-sage text-white";
  const idleCls = "text-muted hover:text-foreground";
  return `flex-1 px-2.5 py-1.5 text-center transition-colors ${active ? activeCls : idleCls}`;
}
