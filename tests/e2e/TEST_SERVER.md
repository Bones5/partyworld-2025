# E2E Test Server Documentation

## Overview

The E2E test suite requires a running HTTP server to validate design system rules against actual HTML. Since BigCommerce Stencil themes require store credentials and cannot run in CI/CD environments without a connected store, we use a lightweight Node.js test server that serves mock HTML pages.

## Architecture

### Test Server (`test-server.js`)

A simple Node.js HTTP server that:
- Runs on port 3000 (configurable via PORT env var)
- Serves mock HTML pages that represent typical BigCommerce Stencil theme structure
- Includes all necessary design system patterns that tests validate
- Automatically starts when running `npm run test:e2e` (configured in `playwright.config.js`)

### Mock HTML Structure

The mock HTML includes:

1. **Document Structure**
   - Semantic HTML5 elements
   - Proper viewport meta tag
   - Accessible skip links

2. **Icon System**
   - SVG sprite with proper attributes
   - Icons using `<use>` with href (not deprecated xlink:href)
   - Proper accessibility attributes (aria-hidden, focusable)
   - Visually hidden text for icon-only buttons

3. **Navigation**
   - Mobile-friendly navigation
   - Touch targets minimum 44x44px
   - Focus states on interactive elements

4. **Components**
   - BEM naming convention (c-component-name__element--modifier)
   - Proper button classes (button, button--primary, button--secondary)
   - Form elements with ARIA labels
   - Card components with proper structure

5. **Responsive Design**
   - CSS that prevents horizontal scroll
   - Responsive images with srcset/sizes
   - Mobile-friendly typography
   - Proper CSS for all viewport sizes

6. **Typography**
   - Heading hierarchy (h1 > h2 > h3)
   - Proper line heights
   - Readable font sizes

## Running Tests

### Standard Test Run
```bash
npm run test:e2e
```

The test server will automatically start on port 3000 and tests will run against it.

### Running Against a Live Store

If you want to test against an actual BigCommerce store instead:

```bash
BASE_URL=https://your-store.mybigcommerce.com npm run test:e2e
```

This will bypass the test server and connect directly to the store.

## Maintenance

### When to Update the Test Server

Update `test-server.js` when:

1. **Adding New Components**: If you add a new component pattern that needs E2E validation, add representative HTML to the mock page.

2. **Design System Changes**: If design system rules change (e.g., new BEM naming patterns, new icon sizes), update the mock HTML to reflect these changes.

3. **Test Failures**: If tests fail because the mock HTML doesn't match expected patterns, update the HTML structure.

### Common Updates

**Adding a new icon:**
```html
<symbol id="icon-name" viewBox="0 0 24 24">
    <path d="..."/>
</symbol>
```

**Adding a new component pattern:**
```html
<div class="c-new-component">
    <div class="c-new-component__element">Content</div>
</div>
```

**Adding responsive patterns:**
```css
@media (max-width: 768px) {
    .component { /* mobile styles */ }
}
```

## Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
PORT=3001 npm run test:e2e
```

And update `playwright.config.js` baseURL accordingly.

### Tests Timeout

If tests timeout waiting for elements, check:
1. The mock HTML includes the elements tests are looking for
2. CSS doesn't hide critical elements
3. Element selectors in tests match the mock HTML structure

### Horizontal Scroll Issues

If responsive tests fail with horizontal scroll:
1. Check for fixed-width elements in the mock HTML
2. Ensure all images have `max-width: 100%`
3. Add `overflow-x: hidden` to body/html if needed
4. Check for elements with padding that push beyond viewport

## Design Patterns Validated

The test server mock HTML validates:

- ✅ SVG sprite with modern href syntax
- ✅ Proper icon accessibility attributes
- ✅ BEM naming for custom components (kebab-case)
- ✅ Cornerstone button classes
- ✅ Form accessibility with ARIA labels
- ✅ Touch targets (44x44px minimum on mobile)
- ✅ Responsive images with srcset
- ✅ Typography hierarchy and scale
- ✅ No horizontal scroll on mobile
- ✅ Visible focus states
- ✅ Skip links for keyboard navigation
- ✅ Lazy loading patterns

## Related Files

- `playwright.config.js` - Playwright configuration with webServer config
- `tests/e2e/test-server.js` - Test server implementation
- `tests/e2e/design-system/*.spec.js` - E2E test suites
- `tests/e2e/README.md` - General E2E testing documentation
- `docs/design-system/design_system_rules.md` - Design system rules

## Future Enhancements

Potential improvements:

1. **Multiple Page Templates**: Serve different HTML for different routes (/, /products, /cart)
2. **Dynamic Content**: Generate mock product data programmatically
3. **Error Pages**: Add mock 404/500 pages for error handling tests
4. **API Mocking**: Mock BigCommerce API responses for interactive tests
5. **Build Integration**: Compile actual templates with mock data instead of static HTML
