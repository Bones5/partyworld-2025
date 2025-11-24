# Testing Guide

This document outlines the testing options available in this repository.

## Current Testing Infrastructure

### 1. Unit Tests (Jest)

**Location**: `assets/js/test-unit/`

**Purpose**: Test individual JavaScript modules and functions in isolation

**Technology**: Jest with jsdom environment

**Running Tests**:
```bash
npm test                 # Run all unit tests
npm run test:watch      # Run tests in watch mode
```

**Coverage**: 
- Cart functionality
- Common utilities (state-country, form-utils, url-utils, etc.)
- UI components (collapsible, carousel, modal, menu)
- Validation functions

**Example Test File**: `assets/js/test-unit/theme/cart.spec.js`

### 2. Acceptance Tests with Visual Regression (NEW)

**Location**: `tests/acceptance/`

**Purpose**: Test complete user workflows and visual appearance of pages

**Technology**: Playwright with screenshot comparison

**Running Tests**:
```bash
npm run test:acceptance              # Run acceptance tests
npm run test:acceptance:headed       # Run with browser visible
npm run test:acceptance:update       # Update baseline screenshots
```

**Features**:
- **End-to-End Testing**: Simulates real user interactions
- **Visual Regression**: Compares screenshots to detect unintended UI changes
- **Cross-Browser**: Tests on Chromium, Firefox, and WebKit
- **Responsive Testing**: Tests different viewport sizes

**Screenshot Storage**:
- Baseline screenshots: `tests/acceptance/screenshots/baseline/`
- Comparison results: `tests/acceptance/screenshots/results/`
- Failed test artifacts: `tests/acceptance/screenshots/failures/`

## Testing Strategy

### When to Use Unit Tests
- Testing individual functions or modules
- Testing business logic
- Testing utilities and helpers
- Fast feedback during development

### When to Use Acceptance Tests
- Testing complete user workflows
- Testing page layouts and visual appearance
- Testing responsive design
- Detecting visual regressions
- Testing cross-browser compatibility

## CI/CD Integration

Both test types run automatically on pull requests and pushes to master/main branches.

### GitHub Actions Workflows
- **Theme Bundling Test**: Builds theme and runs linting/checks
- **Acceptance Tests**: Runs visual regression tests (requires theme to be running)

## Linting and Code Quality

**ESLint** (JavaScript):
```bash
npx grunt check:js       # Run ESLint
```

**Stylelint** (SCSS):
```bash
npm run stylelint        # Check styles
npm run stylelint:fix    # Auto-fix style issues
```

**All Checks**:
```bash
npx grunt check          # Run all linting and unit tests
```

## Writing Tests

### Writing Unit Tests

Create test files with `.spec.js` extension in `assets/js/test-unit/`:

```javascript
import MyModule from '../../theme/my-module';

describe('MyModule', () => {
    it('should do something', () => {
        const instance = new MyModule();
        expect(instance.someMethod()).toBe(expected);
    });
});
```

### Writing Acceptance Tests

Create test files with `.spec.js` extension in `tests/acceptance/`:

```javascript
const { test, expect } = require('@playwright/test');

test.describe('Page Name', () => {
    test('should display correctly', async ({ page }) => {
        await page.goto('/page-url');
        
        // Wait for page to load
        await page.waitForLoadState('networkidle');
        
        // Take and compare screenshot
        await expect(page).toHaveScreenshot('page-name.png', {
            fullPage: true,
            maxDiffPixels: 100
        });
    });
});
```

## Performance Testing

**Lighthouse** is available for performance auditing:

```bash
URL=http://localhost:3000 npm run lighthouse
```

This generates a performance report at `lighthouse-report.html`.

## Best Practices

1. **Keep tests focused**: Each test should verify one specific behavior
2. **Use descriptive test names**: Clearly state what is being tested
3. **Update baselines carefully**: Only update visual baselines when intentional changes are made
4. **Review visual diffs**: Always review screenshot differences before accepting them
5. **Test different viewports**: Include mobile, tablet, and desktop sizes
6. **Use data-testid attributes**: Add test-specific attributes to make selectors more stable
7. **Clean up after tests**: Ensure tests don't affect each other

## Troubleshooting

### Unit Tests Failing
- Run `npm ci` to ensure dependencies are up to date
- Check console output for specific error messages
- Use `npm run test:watch` for interactive debugging

### Acceptance Tests Failing
- Ensure theme is properly built: `npm run build`
- Check if screenshots need updating: `npm run test:acceptance:update`
- Review visual diffs in `tests/acceptance/screenshots/results/`
- Increase `maxDiffPixels` threshold if minor rendering differences are expected

### Visual Regression False Positives
- Font rendering can vary slightly between systems
- Anti-aliasing differences
- Dynamic content (dates, times, random data)
- Solution: Use masking for dynamic areas or increase diff threshold

## Future Enhancements

Potential additions to the testing suite:
- API integration tests
- Accessibility (a11y) testing
- Load/stress testing
- Security testing
- Cross-device testing (mobile devices)
