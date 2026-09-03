import { defineConfig } from "vitest/config";
import path from "node:path";

try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local is optional (e.g. absent in CI) — tests that need it will fail with a clear error instead
}

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // server-only는 react-server 조건에서만 빈 모듈이고, 그냥 Node에서
      // import하면 일부러 예외를 던진다. 테스트는 서버 코드를 직접 부르므로
      // 여기서 빈 모듈로 바꿔 끼운다.
      "server-only": path.resolve(__dirname, "./node_modules/server-only/empty.js"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
