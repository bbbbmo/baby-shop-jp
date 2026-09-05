import { describe, expect, it } from "vitest";
import { authCallbackRedirectTo } from "./authCallbackRedirectTo";

describe("authCallbackRedirectTo", () => {
  it("sends email confirmation to the market auth callback, not the site origin", () => {
    expect(authCallbackRedirectTo("https://shop.example", "jp", "signup")).toBe(
      "https://shop.example/jp/auth/callback?from=signup",
    );
  });
});
