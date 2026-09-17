import { RootDocument, siteMetadata } from "@/app/_document/RootDocument";

export const metadata = siteMetadata;

// 마켓을 고르기 전 화면(/)의 루트 레이아웃. 언어를 아직 모르므로 기본 마켓의 언어를 쓴다.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <RootDocument lang="ja">{children}</RootDocument>;
}
