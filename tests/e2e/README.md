# Playwright E2E Tests - Design System Regression Testing

This directory contains end-to-end tests using Playwright to validate that the theme implementation follows the design system rules documented in `docs/design-system/design_system_rules.md`.

## Purpose

These tests serve as regression tests to ensure that:
1. Design system rules are consistently applied
2. Accessibility standards are maintained
3. Component patterns follow established conventions
4. Asset management best practices are followed
5. Responsive design works across viewports

## Test Structure

```
tests/e2e/
└── design-system/
    ├── accessibility.spec.js          # Accessibility requirements
    ├── asset-management.spec.js       # CDN helper, lazy loading, image optimization
    ├── component-patterns.spec.js     # BEM naming, Cornerstone patterns
    ├── icon-system.spec.js           # SVG sprite usage, icon patterns
    ├── responsive-design.spec.js     # Viewport, mobile-friendly design
    ├── scss-tokens.spec.js           # CSS output validation
    └── typography.spec.js            # Font loading, typography scale
```

## Design Rules Tested

### Icon System (`icon-system.spec.js`)
- ✅ SVG sprite usage with modern `href` syntax (not deprecated `xlink:href`)
- ✅ Proper accessibility attributes (`aria-hidden="true"`, `focusable="false"`)
- ✅ Visually hidden text for icon-only buttons
- ✅ Icon size classes (`.c-icon--sm`, `.c-icon--lg`)
- ✅ CDN helper usage for sprite references

### Accessibility (`accessibility.spec.js`)
- ✅ Visible focus states on interactive elements
- ✅ ARIA labels on form inputs
- ✅ Proper heading hierarchy
- ✅ Alt text on images
- ✅ Keyboard navigation support
- ✅ Visually hidden text using `.u-hiddenVisually`

### Component Patterns (`component-patterns.spec.js`)
- ✅ Cornerstone button classes (`button`, `button--primary`, `button--secondary`)
- ✅ BEM naming conventions for custom components
- ✅ Proper form classes (`form-input`, `form-select`)
- ✅ No inline styles for basic styling
- ✅ Utility class naming conventions (`.u-*`)
- ✅ No mixing of different component systems (e.g., Tailwind)

### Asset Management (`asset-management.spec.js`)
- ✅ CDN helper usage for theme assets
- ✅ Lazy loading implementation
- ✅ Alt text strategy
- ✅ Icon sprite usage
- ✅ No broken image references
- ✅ Relative paths for internal assets
- ✅ Image aspect ratios
- ✅ SVG delivery optimization

### Responsive Design (`responsive-design.spec.js`)
- ✅ Viewport meta tag
- ✅ Mobile-friendly navigation
- ✅ Adequate touch targets (minimum 40x40px)
- ✅ Responsive images (srcset, sizes)
- ✅ Layout adaptation across viewports
- ✅ No horizontal scroll on mobile
- ✅ Responsive visibility classes
- ✅ Readable text sizes on mobile (minimum 12px)

### Typography (`typography.spec.js`)
- ✅ Web font loading
- ✅ Consistent typography scale
- ✅ Proper line heights (body: 1.4-1.8, headings: 1.1-1.4)
- ✅ No deprecated font attributes
- ✅ Consistent font weights
- ✅ Text color contrast
- ✅ Appropriate font families with fallbacks
- ✅ Readable line lengths

### SCSS Tokens (`scss-tokens.spec.js`)
- ✅ No hardcoded colors in critical CSS
- ✅ Consistent spacing values
- ✅ Consistent border radius values
- ✅ Consistent box shadows
- ✅ CSS custom properties usage
- ✅ Minimal use of `!important` (per design rules)
- ✅ Rem units for typography
- ✅ Consistent transition timing

## Running Tests

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

### Run All Tests

```bash
npm run test:e2e
```

### Run Specific Test Suite

```bash
# Run only icon system tests
npx playwright test icon-system

# Run only accessibility tests
npx playwright test accessibility

# Run only component patterns tests
npx playwright test component-patterns
```

### Run Tests in UI Mode

```bash
npx playwright test --ui
```

### Run Tests in Debug Mode

```bash
npx playwright test --debug
```

### View Test Report

```bash
npx playwright show-report
```

## Configuration

Tests are configured in `playwright.config.js` with the following settings:

- **Base URL**: `http://localhost:3000` (configurable via `BASE_URL` env var)
- **Browsers**: Chromium (Firefox and WebKit commented out but available)
- **Timeout**: 30 seconds per test
- **Retries**: 2 retries on CI, 0 locally
- **Screenshots**: Captured on failure
- **Trace**: Captured on first retry

### Setting Base URL

For testing against a live store:

```bash
BASE_URL=https://your-store.mybigcommerce.com npx playwright test
```

For testing local development:

```bash
BASE_URL=http://localhost:3000 npx playwright test
```

## Integration with CI/CD

These tests can be integrated into your CI/CD pipeline:

```yaml
# Example GitHub Actions workflow
- name: Run Playwright tests
  run: |
    npm ci
    npx playwright install --with-deps
    BASE_URL=${{ secrets.STORE_URL }} npm run test:e2e
```

## Writing New Tests

When adding new design rules or components, follow this pattern:

```javascript
const { test, expect } = require('@playwright/test');

test.describe('New Feature Tests', () => {
  test('should follow design rule X', async ({ page }) => {
    await page.goto('/');
    
    // Your test implementation
    const element = await page.locator('.your-selector');
    expect(element).toBeTruthy();
  });
});
```

### Best Practices

1. **Test behavior, not implementation**: Focus on what users see and experience
2. **Use semantic selectors**: Prefer ARIA roles and labels over CSS classes
3. **Keep tests independent**: Each test should work in isolation
4. **Use descriptive names**: Test names should clearly state what they verify
5. **Handle async properly**: Use `await` for all Playwright operations
6. **Test edge cases**: Don't just test the happy path

## Debugging Failed Tests

1. **Run in headed mode**:
   ```bash
   npx playwright test --headed
   ```

2. **Run in debug mode**:
   ```bash
   npx playwright test --debug
   ```

3. **Check screenshots**:
   - Screenshots are saved to `test-results/` on failure
   - Review them to see the state when the test failed

4. **Check trace**:
   ```bash
   npx playwright show-trace trace.zip
   ```

## Maintenance

- **Update tests** when design system rules change
- **Review test coverage** regularly to ensure all rules are tested
- **Keep tests fast** by testing only what's necessary
- **Document exceptions** when design rules can't be tested automatically

## Related Documentation

- [Design System Rules](../../../docs/design-system/design_system_rules.md)
- [Copilot Instructions](../../../.github/copilot-instructions.md)
- [Playwright Documentation](https://playwright.dev/docs/intro)

## Questions?

If you have questions about these tests or need help debugging failures, please:
1. Check the test output and screenshots
2. Review the design system rules documentation
3. Check the Playwright documentation
4. Open an issue with details about the failure
