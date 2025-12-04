# Cornerstone Theme Alignment Roadmap

This document assesses the current state of the Partyworld 2025 theme against the Copilot Repository Instructions and outlines remaining work to complete Cornerstone theme alignment.

## Compatibility Assessment

### ✅ Correctly Following Guidelines

#### Token Usage
- **Color tokens**: Most settings files correctly use `stencilColor("<key>")` for theme colors
- **Spacing tokens**: Components properly use `spacing("<scale>")` function (e.g., `spacing("single")`, `spacing("double")`)
- **Font tokens**: Typography uses `stencilFontFamily("<key>")` and `fontSize("<scale>")` functions
- **Breakpoints**: Components use Foundation/Citadel breakpoint mixins like `@include breakpoint("medium")`

#### File Structure
- **SCSS components**: Properly organized under `assets/scss/components/stencil/<component>/`
- **Settings**: Component settings in `assets/scss/settings/stencil/<component>/_settings.scss`
- **Templates**: Handlebars partials in `templates/components/`
- **JS modules**: PageManager pattern used in `assets/js/theme/`

#### Icon System
- Uses the generated sprite `assets/img/icon-sprite.svg`
- Templates correctly reference icons with `{{cdn 'assets/img/icon-sprite.svg'}}#icon-<name>`
- Modern `href` attribute used instead of deprecated `xlink:href`

#### Accessibility
- `u-hiddenVisually` used for screen reader labels on icon buttons
- `aria-*` attributes present on interactive elements
- `aria-hidden="true"` on decorative SVG icons

### ✅ Issues Fixed

#### Hardcoded Hex Colors (Completed)
All hardcoded colors have been replaced with Stencil token variables:

| File | Line | Issue | Fix Applied |
|------|------|-------|-------------|
| `components/stencil/homepage/_grids.scss` | 29 | `#000000` hardcoded | ✅ Replaced with `$color-textBase` |
| `components/stencil/paymentMethods/_paymentMethods.scss` | 30 | `#e5e5e5` hardcoded | ✅ Replaced with `$color-greyLight` |
| `components/stencil/paymentMethods/_paymentMethods.scss` | 41 | `#fff` hardcoded | ✅ Replaced with `$color-white` |
| `components/stencil/announcementBar/_component.scss` | 15 | `#2F3842` hardcoded | ✅ Replaced with `$color-greyDarkest` |

### ⚠️ Issues Requiring Attention

#### Inline Styles (Priority: Medium)
Some inline styles exist in templates for JS-controlled visibility. These are acceptable for:
- Dynamic visibility toggling (`style="display: none;"` with JS control)
- Dynamic background colors (product swatches)
- Price display toggles

**Acceptable patterns** (no action needed):
- `templates/components/products/price-range.html` - JS-controlled display
- `templates/components/products/options/swatch.html` - Dynamic color swatches

#### Missing Theme Editor Keys (Priority: Low)
Consider adding Theme Editor settings for:
- Announcement bar background color
- Section heading colors
- Payment method card backgrounds

### ✅ Theme Config Brand Alignment Completed

The following `config.json` settings have been updated from Cornerstone defaults to Partyworld brand colors:

#### Buttons (Completed)
| Setting | Old Value | New Value | Status |
|---------|-----------|-----------|--------|
| `button--primary-backgroundColor` | `#444444` | `#D30006` (brand red) | ✅ |
| `button--primary-backgroundColorHover` | `#666666` | `#A00005` | ✅ |
| `button--primary-backgroundColorActive` | `#000000` | `#6D0003` | ✅ |

#### Icons & Rating Stars (Completed)
| Setting | Old Value | New Value | Status |
|---------|-----------|-----------|--------|
| `icon-color` | `#757575` | `#333333` | ✅ |
| `icon-color-hover` | `#999999` | `#D30006` (brand red) | ✅ |
| `icon-ratingEmpty` | `#8F8F8F` | `#cccccc` | ✅ |
| `icon-ratingFull` | `#474747` | `#D30006` (brand red) | ✅ |
| `button--icon-svg-color` | `#757575` | `#333333` | ✅ |

#### Carousel/Slider (Completed)
| Setting | Old Value | New Value | Status |
|---------|-----------|-----------|--------|
| `carousel-title-color` | `#444444` | `#333333` | ✅ |
| `carousel-dot-color` | `#333333` | `#cccccc` | ✅ |
| `carousel-dot-color-active` | `#757575` | `#D30006` (brand red) | ✅ |
| `carousel-arrow-color` | `#8f8f8f` | `#333333` | ✅ |
| `carousel-arrow-color--hover` | `#474747` | `#D30006` (brand red) | ✅ |

#### Navigation (Completed)
| Setting | Old Value | New Value | Status |
|---------|-----------|-----------|--------|
| `navPages-subMenu-backgroundColor` | `#e5e5e5` | `#f5f5f5` | ✅ |
| `dropdown--quickSearch-backgroundColor` | `#e5e5e5` | `#f5f5f5` | ✅ |

### ⚠️ Remaining Theme Config Items

#### Secondary Buttons (Priority: Medium)
| Setting | Current Value | Issue |
|---------|---------------|-------|
| `button--default-color` | `#666666` | Grey secondary button text |
| `button--default-borderColor` | `#8F8F8F` | Grey border |

#### Product Cards (Priority: Low)
| Setting | Current Value | Issue |
|---------|---------------|-------|
| `card-title-color` | `#333333` | May need brand alignment |
| `card-title-color-hover` | `#757575` | Grey hover |

