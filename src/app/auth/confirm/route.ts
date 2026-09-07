import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createServerAuthClient } from "@/shared/api/supabase/serverAuthClient";
import { siteOrigin } from "@/shared/lib/siteOrigin";
import { relativeToOrigin, resolveConfirmDestination } from "@/entities/auth";

const EMAIL_OTP_TYPES: EmailOtpType[] = [
  "signup", "invite", "magiclink", "recovery", "email_change", "email",
];

// 메일 링크가 도착하는 자리다. token_hash를 서버에서 검증해 세션 쿠키를 심는다.
// 브라우저 쪽 PKCE 교환(?code=)은 가입한 브라우저에서만 되는데, 메일 링크는
// 메일 앱의 내장 브라우저나 다른 기기에서 열리는 일이 흔하다. 서버 검증은
// 어디서 열어도 된다.
export async function GET(request: Request): Promise<never> {
  const url = new URL(request.url);
  const verified = await verify(url.searchParams.get("token_hash"), url.searchParams.get("type"));
  const next = relativeToOrigin(url.searchParams.get("next"), siteOrigin(request));
  // redirect()는 예외를 던지는 방식이라 try 밖에서 불러야 한다.
  redirect(resolveConfirmDestination({ verified, next }));
}

async function verify(tokenHash: string | null, type: string | null): Promise<boolean> {
  if (!tokenHash || !isEmailOtpType(type)) {
    return false;
  }
  const supabase = await createServerAuthClient();
  const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
  return !error;
}

function isEmailOtpType(value: string | null): value is EmailOtpType {
  return EMAIL_OTP_TYPES.includes(value as EmailOtpType);
}
