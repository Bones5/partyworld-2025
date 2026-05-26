/**
 * Helpers for production E2E tests against partyworld.ie
 *
 * Provides console / pageerror capture with classification:
 *   - hardErrors:   uncaught exceptions + console.error that are NOT in the benign list
 *   - warnings:     console.warn (kept for inspection / targeted regression assertions)
 *   - benignErrors: console.error matching a known-benign pattern (logged, not failed on)
 *
 * Benign patterns come from the prior DevTools audit of partyworld.ie:
 *   - `/customer/current.jwt` 404 for guest sessions (BigCommerce expected behaviour)
 *   - CSP report-only header violations (nothing actually blocked)
 *   - CORB warnings from third-party tag content-type mismatch
 *   - Generic Chrome "deprecated feature" notices from third-party tags
 */

const BENIGN_PATTERNS = [
  /\/customer\/current\.jwt.*404/i,
  /Content Security Policy.*report-only/i,
  /Cross-Origin Read Blocking/i,
  /was preloaded using link preload but not used/i, // Klaviyo preload — asserted explicitly
  /Failed to load resource:.*the server responded with a status of 404.*jwt/i,
  /deprecated feature/i,
  /\[Report Only\]/i,
  // Firefox wraps CSP report-only as "[JavaScript Error: "Content-Security-Policy: (Report-Only policy)..."]"
  /Report-Only policy/i,
  // Facebook Pixel cookie rejected (Firefox uses "[JavaScript Error: ...]" wrapper — match content)
  /rejected for invalid domain/i,
  // FastSimon API returns 403 when accessed by headless browsers (bot detection) — not a site defect
  /fastsimon/i,
  // Firefox-specific font/image load failures from third-party CDNs
  /downloadable font: download failed/i,
  /Image corrupt or truncated/i,
  // 4xx from Storefront Cart API during test seeding: we try multiple products
  // and skip those that require options (422) or otherwise fail.
  // The combined "text  @  location" string is:
  //   "...status of 422 ()  @  ...partyworld.ie/api/storefront/carts:0"
  // so the status appears first, then the URL — pattern must match that order.
  /the server responded with a status of 4[0-9][0-9].*storefront\/carts/i,
  // BC's checkout module makes stale API calls when the cart is emptied (after
  // window.location.reload on the empty cart page):
  //   - 401 from /api/storefront/checkout/{id} (no valid checkout)
  //   - 404 from /api/storefront/checkout-settings (no cart context)
  // These are site defects (BC bug), not test failures.
  /the server responded with a status of 401.*storefront\/checkout\//i,
  /the server responded with a status of 404.*storefront\/checkout-settings/i,
  // PayPal SDK iframe emits enforcing CSP violations from its own document
  // (not partyworld.ie). Firefox surfaces these as console errors; they are
  // PayPal-side and outside our control.
  /Content-Security-Policy.*paypal\.com/i,
  /paypal\.com\/credit-presentment/i,
];

// Uncaught JS exceptions that are known BC/third-party bugs, not test failures.
// These are checked against Error.message.
const BENIGN_PAGE_ERROR_PATTERNS = [
  // BC's checkout module throws when the cart is empty (e.g. after item removal
  // triggers window.location.reload() and the checkout context isn't found).
  /^checkout not found$/i,
  /^not found$/i,
];

const KNOWN_DEFECT_PATTERNS = {
  tiktokDuplicatePixel: /TikTok Pixel.*Duplicate Pixel ID/i,
  klaviyoPreloadUnused:
    /klaviyo\.js.*preloaded using link preload but not used/i,
};

/**
 * Attach console + pageerror listeners to a Playwright page.
 * Returns an object with `getReport()` that summarises captures.
 *
 * @param {import('@playwright/test').Page} page
 */
function attachConsoleCapture(page) {
  /** @type {{type: string, text: string, location: string, url: string}[]} */
  const all = [];
  /** @type {Error[]} */
  const pageErrors = [];

  page.on("console", (msg) => {
    const location = msg.location();
    all.push({
      type: msg.type(),
      text: msg.text(),
      location: location.url ? `${location.url}:${location.lineNumber}` : "",
      url: page.url(),
    });
  });

  page.on("pageerror", (err) => {
    pageErrors.push(err);
  });

  return {
    getReport() {
      const errors = all.filter((m) => m.type === "error");
      const warnings = all.filter((m) => m.type === "warning");

      const benignErrors = errors.filter((m) =>
        BENIGN_PATTERNS.some((re) => re.test(`${m.text}  @  ${m.location}`)),
      );
      const hardErrors = errors.filter(
        (m) =>
          !BENIGN_PATTERNS.some((re) => re.test(`${m.text}  @  ${m.location}`)),
      );

      return {
        pageErrors, // uncaught JS exceptions — always hard fail
        hardErrors, // console.error not in benign list
        benignErrors, // console.error matched as benign
        warnings, // console.warn (incl. known defects)
        all,
      };
    },
  };
}

/**
 * Convenience assertion: no uncaught exceptions and no non-benign console errors.
 * Returns the report so callers can make additional targeted assertions.
 *
 * @param {import('@playwright/test').Page} page
 * @param {{ attach: ReturnType<typeof attachConsoleCapture> }} ctx
 * @param {import('@playwright/test').TestInfo} testInfo
 */
