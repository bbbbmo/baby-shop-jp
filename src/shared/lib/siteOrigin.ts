// 결제사에 넘기는 복귀 URL은 절대 URL이어야 한다. 프록시 뒤에 서면 요청 URL의
// 호스트가 내부 주소일 수 있으므로 SITE_URL을 우선한다.
// 배포처가 정해지면 그 값을 .env에 넣는다.
//
// NEXT_PUBLIC_ 접두사를 쓰지 않는다. 이 값을 읽는 곳은 서버뿐이고, 접두사를
// 붙이면 쓰지도 않는 값이 클라이언트 번들에 실린다.
//
// URL로 파싱해서 오리진만 남긴다. 끝 슬래시·경로가 함께 정리되고, 오타처럼
// URL이 아닌 값은 여기서 바로 던진다 — 조용히 넘어가면 결제 복귀가 엉뚱한
// 곳으로 가고, 그건 실제 결제 때나 드러난다.
export function resolveSiteOrigin(
  configured: string | undefined,
  requestUrl: string,
): string {
  if (!configured) {
    return new URL(requestUrl).origin;
  }
  return new URL(configured).origin;
}

export function siteOrigin(request: Request): string {
  return resolveSiteOrigin(process.env.SITE_URL, request.url);
}
