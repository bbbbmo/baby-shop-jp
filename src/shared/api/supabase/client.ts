import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 설정되지 않았습니다.",
  );
}

// createBrowserClient는 PKCE 플로우 + 쿠키 저장을 기본으로 쓴다
// (localStorage 대신) — OAuth 리다이렉트를 왕복하는 사이 code_verifier가
// 유실되던 문제(pkce_code_verifier_not_found)를 근본적으로 해결한다.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
