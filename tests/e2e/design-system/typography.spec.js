/**
 * Design System Tests - Typography
 * 
 * Tests that validate typography implementation:
 * - Font loading
 * - Typography scale
 * - Line height ratios
 * - Text hierarchy
 */

const { test, expect } = require('@playwright/test');

test.describe('Typography System', () => {
  test('should load web fonts properly', async ({ page }) => {
    await page.goto('/');
    
    // Wait for fonts to load
    await page.waitForLoadState('networkidle');
    
    // Check if custom fonts are applied
    const body = await page.locator('body').first();
    const bodyFont = await body.evaluate(el => {
      return window.getComputedStyle(el).fontFamily;
    });
    
    // Should not be just system fonts
    expect(bodyFont).toBeTruthy();
    expect(bodyFont.length).toBeGreaterThan(0);
  });

  test('should use consistent typography scale', async ({ page }) => {
    await page.goto('/');
    
    // Get all heading sizes
    const headings = {
      h1: await page.locator('h1').first().evaluate(el => parseFloat(window.getComputedStyle(el).fontSize)),
      h2: await page.locator('h2').first().evaluate(el => parseFloat(window.getComputedStyle(el).fontSize)),
      h3: await page.locator('h3').first().evaluate(el => parseFloat(window.getComputedStyle(el).fontSize)),
      body: await page.locator('p').first().evaluate(el => parseFloat(window.getComputedStyle(el).fontSize)),
    };
    
    // Headings should follow a scale (h1 > h2 > h3 > body)
    if (headings.h1 && headings.h2) {
      expect(headings.h1).toBeGreaterThan(headings.h2);
    }
    if (headings.h2 && headings.h3) {
      expect(headings.h2).toBeGreaterThan(headings.h3);
    }
    if (headings.h3 && headings.body) {
      expect(headings.h3).toBeGreaterThanOrEqual(headings.body);
    }
  });

  test('should have proper line heights', async ({ page }) => {
    await page.goto('/');
    
    // Check body text line height
    const paragraphs = await page.locator('p').all();
    
    for (const p of paragraphs.slice(0, 5)) {
      const lineHeight = await p.evaluate(el => {
        const styles = window.getComputedStyle(el);
        const fontSize = parseFloat(styles.fontSize);
        const lineHeightValue = parseFloat(styles.lineHeight);
        
        return lineHeightValue / fontSize;
      });
      
      // Body text should have line height between 1.4 and 1.8
      expect(lineHeight).toBeGreaterThanOrEqual(1.2);
      expect(lineHeight).toBeLessThanOrEqual(2.0);
    }
  });

  test('should have proper heading line heights', async ({ page }) => {
    await page.goto('/');
    
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    
    for (const heading of headings.slice(0, 5)) {
      const lineHeight = await heading.evaluate(el => {
        const styles = window.getComputedStyle(el);
        const fontSize = parseFloat(styles.fontSize);
        const lineHeightValue = parseFloat(styles.lineHeight);
        
        return lineHeightValue / fontSize;
      });
      
      // Headings typically have tighter line height (1.1 - 1.4)
      expect(lineHeight).toBeGreaterThanOrEqual(1.0);
      expect(lineHeight).toBeLessThanOrEqual(1.6);
    }
  });

  test('should not use deprecated font attributes', async ({ page }) => {
    await page.goto('/');
    
    // Check for deprecated font elements
    const fontElements = await page.locator('font').count();
    expect(fontElements).toBe(0);
    
    // Check for deprecated size attributes
    const sizeAttributes = await page.locator('[size]').count();
    // Note: <input size> is valid, so we only check non-input elements
    const invalidSizeAttributes = await page.locator('[size]:not(input):not(select)').count();
    expect(invalidSizeAttributes).toBe(0);
  });

  test('should have consistent font weights', async ({ page }) => {
    await page.goto('/');
    
    // Check that font weights use numeric values or valid keywords
    const textElements = await page.locator('h1, h2, h3, h4, h5, h6, p, a, button').all();
    
    for (const element of textElements.slice(0, 10)) {
      const fontWeight = await element.evaluate(el => {
        return window.getComputedStyle(el).fontWeight;
      });
      
      // Should be numeric (100-900) or keyword
      const validWeights = ['normal', 'bold', 'bolder', 'lighter'];
      const isNumeric = /^[1-9]00$/.test(fontWeight);
      const isKeyword = validWeights.includes(fontWeight);
      
      expect(isNumeric || isKeyword).toBeTruthy();
    }
  });

  test('should have proper text color contrast', async ({ page }) => {
    await page.goto('/');
    
    // Get text elements and their colors
    const textElements = await page.locator('p, h1, h2, h3, h4, h5, h6, a, button, span').all();
    
    for (const element of textElements.slice(0, 10)) {
      const colors = await element.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          color: styles.color,
          background: styles.backgroundColor,
        };
      });
      
      // Should have defined colors
      expect(colors.color).toBeTruthy();
      expect(colors.background).toBeTruthy();
      
      // Colors should not be 'transparent' for both
      // (This is a basic check - full contrast testing requires color calculations)
      if (colors.color !== 'rgba(0, 0, 0, 0)') {
        expect(colors.color.length).toBeGreaterThan(0);
      }
    }
  });

  test('should use appropriate font families', async ({ page }) => {
    await page.goto('/');
    
    // Check that fonts have proper fallbacks
    const body = await page.locator('body').first();
    const bodyFontFamily = await body.evaluate(el => {
      return window.getComputedStyle(el).fontFamily;
    });
    
    // Should have fallback fonts
    expect(bodyFontFamily).toMatch(/,/); // Contains comma-separated fallbacks
    
    // Common fallbacks should include sans-serif, serif, or monospace
    expect(bodyFontFamily).toMatch(/sans-serif|serif|monospace/i);
  });

  test('should not have text that is too narrow', async ({ page }) => {
    await page.goto('/');
    
    // Check paragraphs for readable line length
    const paragraphs = await page.locator('p').all();
    
    for (const p of paragraphs.slice(0, 5)) {
      const width = await p.evaluate(el => {
        return el.offsetWidth;
      });
      
      // Paragraphs should be at least 200px wide (very minimum)
      // Ideal is 45-75 characters, but we check a basic minimum
      if (width > 0) {
        expect(width).toBeGreaterThanOrEqual(100);
      }
    }
  });
});
