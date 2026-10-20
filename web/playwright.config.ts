import { defineConfig, devices } from "@playwright/test";

// Browser tests (Phase 3). They run against the Firebase emulators under the
// demo-powrfit project, never a real Firebase project. Playwright starts the
// emulators and a dev server pointed at them. Tests share one emulator, so
// they run one at a time and reset it before each test (e2e/helpers.ts).
const PORT = 3100;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [
    // iPhone 13 size and touch, in WebKit (Safari's engine).
    { name: "iphone-13", use: { ...devices["iPhone 13"] } },
    { name: "desktop-1440", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
  ],
  webServer: [
    {
      command: "npm run emulators",
      url: "http://127.0.0.1:9099",
      reuseExistingServer: true,
      timeout: 180_000,
      // SIGINT lets the Firebase CLI stop its Java emulator; SIGTERM left it
      // running and holding port 8080.
      gracefulShutdown: { signal: "SIGINT", timeout: 10_000 },
    },
    {
      command: `npm run dev:emulators -- -p ${PORT}`,
      url: `http://localhost:${PORT}/login`,
      // A stand-in feedback form (D30), so Profile shows its button.
      // Test-only server switches for /api/gyms (P6-05), ignored in
      // production: fake gyms instead of OpenStreetMap, and trust the Auth
      // emulator's unsigned sign-in tokens.
      env: {
        NEXT_PUBLIC_FEEDBACK_URL: "https://example.com/powrfit-feedback",
        GYMS_PROVIDER: "fake",
        GYMS_TRUST_EMULATOR_TOKENS: "1",
      },
      reuseExistingServer: true,
      timeout: 180_000,
    },
  ],
});
