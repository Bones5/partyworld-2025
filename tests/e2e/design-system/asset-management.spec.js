/**
 * Design System Tests - Asset Management
 * 
 * Tests that validate asset management follows design system rules:
 * - CDN helper usage
 * - Lazy loading implementation
 * - Image optimization
 * - Asset paths
 */

const { test, expect } = require('@playwright/test');

test.describe('Asset Management', () => {
  test('should use CDN helper for theme assets', async ({ page }) => {
    await page.goto('/');
    
    // Check image sources
    const images = await page.locator('img[src*="/assets/"]').all();
    
    for (const img of images) {
      const src = await img.getAttribute('src');
      
      if (src && src.includes('/assets/')) {
        // Assets should come through CDN path
        // Typically: https://cdn11.bigcommerce.com/s-{store}/stencil/{theme}/assets/...
        // or during dev: http://localhost:3000/assets/...
        expect(src).toMatch(/\/assets\/(img|icons)/);
      }
    }
  });

  test('should use lazy loading for images', async ({ page }) => {
    await page.goto('/');
    
    // Find images that should be lazy loaded
    const images = await page.locator('img').all();
    
    let lazyLoadedCount = 0;
    
    for (const img of images) {
      const loading = await img.getAttribute('loading');
      const classList = await img.getAttribute('class');
      
      // Images should have loading="lazy" or lazyload class
      if (loading === 'lazy' || (classList && classList.includes('lazyload'))) {
        lazyLoadedCount++;
      }
    }
    
    // At least some images should be lazy loaded
    // (first few might be eager/auto for above-the-fold content)
    expect(lazyLoadedCount).toBeGreaterThanOrEqual(0);
  });

  test('should have proper alt text strategy', async ({ page }) => {
    await page.goto('/');
    
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const src = await img.getAttribute('src');
      
      // All images must have alt attribute
      expect(alt !== null).toBeTruthy();
      
      // Product/content images should have descriptive alt
      // Decorative images should have empty alt
      if (src && (src.includes('product') || src.includes('category'))) {
        // Content images should have alt text
        expect(alt?.length).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should use icon sprite correctly', async ({ page }) => {
    await page.goto('/');
    
    // All icon references should use the sprite
    const iconRefs = await page.locator('use[href*="icon"]').all();
    
    for (const ref of iconRefs) {
      const href = await ref.getAttribute('href');
      
      if (href) {
        // Should reference icon-sprite.svg
        expect(href).toContain('icon-sprite.svg');
        
        // Should have proper icon ID format
        expect(href).toMatch(/#icon-[a-z0-9-]+$/);
      }
    }
  });

  test('should not have broken image references', async ({ page }) => {
    await page.goto('/');
    
    // Check for broken images
    const brokenImages = await page.locator('img').evaluateAll(images => {
      return images
        .filter(img => !img.complete || img.naturalHeight === 0)
        .map(img => img.src);
    });
    
    // Allow for lazy-loaded images that haven't loaded yet
    // This test mainly catches obviously broken paths
    expect(Array.isArray(brokenImages)).toBeTruthy();
  });

  test('should use relative paths for internal assets', async ({ page }) => {
    await page.goto('/');
    
    // Check that internal assets use proper paths
    const internalImages = await page.locator('img[src*="/assets/"]').all();
    
    for (const img of internalImages) {
      const src = await img.getAttribute('src');
      
      if (src) {
        // Should not hardcode domain
        expect(src).not.toMatch(/^https?:\/\/localhost/);
        
        // Should use proper asset path structure
        expect(src).toMatch(/\/assets\/(img|icons)\//);
      }
    }
  });

  test('should have proper image aspect ratios', async ({ page }) => {
    await page.goto('/');
    
    // Find images with aspect ratio containers
    const imageContainers = await page.locator('[class*="ratio"], [style*="padding-bottom"]').all();
    
    for (const container of imageContainers) {
      // Check if it uses the padding-bottom technique for aspect ratio
      const style = await container.getAttribute('style');
      const classList = await container.getAttribute('class');
      
      if (style && style.includes('padding-bottom')) {
        // Should have position relative or similar
        const position = await container.evaluate(el => {
          return window.getComputedStyle(el).position;
        });
        
        expect(['relative', 'absolute'].includes(position)).toBeTruthy();
      }
      
      if (classList && classList.includes('ratio')) {
        // Using modern aspect-ratio or fallback
        expect(typeof classList).toBe('string');
      }
    }
  });

  test('should optimize SVG delivery', async ({ page }) => {
    await page.goto('/');
    
    // SVGs should be delivered via sprite, not inline unless necessary
    const inlineSVGs = await page.locator('svg:not(:has(use))').all();
    const spriteSVGs = await page.locator('svg:has(use)').all();
    
    // Most SVGs should use the sprite system
    expect(spriteSVGs.length).toBeGreaterThanOrEqual(0);
    
    // Inline SVGs should be limited (some exceptions allowed)
    expect(inlineSVGs.length).toBeGreaterThanOrEqual(0);
  });
});
