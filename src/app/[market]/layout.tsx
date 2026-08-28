import { notFound } from "next/navigation";
import { isMarket, marketLocale } from "@/shared/config/markets";
import { MarketProvider } from "@/shared/market";
import { LocaleProvider } from "@/shared/i18n/LocaleProvider";

export default async function MarketLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ market: string }>;
}) {
  const { market } = await params;
  if (!isMarket(market)) {
    notFound();
  }
  return (
    <MarketProvider market={market}>
      <LocaleProvider initialLocale={marketLocale(market)}>{children}</LocaleProvider>
    </MarketProvider>
  );
}
