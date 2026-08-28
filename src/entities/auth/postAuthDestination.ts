export type PostAuthParams = {
  from: "signup" | "signin";
  oauthError: string | null;
  hasCode: boolean;
  hasSession: boolean;
  hasConsent: boolean;
};

// OAuth 콜백에서 어디로 보낼지만 정하는 순수 함수. I/O를 섞지 않아 테스트할 수 있다.
export function resolvePostAuthDestination(params: PostAuthParams): string {
  const { from, oauthError, hasCode, hasSession, hasConsent } = params;
  if (oauthError || !hasCode) {
    return `/${from}?authError=${oauthError ?? "oauthCancelled"}`;
  }
  if (!hasSession) {
    return `/${from}?authError=unknownError`;
  }
  return hasConsent ? "/" : "/auth/consent";
}
