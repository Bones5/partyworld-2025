# Partyworld 2025 Figma Implementation Plan

This document outlines the implementation plan for aligning the Partyworld 2025 theme with the Figma design (node 114-3848).

## Tracking Issue

**Title:** Tracking – Partyworld 2025 Figma Implementation

**Summary**
- Align the Partyworld 2025 theme with the Partyworld Figma file (node 114-3848) using the guidance in `.cursor/rules/design_system_rules.mdc`.
- Work spans SCSS tokens/settings (`assets/scss/settings/**/*`), components (`assets/scss/components/**/*`), templates (`templates/components/**/*`, `templates/pages/**/*`), and frontend behavior (`assets/js/theme/**/*`).
- Progress is tracked via GitHub automation (labels + Project board); once the linked issues below close, this tracker will auto-resolve.

**Child Workstreams**
- [ ] Foundation tokens & settings
- [ ] Header & navigation system
- [ ] Hero + category grids
- [ ] Filters sidebar & product listing
- [ ] Product detail & share bar
- [ ] Testimonials & social proof
- [ ] Newsletter + footer CTAs

**Shared Requirements**
- **Manual QA**: `npm run stylelint`, relevant Jest suites (e.g., `npm test -- product` when touching `assets/js/theme/product/**`), keyboard traversal for nav/filters/forms, contrast verification via `_aria.scss` guidance, responsive checks at desktop/tablet/mobile breakpoints.
- **Screenshots**: After each workstream, capture desktop + mobile PNGs showing the updated section. Store them under `docs/qa/<section>/<yyyy-mm-dd>-{desktop|mobile}.png` and attach/link them in the PR “Screenshots” section (mirroring `meta/desktop_*.png` previews).
- **Icons/assets**: add SVGs to `assets/icons/`, rerun `npx grunt svgstore`, and ensure templates reference `{{cdn 'assets/img/icon-sprite.svg'}}#icon-<id>`.

---

## Child Issues

### 1. Foundation Tokens & Theme Editor Alignment

**Title:** Align foundation tokens with Partyworld Figma

**Goal**
- Map the Partyworld Figma palette, typography, spacing, and layout widths to Theme Editor–backed tokens so downstream sections inherit the right primitives.
- Source of truth: `.cursor/rules/design_system_rules.mdc` + Figma node 114-3848.

**Scope / Files**
- `assets/scss/settings/global/color/_color.scss`
- `assets/scss/settings/global/typography/_typography.scss`
- `assets/scss/settings/global/layout/_layout.scss`
- `assets/scss/settings/stencil/**` (per-component overrides / defaults)
- `meta/` (update screenshot metadata if layout width changes)

**Implementation Checklist**
- [ ] Audit current `stencilColor`/`stencilFontFamily`/`stencilNumber`/`spacing`/`width` usage vs. Figma tokens; document any new Theme Editor keys required.
- [ ] Add/adjust SCSS variables (e.g., `$fontSize-displayXL`, `$spacing-hero-vertical`) to match typography & rhythm values from the design doc.
- [ ] Update layout width/gutter settings so containers honor the 1280px content width and 80px gutters where applicable.
- [ ] Record every new/changed token in `.cursor/rules/design_system_rules.mdc` under “Figma Tokens Canonical.”
- [ ] Regenerate any affected utility classes (e.g., `.u-displayXL`) and ensure `assets/scss/components/_components.scss` still imports them in the right layer order.

**QA & Screenshots**
- Run `npm run stylelint`.
- If TypeScript/JS touched (unlikely), run `npm run lint`.
- Manual regression: verify tokens resolve correctly on a local build (header, hero, product page).
- Capture desktop + mobile PNGs of key token consumers (e.g., hero + product detail) after changes; store at `docs/qa/foundation/<date>-desktop.png` and `...-mobile.png`, and attach to the PR.

---

### 2. Header & Navigation Refresh

**Title:** Implement Partyworld header + navigation per Figma

**Goal**
- Rebuild the announcement bar, header meta row, primary navigation, search, and account/cart icons to match the Partyworld design.

**Scope / Files**
- `templates/components/common/announcement-bar.html` (new) or existing header partial
- `templates/components/common/navigation.html`
- `templates/components/common/nav-pages.html`
- `templates/components/common/nav-user.html`, `search.html`, `currency-selector.html`
- `assets/scss/components/stencil/header/**` (create folder if missing)
- `assets/js/theme/global.js` (ensure behaviors still fire for dropdowns / nav toggles)
- `assets/icons/**` (any new icons entering the sprite)

