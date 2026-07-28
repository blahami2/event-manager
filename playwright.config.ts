import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  reporter: "line",
  use: {
    browserName: "chromium",
    headless: true,
  },
});
