import { defineConfig, devices } from "@playwright/test";

/**
 * E2E_PORT overrides the preview port (defaults to the same 8080 the dev
 * server uses). Local machines where 8080 is occupied (e.g. the homelab's
 * llama-swap) run: E2E_PORT=8181 npx playwright test
 */
const port = Number(process.env.E2E_PORT ?? 8080);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 30_000,
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    // Serve the production build so e2e exercises the same artifact CI ships.
    command: "npm run build && npm run preview",
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
