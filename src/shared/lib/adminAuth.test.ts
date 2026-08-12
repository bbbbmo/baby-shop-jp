import { describe, expect, it, vi } from "vitest";

async function importWithAllowlist(value: string) {
  vi.resetModules();
  process.env.NEXT_PUBLIC_ADMIN_EMAILS = value;
  return import("./adminAuth");
}

describe("isAdminEmail", () => {
  it("matches an email in the allowlist case-insensitively", async () => {
    const { isAdminEmail } = await importWithAllowlist("a@example.com, B@Example.com");
    expect(isAdminEmail("b@example.com")).toBe(true);
  });

  it("rejects an email not in the allowlist", async () => {
    const { isAdminEmail } = await importWithAllowlist("a@example.com");
    expect(isAdminEmail("c@example.com")).toBe(false);
  });

  it("rejects null and undefined", async () => {
    const { isAdminEmail } = await importWithAllowlist("a@example.com");
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
  });

  it("treats an empty allowlist as rejecting everything", async () => {
    const { isAdminEmail } = await importWithAllowlist("");
    expect(isAdminEmail("a@example.com")).toBe(false);
  });
});
