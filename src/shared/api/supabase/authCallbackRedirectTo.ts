import type { Market } from "@/shared/config/markets";

// 확인 메일·OAuth가 마켓 루트가 아니라 콜백에서 세션을 만들게 한다.
export function authCallbackRedirectTo(
  origin: string,
  market: Market,
  from: "signup" | "signin",
): string {
  return `${origin}/${market}/auth/callback?from=${from}`;
}
