import { NextResponse } from "next/server";
import { verifySendEmailHook, type SendEmailHookPayload } from "@/shared/api/supabase/sendEmailHook";
import { sendEmail } from "@/shared/api/email";
import { buildConfirmLink, localeFromRedirect, renderAuthEmail } from "@/entities/auth-email";

// Supabase Auth의 Send Email Hook이 부르는 자리다. 인증 메일을 Supabase 대신
// 우리가 보낸다 — 기본 SMTP는 팀 멤버 주소에만 배달되고, 언어도 하나뿐이다.
// 응답 규약: 성공은 200 + {}, 실패는 {error:{http_code,message}}. 실패로
// 답하면 Supabase가 가입·재설정 요청 자체를 실패로 돌려 사용자에게 알린다.
export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.text();
  const parsed = parse(body, request);
  if (!parsed) {
    return failure(401, "invalid webhook signature");
  }
  return await deliver(parsed);
}

function parse(body: string, request: Request): SendEmailHookPayload | null {
  const secret = process.env.SEND_EMAIL_HOOK_SECRET;
  if (!secret) {
    return null;
  }
  try {
    return verifySendEmailHook(body, Object.fromEntries(request.headers), secret);
  } catch {
    return null;
  }
}

async function deliver(payload: SendEmailHookPayload): Promise<NextResponse> {
  const { email_data: data, user } = payload;
  const link = buildConfirmLink({
    redirectTo: data.redirect_to,
    siteUrl: data.site_url,
    tokenHash: data.token_hash,
    type: data.email_action_type,
  });
  const mail = renderAuthEmail({ type: data.email_action_type, locale: localeFromRedirect(data.redirect_to), link });
  if (!mail) {
    // 템플릿이 없는 액션은 보내지 않되 요청은 성공으로 답한다. 실패로 답하면
    // 사용자의 원래 요청까지 막힌다. 어떤 액션이 빠졌는지는 로그로 남긴다.
    console.warn(`[send-email] no template for action: ${data.email_action_type}`);
    return NextResponse.json({});
  }
  const { error } = await sendEmail({ to: user.email, ...mail });
  return error ? failure(500, error) : NextResponse.json({});
}

function failure(status: number, message: string): NextResponse {
  return NextResponse.json({ error: { http_code: status, message } }, { status });
}