**Implementation Checklist**
- [ ] Create/adjust announcement bar partial with Theme Editor–backed background + typography tokens (`$header-height-bar`, `$color-highlight`).
- [ ] Update header meta row (contact info + reviews) markup and styles with flex layout + spacing from `spacing()` scale.
- [ ] Reflow primary nav to match 80px-ish gaps, 24px nav typography (using `$fontSize-nav`) and focus-visible states from `_aria.scss`.
- [ ] Ensure search, wishlist, account, and cart icons match the 24px spec and include `u-hiddenVisually` labels.
- [ ] Re-run `npx grunt svgstore` if icons changed and update references to `{{cdn 'assets/img/icon-sprite.svg'}}`.
- [ ] Document overrides/settings in `assets/scss/settings/stencil/header/_settings.scss` if needed.

**QA & Screenshots**
- `npm run stylelint`
- `npm run lint` (header JS touched)
- Keyboard traversal: announcement bar links, nav menus, currency selector, search focus trap.
- Contrast + hover/focus states checked at desktop + mobile breakpoints.
- Screenshots saved under `docs/qa/header/<date>-desktop.png` and `...-mobile.png`; attach to PR.

---

### 3. Hero & Category Grid Implementation

**Title:** Implement Partyworld hero + category/occasion grids

**Goal**
- Build the hero banner, multi-tile category grid, and occasion cards exactly as specced in the Partyworld Figma frames.

**Scope / Files**
- `templates/components/page/hero.html` (or new component under `templates/components/page/`)
- `templates/components/products/category-card.html` (new)
- `templates/pages/home.html` (to place hero + grid)
- `assets/scss/components/stencil/hero/**`
- `assets/scss/components/stencil/category-card/**`
- `assets/img/` (verify CDN references, lazy loading)
- `assets/js/theme/home.js` if interactions required (carousel/autoplay)

**Implementation Checklist**
- [ ] Create reusable category card partial with image wrapper (aspect-ratio helper), title, CTA, and optional modifiers (`.c-card--occasion`).
- [ ] Implement hero markup with background media, text stack using `$fontSize-displayXL`/`$fontSize-heroLarge`, and CTA button styles.
- [ ] Wire up responsive grid (Desktop 3/4-column, Mobile 1-column) using `width()` helpers and `spacing()` gutters.
- [ ] Ensure `lazysizes` classes are present and CDN helper used for all media.
- [ ] Update `.cursor/rules/design_system_rules.mdc` with any new component tokens/settings.

**QA & Screenshots**
- `npm run stylelint`
- Manual responsive QA at 1440 / 1024 / 768 / 375 widths.
- Verify lazy loading + keyboard focus for hero CTA and card links.
- Screenshots: `docs/qa/hero/<date>-desktop.png` & `...-mobile.png` attached to PR.

---

### 4. Filters Sidebar & Product Listing

**Title:** Update filters sidebar + product tiles to Partyworld spec

**Goal**
- Match the “Shop filters / product grid” Figma frames, covering accordion filters, pill states, product cards, compare/wishlist buttons.

**Scope / Files**
- `templates/components/faceted-search/facets.html`, `facet-item.html`
- `assets/js/theme/global/faceted-search.js` (or `faceted-search/index.js`)
- `templates/components/products/card.html` (or new `c-productTile`)
- `assets/scss/components/stencil/faceted-search/**`
- `assets/scss/components/stencil/product-listing/**`
- `templates/pages/category.html` and `search.html` for layout adjustments

**Implementation Checklist**
- [ ] Restyle filter accordions (header height, 18px icons or adopt `.c-icon--sm`) with improved spacing + focus states.
- [ ] Implement chip/pill styles for active filters and reset interactions.
- [ ] Update product tile markup to include aspect ratio image wrapper, badge, star rating, price stack, CTA row per Figma.
- [ ] Ensure quick-view/wishlist hooks remain intact (`data-*` attributes, svg icons).
- [ ] Update compare checkbox styling & JS events for accessibility (aria-live announcements if needed).

**QA & Screenshots**
- `npm run stylelint`
- `npm test -- faceted-search` (or appropriate Jest suites)
- Manual keyboard test: expand/collapse filters, apply/remove facets, navigate product cards.
- Accessibility pass: screen reader labels for filters + product info.
- Screens: `docs/qa/filters/<date>-desktop.png` & `...-mobile.png`.

