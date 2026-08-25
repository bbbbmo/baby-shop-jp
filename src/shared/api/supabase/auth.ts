import type { AuthChangeEvent, AuthError, Provider, User } from "@supabase/supabase-js";
import { supabase } from "./client";

export type SignUpParams = {
  email: string;
  password: string;
  name: string;
  furigana: string;
  phone: string;
  marketingOptIn: boolean;
};

export async function signUpWithEmail(
  params: SignUpParams,
): Promise<{ error: string | null }> {
  const { email, password, name, furigana, phone, marketingOptIn } = params;
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, furigana, phone, marketing_opt_in: marketingOptIn },
      // emailRedirectTo를 안 넘기면 Supabase 대시보드에 고정된 Site URL로
      // 확인 메일 링크가 가버려, 배포 도메인에서 가입해도 로컬 주소 등
      // 엉뚱한 곳으로 리다이렉트된다. signInWithOAuth와 동일하게 실제
      // 요청이 온 origin을 그대로 넘긴다.
      emailRedirectTo: window.location.origin,
    },
  });
  return { error: error ? mapAuthError(error) : null };
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error ? mapAuthError(error) : null };
}

export async function signInWithOAuth(
  provider: "google" | "line",
  from: "signup" | "signin",
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: toSupabaseProvider(provider),
    options: { redirectTo: `${window.location.origin}/auth/callback?from=${from}` },
  });
  return { error: error ? mapAuthError(error) : null };
}

// "line"은 supabase-js의 내장 Provider 유니온에 없다 — Supabase Dashboard에
// Custom OAuth Provider로 등록한 식별자(custom:line)를 그대로 넘겨야 한다.
function toSupabaseProvider(provider: "google" | "line"): Provider {
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

export function subscribeToAuthChanges(
  onChange: (user: User | null, event: AuthChangeEvent) => void,
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

function mapAuthError(error: AuthError): string {
  if (error.code === "user_already_exists" || error.code === "email_exists") {
    return "emailAlreadyExists";
  }
  if (error.code === "weak_password") {
    return "passwordTooWeak";
  }
  if (error.code === "invalid_credentials") {
    return "invalidCredentials";
  }
  if (error.code === "email_not_confirmed") {
    return "emailNotConfirmed";
  }
  // 알려진 케이스가 아니면 원래 코드(없으면 에러 클래스 이름)를 그대로
  // 내보낸다. UI는 어차피 errors[code] ?? errors.unknownError로 안전하게
  // 폴백해 문구는 그대로면서, URL(authError=...)에 실제 원인이 남아 다음
  // 재현 때 바로 알 수 있다.
  return error.code ?? error.name ?? "unknownError";
}
