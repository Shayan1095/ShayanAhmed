import { defineConfig, devices } from "@playwright/test";
import bcrypt from "bcryptjs";

/**
 * End-to-end tests (Playwright). They run against a production build on its
 * own port, with a throwaway admin login and a separate MongoDB database
 * (dropped before and after the run), so real content and logins are never
 * touched. Run `npm run build` first, then `npm run test:e2e`.
 */

const PORT = 3300;
export const E2E = {
  baseURL: `http://localhost:${PORT}`,
  email: "e2e@test.local",
  // Test-only credentials for the isolated local test server; never used anywhere else.
  password: "e2e-local-only-password",
  mongoUri: process.env.E2E_MONGODB_URI ?? "mongodb://127.0.0.1:27017/shayan-portfolio-e2e",
};

// Hashed once here; the server only ever sees the hash, as in production.
const hash = Buffer.from(bcrypt.hashSync(E2E.password, 10)).toString("base64");

export default defineConfig({
  testDir: "./e2e",
  outputDir: "./e2e/.results",
  snapshotPathTemplate: "{testDir}/__screenshots__/{testFilePath}/{arg}{ext}",
  fullyParallel: false,
  workers: 1, // tests share one database
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000, toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled" } },
  reporter: [["list"], ["html", { open: "never", outputFolder: "e2e/.report" }]],
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: E2E.baseURL,
    // Uses the installed Google Chrome, so no browser download is needed.
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome", storageState: "e2e/.auth/admin.json" },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: `npx next start -p ${PORT}`,
    url: `${E2E.baseURL}/robots.txt`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      MONGODB_URI: E2E.mongoUri,
      ADMIN_EMAIL: E2E.email,
      ADMIN_PASSWORD_HASH: hash,
      // Emails and Cloudinary stay off in tests; uploads go to the test database.
      RESEND_API_KEY: "",
      CLOUDINARY_URL: "",
    },
  },
});
