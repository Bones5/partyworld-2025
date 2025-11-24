const { test, expect } = require('@playwright/test');

/**
 * Example acceptance test with visual regression
 * This demonstrates how to test a page and capture screenshots for visual comparison
 */

test.describe('Homepage Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the homepage before each test
    await page.goto('/');
    
    // Wait for the page to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('should display homepage correctly on desktop', async ({ page }) => {
    // Take a full page screenshot and compare it to the baseline
    await expect(page).toHaveScreenshot('homepage-desktop.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('should display header correctly', async ({ page }) => {
    // Take a screenshot of a specific element (header)
    const header = page.locator('header');
    await expect(header).toHaveScreenshot('homepage-header.png');
  });

  test('should display main content area', async ({ page }) => {
    // Take a screenshot of the main content
    const main = page.locator('main');
    await expect(main).toHaveScreenshot('homepage-main.png', {
      maxDiffPixels: 150,
    });
  });

  test('should display footer correctly', async ({ page }) => {
    // Scroll to footer
    await page.locator('footer').scrollIntoViewIfNeeded();
    
    // Take a screenshot of the footer
    const footer = page.locator('footer');
    await expect(footer).toHaveScreenshot('homepage-footer.png');
  });
});

test.describe('Homepage Interaction Tests', () => {
  test('should handle mobile menu interaction', async ({ page, isMobile }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Skip this test if not on mobile
    if (!isMobile) {
      test.skip();
    }
    
    // Find and click mobile menu toggle
    const menuToggle = page.locator('[data-mobile-menu-toggle]');
    if (await menuToggle.count() > 0) {
      await menuToggle.click();
      
      // Wait for menu to animate
      await page.waitForTimeout(500);
      
      // Capture screenshot with menu open
      await expect(page).toHaveScreenshot('homepage-mobile-menu-open.png');
    }
  });

  test('should display search functionality', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for search toggle/input
    const searchToggle = page.locator('[data-search]').first();
    if (await searchToggle.count() > 0) {
      await searchToggle.click();
      await page.waitForTimeout(300);
      
      // Capture screenshot with search visible
      await expect(page).toHaveScreenshot('homepage-search-visible.png');
    }
  });
});
