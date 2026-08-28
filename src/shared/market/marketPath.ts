import { isMarket, type Market } from "@/shared/config/markets";

// /admin은 마켓과 무관한 공용 화면이라 접두사를 붙이지 않는다.
const MARKET_FREE_PREFIXES = ["/admin"];

// 링크 호출부가 href 문자열을 고치지 않아도 되도록, 접두사 판단을 여기서 전부 한다.
// 이미 마켓이 붙은 경로는 목적 마켓으로 갈아끼운다 — 마켓 전환 시 현재 경로를 유지하는 데 쓴다.
export function marketPath(market: Market, path: string): string {
  if (!path.startsWith("/")) {
    return path;
  }
  if (MARKET_FREE_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
    return path;
  }
  // stripMarket이 루트를 "/"로 돌려주므로 그대로 이으면 "/kr/"가 된다.
  const rest = stripMarket(path);
  return rest === "/" ? `/${market}` : `/${market}${rest}`;
}

export function stripMarket(path: string): string {
  const [, first, ...rest] = path.split("/");
  if (!isMarket(first)) {
    return path;
  }
  // 마켓 뒤 첫 세그먼트가 비어 있으면("/kr//evil.com") 그대로 이었을 때
  // "//evil.com" — 브라우저가 외부 사이트로 해석하는 프로토콜 상대 URL이 된다.
  const rest_ = rest.join("/").replace(/^\/+/, "");
  return rest_ === "" ? "/" : `/${rest_}`;
}
