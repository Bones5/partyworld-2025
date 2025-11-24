# Acceptance Testing with Visual Regression

This directory contains acceptance tests with visual regression screenshot testing using Playwright.

## Directory Structure

```
tests/acceptance/
├── specs/                    # Test files
│   ├── homepage.spec.js
│   ├── product-page.spec.js
│   └── cart-page.spec.js
├── screenshots/
│   ├── baseline/            # Baseline screenshots for comparison
│   ├── results/             # Test results and diffs
│   └── failures/            # Failed test artifacts
├── fixtures/                # Test data and fixtures
└── README.md               # This file
```

## Quick Start

### Prerequisites

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Install Playwright browsers**:
   ```bash
   npx playwright install chromium
   ```

3. **Build the theme** (if not already built):
   ```bash
   npm run build
   ```

4. **Start the Stencil development server**:
   ```bash
   stencil start
   ```
   This will start the theme at `http://localhost:3000` by default.

### Running Tests

**Run all acceptance tests**:
```bash
npm run test:acceptance
```

**Run tests in headed mode** (see the browser):
```bash
npm run test:acceptance:headed
```

**Run tests for a specific project** (device/browser):
```bash
npx playwright test --project=chromium
npx playwright test --project=mobile
npx playwright test --project=tablet
```

**Run a specific test file**:
```bash
npx playwright test tests/acceptance/specs/homepage.spec.js
```

**Update baseline screenshots**:
```bash
npm run test:acceptance:update
```
⚠️ **Warning**: Only run this when you've intentionally changed the UI and want to update the baseline images.

**View test report**:
```bash
npx playwright show-report tests/acceptance/results/html-report
```

### Debug Mode

Run tests in debug mode with Playwright Inspector:
```bash
npx playwright test --debug
```

## Writing Tests

