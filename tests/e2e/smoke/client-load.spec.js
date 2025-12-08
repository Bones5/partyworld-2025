const { test, expect } = require('@playwright/test');

// Smoke test: homepage should load without JS console errors
// (ignores expected network 4xx noise from theme assets or API)
test('home page loads without console errors', async ({ page }) => {
  const consoleErrors = [];

  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;

    const text = msg.text() || '';

    // Ignore benign network failures (404/422 etc.)
    if (text.includes('Failed to load resource') || /\b4\d\d\b/.test(text)) {
      return;
    }

    consoleErrors.push(text);
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');

  expect(consoleErrors).toEqual([]);
});
