/**
 * Smoke Test
 * 
 * Basic test to verify Playwright is set up correctly
 */

const { test, expect } = require('@playwright/test');

test.describe('Playwright Setup', () => {
  test('should be able to run a basic test', async ({ page }) => {
    // Create a simple test page
    await page.setContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Test Page</title>
        </head>
        <body>
          <h1>Test Page</h1>
          <p>This is a test page for Playwright setup verification.</p>
        </body>
      </html>
    `);
    
    // Verify we can interact with the page
    const heading = await page.locator('h1').textContent();
    expect(heading).toBe('Test Page');
    
    const paragraph = await page.locator('p').textContent();
    expect(paragraph).toContain('test page');
  });
  
  test('should support modern JavaScript features', async ({ page }) => {
    await page.setContent('<div id="test"></div>');
    
    const result = await page.evaluate(() => {
      // Test arrow functions, template literals, const/let
      const message = 'Hello';
      const world = 'World';
      return `${message} ${world}`;
    });
    
    expect(result).toBe('Hello World');
  });
  
  test('should be able to test CSS styles', async ({ page }) => {
    await page.setContent(`
      <style>
        .test-element {
          color: rgb(255, 0, 0);
          font-size: 16px;
          padding: 10px;
        }
      </style>
      <div class="test-element">Styled Element</div>
    `);
    
    const element = page.locator('.test-element');
    const color = await element.evaluate(el => window.getComputedStyle(el).color);
    const fontSize = await element.evaluate(el => window.getComputedStyle(el).fontSize);
    
    expect(color).toBe('rgb(255, 0, 0)');
    expect(fontSize).toBe('16px');
  });
});
