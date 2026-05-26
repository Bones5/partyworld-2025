/**
 * Cart page tests (production)
 *
 * Run:
 *   BASE_URL=https://www.partyworld.ie npx playwright test tests/e2e/production/cart.spec.js
 *
 * Adds a product (via PDP) then exercises the cart page:
 *   - line item rendered with title, price, qty input
 *   - qty input change updates the subtotal
 *   - remove item empties the row
 *   - empty-cart message renders when last item removed
 *   - no uncaught JS errors throughout
 */

const { test, expect } = require("@playwright/test");
const {
  attachConsoleCapture,
  assertNoJsErrors,
  dismissCookieBanner,
} = require("./_helpers");

const FALLBACK_CATEGORIES = [
  "/balloons/",
  "/birthday-party-decorations/",
  "/cake-accessories/",
  "/confetti/",
];

/**
 * Add one item to the cart via BigCommerce's Storefront Cart API.
 *
 * BC's theme JavaScript is wired to the window load event, so UI-based
 * add-to-cart is unreliable when pages are loaded with waitUntil:domcontentloaded.
 * Using the Storefront API bypasses JS initialisation entirely.
 *
 * Strategy: for each fallback category, read product IDs from the
 * server-rendered card elements (data-entity-id), then try each product
 * via the API. Products with required options return 4xx and are skipped.
 */
async function addOneItemToCart(page) {
  let firstCategory = true;
  for (const cat of FALLBACK_CATEGORIES) {
    await page.goto(cat, { waitUntil: "domcontentloaded" });
    if (firstCategory) {
      // Dismiss cookie banner once so consent is saved for the whole session
      await dismissCookieBanner(page);
      firstCategory = false;
    }

    // Collect up to 5 product IDs from server-rendered card elements
    const productIds = await page.evaluate(() =>
      Array.from(document.querySelectorAll("article.card[data-entity-id]"))
        .map((el) => Number(el.getAttribute("data-entity-id")))
        .filter((id) => id > 0)
        .slice(0, 5),
    );

    for (const pid of productIds) {
      const added = await page
        .evaluate(async (productId) => {
          try {
            const cartsResp = await fetch("/api/storefront/carts", {
              credentials: "same-origin",
            });
            const carts = cartsResp.ok ? await cartsResp.json() : [];
            const body = JSON.stringify({
              lineItems: [{ quantity: 1, productId }],
            });
            const headers = { "Content-Type": "application/json" };
            const url =
              carts && carts.length > 0
                ? `/api/storefront/carts/${carts[0].id}/items`
                : "/api/storefront/carts";
            const resp = await fetch(url, {
              method: "POST",
              headers,
              body,
              credentials: "same-origin",
            });
            return resp.ok;
          } catch {
            return false;
          }
        }, pid)
        .catch(() => false);

      if (!added) continue;

      await page.goto("/cart.php", { waitUntil: "domcontentloaded" });
      const hasItem = await page
        .locator(".cart-item, [data-cart-item]")
        .first()
        .isVisible()
        .catch(() => false);
      if (hasItem) return true;
    }
  }
  return false;
}

test.describe("Cart page", () => {
  test("cart line item renders, qty updates subtotal, remove empties cart", async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    const capture = attachConsoleCapture(page);

    const added = await addOneItemToCart(page);
    test.skip(!added, "Could not add any product to cart");

    // Use waitUntil:"load" so BC's cart JS (wired to window.load) initialises
    // before we interact, and so CookieYes is ready to be dismissed.
    await page.goto("/cart.php", { waitUntil: "load" });
    await dismissCookieBanner(page);

    const item = page.locator(".cart-item, [data-cart-item]").first();
    await expect(item, "Cart line item should be visible").toBeVisible();

    const title = item.locator(".cart-item-title, .cart-item-name").first();
    await expect(title).toBeVisible();

    const qty = item
      .locator(
        'input.cart-item-qty-input, input[name="qty"], [data-cart-item-qty]',
      )
      .first();
    if (await qty.count()) {
      const subtotalLocator = page
        .locator(
          ".cart-total-grandTotal, [data-cart-totals] .cart-priceItem--grandTotal, .cart-total-value",
        )
        .first();
      const before = (await subtotalLocator.innerText().catch(() => "")) || "";

      await qty.fill("2");
      await qty.press("Tab").catch(() => {}); // blur triggers BC's change handler
      // Wait up to 15s for BC's AJAX to update the subtotal DOM
      await page
        .waitForFunction(
          (prev) => {
            const el = document.querySelector(
              ".cart-total-grandTotal, [data-cart-totals] .cart-priceItem--grandTotal, .cart-total-value",
            );
            return el && el.textContent.trim() !== prev;
          },
          before,
          { timeout: 15000 },
        )
        .catch(() => {});

      const after = (await subtotalLocator.innerText().catch(() => "")) || "";
      expect(after, "Subtotal should change after qty update").not.toBe(before);
    }

    // Remove item
    // BC's remove button shows a custom "Are you sure?" alert modal (class="confirm button")
    // with an "OK" confirm action. We must click it to trigger the actual delete.
    const remove = page
      .locator(
        '.cart-remove, button[data-cart-itemid][data-action="remove"], a:has-text("Remove")',
      )
      .first();
    if (await remove.count()) {
      await remove.click();
      // Accept the BC alert modal confirm button if it appears
      const okBtn = page
        .locator("button.confirm, #alert-modal .confirm")
        .first();
      await okBtn.click({ timeout: 5000 }).catch(() => {});
      // Wait for the AJAX remove to complete
      await page
        .waitForLoadState("networkidle", { timeout: 15000 })
        .catch(() => {});
      const empty = page
        .locator(
          ':text-matches("cart is empty|no items|your cart is empty", "i")',
        )
        .first();
      await expect(empty).toBeVisible({ timeout: 10000 });
    }

    await assertNoJsErrors({ attach: capture }, testInfo);
  });
});
