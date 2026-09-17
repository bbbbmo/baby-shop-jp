import { notFound } from "next/navigation";
import { isMarket, marketLocale } from "@/shared/config/markets";
import { MarketProvider } from "@/shared/market";
import { LocaleProvider } from "@/shared/i18n/LocaleProvider";
import { RootDocument, siteMetadata } from "@/app/_document/RootDocument";

export const metadata = siteMetadata;

// 쇼핑 화면의 루트 레이아웃. params로 마켓을 직접 받아 <html lang>을 정한다.
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
  const locale = marketLocale(market);
  return (
    <RootDocument lang={locale}>
      <MarketProvider market={market}>
        <LocaleProvider initialLocale={locale}>{children}</LocaleProvider>
      </MarketProvider>
    </RootDocument>
  );
}
