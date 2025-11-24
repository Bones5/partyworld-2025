# Testing Options Summary

This document answers the question: "What are our testing options with this repo? Can we get visual regression screenshots as part of acceptance?"

## Answer: YES! ✅

Visual regression screenshot testing is now available as part of acceptance tests.

## Testing Options Available

### 1. Unit Tests (Existing - Jest)

**What**: Tests individual JavaScript modules in isolation  
**Location**: `assets/js/test-unit/`  
**Run**: `npm test`  
**Coverage**: 13 test suites, 116 tests covering cart, utilities, and UI components

### 2. Acceptance Tests with Visual Regression (NEW - Playwright)

**What**: End-to-end tests with automatic screenshot comparison  
**Location**: `tests/acceptance/`  
**Run**: `npm run test:acceptance`  

**Capabilities**:
- ✅ **Visual Regression Testing**: Automatically compares screenshots to detect UI changes
- ✅ **Cross-browser Testing**: Tests on Chromium, mobile, and tablet viewports
- ✅ **Full Page Screenshots**: Capture entire pages or specific elements
- ✅ **Responsive Testing**: Test different device sizes
- ✅ **Diff Reports**: HTML reports showing visual differences
- ✅ **CI/CD Integration**: GitHub Actions workflow ready

### 3. Code Quality Checks (Existing)

**Linting**:
- ESLint for JavaScript
- Stylelint for SCSS

**Run**: `npx grunt check`

### 4. Performance Testing (Existing)

**Lighthouse** performance audits  
**Run**: `URL=http://localhost:3000 npm run lighthouse`

## Quick Start for Visual Regression Testing

### Setup (One-time)
```bash
# Install dependencies
npm install

# Install Playwright browser
npx playwright install chromium
```

### Running Tests
```bash
# Run acceptance tests with visual regression
npm run test:acceptance

# Run with browser visible (for debugging)
npm run test:acceptance:headed

# Update baseline screenshots (after intentional UI changes)
npm run test:acceptance:update

# View test report with visual diffs
npm run test:acceptance:report
```

## How Visual Regression Works

1. **First Run**: Playwright captures baseline screenshots
2. **Subsequent Runs**: Compares new screenshots against baselines
3. **On Differences**: 
   - Test fails
   - Visual diff is generated
   - HTML report shows what changed
4. **Update Baselines**: When UI changes are intentional, update baselines

## Example Test

```javascript
const { test, expect } = require('@playwright/test');

test('homepage displays correctly', async ({ page }) => {
  // Navigate to page
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  // Take screenshot and compare to baseline
  await expect(page).toHaveScreenshot('homepage.png', {
    fullPage: true,
    maxDiffPixels: 100  // Allow up to 100 pixels difference
  });
});
```

## Test Files Included

### Ready to Use
- `tests/acceptance/specs/homepage.spec.js` - Homepage tests
- `tests/acceptance/specs/example-best-practices.spec.js` - Best practices example

### Templates (Marked as `.skip()`)
- `tests/acceptance/specs/product-page.spec.js` - Product page template
- `tests/acceptance/specs/cart-page.spec.js` - Cart page template

**Note**: Template tests are skipped by default and need actual store URLs to run.

## Configuration

All settings are in `playwright.config.js`:
- Base URL: `http://localhost:3000` (configurable via `BASE_URL` env var)
- Timeout: 30 seconds per test
- Screenshot diff threshold: 100 pixels max difference
- Projects: Desktop (Chromium), Mobile (iPhone 12), Tablet (iPad Pro)

## Documentation

Comprehensive guides available:
- **[TESTING.md](TESTING.md)** - Complete testing guide for all test types
- **[tests/acceptance/README.md](tests/acceptance/README.md)** - Detailed acceptance testing guide
- **README.md** - Updated with testing section

## CI/CD Integration

A GitHub Actions workflow is configured at `.github/workflows/acceptance-tests.yml`.

**To enable**:
1. Add store credentials as GitHub secrets
2. Uncomment the workflow steps
3. Tests will run automatically on PRs and pushes

## Benefits

### Visual Regression Testing Benefits
1. **Catch Unintended Changes**: Automatically detect visual bugs
2. **Prevent Regressions**: Ensure UI stays consistent
3. **Save Time**: No manual visual testing
4. **Cross-browser Confidence**: Test multiple viewports
5. **Documentation**: Screenshots serve as visual documentation
6. **Fast Feedback**: Know immediately if UI breaks

### Test Coverage
- **Unit Tests**: Logic and functionality (already existing)
- **Acceptance Tests**: User workflows and visual appearance (new)
- **Linting**: Code quality (already existing)
- **Performance**: Lighthouse audits (already existing)

## Next Steps

### For Immediate Use
1. Run `npx playwright install chromium`
2. Start your Stencil dev server: `stencil start`
3. Run: `npm run test:acceptance`
4. First run creates baselines
5. Second run verifies against baselines

### For Your Store
1. Update test files with actual product/page URLs
2. Uncomment skipped tests
3. Run tests to generate baselines
4. Add more tests for critical pages

### For CI/CD
1. Add BigCommerce store credentials to GitHub secrets
2. Uncomment workflow steps in `.github/workflows/acceptance-tests.yml`
3. Tests run automatically on every PR

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Visual Comparison Guide](https://playwright.dev/docs/test-snapshots)
- [BigCommerce Stencil](https://github.com/bigcommerce/stencil-cli)

## Summary

✅ **Visual regression screenshot testing is fully implemented and ready to use**  
✅ **Comprehensive testing suite available: Unit, Acceptance, Visual Regression, Linting, Performance**  
✅ **Documentation provided for all test types**  
✅ **CI/CD workflow configured and ready to enable**  
✅ **Example tests and best practices included**

The repository now has a complete testing infrastructure that includes visual regression screenshot capabilities as part of acceptance testing.
