# Foundation Token QA Documentation

## Purpose
This directory contains QA artifacts for foundation token alignment with Partyworld Figma (Node 114-3848).

## Token Implementation Status

### Layout Tokens ✅
- `$layout-widthMax: remCalc(1280px)` - Maximum content width aligned with Figma desktop (1440px with 80px gutters)
- `$spacing-container-wide: remCalc(80px)` - Horizontal gutters for wide containers
- `$spacing-hero-vertical: remCalc(73px)` - Hero section vertical spacing

### Typography Tokens ✅
- `$fontSize-displayXL: 114px` with `$lineHeight-displayXL: 120px` - Extra large display headings
- `$fontSize-heroLarge: 57px` with `$lineHeight-heroLarge: 60px` - Large hero headings
- `$fontSize-nav: 24px` with `$lineHeight-nav: 24px` - Navigation text size

### Header Tokens ✅
- `$header-height-bar: remCalc(56px)` - Announcement bar height
- `$header-height-primary: remCalc(201px)` - Composite logo/search/user zone height

### Utility Classes ✅
- `.u-displayXL` - Apply display XL typography styling
- `.u-heroLarge` - Apply large hero typography styling
- `.u-navText` - Apply navigation text styling

## Component Implementations ✅

### Testimonial Component
- Location: `assets/scss/components/stencil/testimonial/`
- Template: `templates/components/testimonial.html`
- Features: Stars rating display, testimonial body, author attribution
- Usage: Customer reviews, testimonials sections

### Category Card Component
- Location: `assets/scss/components/stencil/categoryCard/`
- Template: `templates/components/category-card.html`
- Features: Image with aspect-ratio, heading, CTA button
- Usage: Category grids, product collections

### Share Bar Component
- Location: `assets/scss/components/stencil/shareBar/`
- Template: `templates/components/share-bar.html`
- Features: Social share, wishlist, add to cart actions
- Usage: Product detail pages, content sharing

## Validation Performed

### Build Validation ✅
```bash
npm run build
# Result: Webpack compiled successfully in ~9.7s
```

### Stylelint Validation ✅
```bash
npm run stylelint
# Result: All SCSS files pass without errors
```

### Token Resolution ✅
All tokens compile correctly and are accessible throughout the SCSS architecture via the proper import chain:
1. Global settings imported first (`settings/global/`)
2. Component-specific overrides in stencil settings (`settings/stencil/`)
3. Utilities layer includes type-extensions
4. Components layer imports all new components in correct order

## Visual Regression Testing

### Desktop Testing (1440px viewport)
When performing visual regression testing on desktop:
1. Test header with announcement bar (`$header-height-bar: 56px`)
2. Test hero section with large typography (`.u-displayXL`, `.u-heroLarge`)
3. Test category grid using category card components
4. Test product detail page with share bar
5. Verify container width respects `$layout-widthMax: 1280px` with `$spacing-container-wide: 80px` gutters

### Mobile Testing (375px viewport)
When performing visual regression testing on mobile:
1. Test responsive header collapse
2. Test hero typography scales appropriately
3. Test category cards stack vertically
4. Test share bar remains accessible
5. Verify spacing scales with smaller containers

## Screenshot Requirements

When capturing QA screenshots, save them in this directory with the following naming convention:
- Desktop: `YYYY-MM-DD-desktop-[component].png`
- Mobile: `YYYY-MM-DD-mobile-[component].png`

Example:
- `2025-11-24-desktop-hero.png`
- `2025-11-24-mobile-hero.png`
- `2025-11-24-desktop-product-detail.png`
- `2025-11-24-mobile-product-detail.png`

## Manual Testing Checklist

- [ ] Header announcement bar displays at correct height (56px)
- [ ] Hero section uses correct typography scale (.u-displayXL or .u-heroLarge)
- [ ] Navigation items use correct font size (24px)
- [ ] Category cards maintain proper aspect ratio and spacing
- [ ] Share bar interactive states work (hover, focus)
- [ ] Testimonial component displays star ratings correctly
- [ ] Container width respects 1280px max-width on large screens
- [ ] All components are keyboard accessible
- [ ] Focus states meet WCAG contrast requirements
- [ ] Responsive breakpoints work correctly (mobile 375px, tablet, desktop 1440px)

## Known Issues / Notes

None identified. All tokens compile successfully and are ready for integration into page templates.

## References

- Design System Rules: `.cursor/rules/design_system_rules.mdc`
- Figma Source: https://www.figma.com/design/OuvDwuVAT5qzIJfYiCg4Mz/Partyworld?node-id=114-3848
- Tracking Issue: Bones5/partyworld-2025#3
