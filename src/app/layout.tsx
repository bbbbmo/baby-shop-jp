import type { Metadata } from "next";
import { headers } from "next/headers";
import {
  Noto_Sans_JP,
  Noto_Sans_KR,
  Zilla_Slab,
  Noto_Serif_JP,
  Noto_Serif_KR,
  IBM_Plex_Mono,
  IBM_Plex_Sans_JP,
  IBM_Plex_Sans_KR,
} from "next/font/google";
import "./globals.css";
import { MARKET_HEADER, isMarket, marketLocale } from "@/shared/config/markets";
import { FontModeProvider } from "@/shared/i18n/FontModeProvider";
import { SessionProvider } from "@/entities/auth";
import { QueryProvider } from "@/shared/api/QueryProvider";

const notoJp = Noto_Sans_JP({
  variable: "--font-noto-jp",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const notoKr = Noto_Sans_KR({
  variable: "--font-noto-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const zillaSlab = Zilla_Slab({
  variable: "--font-zilla",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const notoSerifJp = Noto_Serif_JP({
  variable: "--font-noto-serif-jp",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const notoSerifKr = Noto_Serif_KR({
  variable: "--font-noto-serif-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const plexSansJp = IBM_Plex_Sans_JP({
  variable: "--font-plex-sans-jp",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

const plexSansKr = IBM_Plex_Sans_KR({
  variable: "--font-plex-sans-kr",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  display: "swap",
});

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
    <html lang={lang} className={`${notoJp.variable} ${notoKr.variable} ${zillaSlab.variable} ${notoSerifJp.variable} ${notoSerifKr.variable} ${plexMono.variable} ${plexSansJp.variable} ${plexSansKr.variable} h-full`}>
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
