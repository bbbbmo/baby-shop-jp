import type {
  AuthChangeEvent,
  AuthError,
  Provider,
  User,
} from "@supabase/supabase-js";
import type { Market } from "@/shared/config/markets";
import { supabase } from "./client";

export type SignUpParams = {
  email: string;
  password: string;
  name: string;
  consentTerms: boolean;
  consentPrivacy: boolean;
  consentMarketing: boolean;
};

export async function signUpWithEmail(
  params: SignUpParams
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signUp({
    email: params.email,
    password: params.password,
    options: {
      data: toSignUpMetadata(params),
      // emailRedirectTo를 안 넘기면 Supabase 대시보드에 고정된 Site URL로
      // 확인 메일 링크가 가버려, 배포 도메인에서 가입해도 로컬 주소 등
      // 엉뚱한 곳으로 리다이렉트된다. signInWithOAuth와 동일하게 실제
      // 요청이 온 origin을 그대로 넘긴다.
      emailRedirectTo: window.location.origin,
    },
  });
  return { error: error ? mapAuthError(error) : null };
}

// 이메일 가입은 signUp 반환 시점에 세션이 없어 RLS insert가 막힌다.
// 이 키들을 DB 트리거(handle_new_user_consents)가 읽어 user_consents에 기록한다.
function toSignUpMetadata(params: SignUpParams): Record<string, unknown> {
  return {
    name: params.name,
    consent_terms: params.consentTerms,
    consent_privacy: params.consentPrivacy,
    consent_marketing: params.consentMarketing,
  };
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error ? mapAuthError(error) : null };
}

export async function signInWithOAuth(
  provider: "google" | "line" | "kakao",
  from: "signup" | "signin",
  market: Market
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: toSupabaseProvider(provider),
    options: {
      redirectTo: `${window.location.origin}/${market}/auth/callback?from=${from}`,
    },
  });
  return { error: error ? mapAuthError(error) : null };
}

// "line"은 supabase-js의 내장 Provider 유니온에 없다 — Supabase Dashboard에
// Custom OAuth Provider로 등록한 식별자(custom:line)를 그대로 넘겨야 한다.
function toSupabaseProvider(provider: "google" | "line" | "kakao"): Provider {
  return (provider === "line" ? "custom:line" : provider) as Provider;
}

// getSession()은 내부적으로 클라이언트 초기화(initializePromise) 완료를
// 기다린다. OAuth 콜백 화면에서는 detectSessionInUrl이 수행하는 코드 교환이
// 끝난 뒤의 결과를 보게 되므로, 교환 완료를 기다리는 용도로도 안전하다.
export async function hasSession(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return data.session !== null;
}

export async function signOut(): Promise<{ error: string | null }> {
  // scope: "local" — 이 기기의 세션만 종료한다. 기본값(global)은 모든 기기의
  // refresh token을 무효화해 다른 기기까지 로그아웃시킨다.
  const { error } = await supabase.auth.signOut({ scope: "local" });
  return { error: error ? mapAuthError(error) : null };
}

export async function updateProfile(params: {
  name: string;
  furigana: string;
  phone: string;
}): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.updateUser({ data: params });
  return { error: error ? mapAuthError(error) : null };
}

// current_password를 함께 넘기면 GoTrue가 서버에서 검증한다. 클라이언트에서
// signInWithPassword로 확인하는 방식은 개발자도구로 우회할 수 있고,
// 실패한 로그인 시도 기록도 지저분해진다.
export async function changePassword(params: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.updateUser({
    current_password: params.currentPassword,
    password: params.newPassword,
  });
  return { error: error ? mapAuthError(error) : null };
}

// 가입되지 않은 주소여도 Supabase는 메일을 안 보내고 에러도 내지 않는다.
// 계정 열거 방지가 기본으로 들어 있으므로 호출부는 결과를 구분하지 말 것.
export async function requestPasswordReset(
  email: string,
  redirectTo: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  return { error: error ? mapAuthError(error) : null };
}

// 비밀번호를 새로 정하고 다른 기기의 세션을 끊는다. 비밀번호를 잊어 재설정하는
// 상황은 계정을 빼앗겼을 가능성이 있어서다. scope "others"는 이 기기는 남긴다.
// 이미 발급된 access token은 만료 전까지 살아 있다 — 끊기는 건 refresh token이다.
export async function resetPassword(newPassword: string): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) {
    return { error: mapAuthError(error) };
  }
  await supabase.auth.signOut({ scope: "others" });
  return { error: null };
}

// 가입 경로 목록 ("email" · "kakao" · "google" · "line").
// 세션 안의 user 객체가 identities를 담는다는 보장이 없어 getUser()로 서버에
// 물어본다. 조회에 실패하면 null — 빈 배열로 뭉개면 "비밀번호가 없는 계정"과
// 구분되지 않아, 이메일 가입자에게 소셜 계정이라고 잘못 안내하게 된다.
export async function getIdentityProviders(): Promise<string[] | null> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }
  return (data.user.identities ?? []).map((identity) => identity.provider);
}

// 복구 링크는 두 형식으로 온다. 사용자가 화면에서 요청한 메일은 PKCE라
// "?code="로 오고 supabase-js가 알아서 교환하지만, 관리자 API·대시보드가
// 만든 링크는 "#access_token=..."(암시적 방식)으로 온다. 우리 클라이언트는
// PKCE 설정이라 후자를 그냥 흘려버려, 멀쩡한 링크가 "만료됨"으로 보였다.
// 해시에 토큰이 실려 있으면 직접 세션으로 세운다.
export async function restoreSessionFromUrlHash(): Promise<boolean> {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const access_token = params.get("access_token");
  const refresh_token = params.get("refresh_token");
  if (!access_token || !refresh_token) {
    return false;
  }
  const { error } = await supabase.auth.setSession({ access_token, refresh_token });
  // 토큰이 주소창에 남아 있으면 공유·기록으로 새 나간다.
  window.history.replaceState(null, "", window.location.pathname);
  return !error;
}

export function subscribeToAuthChanges(
  onChange: (user: User | null, event: AuthChangeEvent) => void
): () => void {
  // onAuthStateChange는 등록 즉시 INITIAL_SESSION 이벤트로 현재 세션(또는 null)을
  // 한 번 방출하므로, 별도의 getSession() 초기 조회는 불필요하며 경쟁 상태만 만든다.
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    onChange(session?.user ?? null, event);
  });

  return () => subscription.unsubscribe();
}

export type { User };

const AUTH_ERROR_CODES: Record<string, string> = {
  user_already_exists: "emailAlreadyExists",
  email_exists: "emailAlreadyExists",
  weak_password: "passwordTooWeak",
  invalid_credentials: "invalidCredentials",
  email_not_confirmed: "emailNotConfirmed",
  // 새 비밀번호가 기존과 같을 때. 폼에서 미리 거르지만 서버도 거절한다.
  same_password: "samePassword",
};

// 알려진 케이스가 아니면 원래 코드(없으면 에러 클래스 이름)를 그대로
// 내보낸다. UI는 어차피 errors[code] ?? errors.unknownError로 안전하게
// 폴백해 문구는 그대로면서, URL(authError=...)에 실제 원인이 남아 다음
// 재현 때 바로 알 수 있다.
function mapAuthError(error: AuthError): string {
  return AUTH_ERROR_CODES[error.code ?? ""] ?? error.code ?? error.name ?? "unknownError";
}