---

### 5. Product Detail & Share Bar

**Title:** Implement Partyworld product detail + share/wishlist bar

**Goal**
- Bring the PDP layout (media gallery, info stack, share/wishlist/cart CTA row) in line with Figma’s “Helium Balloon Cylinder” frames.

**Scope / Files**
- `templates/pages/product.html`
- `templates/components/products/product-view.html` (or child partials)
- `templates/components/products/share-bar.html` (new)
- `assets/scss/components/stencil/product/**`
- `assets/js/theme/product/{product-details-base.js,image-gallery.js,share.js}`
- `assets/icons/**` (share icons, wishlist outlines)

**Implementation Checklist**
- [ ] Create share/wishlist CTA component with icon buttons + hidden text, matching spacing + color tokens.
- [ ] Adjust info column typography (pricing, badges, accordions) to use new tokens from foundation work.
- [ ] Ensure quantity selector, add-to-cart button, and accordion details follow Figma styling + focus states.
- [ ] Update gallery spacing/pagination dots to align with spec; confirm zoom/lightbox still work.
- [ ] Document any new settings in `assets/scss/settings/stencil/product/_settings.scss`.

**QA & Screenshots**
- `npm run stylelint`
- `npm test -- product` (or targeted Jest suite)
- Manual QA: keyboard through gallery thumbnails, share buttons, add-to-cart flow.
- Confirm aria-labels on share buttons + live region for cart feedback.
- Screenshots saved at `docs/qa/pdp/<date>-desktop.png` & `...-mobile.png`.

---

### 6. Testimonials & Social Proof

**Title:** Build Partyworld testimonial component

**Goal**
- Deliver the “Our happy customers” carousel/cards noted in Figma, leveraging rating icons and consistent spacing.

**Scope / Files**
- `templates/components/testimonial.html` (new)
- `templates/pages/home.html` (or other placements)
- `assets/scss/components/stencil/testimonial/**`
- `assets/js/theme/home.js` (if slider/autoplay behavior required)
- `assets/icons/icon-star.svg` updates (if new variants needed)

**Implementation Checklist**
- [x] Create testimonial card markup (quote, author, role, rating stars) with accessible aria-labels for ratings.
- [x] Style cards with `spacing()`, `$color-textBase`, drop shadows per design.
- [x] Add slider controls or grid layout per responsive breakpoints; ensure keyboard operable.
- [x] Hook component into the home page (and any other page) via partial include.
- [x] Update design doc pending actions list to mark testimonials as implemented.

**QA & Screenshots**
- `npm run stylelint`
- Manual test: keyboard navigation for carousel controls (if applicable) + screen reader output.
- Contrast + responsive layout verification.
- Screenshots: `docs/qa/testimonials/<date>-desktop.png` & `...-mobile.png`.

---

### 7. Newsletter Signup & Footer CTAs

**Title:** Implement Partyworld newsletter + footer CTAs

**Goal**
- Refresh the newsletter signup block and footer promos/forms to match Figma’s final frames, including validation + social icons.

**Scope / Files**
- `templates/components/page/newsletter.html` (or similar)
- `templates/components/common/footer.html`
- `assets/scss/components/stencil/newsletter/**`
- `assets/scss/components/stencil/footer/**`
- `assets/js/theme/global/newsletter.js` (validation / success messaging)
- `assets/icons/**` for social icons, arrow buttons

**Implementation Checklist**
- [ ] Rebuild newsletter form layout (headline, supporting text, input/button) using new typography tokens and spacing.
- [ ] Wire up validation states with `aria-describedby` + inline error handling consistent with accessibility guidance.
- [ ] Update footer columns (contact info, nav links, badges) to the Partyworld layout, ensuring responsive stacking.
- [ ] Refresh social icon buttons to match size/shape specs and ensure svg sprite references exist.
- [ ] Document new settings (colors, spacing) if Theme Editor overrides required.

**QA & Screenshots**
- `npm run stylelint`
- `npm run lint` if newsletter JS changes
- Manual QA: keyboard focus order through footer + form, screen reader announcement of validation errors, responsive layout checks.
- Screenshots: `docs/qa/newsletter-footer/<date>-desktop.png` & `...-mobile.png`.