### ⚠️ Uncustomized Theme Config Settings (Priority: Medium)

The following `config.json` settings still use default Cornerstone values and should be reviewed against the Partyworld brand design:

#### Checkout Page (Full Review Needed)
The checkout page settings (`optimizedCheckout-*`) all use default Cornerstone values and should be comprehensively reviewed for brand alignment.

### 📋 Implementation Roadmap

#### Phase 1: Fix Hardcoded Colors ✅ COMPLETED
1. [x] **Homepage grids heading color**
   - File: `assets/scss/components/stencil/homepage/_grids.scss`
   - Replaced `#000000` with `$color-textBase`

2. [x] **Payment methods colors**
   - File: `assets/scss/components/stencil/paymentMethods/_paymentMethods.scss`
   - Replaced `#e5e5e5` with `$color-greyLight`
   - Replaced `#fff` with `$color-white`

3. [x] **Announcement bar background**
   - File: `assets/scss/components/stencil/announcementBar/_component.scss`
   - Replaced `#2F3842` with `$color-greyDarkest`

#### Phase 2: Complete Component Implementations (From IMPLEMENTATION_PLAN.md)
Per the existing implementation plan in `docs/IMPLEMENTATION_PLAN.md`:

1. [ ] **Foundation Tokens & Theme Editor Alignment**
   - Audit remaining token gaps
   - Complete Figma color palette mapping

2. [ ] **Header & Navigation Refresh**
   - Announcement bar partial improvements
   - Header meta row alignment
   - Primary nav styling updates

3. [ ] **Hero & Category Grid**
   - ✅ Hero component (implemented)
   - ✅ Category card (implemented)
   - ✅ Category grid (implemented)

4. [ ] **Filters Sidebar & Product Listing**
   - Accordion filter refinements
   - Product tile updates

5. [ ] **Product Detail & Share Bar**
   - ✅ Share bar (implemented)
   - Gallery spacing updates
   - Quantity selector styling

6. [ ] **Testimonials & Social Proof**
   - ✅ Testimonial component (scaffolded)
   - Complete slider implementation

7. [ ] **Newsletter & Footer CTAs**
   - Newsletter form refinement
   - Footer layout updates

#### Phase 3: Theme Config Brand Alignment ✅ COMPLETED
Updated `config.json` settings from Cornerstone defaults to Partyworld brand values:

1. [x] **Primary Button Colors**
   - Updated `button--primary-backgroundColor` to brand red (`#D30006`)
   - Updated hover/active states to brand-aligned colors (`#A00005`, `#6D0003`)
   - Tested across all button instances (Add to Cart, Checkout, etc.)

2. [x] **Icon & Rating Colors**
   - Updated `icon-color` to `#333333` and hover state to brand red
   - Updated `icon-ratingEmpty` to `#cccccc` and `icon-ratingFull` to brand red
   - Brand accent now used for filled stars

3. [x] **Carousel Colors**
   - Updated dot colors for brand alignment
   - Updated arrow colors to use brand red on hover

4. [x] **Navigation Dropdowns**
   - Updated `navPages-subMenu-backgroundColor` to lighter `#f5f5f5`
   - Updated `dropdown--quickSearch-backgroundColor` to `#f5f5f5`

**Remaining Items:**
- [ ] Secondary button colors review (may not need changes)
- [ ] Product card title hover colors (assess if needs brand alignment)
- [ ] Checkout page branding (comprehensive audit needed)

#### Phase 4: Documentation & QA (Ongoing)
1. [ ] Update `design_system_rules.md` with any new tokens
2. [ ] Capture desktop/mobile screenshots for each section
3. [ ] Keyboard navigation testing
4. [ ] Screen reader testing
5. [ ] Responsive breakpoint verification

## Verified Build Commands

| Command | Purpose | Status |
|---------|---------|--------|
| `npm run build` | Production bundle | ✅ Working |
| `npm run buildDev` | Development bundle with source maps | ✅ Available |
| `npm run stylelint` | SCSS linting | ✅ Available |
| `npm run test` | Jest unit tests | ✅ Available |
| `npx grunt svgstore` | Generate icon sprite | ✅ Available |

## Component Status Summary

| Component | SCSS | Template | Settings | Status |
|-----------|------|----------|----------|--------|
| Announcement Bar | ✅ | ✅ | ✅ | Complete |
| Category Card | ✅ | ✅ | ✅ | Complete |
| Category Grid | ✅ | ✅ | N/A | Complete |
| Hero | ✅ | ✅ | ✅ | Complete |
| Share Bar | ✅ | ✅ | N/A | Complete |
| Testimonial | ✅ | ✅ | N/A | Scaffolded |
| Homepage Grids | ✅ | ✅ | N/A | Complete |
| Payment Methods | ✅ | ✅ | N/A | Complete |
| Faceted Search | ✅ | ✅ | ✅ | Complete |
| Product View | ✅ | ✅ | ✅ | Complete |
| Nav Pages | ✅ | ✅ | ✅ | Complete |
| Nav User | ✅ | ✅ | ✅ | Complete |

## References

- [Copilot Instructions](/.github/copilot-instructions.md)
- [Design System Rules](./design_system_rules.md)
- [Implementation Plan](../IMPLEMENTATION_PLAN.md)
- [BigCommerce Cornerstone Documentation](https://developer.bigcommerce.com/stencil-docs)