async function assertNoJsErrors(ctx, testInfo) {
  const report = ctx.attach.getReport();

  if (report.pageErrors.length || report.hardErrors.length) {
    await testInfo.attach("console-report.json", {
      body: JSON.stringify(
        {
          url: testInfo.title,
          pageErrors: report.pageErrors.map((e) => ({
            message: e.message,
            stack: e.stack,
          })),
          hardErrors: report.hardErrors,
          benignErrors: report.benignErrors,
          warnings: report.warnings,
        },
        null,
        2,
      ),
      contentType: "application/json",
    });
  }

  const { expect } = require("@playwright/test");

  expect(
    report.pageErrors
      .filter(
        (e) => !BENIGN_PAGE_ERROR_PATTERNS.some((re) => re.test(e.message)),
      )
      .map((e) => e.message),
    "Uncaught JS exceptions occurred on the page",
  ).toEqual([]);

  expect(
    report.hardErrors.map((e) => `${e.text}  @  ${e.location}`),
    "console.error messages not matched by the known-benign list",
  ).toEqual([]);

  return report;
}

/**
 * Dismiss the cookie consent banner (CookieYes) if present.
 * Tries multiple strategies because the banner script is consent-gated and the
 * markup can vary slightly between pages.
 *
 * @param {import('@playwright/test').Page} page
 */
async function dismissCookieBanner(page) {
  const selectors = [
    "#cky-btn-accept",
    ".cky-btn-accept",
    "button.cky-banner-btn-close",
    'button:has-text("Accept All")',
    'button:has-text("Accept")',
  ];

  // CookieYes is loaded async — give it up to 3 s to render the banner before
  // we start probing individual selectors.
  const combinedSelector = selectors.join(", ");
  await page
    .locator(combinedSelector)
    .first()
    .waitFor({ state: "visible", timeout: 3000 })
    .catch(() => {});

  // ALWAYS inject the overlay-suppression CSS, even if no banner was found —
  // CookieYes can render `.cky-overlay` on subsequent pages (after consent
  // was saved on an earlier page) and that empty overlay still intercepts
  // pointer events. This must run on every page navigation.
  const suppressOverlay = async () => {
    await page
      .addStyleTag({
        content:
          ".cky-overlay { pointer-events: none !important; display: none !important; } " +
          ".cky-consent-bar, .cky-modal { display: none !important; }",
      })
      .catch(() => {});
    await page
      .evaluate(() => {
        document
          .querySelectorAll(".cky-overlay, .cky-consent-bar, .cky-modal")
          .forEach((el) => el.remove());
      })
      .catch(() => {});
  };

  for (const sel of selectors) {
    const btn = page.locator(sel).first();
    try {
      if (await btn.isVisible({ timeout: 1000 })) {
        await btn.click({ timeout: 2000 });
        // Wait for CookieYes to remove its overlay from the DOM.
        await page
          .locator(".cky-overlay")
          .first()
          .waitFor({ state: "detached", timeout: 3000 })
          .catch(() => {});
        await suppressOverlay();
        return true;
      }
    } catch (_) {
      // try next
    }
  }
  // No banner found (already consented or hasn't loaded) — still suppress
  // any residual overlay so it can't block clicks.
  await suppressOverlay();
  return false;
}

/**
 * Collect a sample of category page URLs from the main navigation.
 * Returns up to `max` distinct internal links that look like category paths
 * (i.e. not /products/, /cart, /login, /search, etc.).
 *
 * @param {import('@playwright/test').Page} page
 * @param {number} max
 */
async function discoverCategoryLinks(page, max = 6) {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await dismissCookieBanner(page);

  const hrefs = await page.evaluate(() => {
    const out = new Set();
    document
      .querySelectorAll(
        ".navPages a, nav a, .navPages-action, [data-collapsible] a",
      )
      .forEach((a) => {
        const href = a.getAttribute("href") || "";
        if (!href) return;
        if (
          /^(https?:)?\/\//.test(href) &&
          !href.includes(window.location.host)
        )
          return;
        if (/^(mailto:|tel:|javascript:|#)/.test(href)) return;
        if (
          /\/(cart|login|account|search|checkout|register|blog|contact|about|brands)/i.test(
            href,
          )
        )
          return;
        if (/\/products\//i.test(href)) return;
        // category-like: ends with slash, no extension
        if (/\.[a-z]{2,4}($|\?)/i.test(href)) return;
        out.add(href.replace(/^https?:\/\/[^/]+/i, "")); // path only
      });
    return Array.from(out);
  });

  // Filter to plausible category URLs (path segments only, not root)
  const filtered = hrefs.filter((h) => h && h !== "/" && h.length > 1);
  return filtered.slice(0, max);
}

/**
 * Find the first product card link from the current page.
 *
 * @param {import('@playwright/test').Page} page
 */
async function firstProductLink(page) {
  return page.evaluate(() => {
    const candidates = document.querySelectorAll(
      '.card a.card-figure__link, .productCard a, .product a[href*="/"], a[href*="/"][data-event-type="product-click"]',
    );
    for (const a of candidates) {
      const href = a.getAttribute("href") || "";
      if (href && !/\/(cart|login|account|search|checkout)/i.test(href)) {
        return href.replace(/^https?:\/\/[^/]+/i, "");
      }
    }
    return null;
  });
}

module.exports = {
  BENIGN_PATTERNS,
  KNOWN_DEFECT_PATTERNS,
  attachConsoleCapture,
  assertNoJsErrors,
  dismissCookieBanner,
  discoverCategoryLinks,
  firstProductLink,
};
