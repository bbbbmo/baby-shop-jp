import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DEFAULT_MARKET, type Market } from "@/shared/config/markets";

export default async function RootPage() {
  const acceptLanguage = (await headers()).get("accept-language") ?? "";
  redirect(`/${preferredMarket(acceptLanguage)}`);
}

// 브라우저 언어는 기본값을 정하는 데만 쓴다. 추정이 틀려도 화면 위쪽의
// 마켓 전환으로 바꿀 수 있으므로 사용자가 갇히지 않는다.
function preferredMarket(acceptLanguage: string): Market {
  const lower = acceptLanguage.toLowerCase();
  if (lower.startsWith("ko")) {
    return "kr";
  }
  if (lower.startsWith("ja")) {
    return "jp";
  }
  return DEFAULT_MARKET;
}
