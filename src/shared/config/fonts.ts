import {
  IBM_Plex_Mono,
  IBM_Plex_Sans_JP,
  IBM_Plex_Sans_KR,
  Noto_Sans_JP,
  Noto_Sans_KR,
  Noto_Serif_JP,
  Noto_Serif_KR,
  Zilla_Slab,
} from "next/font/google";

// next/font를 부르는 유일한 파일. 화면 코드는 폰트 이름을 모른다 —
// globals.css의 역할 토큰(--font-body, --font-brand)만 쓴다.
// 폰트를 빼거나 바꿀 때는 여기 목록과 globals.css의 토큰 두 줄만 고친다.
//
// 옵션을 변수로 묶어 스프레드하면 안 된다. next/font는 빌드 시 호출 인자를
// 정적으로 읽어 폰트 파일을 내려받으므로, 리터럴이 아니면 "Missing weight"로 실패한다.

// --font-brand (로고)
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

// --font-body 기본(slab)
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

// --font-body 토글(mono). 폰트 토글을 없앨 때 이 세 정의와 globals.css의
// html.font-mode-mono 블록을 함께 지운다.
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

// <html>에 붙일 CSS 변수 클래스 묶음.
export const fontVariables = [
  notoJp, notoKr, zillaSlab, notoSerifJp, notoSerifKr, plexMono, plexSansJp, plexSansKr,
]
  .map((font) => font.variable)
  .join(" ");
