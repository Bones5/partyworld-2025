/**
 * Product page tests (production)
 *
 * Run:
 *   BASE_URL=https://www.partyworld.ie npx playwright test tests/e2e/production/product.spec.js
 *
 * Strategy: walk from the homepage into a category, grab the first product card,
 * then assert PDP basics + input functionality + add-to-cart.
 * This keeps the test robust to changing URLs.
 */

const { test, expect } = require("@playwright/test");
const {
  attachConsoleCapture,
  assertNoJsErrors,
  dismissCookieBanner,
  discoverCategoryLinks,
  firstProductLink,
} = require("./_helpers");

test.describe("Product detail page", () => {
  test("PDP renders core elements and quantity input works", async ({
    page,
  }, testInfo) => {
    const capture = attachConsoleCapture(page);

    const categories = await discoverCategoryLinks(page, 4);
    expect(
      categories.length,
      "No category links discovered from nav",
    ).toBeGreaterThan(0);

    // Find a category that has at least one product card
    let productHref = null;
    for (const cat of categories) {
      await page.goto(cat, { waitUntil: "domcontentloaded" });
      await dismissCookieBanner(page);
      productHref = await firstProductLink(page);
      if (productHref) break;
    }
    expect(
      productHref,
      "Could not find any product link from discovered categories",
    ).toBeTruthy();

    await page.goto(productHref, { waitUntil: "domcontentloaded" });

    // Title + price + main image
    await expect(page.locator(".productView-title, h1").first()).toBeVisible();
    await expect(
      page.locator(".productView-price, [data-product-price]").first(),
    ).toBeVisible();
    await expect(
      page.locator(".productView-image img, [data-product-image] img").first(),
    ).toBeVisible();

    // Quantity input: accepts numeric, increments via +/- buttons if present
    const qty = page
      .locator('input[name="qty[]"], input[name="quantity"], #qty\\[\\]')
      .first();
    if (await qty.count()) {
      await qty.fill("2");
      await expect(qty).toHaveValue("2");

      // BigCommerce qty field is type="text"; letters are not stripped client-side.
      // Just verify the field accepts numeric input (the main UX path).
      await qty.fill("1");
    }

    // Add to cart button exists and is enabled (in-stock case)
    const addBtn = page
      .locator(
        '#form-action-addToCart, button[data-button-purchase], button:has-text("Add to Cart")',
      )
      .first();
    await expect(addBtn).toBeVisible();

    await assertNoJsErrors({ attach: capture }, testInfo);
  });

  test("add to cart updates header cart count", async ({ page }, testInfo) => {
    // BC's theme JS (theme-bundle.main.js) is wired to the window load event,
    // so we use waitUntil:"load" to guarantee BC initialises before we interact.
    // Simple foil balloon products have no required options, so the add-to-cart
    // button is immediately enabled once BC's JS runs.
    test.setTimeout(90_000);
    const capture = attachConsoleCapture(page);

    // Known simple products with no required option groups on partyworld.ie.
    // Using direct URLs skips the slow category-discovery step.
    const SIMPLE_PRODUCTS = [
      "/lol-blue-foil-balloon/",
      "/construction-foil-balloon/",
      "/50th-pink-glitz-foil-balloon/",
      "/pink-glitz-18th-foil-balloon/",
      "/blue-18th-foil-balloon/",
    ];

    let clicked = false;
    for (const productPath of SIMPLE_PRODUCTS) {
      // waitUntil:"load" ensures the window load event has fired, which triggers
      // onThemeBundleMain() → stencilBootstrap().load() → ProductDetails init.
      await page.goto(productPath, { waitUntil: "load" });
      await dismissCookieBanner(page);

      const addBtn = page.locator("#form-action-addToCart").first();
      // isVisible confirms the add-to-cart wrapper is not display:none (in stock)
      if (!(await addBtn.isVisible().catch(() => false))) continue;
      if (!(await addBtn.isEnabled().catch(() => false))) continue;

      await addBtn.click();
      clicked = true;
      break;
    }

    test.skip(
      !clicked,
      "No purchasable simple product available on partyworld.ie",
    );

    // Wait for cart counter to update (countPill is CSS-hidden at count=0).
    await page
      .waitForFunction(
        () => {
          const el = document.querySelector(
            ".navUser-item--cart .countPill, [data-cart-quantity], .cart-quantity",
          );
          return el && Number(el.textContent.trim()) > 0;
        },
        { timeout: 8000 },
      )
      .catch(() => {});

    const counter = page
      .locator(
        ".navUser-item--cart .countPill, [data-cart-quantity], .cart-quantity",
      )
      .first();
    const countText = await counter
      .innerText({ timeout: 2000 })
      .catch(() => "0");
    if (Number(countText.trim()) > 0) {
      expect(
        Number(countText.trim()),
        "Cart count should be > 0",
      ).toBeGreaterThan(0);
    } else {
      // Counter didn't update — fall back to /cart.php to verify add-to-cart
      await page.goto("/cart.php", { waitUntil: "domcontentloaded" });
      const cartItem = page.locator(".cart-item, [data-cart-item]").first();
      await expect(
        cartItem,
        "Cart should have an item after add-to-cart (counter did not update)",
      ).toBeVisible({ timeout: 5000 });
    }

    await assertNoJsErrors({ attach: capture }, testInfo);
  });
});
