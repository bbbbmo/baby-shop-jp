import { createClient } from "@supabase/supabase-js";

// service-role 키를 쓰는 클라이언트 — RLS를 우회하므로 Route Handler 등
// 서버 전용 코드에서만 import 한다. "use client" 컴포넌트에서 절대 import 금지.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.",
  );
}

export const supabaseServer = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
