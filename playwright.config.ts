import { defineConfig, devices } from "@playwright/test";

/**
 * E2E do Carcará Revisa. Por padrão sobe o Vite em modo dev.
 * Para gravar vídeo de demonstração: npm run test:e2e:demo
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:5173",
    testIdAttribute: "data-testid",
    trace: "retain-on-failure",
    video: process.env.DEMO ? "on" : "retain-on-failure",
    launchOptions: { slowMo: process.env.DEMO ? 400 : 0 },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : { command: "npm run dev", url: "http://localhost:5173", reuseExistingServer: true, timeout: 60_000 },
});
