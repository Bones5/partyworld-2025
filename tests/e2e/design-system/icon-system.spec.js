/**
 * Design System Tests - Icon System
 * 
 * Tests that validate icon implementation follows design system rules:
 * - SVG sprite usage
 * - Proper attributes (aria-hidden, focusable)
 * - Icon sizing classes
 * - Visually hidden labels for accessibility
 */

const { test, expect } = require('@playwright/test');

test.describe('Icon System Implementation', () => {
  test('should use SVG sprite with proper href syntax', async ({ page }) => {
    await page.goto('/');
    
    // Find all SVG icons
    const svgIcons = await page.locator('svg use').all();
    
    // At least some icons should exist
    expect(svgIcons.length).toBeGreaterThan(0);
    
    // Check each icon uses correct href syntax (not deprecated xlink:href)
    for (const icon of svgIcons) {
      const href = await icon.getAttribute('href');
      
      // Should use href attribute
      expect(href).toBeTruthy();
      
      // Should reference the icon sprite
      if (href) {
        expect(href).toContain('icon-sprite.svg');
        expect(href).toMatch(/#icon-\w+/);
      }
      
      // Should not use deprecated xlink:href
      const xlinkHref = await icon.getAttribute('xlink:href');
      expect(xlinkHref).toBeNull();
    }
  });

  test('should have proper accessibility attributes on icons', async ({ page }) => {
    await page.goto('/');
    
    // Find all SVG elements that contain icons
    const svgElements = await page.locator('svg:has(use)').all();
    
    expect(svgElements.length).toBeGreaterThan(0);
    
    for (const svg of svgElements) {
      // SVG should be aria-hidden="true"
      const ariaHidden = await svg.getAttribute('aria-hidden');
      expect(ariaHidden).toBe('true');
      
      // SVG should have focusable="false"
      const focusable = await svg.getAttribute('focusable');
      expect(focusable).toBe('false');
    }
  });

  test('should have visually hidden text for icon-only buttons', async ({ page }) => {
    await page.goto('/');
    
    // Find buttons/links that contain only icons (no visible text)
    const iconButtons = await page.locator('button:has(svg use), a:has(svg use)').all();
    
    for (const button of iconButtons) {
      const visibleText = await button.evaluate(el => {
        // Get only visible text content
        const clone = el.cloneNode(true);
        // Remove visually hidden elements
        clone.querySelectorAll('.u-hiddenVisually').forEach(e => e.remove());
        return clone.textContent?.trim() || '';
      });
      
      // If button has no visible text, it should have visually hidden text
      if (!visibleText) {
        const hiddenText = await button.locator('.u-hiddenVisually').textContent();
        expect(hiddenText).toBeTruthy();
        expect(hiddenText?.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test('should use proper icon size classes', async ({ page }) => {
    await page.goto('/');
    
    // Find icons with size classes
    const icons = await page.locator('svg[class*="icon"]').all();
    
    for (const icon of icons) {
      const classList = await icon.getAttribute('class');
      
      if (classList) {
        // Icons should have base class or size modifiers
        const hasValidClass = classList.includes('c-icon') || 
                             classList.includes('navUser-icon') ||
                             classList.includes('icon');
        
        expect(hasValidClass).toBeTruthy();
        
        // If size modifier exists, should be valid
        if (classList.includes('c-icon--')) {
          expect(classList).toMatch(/c-icon--(sm|lg|xl)/);
        }
      }
    }
  });

  test('should use CDN helper for icon sprite references', async ({ page }) => {
    await page.goto('/');
    
    // Get all icon sprite references
    const spriteRefs = await page.locator('use[href*="icon-sprite"]').all();
    
    expect(spriteRefs.length).toBeGreaterThan(0);
    
    for (const ref of spriteRefs) {
      const href = await ref.getAttribute('href');
      
      if (href) {
        // Should reference from assets/img/icon-sprite.svg
        expect(href).toContain('assets/img/icon-sprite.svg');
        
        // Should have proper icon ID format
        expect(href).toMatch(/#icon-[a-z0-9-]+$/);
      }
    }
  });
});
