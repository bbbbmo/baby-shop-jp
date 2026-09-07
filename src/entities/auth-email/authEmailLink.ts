import { isMarket, marketLocale } from "@/shared/config/markets";
import type { Locale } from "@/shared/i18n/types";

export type ConfirmLinkParams = {
  redirectTo: string;
  siteUrl: string;
  tokenHash: string;
  type: string;
};

// 링크의 오리진은 Site URL이 아니라 사용자가 가입한 곳(redirect_to)을 따른다.
// 로컬에서 가입했는데 배포 도메인의 /auth/confirm으로 보내면 세션 쿠키가
// 엉뚱한 도메인에 생긴다. redirect_to는 Supabase 허용 목록을 이미 통과한 값이다.
export function buildConfirmLink(params: ConfirmLinkParams): string {
  const target = parseUrl(params.redirectTo) ?? parseUrl(params.siteUrl);
  const origin = target?.origin ?? params.siteUrl;
  const next = target ? `${target.pathname}${target.search}` : "/";
  const query = new URLSearchParams({
    token_hash: params.tokenHash,
    type: params.type,
    next,
  });
  return `${origin}/auth/confirm?${query.toString()}`;
}

export function localeFromRedirect(redirectTo: string): Locale {
  const first = parseUrl(redirectTo)?.pathname.split("/")[1];
  return isMarket(first) ? marketLocale(first) : "ja";
}

function parseUrl(value: string): URL | null {
  try {
    return value ? new URL(value) : null;
  } catch {
    return null;
  }
}
