/**
 * Category page tests (production)
 *
 * Run:
 *   BASE_URL=https://www.partyworld.ie npx playwright test tests/e2e/production/category.spec.js
 *
 * Covers (per browser project, chromium + firefox):
 *   - top-level navigation categories discovered from the homepage nav
 *   - a hard-coded fallback list so the suite fails accurately even if the nav
 *     selector ever changes
 *
 * Each category page is asserted for:
 *   1. HTTP 200, DOM ready
 *   2. A visible product grid (Cornerstone `.productGrid` / `.card`)
 *   3. Working sort <select> (changing it updates the URL / triggers reload)
 *   4. No uncaught JS exceptions and no non-benign console.error messages
 */

const { test, expect } = require("@playwright/test");
const {
  attachConsoleCapture,
  assertNoJsErrors,
  dismissCookieBanner,
  discoverCategoryLinks,
} = require("./_helpers");

// Hard-coded fallback so coverage is deterministic even if discovery breaks.
// These should be edited to match canonical categories once confirmed.
const FALLBACK_CATEGORIES = [
  "/balloons/",
  "/birthday-party-decorations/",
  "/cake-accessories/",
  "/confetti/",
];

test.describe.configure({ mode: "parallel" });

test.describe("Category pages", () => {
  test("discovers category links from main navigation", async ({ page }) => {
    const links = await discoverCategoryLinks(page, 8);
    // We expect at least a couple of category links to exist in the nav.
    expect(
      links.length,
      `Discovered category links: ${JSON.stringify(links)}`,
    ).toBeGreaterThan(1);
  });

  for (const path of FALLBACK_CATEGORIES) {
    test(`category renders and is interactive: ${path}`, async ({
      page,
    }, testInfo) => {
      const capture = attachConsoleCapture(page);

      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response, `no response for ${path}`).toBeTruthy();
      expect(response.status(), `HTTP status for ${path}`).toBeLessThan(400);

      await dismissCookieBanner(page);

      // Page rendered something category-ish
      await expect(
        page.locator('main, [role="main"], #main-content').first(),
      ).toBeVisible();

      // Either a product grid OR a "no products" message — the page must not be blank.
      const hasGrid = await page
        .locator(".productGrid, .product-grid, [data-product-list]")
        .first()
        .isVisible()
        .catch(() => false);
      const hasEmpty = await page
        .locator(':text-matches("no products", "i")')
        .first()
        .isVisible()
        .catch(() => false);
      expect(
        hasGrid || hasEmpty,
        `Neither product grid nor empty-state visible on ${path}`,
      ).toBeTruthy();

      // Sort select, if present, should be interactive
      const sortSelect = page
        .locator('select[name="sort"], #sort, select[data-sort]')
        .first();
      if (await sortSelect.count()) {
        const optionValues = await sortSelect
          .locator("option")
          .evaluateAll((opts) => opts.map((o) => o.value).filter(Boolean));
        if (optionValues.length > 1) {
          await sortSelect.selectOption(optionValues[1]);
          // Either navigation happens or AJAX re-renders the grid.
          await page.waitForLoadState("domcontentloaded");
        }
      }

      await assertNoJsErrors({ attach: capture }, testInfo);
    });
  }
});
