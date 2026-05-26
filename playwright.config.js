// @ts-check
const { defineConfig, devices } = require("@playwright/test");

/**
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: "./tests/e2e",

  // Maximum time one test can run for
  timeout: 30 * 1000,

  expect: {
    // Maximum time expect() should wait for the condition to be met
    timeout: 5000,
  },

  // Run tests in files in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Production e2e runs against a live storefront with third-party SDKs
  // (Stripe, Braintree, PayPal, Google Pay, Apple Pay, Klarna, Trustpilot,
  // Klaviyo, CookieYes). Under cross-browser parallel load these providers
  // intermittently throttle or stall. One local retry absorbs transient
  // upstream flakes without masking real regressions.
  retries: process.env.CI ? 2 : 1,

  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,

  // Reporter to use
  reporter: "json",

  // Shared settings for all projects
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: process.env.BASE_URL || "http://localhost:3000",

    // Collect trace when retrying the failed test
    trace: "on-first-retry",

    // Take screenshot on failure
    screenshot: "only-on-failure",
  },

  // Configure projects for major browsers
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    // Uncomment to test on additional browsers
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    // Test against mobile viewports
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  // Run your local dev server before starting the tests.
  // Skipped automatically when BASE_URL points at a remote host (staging/production).
  webServer:
    process.env.BASE_URL && !/localhost|127\.0\.0\.1/.test(process.env.BASE_URL)
      ? undefined
      : {
          command: "node tests/e2e/test-server.js",
          url: "http://localhost:3000",
          reuseExistingServer: !process.env.CI,
          timeout: 120 * 1000,
        },
});
