import { DEFAULT_MARKET, isMarket, type Market } from "@/shared/config/markets";

export type ConfirmParams = {
  verified: boolean;
  next: string | null;
};

// /auth/confirm 라우트가 어디로 보낼지만 정하는 순수 함수.
// next는 메일 링크에 실려 오는 값이라 믿을 수 없다. 같은 사이트 안의
// 상대 경로만 받아들이고, 절대 URL·프로토콜 상대 URL("//evil")은 버린다.
export function resolveConfirmDestination({ verified, next }: ConfirmParams): string {
  const safeNext = safeRelativePath(next);
  const market = marketOfPath(safeNext);
  if (!verified) {
    return `/${market}/auth/confirmed?error=expired`;
  }
  return safeNext ?? `/${market}/auth/confirmed`;
}

function safeRelativePath(value: string | null): string | null {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return null;
  }
  return value;
}

function marketOfPath(path: string | null): Market {
  const first = path?.split("/")[1];
  return isMarket(first) ? first : DEFAULT_MARKET;
}

// 대시보드 템플릿의 {{ .RedirectTo }}는 절대 URL로 온다. 우리 사이트 것이면
// 경로만 남기고, 다른 오리진이면 버린다. 상대 경로는 그대로 통과한다.
export function relativeToOrigin(value: string | null, origin: string): string | null {
  if (!value) {
    return null;
  }
  if (value.startsWith("/")) {
    return value;
  }
  try {
    const url = new URL(value);
    return url.origin === origin ? `${url.pathname}${url.search}` : null;
  } catch {
    return null;
  }
}
