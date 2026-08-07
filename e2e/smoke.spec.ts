import { readFileSync } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

// Supabase 세션을 localStorage에 미리 심어 로그인 상태를 시뮬레이션한다.
// (이 저장소에 실제 테스트 계정이 없어 진짜 로그인 플로우는 테스트할 수 없다.)
const FAKE_EMAIL = "e2e-fake-user@example.com";

function getSupabaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return process.env.NEXT_PUBLIC_SUPABASE_URL;
  }
  const envPath = path.resolve(__dirname, "../.env.local");
  const match = readFileSync(envPath, "utf-8").match(
    /^NEXT_PUBLIC_SUPABASE_URL=(.+)$/m,
  );
  if (!match) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL을 찾을 수 없습니다 (.env.local 확인)");
  }
  return match[1].trim();
}

// supabase-js가 storageKey를 프로젝트 ref로부터 유도하는 방식과 동일하다
// (SupabaseClient.ts: `sb-${baseUrl.hostname.split('.')[0]}-auth-token`).
function getStorageKey(): string {
  const projectRef = new URL(getSupabaseUrl()).hostname.split(".")[0];
  return `sb-${projectRef}-auth-token`;
}

function buildFakeSession(email: string) {
  const nowSeconds = Math.floor(Date.now() / 1000);
  return {
    access_token: "e2e-fake-access-token",
    refresh_token: "e2e-fake-refresh-token",
    expires_in: 3600,
    expires_at: nowSeconds + 60 * 60 * 24 * 365, // 1년 뒤: SDK가 갱신을 시도하지 않도록
    token_type: "bearer",
    user: {
      id: "00000000-0000-4000-8000-000000000000",
      aud: "authenticated",
      role: "authenticated",
      email,
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: {},
      created_at: new Date().toISOString(),
    },
  };
}

async function seedFakeSession(page: import("@playwright/test").Page) {
  await page.addInitScript(
    ({ key, session }: { key: string; session: unknown }) => {
      window.localStorage.setItem(key, JSON.stringify(session));
    },
    { key: getStorageKey(), session: buildFakeSession(FAKE_EMAIL) },
  );
}

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

test("mypage shows the email and logout button for a logged-in session", async ({
  page,
}) => {
  await seedFakeSession(page);
  await page.goto("/mypage");
  await expect(page.getByText(FAKE_EMAIL)).toBeVisible();
  await expect(page.getByRole("button", { name: /ログアウト/ })).toBeVisible();
});

test("mypage profile card toggles into edit mode", async ({ page }) => {
  await seedFakeSession(page);
  await page.goto("/mypage");
  await page.getByRole("button", { name: "情報を編集" }).click();
  await expect(page.getByRole("textbox", { name: "電話番号" })).toBeVisible();
  await expect(page.getByRole("button", { name: "保存する" })).toBeVisible();
  await expect(page.getByRole("button", { name: "キャンセル" })).toBeVisible();
});

test("mypage profile edit shows a validation error for invalid furigana", async ({
  page,
}) => {
  await seedFakeSession(page);
  await page.goto("/mypage");
  await page.getByRole("button", { name: "情報を編集" }).click();
  await page.getByRole("textbox", { name: "お名前（フリガナ）" }).fill("やまだ");
  await page.getByRole("button", { name: "保存する" }).click();
  await expect(
    page.getByText("フリガナはカタカナで入力してください"),
  ).toBeVisible();
});

test("mypage profile edit cancel returns to view mode", async ({ page }) => {
  await seedFakeSession(page);
  await page.goto("/mypage");
  await page.getByRole("button", { name: "情報を編集" }).click();
  await page.getByRole("button", { name: "キャンセル" }).click();
  await expect(page.getByRole("button", { name: "情報を編集" })).toBeVisible();
  await expect(page.getByRole("button", { name: "保存する" })).not.toBeVisible();
});

test("header profile link points to /mypage for a logged-in session", async ({
  page,
}) => {
  await seedFakeSession(page);
  await page.goto("/");
  const profileLink = page.getByRole("link", { name: "マイページ" });
  await expect(profileLink).toHaveAttribute("href", "/mypage");
});
