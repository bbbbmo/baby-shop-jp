import { describe, expect, it } from "vitest";
import { buildConfirmLink, localeFromRedirect } from "./authEmailLink";

describe("buildConfirmLink", () => {
  it("points at the confirm route on the origin the user signed up from", () => {
    expect(
      buildConfirmLink({
        redirectTo: "http://localhost:3000/kr/auth/confirmed",
        siteUrl: "https://shop.example",
        tokenHash: "abc",
        type: "signup",
      }),
    ).toBe("http://localhost:3000/auth/confirm?token_hash=abc&type=signup&next=%2Fkr%2Fauth%2Fconfirmed");
  });

  it("keeps the query of the redirect target inside next", () => {
    expect(
      buildConfirmLink({
        redirectTo: "https://shop.example/jp/auth/callback?from=signup",
        siteUrl: "https://shop.example",
        tokenHash: "abc",
        type: "signup",
      }),
    ).toBe(
      "https://shop.example/auth/confirm?token_hash=abc&type=signup&next=%2Fjp%2Fauth%2Fcallback%3Ffrom%3Dsignup",
    );
  });

  it("falls back to the site url when redirect_to is empty or invalid", () => {
    expect(
      buildConfirmLink({ redirectTo: "", siteUrl: "https://shop.example", tokenHash: "x", type: "recovery" }),
    ).toBe("https://shop.example/auth/confirm?token_hash=x&type=recovery&next=%2F");
  });
});

describe("localeFromRedirect", () => {
  it("reads the market segment of the redirect path", () => {
    expect(localeFromRedirect("https://shop.example/kr/auth/confirmed")).toBe("ko");
    expect(localeFromRedirect("https://shop.example/jp/auth/confirmed")).toBe("ja");
  });

  it("defaults to japanese when the path carries no market", () => {
    expect(localeFromRedirect("https://shop.example/")).toBe("ja");
    expect(localeFromRedirect("")).toBe("ja");
  });
});
