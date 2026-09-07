import { Webhook } from "standardwebhooks";

// Supabase Send Email Hook이 보내는 본문. 쓰는 필드만 적는다.
export type SendEmailHookPayload = {
  user: {
    id: string;
    email: string;
    user_metadata?: Record<string, unknown>;
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
};

// 대시보드가 발급하는 secret은 "v1,whsec_<base64>" 형식이고, 서명 검증에는
// base64 부분만 쓴다. 검증에 실패하면 그대로 던진다 — 서명 없는 요청으로
// 아무에게나 인증 메일을 보내게 두면 안 된다.
export function verifySendEmailHook(
  payload: string,
  headers: Record<string, string>,
  secret: string,
): SendEmailHookPayload {
  const webhook = new Webhook(secret.replace(/^v1,whsec_/, ""));
  return webhook.verify(payload, headers) as SendEmailHookPayload;
}
