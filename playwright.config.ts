import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // Turbopack dev 서버가 무거운 라우트(/mypage 등)를 첫 요청에서 콜드 컴파일할 때
  // 기본 30초 타임아웃을 넘길 수 있다. 컴파일 후에는 즉시 응답하므로 기능 문제가
  // 아니라 dev 서버 워밍업 시간 문제 — 테스트 타임아웃만 넉넉히 잡는다.
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