### Basic Test Structure

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/your-page');
    await page.waitForLoadState('networkidle');
  });

  test('should display correctly', async ({ page }) => {
    // Your test logic
    await expect(page).toHaveScreenshot('feature-name.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});
```

### Visual Regression Testing

**Full page screenshot**:
```javascript
await expect(page).toHaveScreenshot('page-name.png', {
  fullPage: true,
  maxDiffPixels: 100,
});
```

**Element screenshot**:
```javascript
const element = page.locator('.my-element');
await expect(element).toHaveScreenshot('element-name.png');
```

**Custom screenshot options**:
```javascript
await expect(page).toHaveScreenshot('custom.png', {
  fullPage: true,
  maxDiffPixels: 200,           // Max pixels that can differ
  maxDiffPixelRatio: 0.02,      // Max ratio of different pixels (0-1)
  threshold: 0.3,               // Threshold for pixel difference (0-1)
  animations: 'disabled',       // Disable animations
});
```

**Masking dynamic content**:
```javascript
await expect(page).toHaveScreenshot('masked.png', {
  mask: [page.locator('.dynamic-content')],  // Hide dynamic areas
});
```

### Testing Different Viewports

**Use predefined projects** (configured in playwright.config.js):
- `chromium` - Desktop Chrome (1280x720)
- `mobile` - iPhone 12
- `tablet` - iPad Pro

**Custom viewport in test**:
```javascript
test('custom viewport', async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');
  // ... test logic
});
```

**Device-specific tests**:
```javascript
test('mobile-only test', async ({ page, isMobile }) => {
  if (!isMobile) {
    test.skip();
  }
  // ... mobile-specific test
});
```

## Best Practices

### 1. Wait for Content to Load
Always wait for the page to stabilize before taking screenshots:
```javascript
await page.waitForLoadState('networkidle');
await page.waitForTimeout(500); // For animations
```

### 2. Handle Dynamic Content
Mask or mock dynamic content like timestamps, user-specific data:
```javascript
// Mask elements
await expect(page).toHaveScreenshot('page.png', {
  mask: [
    page.locator('.timestamp'),
    page.locator('.user-name'),
  ],
});
```

### 3. Use Descriptive Names
Use clear, hierarchical names for screenshots:
```javascript
// Good
'homepage-desktop-hero-section.png'
'product-page-mobile-image-gallery.png'

// Bad
'test1.png'
'screenshot.png'
```

### 4. Set Appropriate Thresholds
- Start with strict thresholds (low maxDiffPixels)
- Increase if you have acceptable minor rendering differences
- Document why you increased thresholds

### 5. Review Visual Diffs
When tests fail:
1. Check the HTML report: `npx playwright show-report tests/acceptance/results/html-report`
2. Review the visual diff images
3. Determine if the change is intentional or a bug
4. Update baselines only for intentional changes

### 6. Test Critical User Journeys
Focus on:
- Homepage and landing pages
- Product browsing and search
- Cart and checkout flows
- Account pages
- Key conversion paths

### 7. Use Data Attributes for Selectors
Add `data-testid` attributes to make tests more stable:
```html
<button data-testid="add-to-cart">Add to Cart</button>
```

```javascript
await page.locator('[data-testid="add-to-cart"]').click();
```

## Configuration

The Playwright configuration is in `playwright.config.js` at the root of the project.

### Key Configuration Options

- **baseURL**: Set via `BASE_URL` env variable or defaults to `http://localhost:3000`
- **timeout**: 30 seconds per test
- **retries**: 2 retries on CI, 0 locally
- **screenshots**: Captured on failure
- **video**: Recorded on failure
- **projects**: chromium, mobile, tablet

### Environment Variables

Set these before running tests:
```bash
export BASE_URL=http://localhost:3000
export CI=true  # Enable CI mode
```

## Troubleshooting

### Tests Failing Due to Minor Pixel Differences

**Cause**: Font rendering, anti-aliasing, or minor CSS differences

**Solution**: Increase `maxDiffPixels` or `maxDiffPixelRatio`:
```javascript
await expect(page).toHaveScreenshot('page.png', {
  maxDiffPixels: 200,  // Increased from 100
});
```

### Dynamic Content Causing Failures

**Cause**: Timestamps, random IDs, user-specific content

**Solution**: Mask dynamic areas:
```javascript
await expect(page).toHaveScreenshot('page.png', {
  mask: [page.locator('.dynamic-content')],
});
```

### Animations Causing Inconsistent Screenshots

**Cause**: CSS animations or transitions

**Solution**: Disable animations in config or wait for them to complete:
```javascript
// In playwright.config.js
expect: {
  toHaveScreenshot: {
    animations: 'disabled',
  },
}

// Or in test
await page.waitForTimeout(1000); // Wait for animation
```

### Tests Work Locally But Fail on CI

**Cause**: Different OS rendering (Linux vs macOS vs Windows)

**Solution**: 
- Run tests in Docker locally with same OS as CI
- Generate baselines on CI
- Use higher thresholds for cross-platform tests

### Page Not Loading

**Cause**: Stencil server not running or wrong URL

**Solution**:
```bash
# Check if server is running
curl http://localhost:3000

# Start stencil server
stencil start

# Or set BASE_URL environment variable
export BASE_URL=http://your-store-url.com
```

## CI/CD Integration

The acceptance tests can be integrated into your GitHub Actions workflow.

Example workflow step:
```yaml
- name: Install Playwright
  run: npx playwright install chromium

- name: Run Acceptance Tests
  run: npm run test:acceptance
  env:
    BASE_URL: http://localhost:3000

- name: Upload Test Results
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: tests/acceptance/results/html-report/
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Test API](https://playwright.dev/docs/api/class-test)
- [Visual Comparisons Guide](https://playwright.dev/docs/test-snapshots)
- [BigCommerce Stencil CLI](https://github.com/bigcommerce/stencil-cli)

## Tips

1. **Generate baselines first**: Run tests once to create baseline screenshots before expecting them to pass
2. **Review changes carefully**: Always inspect visual diffs before updating baselines
3. **Keep tests stable**: Use data attributes and stable selectors
4. **Test incrementally**: Start with key pages, add more coverage over time
5. **Document expectations**: Add comments explaining why certain thresholds are set
6. **Regular maintenance**: Update baselines when UI intentionally changes
7. **Use git-ignore**: Don't commit `results/` folder, only `baseline/` screenshots
