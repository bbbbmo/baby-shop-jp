import { beforeEach, describe, expect, it, vi } from "vitest";
import { Webhook } from "standardwebhooks";

type Mail = { to: string; subject: string; html: string };
const sendEmail = vi.fn<(mail: Mail) => Promise<{ error: string | null }>>(async () => ({ error: null }));
vi.mock("@/shared/api/email", () => ({ sendEmail: (mail: Mail) => sendEmail(mail) }));

const rawSecret = Buffer.from("test-secret-test-secret-1234").toString("base64");
process.env.SEND_EMAIL_HOOK_SECRET = `v1,whsec_${rawSecret}`;

const { POST } = await import("./route");

function payload(type: string, redirectTo: string): string {
  return JSON.stringify({
    user: { id: "u1", email: "a@b.c" },
    email_data: {
      token: "1",
      token_hash: "hash",
      redirect_to: redirectTo,
      email_action_type: type,
      site_url: "https://shop.example",
    },
  });
}

function signedRequest(body: string, secret = rawSecret): Request {
  const timestamp = new Date();
  const signature = new Webhook(secret).sign("msg_1", timestamp, body);
  return new Request("http://localhost/api/auth/send-email", {
    method: "POST",
    body,
    headers: {
      "content-type": "application/json",
      "webhook-id": "msg_1",
      "webhook-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
      "webhook-signature": signature,
    },
  });
}

describe("POST /api/auth/send-email", () => {
  beforeEach(() => sendEmail.mockClear());

  it("rejects a request whose signature does not match the hook secret", async () => {
    const other = Buffer.from("other-secret-other-secret-99").toString("base64");
    const response = await POST(signedRequest(payload("signup", "https://shop.example/jp/x"), other));
    expect(response.status).toBe(401);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("sends the korean signup mail with a confirm link when the user came from /kr", async () => {
    const response = await POST(signedRequest(payload("signup", "https://shop.example/kr/auth/confirmed")));
    expect(response.status).toBe(200);
    const [mail] = sendEmail.mock.calls[0];
    expect(mail.to).toBe("a@b.c");
    expect(mail.subject).toMatch(/이메일/);
    expect(mail.html).toContain("https://shop.example/auth/confirm?token_hash=hash&amp;type=signup");
  });

  it("answers 200 without sending when there is no template for the action", async () => {
    const response = await POST(signedRequest(payload("email_change", "https://shop.example/jp/")));
    expect(response.status).toBe(200);
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("reports a provider failure so Supabase surfaces it instead of pretending success", async () => {
    sendEmail.mockResolvedValueOnce({ error: "domain not verified" });
    const response = await POST(signedRequest(payload("recovery", "https://shop.example/jp/auth/reset-password")));
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ error: { message: "domain not verified" } });
  });
});
