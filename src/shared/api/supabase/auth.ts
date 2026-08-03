import type { AuthError, Provider } from "@supabase/supabase-js";
import { supabase } from "./client";

export type SignUpParams = {
  email: string;
  password: string;
  name: string;
  furigana: string;
  marketingOptIn: boolean;
};

export async function signUpWithEmail(
  params: SignUpParams,
): Promise<{ error: string | null }> {
  const { email, password, name, furigana, marketingOptIn } = params;
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, furigana, marketing_opt_in: marketingOptIn },
    },
  });
  return { error: error ? mapAuthError(error) : null };
}

export async function signInWithOAuth(
  provider: "google" | "line",
): Promise<{ error: string | null }> {
  // "line"은 supabase-js의 내장 Provider 유니온에 없다 (Custom OAuth Provider로
  // Supabase Dashboard에 등록해야 런타임에서 동작). 타입만 캐스팅한다.
  const { error } = await supabase.auth.signInWithOAuth({
    provider: provider as Provider,
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
  return { error: error ? mapAuthError(error) : null };
}

export async function exchangeCodeForSession(
  code: string,
): Promise<{ error: string | null }> {
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return { error: error ? mapAuthError(error) : null };
}

function mapAuthError(error: AuthError): string {
  if (error.code === "user_already_exists" || error.code === "email_exists") {
    return "emailAlreadyExists";
  }
  if (error.code === "weak_password") {
    return "passwordTooWeak";
  }
  return "unknownError";
}
