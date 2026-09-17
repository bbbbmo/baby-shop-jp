import type { Metadata } from "next";
import type { Locale } from "@/shared/i18n/types";
import "../globals.css";
import { fontVariables } from "@/shared/config/fonts";
import { FontModeProvider } from "@/shared/i18n/FontModeProvider";
import { SessionProvider } from "@/entities/auth";
import { QueryProvider } from "@/shared/api/QueryProvider";

// 루트 레이아웃이 셋(shop · site · admin)이라 <html>·<body>·전역 프로바이더를
// 여기 한 번만 적는다. 루트를 나눈 이유는 <html lang>이다 — 레이아웃은 자기
// 아래 세그먼트의 params를 볼 수 없어서, 마켓별 lang을 찍으려면 [market]
// 레이아웃 자체가 루트여야 한다.
export const siteMetadata: Metadata = {
  title: "COMO | やさしいベビー服",
  description: "赤ちゃんにやさしい素材のベビー服セレクトショップ（デモ）",
};

export function RootDocument({ lang, children }: { lang: Locale; children: React.ReactNode }) {
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
