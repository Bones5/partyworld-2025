# Partyworld 2025

[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/bigcommerce/cornerstone)
![tests](https://github.com/bigcommerce/cornerstone/workflows/Theme%20Bundling%20Test/badge.svg?branch=master)

Partyworld 2025 is a customized BigCommerce theme based on Cornerstone.

Development in this repo is local-only. We do not maintain a BigCommerce staging store for theme work; use the local Stencil server against the configured store credentials described in [docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md).

## Documentation

- [Trustpilot Integration Guide](docs/TRUSTPILOT_INTEGRATION.md) - Complete guide for integrating Trustpilot badges and customer reviews
- [Playwright Testing Guide](docs/PLAYWRIGHT_TESTING.md) - E2E testing documentation
- [Theme Map](docs/THEME_MAP.md) - Visual guide to template structure and component organization
- [Design System Rules](docs/design-system/design_system_rules.md) - Design tokens, components, and patterns
- [Environments](docs/ENVIRONMENTS.md) - Local development store configuration
- [SVG Styling](docs/SVG_STYLING.md) - SVG icon system and styling guidelines

## Content Setup

Setting up your store with this theme? See our comprehensive content guides:

- **[Content Requirements Guide](docs/CONTENT_REQUIREMENTS.md)** - Complete guide to populating your theme with content, including:
  - Theme settings configuration
  - Homepage content requirements
  - Product catalog setup
  - Category structure
  - Branding assets
  - Customization instructions

- **[Content Requirements Summary](docs/CONTENT_REQUIREMENTS_SUMMARY.md)** - Quick reference checklist with:
  - Essential content checklist
  - Image size reference
  - 5-week setup timeline
  - Common questions

## Testing

### Unit Tests (Jest)

Run JavaScript unit tests:

```bash
npm test
```

### E2E Tests (Playwright)

Run end-to-end regression tests for design system validation:

```bash
npm run test:e2e
```

See [Playwright Testing Guide](docs/PLAYWRIGHT_TESTING.md) for detailed information on:

- Running tests against local or deployed stores
- Writing new tests
- CI/CD integration
- Debugging test failures

The E2E tests validate:

- Icon system implementation
- Accessibility requirements (WCAG)
- Component patterns and BEM naming
- Asset management (CDN, lazy loading)
- Responsive design
- Typography scale
- SCSS token usage

### Stencil Utils

[Stencil-utils](https://github.com/bigcommerce/stencil-utils) is our supporting library for our events and remote interactions.

## JS API

When writing theme JavaScript (JS) there is an API in place for running JS on a per page basis. To properly write JS for your theme, the following page types are available to you:

- "pages/account/addresses"
- "pages/account/add-address"
- "pages/account/add-return"
- "pages/account/add-wishlist"
- "pages/account/recent-items"
- "pages/account/download-item"
- "pages/account/edit"
- "pages/account/return-saved"
- "pages/account/returns"
- "pages/account/payment-methods"
- "pages/auth/login"
- "pages/auth/account-created"
- "pages/auth/create-account"
- "pages/auth/new-password"
- "pages/blog"
- "pages/blog-post"
- "pages/brand"
- "pages/brands"
- "pages/cart"
- "pages/category"
- "pages/compare"
- "pages/errors"
- "pages/gift-certificate/purchase"
- "pages/gift-certificate/balance"
- "pages/gift-certificate/redeem"
- "global"
- "pages/home"
- "pages/order-complete"
- "pages/page"
- "pages/product"
- "pages/search"
- "pages/sitemap"
- "pages/subscribed"
- "pages/account/wishlist-details"
- "pages/account/wishlists"

These page types will correspond to the pages within your theme. Each one of these page types map to an ES6 module that extends the base `PageManager` abstract class.

```javascript
export default class Auth extends PageManager {
  constructor() {
    // Set up code goes here; attach to internals and use internals as you would 'this'
  }
}
```

### JS Template Context Injection

Occasionally you may need to use dynamic data from the template context within your client-side theme application code.

Two helpers are provided to help achieve this.

The inject helper allows you to compose a JSON object with a subset of the template context to be sent to the browser.

```
{{inject "stringBasedKey" contextValue}}
```

To retrieve the parsable JSON object, just call `{{jsContext}}` after all of the `{{@inject}}` calls.

For example, to setup the product name in your client-side app, you can do the following if you're in the context of a product:

```html
{{inject "myProductName" product.title}}

<script>
  // Note the lack of quotes around the jsContext handlebars helper, it becomes a string automatically.
  var jsContext = JSON.parse({{jsContext}}); // jsContext would output "{\"myProductName\": \"Sample Product\"}" which can feed directly into your JavaScript

  console.log(jsContext.myProductName); // Will output: Sample Product
</script>
```

You can compose your JSON object across multiple pages to create a different set of client-side data depending on the currently loaded template context.

The stencil theme makes the jsContext available on both the active page scoped and global PageManager objects as `this.context`.

## Polyfilling via Feature Detection

Cornerstone implements [this strategy](https://philipwalton.com/articles/loading-polyfills-only-when-needed/) for polyfilling.

In `templates/components/common/polyfill-script.html` there is a simple feature detection script which can be extended to detect any recent JS features you intend to use in your theme code.

If any one of the conditions is not met, an additional blocking JS bundle configured in `assets/js/polyfills.js` will be loaded to polyfill modern JS features before the main bundle executes.

This intentionally prioritizes the experience of the 90%+ of shoppers who are on modern browsers in terms of performance, while maintaining compatibility (at the expense of additional JS download+parse for the polyfills) for users on legacy browsers.

## Static assets

Some static assets in the Stencil theme are handled with Grunt if required. This
means you have some dependencies on grunt and npm. To get started:

First make sure you have Grunt installed globally on your machine:

```
npm install -g grunt-cli
```

and run:

```
npm install
```

Note: package-lock.json file was generated by Node version 20 and npm version 10. The app supports Node 20 as well as multiple versions of npm, but we should always use those versions when updating package-lock.json, unless it is decided to upgrade those, and in this case the readme should be updated as well. If using a different version for node OR npm, please delete the package-lock.json file prior to installing node packages and also prior to pushing to github.

If updating or adding a dependency, please double check that you are working on Node version 20 and npm version 10 and run `npm update <package_name>` or `npm install <package_name>` (avoid running npm install for updating a package). After updating the package, please make sure that the changes in the package-lock.json reflect only the updated/new package prior to pushing the changes to github.

### Icons

Icons are delivered via a single SVG sprite, which is embedded on the page in
`templates/layout/base.html`. It is generated via a grunt task `grunt svgstore`.

The task takes individual SVG files for each icon in `assets/icons` and bundles
them together, to be inlined on the top of the theme, via an ajax call managed
by svg-injector. Each icon can then be called in a similar way to an inline image via:

```
<svg><use xlink:href="#icon-svgFileName" /></svg>
```

The ID of the SVG icon you are calling is based on the filename of the icon you want,
with `icon-` prepended. e.g. `xlink:href="#icon-facebook"`.

Simply add your new icon SVG file to the icons folder, and run `grunt svgstore`,
or just `grunt`.

#### License

(The MIT License)
Copyright (C) 2015-present BigCommerce Inc.
All rights reserved.

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense,and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
