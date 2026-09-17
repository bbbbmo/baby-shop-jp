import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { fontVariables } from "@/shared/config/fonts";
import { MARKET_HEADER, isMarket, marketLocale } from "@/shared/config/markets";
import { FontModeProvider } from "@/shared/i18n/FontModeProvider";
import { SessionProvider } from "@/entities/auth";
import { QueryProvider } from "@/shared/api/QueryProvider";

export const metadata: Metadata = {
  title: "COMO | やさしいベビー服",
  description: "赤ちゃんにやさしい素材のベビー服セレクトショップ（デモ）",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // proxy가 경로에서 읽어 넘긴 마켓. 마켓 밖 화면(/admin 등)에서는 없다.
  const market = (await headers()).get(MARKET_HEADER);
  const lang = isMarket(market) ? marketLocale(market) : "ja";

  return (
    <html lang={lang} className={`${fontVariables} h-full`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <QueryProvider>
          <SessionProvider>
            <FontModeProvider>{children}</FontModeProvider>
          </SessionProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
