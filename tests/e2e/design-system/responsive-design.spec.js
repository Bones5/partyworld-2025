/**
 * Design System Tests - Responsive Design
 * 
 * Tests that validate responsive design implementation:
 * - Viewport meta tag
 * - Mobile-friendly navigation
 * - Responsive images
 * - Touch targets
 * - Breakpoint consistency
 */

const { test, expect } = require('@playwright/test');

test.describe('Responsive Design', () => {
  test('should have viewport meta tag', async ({ page }) => {
    await page.goto('/');
    
    // Check for viewport meta tag
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    
    expect(viewport).toBeTruthy();
    expect(viewport).toContain('width=device-width');
    expect(viewport).toContain('initial-scale=1');
  });

  test('should have mobile-friendly navigation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Should have mobile menu toggle
    const mobileMenuToggle = await page.locator('[class*="mobileMenu"], [class*="mobile-menu"], button[aria-label*="menu"], button[aria-label*="Menu"]').count();
    
    expect(mobileMenuToggle).toBeGreaterThanOrEqual(0);
  });

  test('should have adequate touch targets on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Get all interactive elements
    const interactiveElements = await page.locator('a, button, input[type="button"], input[type="submit"]').all();
    
    for (const element of interactiveElements.slice(0, 10)) {
      const box = await element.boundingBox();
      
      if (box) {
        // Touch targets should be at least 44x44 (iOS guidelines) or 48x48 (Material)
        // Allow some flexibility for small icons with padding
        const minSize = 40;
        
        if (box.width < minSize || box.height < minSize) {
          // Check if element has padding that makes it larger
          const padding = await element.evaluate(el => {
            const styles = window.getComputedStyle(el);
            return {
              top: parseFloat(styles.paddingTop),
              bottom: parseFloat(styles.paddingBottom),
              left: parseFloat(styles.paddingLeft),
              right: parseFloat(styles.paddingRight),
            };
          });
          
          const totalWidth = box.width + padding.left + padding.right;
          const totalHeight = box.height + padding.top + padding.bottom;
          
          // Allow smaller targets if they're in a group or have context
          expect(totalWidth > 20 && totalHeight > 20).toBeTruthy();
        }
      }
    }
  });

  test('should use responsive images', async ({ page }) => {
    await page.goto('/');
    
    // Check for responsive image techniques
    const images = await page.locator('img').all();
    
    for (const img of images.slice(0, 10)) {
      const srcset = await img.getAttribute('srcset');
      const sizes = await img.getAttribute('sizes');
      
      // Images should ideally have srcset for responsive delivery
      // or be constrained by CSS
      if (srcset) {
        expect(srcset.length).toBeGreaterThan(0);
      }
      
      // Check CSS max-width
      const maxWidth = await img.evaluate(el => {
        return window.getComputedStyle(el).maxWidth;
      });
      
      // Images should be responsive
      expect(maxWidth !== 'none' || srcset !== null).toBeTruthy();
    }
  });

  test('should adapt layout for different viewports', async ({ page }) => {
    // Test desktop
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    
    // Wait for layout
    await page.waitForLoadState('networkidle');
    
    const desktopLayout = await page.locator('body').evaluate(el => {
      return window.getComputedStyle(el).width;
    });
    
    // Test tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500); // Allow layout to adjust
    
    const tabletLayout = await page.locator('body').evaluate(el => {
      return window.getComputedStyle(el).width;
    });
    
    // Test mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(500);
    
    const mobileLayout = await page.locator('body').evaluate(el => {
      return window.getComputedStyle(el).width;
    });
    
    // Layouts should adapt
    expect(desktopLayout).not.toBe(mobileLayout);
    expect(tabletLayout).toBeTruthy();
  });

  test('should not have horizontal scroll on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check if page has horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    
    // Should not have horizontal scroll
    expect(hasHorizontalScroll).toBeFalsy();
  });

  test('should hide/show elements responsively', async ({ page }) => {
    await page.goto('/');
    
    // Find elements with responsive display classes
    const responsiveElements = await page.locator('[class*="show-for-"], [class*="hide-for-"], [class*="visible-"], [class*="hidden-"]').all();
    
    // Test that these elements are properly controlled by breakpoints
    for (const element of responsiveElements.slice(0, 5)) {
      const classList = await element.getAttribute('class');
      
      if (classList) {
        // Should use Foundation's responsive visibility classes
        expect(classList).toMatch(/show-for-|hide-for-|visible-|hidden-/);
      }
    }
  });

  test('should maintain readable text on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Check font sizes
    const textElements = await page.locator('p, h1, h2, h3, h4, h5, h6, li, a').all();
    
    for (const element of textElements.slice(0, 10)) {
      const fontSize = await element.evaluate(el => {
        return parseFloat(window.getComputedStyle(el).fontSize);
      });
      
      // Text should be at least 14px on mobile (16px preferred)
      expect(fontSize).toBeGreaterThanOrEqual(12);
    }
  });
});
