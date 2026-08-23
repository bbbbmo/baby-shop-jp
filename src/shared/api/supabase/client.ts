import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 설정되지 않았습니다.",
  );
}

// supabase-js 기본값은 flowType: "implicit"이라, OAuth 성공 시 세션 토큰이
// URL 쿼리(code)가 아니라 해시 프래그먼트(#access_token=...)로 온다.
// auth/callback 페이지는 code를 exchangeCodeForSession으로 교환하는
// PKCE 흐름을 전제로 하므로, implicit 기본값에서는 code가 항상 없다고
// 판단해 로그인이 실제로는 성공했는데도 "취소됨"으로 잘못 표시된다.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { flowType: "pkce" },
});
