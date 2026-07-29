import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  reporter: "line",
  use: {
    baseURL: "http://127.0.0.1:3100",
    browserName: "chromium",
    headless: true,
  },
  webServer: {
    command: "E2E_HARNESS=1 npm run dev:next -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100/e2e/admin-responsive",
    env: { E2E_HARNESS: "1", NODE_ENV: "development" },
    reuseExistingServer: false,
  },
});
