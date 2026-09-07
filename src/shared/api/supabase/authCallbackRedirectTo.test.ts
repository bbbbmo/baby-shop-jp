import { describe, expect, it } from "vitest";
import { authCallbackRedirectTo, authConfirmedRedirectTo } from "./authCallbackRedirectTo";

describe("authCallbackRedirectTo", () => {
  it("sends email confirmation to the market auth callback, not the site origin", () => {
    expect(authCallbackRedirectTo("https://shop.example", "jp", "signup")).toBe(
      "https://shop.example/jp/auth/callback?from=signup",
    );
  });
});

describe("authConfirmedRedirectTo", () => {
  it("lands the confirm link on the market confirmed screen", () => {
    expect(authConfirmedRedirectTo("https://shop.example", "kr")).toBe(
      "https://shop.example/kr/auth/confirmed",
    );
  });
});
