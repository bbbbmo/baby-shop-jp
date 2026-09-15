import { sendWithResend, type OutgoingEmail } from "./resend";

export type { OutgoingEmail };

// 발송 서비스를 감싸는 유일한 진입점. 상위 레이어는 Resend를 모른다 —
// 서비스를 바꾸면 이 함수의 구현만 바뀐다.
export async function sendEmail(mail: OutgoingEmail): Promise<{ error: string | null }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    return { error: "RESEND_API_KEY / EMAIL_FROM 환경변수가 설정되지 않았습니다." };
  }
  return sendWithResend(mail, { apiKey, from });
}
