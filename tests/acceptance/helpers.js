/**
 * Common test utilities and helpers for acceptance tests
 */

const { 
  PAGE_STABLE_BUFFER, 
  ANIMATION_DURATION, 
  COOKIE_BANNER_TIMEOUT, 
  SCROLL_COMPLETE,
  DEFAULT_MAX_DIFF_PIXELS,
  DEFAULT_MAX_DIFF_RATIO,
  DEFAULT_THRESHOLD
} = require('./constants');

/**
 * Wait for all images to load on the page
 * @param {import('@playwright/test').Page} page 
 */
async function waitForImages(page) {
  await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    return Promise.all(
      images
        .filter(img => !img.complete)
        .map(img => new Promise(resolve => {
          img.onload = img.onerror = resolve;
        }))
    );
  });
}

/**
 * Wait for fonts to load
 * @param {import('@playwright/test').Page} page 
 */
async function waitForFonts(page) {
  await page.evaluate(() => document.fonts.ready);
}

/**
 * Disable animations for more consistent screenshots
 * @param {import('@playwright/test').Page} page 
 */
async function disableAnimations(page) {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `
  });
}

/**
 * Wait for page to be fully stable (network idle + images + fonts)
 * @param {import('@playwright/test').Page} page 
 * @param {number} bufferMs - Additional buffer time for final rendering (default from constants)
 */
async function waitForPageStable(page, bufferMs = PAGE_STABLE_BUFFER) {
  await page.waitForLoadState('networkidle');
  await waitForImages(page);
  await waitForFonts(page);
  // Small buffer for any final rendering
  await page.waitForTimeout(bufferMs);
}

/**
 * Hide elements with dynamic content (timestamps, etc.)
 * @param {import('@playwright/test').Page} page 
 * @param {string[]} selectors - Array of CSS selectors to hide
 */
async function hideDynamicElements(page, selectors) {
  for (const selector of selectors) {
    await page.locator(selector).evaluateAll(elements => {
      elements.forEach(el => {
        el.style.visibility = 'hidden';
      });
    });
  }
}

/**
 * Get common screenshot options with sensible defaults
 * @param {object} overrides - Override default options
 * @returns {object} Screenshot options
 */
function getScreenshotOptions(overrides = {}) {
  return {
    fullPage: false,
    maxDiffPixels: DEFAULT_MAX_DIFF_PIXELS,
    maxDiffPixelRatio: DEFAULT_MAX_DIFF_RATIO,
    threshold: DEFAULT_THRESHOLD,
    animations: 'disabled',
    ...overrides,
  };
}

/**
 * Mock API responses for consistent testing
 * @param {import('@playwright/test').Page} page 
 * @param {string} url - URL pattern to match
 * @param {object} response - Mock response data
 */
async function mockApiResponse(page, url, response) {
  await page.route(url, route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Accept cookie consent if present
 * @param {import('@playwright/test').Page} page 
 * @param {number} timeout - Maximum time to wait for cookie banner (default from constants)
 */
async function acceptCookieConsent(page, timeout = COOKIE_BANNER_TIMEOUT) {
  const cookieButton = page.locator('[data-cookie-accept], .cookie-accept, #cookie-accept').first();
  if (await cookieButton.isVisible({ timeout }).catch(() => false)) {
    await cookieButton.click();
    await page.waitForTimeout(ANIMATION_DURATION);
  }
}

/**
 * Scroll element into view with better visibility
 * @param {import('@playwright/test').Page} page 
 * @param {string} selector 
 */
async function scrollToElement(page, selector) {
  await page.locator(selector).scrollIntoViewIfNeeded();
  await page.waitForTimeout(SCROLL_COMPLETE); // Wait for scroll to complete
}

module.exports = {
  waitForImages,
  waitForFonts,
  disableAnimations,
  waitForPageStable,
  hideDynamicElements,
  getScreenshotOptions,
  mockApiResponse,
  acceptCookieConsent,
  scrollToElement,
};
