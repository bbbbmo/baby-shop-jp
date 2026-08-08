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
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
