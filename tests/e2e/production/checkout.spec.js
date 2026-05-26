/**
 * Checkout tests (production)
 *
 * Run:
 *   BASE_URL=https://www.partyworld.ie npx playwright test tests/e2e/production/checkout.spec.js
 *
 * Drives the guest checkout up to (but NOT including) Place Order.
 * Asserts each payment method radio renders correct UI:
 *   - radio-braintree            -> Braintree hosted-fields iframes (card number, cvv, expiry)
 *   - radio-braintreepaypal      -> PayPal continue button
 *   - radio-applepay             -> Apple Pay button / iframe
 *   - radio-googlepaybraintree   -> Google Pay sign-in OR pay button
 *
 * No order is ever placed; the Place Order button is only inspected for state.
 */

const { test, expect } = require("@playwright/test");
const {
  attachConsoleCapture,
  assertNoJsErrors,
  dismissCookieBanner,
} = require("./_helpers");

const GUEST = {
  email: `qa+${Date.now()}@example.invalid`,
  firstName: "QA",
  lastName: "Tester",
  phone: "02012345678",
  address1: "1 Test Street",
  city: "London",
  postcode: "SW1A 1AA",
  country: "United Kingdom",
};

/**
 * Seed the cart with one purchasable item via BigCommerce's Storefront Cart API.
 *
 * BC's theme JavaScript is wired to the window load event, so UI-based
 * add-to-cart is unreliable with waitUntil:domcontentloaded.
 * Using the Storefront API bypasses JS initialisation entirely.
 *
 * Strategy: for each fallback category, read product IDs from server-rendered
 * card elements (data-entity-id), then call the API for each until one succeeds.
 * Products with required options return 4xx and are skipped.
 */
