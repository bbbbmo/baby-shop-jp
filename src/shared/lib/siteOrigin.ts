// 결제사에 넘기는 복귀 URL은 절대 URL이어야 한다. 프록시 뒤에 서면 요청 URL의
// 호스트가 내부 주소일 수 있으므로 NEXT_PUBLIC_SITE_URL을 우선한다.
// 배포처가 정해지면 그 값을 .env에 넣는다.
export function resolveSiteOrigin(configured: string | undefined, requestUrl: string): string {
  if (configured) {
    return configured.replace(/\/+$/, "");
  }
  return new URL(requestUrl).origin;
}

export function siteOrigin(request: Request): string {
  return resolveSiteOrigin(process.env.NEXT_PUBLIC_SITE_URL, request.url);
}
