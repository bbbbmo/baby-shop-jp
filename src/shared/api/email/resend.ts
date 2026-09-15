export type OutgoingEmail = { to: string; subject: string; html: string };
export type ResendConfig = { apiKey: string; from: string };

// Resend REST API를 fetch로 직접 부른다. SDK를 들이면 의존성만 늘고,
// 보내는 건 이 한 요청뿐이다. 실패 사유는 그대로 돌려준다 — 도메인 미인증
// 같은 설정 문제는 사람이 읽어야 고친다.
export async function sendWithResend(
  mail: OutgoingEmail,
  config: ResendConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<{ error: string | null }> {
  const response = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: config.from, to: [mail.to], subject: mail.subject, html: mail.html }),
  });
  return { error: response.ok ? null : await readError(response) };
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    return body.message ?? `resend responded ${response.status}`;
  } catch {
    return `resend responded ${response.status}`;
  }
}
