/**
 * Test Fixtures and Helpers
 * 
 * Common utilities for Playwright tests
 */

/**
 * Wait for web fonts to load
 * @param {import('@playwright/test').Page} page
 */
async function waitForFonts(page) {
  await page.evaluate(() => {
    return document.fonts.ready;
  });
}

/**
 * Get computed style for an element
 * @param {import('@playwright/test').Locator} element
 * @param {string} property
 * @returns {Promise<string>}
 */
async function getComputedStyle(element, property) {
  return await element.evaluate((el, prop) => {
    return window.getComputedStyle(el)[prop];
  }, property);
}

/**
 * Check if element is visible in viewport
 * @param {import('@playwright/test').Locator} element
 * @returns {Promise<boolean>}
 */
async function isInViewport(element) {
  return await element.evaluate(el => {
    const rect = el.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  });
}

/**
 * Get contrast ratio between two RGB colors
 * @param {string} color1 - RGB color string
 * @param {string} color2 - RGB color string
 * @returns {number} Contrast ratio
 */
function getContrastRatio(color1, color2) {
  const getLuminance = (color) => {
    const rgb = color.match(/\d+/g).map(Number);
    const [r, g, b] = rgb.map(val => {
      const sRGB = val / 255;
      return sRGB <= 0.03928 ? sRGB / 12.92 : Math.pow((sRGB + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Take a screenshot with a descriptive name
 * @param {import('@playwright/test').Page} page
 * @param {string} name
 */
async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ path: `test-results/${name}-${timestamp}.png`, fullPage: true });
}

module.exports = {
  waitForFonts,
  getComputedStyle,
  isInViewport,
  getContrastRatio,
  takeScreenshot,
};
