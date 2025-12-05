# Partyworld 2025 — Copilot Repository Instructions

Context

This is a BigCommerce Cornerstone (Stencil) theme. Prefer reusing Cornerstone primitives and classes over inventing new ones.
Build: Webpack 5; Styles: SCSS + Citadel; JS: jQuery + @bigcommerce/stencil-utils + PageManager pattern.
Guardrails

Use token functions and Theme Editor-backed variables:
Colors: stencilColor("<key>") (no raw hex in SCSS).
Numbers: stencilNumber("<key>").
Fonts: stencilFontFamily("<key>").
Spacing: spacing("<scale>").
Follow the latest layout map (docs/THEME_MAP.md):
- Header meta row = left contact bar, right Trustpilot badge.
- Home page order: hero/theme slider -> celebrate grid -> marketing banner -> category grid -> featured products -> top sellers -> large sale banner -> new products -> customer review grid -> intro & promise -> blog teaser.
- Category page: insert `shop-by-category` partial (when subcategories exist), then `category-bestsellers` before the main product grid.
- PDP right column sequence: product title + inline share button → badges grid → description → product video → tabs block.
- PDP cross-sell rows: alternate suggestions then also-bought before quick view modal.
Place files in the correct layers:
SCSS components: assets/scss/components/stencil/<component>/_component.scss
Component settings: assets/scss/settings/stencil/<component>/_settings.scss
Templates: templates/components/<component>.html
JS modules/Page classes: assets/js/theme/**
Use the CDN helper for assets in templates: {{cdn 'assets/img/...'}}
Icons: use the generated sprite assets/img/icon-sprite.svg with <use href="{{cdn 'assets/img/icon-sprite.svg'}}#icon-<name>">.
Breakpoints: use Foundation/Citadel mixins; do not hardcode media queries.
Accessibility: include visible focus or :focus-visible, proper aria labels, and u-hiddenVisually for icon-only controls.
Cornerstone-first components

Buttons:
Primary: class="button button--primary"
Secondary: class="button button--secondary"
Sizes: button--small, button--large
Icon buttons: pair with sprite <svg><use ...></use></svg> and add a visually hidden label.
Forms: Use theme form classes (form, form-input, form-select, etc.) and existing validation/focus styles.
Disclosure/Accordion/Tabs/Modal: Reuse existing Cornerstone/Stencil utilities and JS patterns where possible.
Product UI: Prefer existing product card/tile and rating star patterns before creating new ones.
File placement examples

New UI: add SCSS under components/stencil/<name>, settings in settings/stencil/<name>, template in templates/components/<name>.html, and import in assets/scss/components/_components.scss.
JS: add a small module and compose it in the relevant PageManager.
What to avoid

Adding new UI frameworks (e.g., Tailwind) or inline styles.
Hardcoded hex colors or pixel values when a token exists.
Creating duplicate components where Cornerstone already provides one.
See also

Full design system and mappings: docs/design-system/design_system_rules.md.
Build/lint: npm run build, npm run buildDev, npm run stylelint, npx grunt svgstore.
