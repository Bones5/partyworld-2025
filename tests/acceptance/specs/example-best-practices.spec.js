const { test, expect } = require('@playwright/test');
const { 
  waitForPageStable, 
  getScreenshotOptions,
  acceptCookieConsent 
} = require('../helpers');

/**
 * Example test demonstrating best practices for visual regression testing
 * This test uses the helper utilities for more stable and reliable screenshots
 */

test.describe('Visual Regression Best Practices Example', () => {
  test('homepage with stable screenshot', async ({ page }) => {
    // Navigate to homepage
    await page.goto('/');
    
    // Accept cookie consent if present
    await acceptCookieConsent(page);
    
    // Wait for page to be fully stable
    await waitForPageStable(page);
    
    // Take screenshot with custom options
    await expect(page).toHaveScreenshot(
      'homepage-stable.png', 
      getScreenshotOptions({ 
        fullPage: true,
        maxDiffPixels: 150 
      })
    );
  });

  test('header section with precise screenshot', async ({ page }) => {
    await page.goto('/');
    await waitForPageStable(page);
    
    // Get header element
    const header = page.locator('header').first();
    
    // Take element screenshot
    await expect(header).toHaveScreenshot(
      'header-precise.png',
      getScreenshotOptions()
    );
  });

  test('responsive homepage on different viewports', async ({ page }) => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 },
    ];

    for (const viewport of viewports) {
      await page.setViewportSize({ 
        width: viewport.width, 
        height: viewport.height 
      });
      
      await page.goto('/');
      await waitForPageStable(page);
      
      await expect(page).toHaveScreenshot(
        `homepage-${viewport.name}.png`,
        getScreenshotOptions({ fullPage: true })
      );
    }
  });
});
