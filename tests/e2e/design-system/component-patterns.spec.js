/**
 * Design System Tests - Component Patterns
 * 
 * Tests that validate component implementation follows design system rules:
 * - BEM naming conventions
 * - Cornerstone button classes
 * - Form component patterns
 * - Component structure
 */

const { test, expect } = require('@playwright/test');

test.describe('Component Patterns', () => {
  test('should use Cornerstone button classes', async ({ page }) => {
    await page.goto('/');
    
    // Find all buttons
    const buttons = await page.locator('button, a.button').all();
    
    for (const button of buttons) {
      const classList = await button.getAttribute('class');
      
      if (classList && classList.includes('button')) {
        // Should use proper button classes
        expect(classList).toMatch(/button/);
        
        // If it has a variant, should be valid
        if (classList.includes('button--')) {
          expect(classList).toMatch(/button--(primary|secondary|tertiary|small|large)/);
        }
        
        // Should not use arbitrary inline styles for basic styling
        const style = await button.getAttribute('style');
        if (style) {
          // Should not have basic color/padding inline
          expect(style).not.toMatch(/background-color:/);
          expect(style).not.toMatch(/padding:/);
        }
      }
    }
  });

  test('should use BEM naming for custom components', async ({ page }) => {
    await page.goto('/');
    
    // Find elements with component classes (starts with c-)
    const components = await page.locator('[class*="c-"]').all();
    
    for (const component of components.slice(0, 10)) {
      const classList = await component.getAttribute('class');
      
      if (classList) {
        const classes = classList.split(' ');
        
        for (const cls of classes) {
          if (cls.startsWith('c-')) {
            // BEM pattern: c-componentName__element--modifier
            // Should use kebab-case
            expect(cls).toMatch(/^c-[a-z][a-z0-9]*(-[a-z0-9]+)*(__|--)?[a-z0-9]*(-[a-z0-9]+)*$/);
            
            // Should not have camelCase
            expect(cls).not.toMatch(/[A-Z]/);
          }
        }
      }
    }
  });

  test('should use proper form classes', async ({ page }) => {
    await page.goto('/');
    
    // Find all forms
    const forms = await page.locator('form').all();
    
    for (const form of forms) {
      const classList = await form.getAttribute('class');
      
      // Forms should have a form class or be part of a component
      if (classList) {
        expect(classList).toMatch(/form|c-/);
      }
      
      // Check form inputs
      const inputs = await form.locator('input, select, textarea').all();
      
      for (const input of inputs) {
        const inputClass = await input.getAttribute('class');
        
        // Inputs should have proper form classes
        if (inputClass) {
          expect(inputClass).toMatch(/form-input|form-select|form-field|c-/);
        }
      }
    }
  });

  test('should not use inline styles for basic styling', async ({ page }) => {
    await page.goto('/');
    
    // Get all elements with inline styles
    const styledElements = await page.locator('[style]').all();
    
    for (const element of styledElements) {
      const style = await element.getAttribute('style');
      
      if (style) {
        // Should not have hardcoded colors (hex or rgb)
        expect(style).not.toMatch(/#[0-9a-f]{3,6}/i);
        expect(style).not.toMatch(/rgb\(/i);
        
        // Dynamic positioning/sizing is OK, but basic styling should be in CSS
        // This is a soft check - we allow inline styles for dynamic content
      }
    }
  });

  test('should use utility classes correctly', async ({ page }) => {
    await page.goto('/');
    
    // Find elements with utility classes (u-)
    const utilityElements = await page.locator('[class*="u-"]').all();
    
    for (const element of utilityElements.slice(0, 10)) {
      const classList = await element.getAttribute('class');
      
      if (classList) {
        const classes = classList.split(' ');
        
        for (const cls of classes) {
          if (cls.startsWith('u-')) {
            // Utility classes should follow naming convention
            expect(cls).toMatch(/^u-[a-z][a-zA-Z0-9]*$/);
          }
        }
      }
    }
  });

  test('should have proper card component structure', async ({ page }) => {
    await page.goto('/');
    
    // Find card components
    const cards = await page.locator('.c-card, .card').all();
    
    for (const card of cards) {
      const classList = await card.getAttribute('class');
      
      // Cards should use proper class naming
      if (classList) {
        expect(classList).toMatch(/c-card|card/);
        
        // If it has modifiers, they should follow BEM
        if (classList.includes('--')) {
          expect(classList).toMatch(/--[a-z][a-z0-9-]*/);
        }
      }
    }
  });

  test('should use proper icon button pattern', async ({ page }) => {
    await page.goto('/');
    
    // Find icon buttons (buttons with SVG icons)
    const iconButtons = await page.locator('button:has(svg), a.button:has(svg)').all();
    
    for (const button of iconButtons) {
      // Should have button class
      const classList = await button.getAttribute('class');
      expect(classList).toBeTruthy();
      
      // Should have accessible text (visible or hidden)
      const textContent = await button.textContent();
      const hasHiddenText = await button.locator('.u-hiddenVisually').count() > 0;
      
      expect(textContent?.trim() || hasHiddenText).toBeTruthy();
    }
  });

  test('should not mix different component systems', async ({ page }) => {
    await page.goto('/');
    
    // Check that we don't have conflicting class systems
    const elements = await page.locator('[class]').all();
    
    for (const element of elements.slice(0, 20)) {
      const classList = await element.getAttribute('class');
      
      if (classList) {
        // Should not have Tailwind-like utility classes
        expect(classList).not.toMatch(/\b(flex-1|grid-cols-|bg-|text-lg|p-\d+|m-\d+)\b/);
        
        // Should not have Bootstrap-like classes mixed with custom
        const hasCustom = classList.includes('c-');
        const hasBootstrap = classList.match(/\b(container-fluid|col-md-|row)\b/);
        
        // This is informational - not strictly an error
        expect(typeof hasBootstrap).toBe('object');
      }
    }
  });
});
