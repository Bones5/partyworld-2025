# Playwright Testing Guide for BigCommerce Stencil

This guide explains how to use Playwright tests with the BigCommerce Stencil theme development workflow.

## Testing Strategy

The Playwright tests in this project are designed to validate design system rules and ensure consistent implementation across the theme. They are **regression tests** that check for:

1. **Design System Compliance**: Ensures code follows documented design rules
2. **Accessibility Standards**: Validates WCAG compliance and keyboard navigation
3. **Responsive Design**: Tests layout across different viewport sizes
4. **Component Patterns**: Verifies correct usage of Cornerstone and custom components
5. **Asset Management**: Checks CDN usage, lazy loading, and image optimization

## Testing Environments

### Local Development with Stencil CLI

The most common testing scenario is against a local Stencil development server:

1. **Start the Stencil development server**:
   ```bash
   npm run start
   ```
   This starts the local server at `http://localhost:3000`

2. **Run Playwright tests in another terminal**:
   ```bash
   npm run test:e2e
   ```

3. **Run specific test suites**:
   ```bash
   # Test only accessibility
   npx playwright test accessibility
   
   # Test only icon system
   npx playwright test icon-system
   
   # Test all design system rules
   npx playwright test design-system/
   ```

### Testing Against Staging/Production

To test against a deployed store:

```bash
BASE_URL=https://your-store.mybigcommerce.com npm run test:e2e
```

Or set it in your environment:

```bash
export BASE_URL=https://your-store.mybigcommerce.com
npm run test:e2e
```

### Testing Specific Pages

By default, most tests start at the home page (`/`). To test specific pages, you can:

1. **Modify individual tests** to navigate to specific URLs
2. **Create page-specific test files** for different page types

Example:
```javascript
test('should validate product page', async ({ page }) => {
  await page.goto('/products/example-product/');
  // Test product-specific rules
});
```

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/playwright.yml`:

```yaml
name: Playwright Tests
on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps chromium
    
    - name: Run Playwright tests
      run: npm run test:e2e
      env:
        BASE_URL: ${{ secrets.STAGING_URL }}
    
    - name: Upload test results
      if: always()
      uses: actions/upload-artifact@v3
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
```

### GitLab CI Example

Create `.gitlab-ci.yml`:

```yaml
playwright:
  image: mcr.microsoft.com/playwright:v1.40.0-focal
  stage: test
  script:
    - npm ci
    - npx playwright test
  artifacts:
    when: always
    paths:
      - playwright-report/
    expire_in: 1 week
  variables:
    BASE_URL: "$STAGING_URL"
```

## Stencil-Specific Considerations

### Theme Context

These tests assume you're testing a BigCommerce Stencil theme with:
- Handlebars templates
- SCSS with Citadel framework
- jQuery and Stencil Utils
- Foundation Sites utilities

### Authentication

Some pages may require authentication. To test authenticated pages:

```javascript
test.use({
  storageState: 'auth.json', // Save login state
});

test('should work on account page', async ({ page }) => {
  await page.goto('/account.php');
  // Test authenticated content
});
```

### API Testing

To test against BigCommerce APIs:

```javascript
test('should validate product data', async ({ request }) => {
  const response = await request.get('/api/storefront/products/123');
  expect(response.ok()).toBeTruthy();
});
```

## Debugging Tips

### Visual Debugging

1. **Run in headed mode** to see the browser:
   ```bash
   npm run test:e2e:headed
   ```

2. **Use UI mode** for interactive debugging:
   ```bash
   npm run test:e2e:ui
   ```

3. **Debug mode with inspector**:
   ```bash
   npm run test:e2e:debug
   ```

### Screenshot on Failure

Tests automatically capture screenshots on failure. Find them in:
```
test-results/
├── accessibility-should-have-visible-focus-states-chromium/
│   └── test-failed-1.png
└── ...
```

### Trace Viewer

For detailed debugging, view traces:
```bash
npx playwright show-trace trace.zip
```

## Performance Considerations

### Test Execution Time

- **Full suite**: ~2-3 minutes for all tests
- **Single suite**: ~10-30 seconds per test file
- **Parallel execution**: Enabled by default (use `workers: 1` for sequential)

### Network Optimization

```javascript
// Block unnecessary resources
await page.route('**/*.{png,jpg,jpeg}', route => route.abort());
```

### Page Load Optimization

```javascript
// Wait for specific state
await page.goto('/', { waitUntil: 'domcontentloaded' });
```

## Writing Theme-Specific Tests

### Testing Custom Components

```javascript
test('should render custom hero component', async ({ page }) => {
  await page.goto('/');
  
  // Test custom component
  const hero = page.locator('.c-hero');
  await expect(hero).toBeVisible();
  
  // Test Theme Editor integration
  const heading = hero.locator('.c-hero__heading');
  await expect(heading).toHaveText(/./); // Has content
});
```

### Testing Stencil Utils

```javascript
test('should use stencil utils for AJAX', async ({ page }) => {
  await page.goto('/');
  
  // Check that stencil-utils is loaded
  const hasStencilUtils = await page.evaluate(() => {
    return typeof window.stencilUtils !== 'undefined';
  });
  
  expect(hasStencilUtils).toBeTruthy();
});
```

### Testing BigCommerce Widgets

```javascript
test('should render page builder widgets', async ({ page }) => {
  await page.goto('/');
  
  // Test widget regions
  const widgets = page.locator('[data-content-region]');
  const count = await widgets.count();
  
  expect(count).toBeGreaterThanOrEqual(0);
});
```

## Best Practices for Stencil Themes

1. **Test with real store data**: Use staging stores with realistic products
2. **Test cart/checkout carefully**: These involve external payment systems
3. **Consider BigCommerce limitations**: Some features require store context
4. **Test category/product pages**: Different templates may have different rules
5. **Validate Theme Editor settings**: Test that settings properly affect output

## Maintenance

### Updating Tests

When design rules change:
1. Update `docs/design-system/design_system_rules.md`
2. Update corresponding test files
3. Update test documentation

### Skipping Tests

To skip tests temporarily:

```javascript
test.skip('temporarily disabled', async ({ page }) => {
  // This test won't run
});
```

### Test Stability

If tests are flaky:
1. Add appropriate `waitForLoadState()` calls
2. Use `waitForSelector()` for dynamic content
3. Increase timeouts for slow operations
4. Check for race conditions

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [BigCommerce Stencil Docs](https://developer.bigcommerce.com/stencil-docs/)
- [Design System Rules](../../docs/design-system/design_system_rules.md)
- [Theme Development Guide](../../README.md)

## Support

For help with Playwright tests:
1. Check test output and screenshots
2. Review the README in `tests/e2e/`
3. Check Playwright documentation
4. Review design system rules
5. Open an issue with:
   - Test name that failed
   - Error message
   - Screenshots
   - Expected vs actual behavior
