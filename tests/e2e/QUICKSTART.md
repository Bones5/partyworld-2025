# Playwright Quick Start Guide

## Installation

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Install Playwright browsers**:
   ```bash
   npx playwright install chromium --with-deps
   ```

## Running Tests

### Quick Test Run
```bash
# Run all tests
npm run test:e2e

# Run smoke tests to verify setup
npx playwright test smoke
```

### Interactive Testing
```bash
# Open UI mode (recommended for development)
npm run test:e2e:ui

# Run with visible browser
npm run test:e2e:headed

# Run in debug mode with inspector
npm run test:e2e:debug
```

### Run Specific Tests
```bash
# Run a specific test file
npx playwright test icon-system

# Run tests matching a pattern
npx playwright test accessibility

# Run a single test by name
npx playwright test -g "should have visible focus states"
```

## Test Against Different URLs

```bash
# Local development (default)
npm run test:e2e

# Staging store
BASE_URL=https://staging-store.mybigcommerce.com npm run test:e2e

# Production store
BASE_URL=https://store.mybigcommerce.com npm run test:e2e
```

## View Results

```bash
# Generate and view HTML report
npm run test:e2e:report

# View last test results
npx playwright show-report
```

## Common Test Scenarios

### Testing a Specific Design Rule

```bash
# Test icon system only
npx playwright test icon-system

# Test accessibility only
npx playwright test accessibility

# Test responsive design only
npx playwright test responsive-design
```

### Debugging Failed Tests

```bash
# Run failed tests in debug mode
npm run test:e2e:debug --grep "test name that failed"

# Run with visible browser to see what's happening
npm run test:e2e:headed

# Run with trace enabled
npx playwright test --trace on
```

### Testing Before Commit

```bash
# Run a quick smoke test
npx playwright test smoke

# Run all design system tests
npm run test:e2e
```

## Test Structure

```
tests/e2e/
├── smoke.spec.js                    # Basic setup verification
├── design-system/
│   ├── accessibility.spec.js        # WCAG compliance, focus states
│   ├── asset-management.spec.js     # CDN, lazy loading, images
│   ├── component-patterns.spec.js   # BEM, Cornerstone patterns
│   ├── icon-system.spec.js         # SVG sprites, accessibility
│   ├── responsive-design.spec.js   # Viewports, mobile-friendly
│   ├── scss-tokens.spec.js         # CSS output validation
│   └── typography.spec.js          # Font loading, scale
└── helpers.js                       # Test utilities
```

## Expected Test Results

✅ **57 design system tests** covering:
- Icon system implementation
- Accessibility requirements
- Component patterns
- Asset management
- Responsive design
- Typography
- SCSS token usage

## Tips

1. **Start with UI mode** when developing new tests
2. **Use headed mode** to see browser interactions
3. **Check screenshots** in `test-results/` when tests fail
4. **Run smoke tests** first to verify basic setup
5. **Test locally** before pushing changes

## Need Help?

- 📖 [Full Testing Guide](../docs/PLAYWRIGHT_TESTING.md)
- 📖 [Test README](README.md)
- 📖 [Playwright Docs](https://playwright.dev)
- 📖 [Design System Rules](../../docs/design-system/design_system_rules.md)

## Common Issues

### "Test environment not found"
```bash
# Install dependencies
npm ci
```

### "Browser not installed"
```bash
# Install Playwright browsers
npx playwright install chromium --with-deps
```

### "Connection refused"
```bash
# Make sure your development server is running
npm run start

# Or set BASE_URL to an external store
BASE_URL=https://your-store.com npm run test:e2e
```

### Tests are flaky
```bash
# Run with longer timeout
npx playwright test --timeout 60000

# Run sequentially instead of parallel
npx playwright test --workers=1
```

## CI/CD

Tests automatically run in GitHub Actions on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

View results in the Actions tab of the repository.
