// 재설정 링크를 타고 온 화면이 무엇을 보여줄지 정한다.
// entities/auth/postAuthDestination.ts와 같은 모양의 순수 판단 함수다.
export type ResetState = "expired" | "unknown" | "socialOnly" | "ready";

// 소셜 로그인 계정에는 비밀번호가 없다. 그대로 updateUser를 부르면 identities에
// 잡히지 않는 비밀번호가 생긴다(supabase/discussions#37737의 ghost password).
//
// providers가 null이면 가입 경로를 확인하지 못한 것이라 소셜 계정과 구분한다.
// 뭉개면 이메일 가입자에게 "소셜로 가입한 계정"이라고 잘못 안내하게 되고,
// 복구 링크는 일회용이라 그 사람은 그대로 막힌다.
export function resolveResetState(input: {
  hasSession: boolean;
  providers: string[] | null;
}): ResetState {
  if (!input.hasSession) {
    return "expired";
  }
  if (input.providers === null) {
    return "unknown";
  }
  return input.providers.includes("email") ? "ready" : "socialOnly";
}

// 안내할 소셜 서비스 이름. 여러 개면 첫 번째를 쓴다.
// 고를 게 없으면 null — 화면이 이름 없는 일반 문구로 떨어진다.
export function primarySocialProvider(providers: string[]): string | null {
  return providers.find((provider) => provider !== "email") ?? null;
}
