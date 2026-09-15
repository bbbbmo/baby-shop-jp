import { describe, expect, it } from "vitest";
import { sendWithResend } from "./resend";

const config = { apiKey: "re_test", from: "COMO <no-reply@shop.example>" };
const mail = { to: "a@b.c", subject: "hi", html: "<p>hi</p>" };

describe("sendWithResend", () => {
  it("posts the mail to the Resend API with the bearer key and sender", async () => {
    let captured: { url: string; init: RequestInit } | null = null;
    const fetchImpl: typeof fetch = async (url, init) => {
      captured = { url: String(url), init: init ?? {} };
      return new Response(JSON.stringify({ id: "m1" }), { status: 200 });
    };
    const result = await sendWithResend(mail, config, fetchImpl);
    expect(result.error).toBeNull();
    expect(captured!.url).toBe("https://api.resend.com/emails");
    expect((captured!.init.headers as Record<string, string>).Authorization).toBe("Bearer re_test");
    expect(JSON.parse(String(captured!.init.body))).toMatchObject({ from: config.from, to: ["a@b.c"] });
  });

  it("surfaces the provider message when Resend rejects the mail", async () => {
    const fetchImpl: typeof fetch = async () =>
      new Response(JSON.stringify({ message: "domain not verified" }), { status: 403 });
    const result = await sendWithResend(mail, config, fetchImpl);
    expect(result.error).toBe("domain not verified");
  });
});
