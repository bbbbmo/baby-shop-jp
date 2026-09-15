import type { Market } from "@/shared/config/markets";

// 확인 메일·OAuth가 마켓 루트가 아니라 콜백에서 세션을 만들게 한다.
export function authCallbackRedirectTo(
  origin: string,
  market: Market,
  from: "signup" | "signin",
): string {
  return `${origin}/${market}/auth/callback?from=${from}`;
}

// 확인 메일 링크가 인증을 마친 뒤 도착하는 화면. 세션은 /auth/confirm 라우트가
// 서버에서 만들어 두므로, 이 화면은 안내만 한다.
export function authConfirmedRedirectTo(origin: string, market: Market): string {
  return `${origin}/${market}/auth/confirmed`;
}
