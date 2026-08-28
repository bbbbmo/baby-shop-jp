import { describe, expect, it } from "vitest";
import { resolvePostAuthDestination, type PostAuthParams } from "./postAuthDestination";

const base: PostAuthParams = {
  from: "signin",
  oauthError: null,
  hasCode: true,
  hasSession: true,
  hasConsent: true,
};

describe("resolvePostAuthDestination", () => {
  it("sends a fully authorized user home", () => {
    expect(resolvePostAuthDestination(base)).toBe("/");
  });

  it("sends a user without a consent record to the consent screen", () => {
    expect(resolvePostAuthDestination({ ...base, hasConsent: false })).toBe("/auth/consent");
  });

  it("returns to the originating page when the provider reports an error", () => {
    expect(
      resolvePostAuthDestination({ ...base, from: "signup", oauthError: "access_denied" }),
    ).toBe("/signup?authError=access_denied");
  });

  it("treats a missing code as a cancelled login", () => {
    expect(resolvePostAuthDestination({ ...base, hasCode: false })).toBe(
      "/signin?authError=oauthCancelled",
    );
  });

  it("reports an unknown error when the code exchange left no session", () => {
    expect(resolvePostAuthDestination({ ...base, hasSession: false })).toBe(
      "/signin?authError=unknownError",
    );
  });

  it("prefers the provider error over the missing session", () => {
    expect(
      resolvePostAuthDestination({ ...base, oauthError: "server_error", hasSession: false }),
    ).toBe("/signin?authError=server_error");
  });
});
