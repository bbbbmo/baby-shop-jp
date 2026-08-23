import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 설정되지 않았습니다.",
  );
}

// Server Component/Route Handler에서 매 요청마다 호출해 현재 쿠키를 읽는
// 서버 클라이언트를 만든다. Server Component에서는 쿠키를 쓸 수 없어
// setAll이 실패할 수 있는데, proxy.ts가 세션을 이미 갱신해 두므로 무시해도
// 안전하다 (Supabase 공식 패턴).
export async function createServerAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Component에서는 쿠키를 쓸 수 없다 — proxy.ts가 세션을
          // 갱신하므로 무시해도 안전하다.
        }
      },
    },
  });
}
