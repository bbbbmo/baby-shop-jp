import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { MARKET_HEADER, isMarket } from "@/shared/config/markets";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY 환경변수가 설정되지 않았습니다.",
  );
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  // 루트 레이아웃이 <html lang>을 정하려면 경로의 마켓을 알아야 하는데,
  // 레이아웃은 자기 아래 세그먼트의 params를 볼 수 없다. 요청 헤더로 넘긴다.
  const requestHeaders = new Headers(request.headers);
  const segment = request.nextUrl.pathname.split("/")[1];
  if (isMarket(segment)) {
    requestHeaders.set(MARKET_HEADER, segment);
  }
  const nextResponse = () => NextResponse.next({ request: { headers: requestHeaders } });

  let response = nextResponse();

  const supabase = createServerClient(
    supabaseUrl!,
    supabaseAnonKey!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          // 요청 헤더를 새로 만들어 넘기므로 갱신된 쿠키를 여기에도 반영해야
          // 이번 요청의 서버 컴포넌트가 새 세션을 본다. 빠지면 세션이 유실된다.
          requestHeaders.set("cookie", request.cookies.toString());
          response = nextResponse();
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // 세션이 있으면 필요 시 갱신해 쿠키에 반영한다. 실패(비로그인 포함)해도
  // 요청은 막지 않는다 — 실제 접근 차단은 /mypage, /admin, /api/admin/**가
  // 각자 담당한다.
  await supabase.auth.getClaims();

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
