import { describe, expect, it } from "vitest";
import { Webhook } from "standardwebhooks";
import { verifySendEmailHook } from "./sendEmailHook";

const rawSecret = Buffer.from("test-secret-test-secret-1234").toString("base64");
const body = JSON.stringify({
  user: { id: "u1", email: "a@b.c", user_metadata: { name: "Aoi" } },
  email_data: {
    token: "123456",
    token_hash: "hash",
    redirect_to: "https://shop.example/jp/auth/confirmed",
    email_action_type: "signup",
    site_url: "https://shop.example",
  },
});

function signedHeaders(secret: string, payload: string): Record<string, string> {
  const id = "msg_1";
  const timestamp = new Date();
  const signature = new Webhook(secret).sign(id, timestamp, payload);
  return {
    "webhook-id": id,
    "webhook-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
    "webhook-signature": signature,
  };
}

describe("verifySendEmailHook", () => {
  it("accepts a payload signed with the dashboard secret, prefix included", () => {
    const parsed = verifySendEmailHook(body, signedHeaders(rawSecret, body), `v1,whsec_${rawSecret}`);
    expect(parsed.user.email).toBe("a@b.c");
    expect(parsed.email_data.email_action_type).toBe("signup");
  });

  it("rejects a payload signed with a different secret", () => {
    const other = Buffer.from("other-secret-other-secret-99").toString("base64");
    expect(() => verifySendEmailHook(body, signedHeaders(other, body), `v1,whsec_${rawSecret}`)).toThrow();
  });
});
