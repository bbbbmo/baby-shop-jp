import { test, expect } from "@playwright/test";

test("home page loads and shows the brand name", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("COMO").first()).toBeVisible();
});

test("signin page renders the login form", async ({ page }) => {
  await page.goto("/signin");
  await expect(page.getByRole("button", { name: /ログイン/ }).first()).toBeVisible();
});

test("mypage redirects to signin when logged out", async ({ page }) => {
  await page.goto("/mypage");
  await page.waitForURL("**/signin", { timeout: 5000 });
});