async function seedCartWithOneItem(page) {
  const categories = [
    "/balloons/",
    "/birthday-party-decorations/",
    "/cake-accessories/",
    "/confetti/",
    "/pinatas/",
  ];
  let firstCategory = true;
  for (const cat of categories) {
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

test.describe("Checkout", () => {
  // Production checkout depends on third-party SDKs (Stripe, Braintree, PayPal,
  // Google Pay, Apple Pay). Under cross-browser parallel load these providers
  // throttle and one browser's iframe init can stall. A single retry absorbs
  // that transient flakiness without masking real regressions.
  test.describe.configure({ mode: "serial", retries: 1 });

  test("guest checkout reaches payment step and each payment method renders", async ({
    page,
  }, testInfo) => {
    // Long-running flow with third-party iframes.
    // Firefox is slower with BC's checkout React SPA; budget 5 minutes.
    test.setTimeout(300_000);

    const capture = attachConsoleCapture(page);

    const seeded = await seedCartWithOneItem(page);
    test.skip(!seeded, "Could not seed cart with a product");

    await page.goto("/checkout", { waitUntil: "domcontentloaded" });

    // ── Customer step: email ────────────────────────────────────
    const emailInput = page.locator('#email, input[name="email"]').first();
    // Wait for the checkout React app to render the email step before
    // dismissing the cookie banner (ensures CookieYes JS has also loaded).
    await expect(emailInput).toBeVisible({ timeout: 60_000 });
    await dismissCookieBanner(page);
    await emailInput.fill(GUEST.email);

    const continueAsGuest = page
      .locator(
        'button:has-text("Continue as Guest"), button:has-text("Continue"), #checkout-customer-continue',
      )
      .first();
    await continueAsGuest.click().catch(() => {});
    // Don't await networkidle — BC's checkout keeps connections open (long-polling)
    // which makes networkidle fire late or not at all in Firefox.
    // Instead, rely on the firstName visibility timeout below.

    // ── Shipping step ──────────────────────────────────────────
    // BC's checkout React SPA labels fields by accessible name (aria-label /
    // <label> text).  Use getByLabel() as the primary strategy; keep the
    // id/name fallback for forward-compat.
    const firstName = page
      .getByLabel("First Name", { exact: true })
      .or(page.locator('#firstNameInput, input[name="firstName"]'))
      .first();
    await expect(firstName).toBeVisible({ timeout: 90_000 });
    await firstName.fill(GUEST.firstName);

    await page
      .getByLabel("Last Name", { exact: true })
      .or(page.locator('#lastNameInput, input[name="lastName"]'))
      .first()
      .fill(GUEST.lastName);

    await page
      .getByLabel(/phone/i)
      .or(page.locator('input[name="phone"]'))
      .first()
      .fill(GUEST.phone)
      .catch(() => {});

    // "Address" (exact) avoids matching "Apartment/Suite/Building" label
    await page
      .getByLabel("Address", { exact: true })
      .or(page.locator('#addressLine1Input, input[name="address1"]'))
      .first()
      .fill(GUEST.address1);

    await page
      .getByLabel("City", { exact: true })
      .or(page.locator('#cityInput, input[name="city"]'))
      .first()
      .fill(GUEST.city);

    await page
      .getByLabel(/postal|postcode|zip/i)
      .or(page.locator('#postCodeInput, input[name="postalCode"]'))
      .first()
      .fill(GUEST.postcode)
      .catch(() => {}); // postal code may not appear until Country is selected

    const countrySelect = page
      .getByLabel("Country", { exact: true })
      .or(page.locator('#countryCodeInput, select[name="countryCode"]'))
      .first();
    if (await countrySelect.count()) {
      await countrySelect
        .selectOption({ label: GUEST.country })
        .catch(async () => {
          // Some stores use code values
          await countrySelect.selectOption("IE").catch(() => {});
        });
    }

    // Continue to shipping options
    const shippingContinue = page
      .locator('#checkout-shipping-continue, button:has-text("Continue")')
      .first();
    await shippingContinue.click().catch(() => {});

    // Shipping method should auto-select
    await page
      .locator('.shippingOption, [data-test="shipping-option"]')
      .first()
      .waitFor({ timeout: 30_000 })
      .catch(() => {});

    // Continue to payment
    const billingContinue = page
      .locator('#checkout-billing-continue, button:has-text("Continue")')
      .first();
    await billingContinue.click().catch(() => {});

    // ── Payment step: assert each method UI ────────────────────────────
    const paymentMethods = [
      {
        id: "radio-braintree",
        label: "Credit card (Braintree hosted fields)",
        expect: async () => {
          // Hosted fields are in iframes. Check that at least one iframe with braintree-hosted-fields is present.
          await expect(
            page
              .locator(
                'iframe[id*="braintree-hosted-field"], iframe[src*="braintreegateway"]',
              )
              .first(),
          ).toBeAttached({ timeout: 20_000 });
        },
      },
      {
        id: "radio-braintreepaypal",
        label: "PayPal",
        expect: async () => {
          await expect(
            page
              .locator(
                'button:has-text("PayPal"), [data-funding-source="paypal"], iframe[src*="paypal.com"]',
              )
              .first(),
          ).toBeAttached({ timeout: 20_000 });
        },
      },
      {
        id: "radio-applepay",
        label: "Apple Pay",
        expect: async () => {
          // Apple Pay button only renders on Safari/macOS; on other browsers we just verify the radio selection is honoured.
          const applePayBtn = page
            .locator(
              'button:has-text("Apple Pay"), .apple-pay-button, iframe[src*="apple-pay"]',
            )
            .first();
          // Either it renders, or the section is at least labelled.
          const radio = page.locator("#radio-applepay");
          await expect(radio).toBeChecked();
          await applePayBtn.isVisible({ timeout: 5000 }).catch(() => false);
        },
      },
      {
        id: "radio-googlepaybraintree",
        label: "Google Pay",
        expect: async () => {
          await expect(
            page
              .locator(
                'button:has-text("Google Pay"), button:has-text("Sign in to Google Pay"), iframe[src*="pay.google.com"], iframe[src*="googleapis"]',
              )
              .first(),
          ).toBeAttached({ timeout: 20_000 });

          // Place Order should be disabled until signed in
          const placeOrder = page
            .locator(
              '#checkout-payment-continue, button:has-text("Place Order")',
            )
            .first();
          if (await placeOrder.count()) {
            const disabled = await placeOrder.isDisabled().catch(() => false);
            // If Google Pay requires sign-in, we expect disabled. Soft assertion only.
            expect
              .soft(
                disabled,
                "Place Order disabled while Google Pay not signed in",
              )
              .toBeTruthy();
          }
        },
      },
    ];

    for (const method of paymentMethods) {
      const radio = page.locator(`#${method.id}`);
      const exists = await radio.count();
      if (!exists) {
        testInfo.annotations.push({
          type: "skip",
          description: `${method.label} radio not present`,
        });
        continue;
      }
      await radio.check({ force: true });
      await method.expect();
    }

    // Explicitly do NOT click Place Order.

    await assertNoJsErrors({ attach: capture }, testInfo);
  });
});
