// 재설정 링크를 타고 온 화면이 무엇을 보여줄지 정한다.
// entities/auth/postAuthDestination.ts와 같은 모양의 순수 판단 함수다.
export type ResetState = "expired" | "socialOnly" | "ready";

// 소셜 로그인 계정에는 비밀번호가 없다. 그대로 updateUser를 부르면 identities에
// 잡히지 않는 비밀번호가 생긴다(supabase/discussions#37737의 ghost password).
// 조회에 실패해 providers가 비어 오면 막는 쪽으로 틀린다.
export function resolveResetState(input: {
  hasSession: boolean;
  providers: string[];
}): ResetState {
  if (!input.hasSession) {
    return "expired";
  }
  return input.providers.includes("email") ? "ready" : "socialOnly";
}

// 안내할 소셜 서비스 이름. 여러 개면 첫 번째를 쓴다.
// 고를 게 없으면 null — 화면이 이름 없는 일반 문구로 떨어진다.
export function primarySocialProvider(providers: string[]): string | null {
  return providers.find((provider) => provider !== "email") ?? null;
}
