import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "qa",
  testMatch: "**/*.spec.ts",
  timeout: 90000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL:
      process.env.PROTOTYPE_URL || "http://127.0.0.1:5173/outpost-prototype/",
    viewport: { width: 393, height: 852 },
    headless: true,
    actionTimeout: 10000,
    navigationTimeout: 15000,
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    },
    trace: "retain-on-failure",
  },
});
