import type { Metadata } from "next";
import { Noto_Sans_JP, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/i18n/LocaleProvider";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

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

export const metadata: Metadata = {
  title: "KOMO | やさしいベビー服",
  description: "赤ちゃんにやさしい素材のベビー服セレクトショップ（デモ）",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${notoJp.variable} ${notoKr.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <LocaleProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </LocaleProvider>
      </body>
    </html>
  );
}
