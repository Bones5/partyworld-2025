/**
 * Known third-party defects (production)
 *
 * Run:
 *   BASE_URL=https://www.partyworld.ie npx playwright test tests/e2e/production/known-defects.spec.js
 *
 * These two warnings were observed during the manual DevTools audit and the
 * user wants regression coverage so we know when they're fixed (or regress).
 *
 *   1. TikTok Pixel "Duplicate Pixel ID" warning  — pixel fires twice.
 *   2. Klaviyo `klaviyo.js` is preloaded but not used within a few seconds.
 *
 * NOTE: Today these tests assert that the warnings DO appear (red status =
 * fixed). When you want to flip them into "must be absent" mode, change the
 * `.toBeGreaterThan(0)` to `.toBe(0)`.
 */

const { test, expect } = require("@playwright/test");
const {
  attachConsoleCapture,
  dismissCookieBanner,
  KNOWN_DEFECT_PATTERNS,
} = require("./_helpers");

test.describe("Known third-party defects", () => {
  test("TikTok Pixel fires only once (currently FAILING — duplicate detected)", async ({
    page,
  }) => {
    const cap = attachConsoleCapture(page);
    await page.goto("/", { waitUntil: "networkidle" });
    await dismissCookieBanner(page);
    // Give tags time to fire / log
    await page.waitForTimeout(5000);

    const report = cap.getReport();
    const matches = [...report.warnings, ...report.all].filter((m) =>
      KNOWN_DEFECT_PATTERNS.tiktokDuplicatePixel.test(m.text),
    );

    // Inverted assertion: passes once the duplicate is gone.
    expect(
      matches.map((m) => m.text),
      "TikTok Pixel duplicate ID warning should no longer appear",
    ).toEqual([]);
  });

  test("Klaviyo preload is consumed (currently FAILING — preload unused)", async ({
    page,
  }) => {
    const cap = attachConsoleCapture(page);
    await page.goto("/", { waitUntil: "networkidle" });
    await dismissCookieBanner(page);
    await page.waitForTimeout(5000);

    const report = cap.getReport();
    const matches = [...report.warnings, ...report.all].filter((m) =>
      KNOWN_DEFECT_PATTERNS.klaviyoPreloadUnused.test(m.text),
    );

    expect(
      matches.map((m) => m.text),
      "Klaviyo preload-unused warning should no longer appear",
    ).toEqual([]);
  });
});
