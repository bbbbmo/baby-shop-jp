import { describe, expect, it } from "vitest";
import { relativeToOrigin, resolveConfirmDestination } from "./confirmDestination";

describe("resolveConfirmDestination", () => {
  it("sends a verified user to the requested relative path", () => {
    expect(resolveConfirmDestination({ verified: true, next: "/kr/auth/confirmed" })).toBe(
      "/kr/auth/confirmed",
    );
  });

  it("falls back to the default market confirmed screen when next is missing", () => {
    expect(resolveConfirmDestination({ verified: true, next: null })).toBe("/jp/auth/confirmed");
  });

  it("refuses absolute and protocol-relative next values", () => {
    expect(resolveConfirmDestination({ verified: true, next: "https://evil.example/" })).toBe(
      "/jp/auth/confirmed",
    );
    expect(resolveConfirmDestination({ verified: true, next: "//evil.example" })).toBe(
      "/jp/auth/confirmed",
    );
  });

  it("reports failure on the confirmed screen of the market taken from next", () => {
    expect(
      resolveConfirmDestination({ verified: false, next: "/kr/auth/reset-password" }),
    ).toBe("/kr/auth/confirmed?error=expired");
  });

  it("reports failure on the default market when next carries no market", () => {
    expect(resolveConfirmDestination({ verified: false, next: null })).toBe(
      "/jp/auth/confirmed?error=expired",
    );
  });
});

describe("relativeToOrigin", () => {
  it("turns a same-origin absolute url into its path and query", () => {
    expect(relativeToOrigin("https://shop.example/kr/auth/confirmed?x=1", "https://shop.example")).toBe(
      "/kr/auth/confirmed?x=1",
    );
  });

  it("leaves relative paths untouched and drops foreign origins", () => {
    expect(relativeToOrigin("/jp/auth/confirmed", "https://shop.example")).toBe("/jp/auth/confirmed");
    expect(relativeToOrigin("https://evil.example/x", "https://shop.example")).toBeNull();
    expect(relativeToOrigin(null, "https://shop.example")).toBeNull();
  });
});
