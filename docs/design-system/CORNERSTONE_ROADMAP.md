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

### ⚠️ Issues Requiring Attention

#### Hardcoded Hex Colors (Priority: High)
These files contain hardcoded hex values that should be replaced with token variables:

| File | Line | Issue | Suggested Fix |
|------|------|-------|---------------|
| `components/stencil/homepage/_grids.scss` | 29 | `#000000` hardcoded | Use `$color-textBase` or `stencilColor("color-textHeading")` |
| `components/stencil/paymentMethods/_paymentMethods.scss` | 30 | `#e5e5e5` hardcoded | Use `$color-greyLight` or define token |
| `components/stencil/paymentMethods/_paymentMethods.scss` | 41 | `#fff` hardcoded | Use `$color-white` |
| `components/stencil/announcementBar/_component.scss` | 15 | `#2F3842` hardcoded | Create/use `$color-announcementBar-bg` token (Note: Comment mentions `$color-primary` red but actual color is dark blue-grey - design intent should be clarified) |

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

### ⚠️ Uncustomized Theme Config Settings (Priority: Medium)

The following `config.json` settings still use default Cornerstone values and should be reviewed against the Partyworld brand design:

#### Buttons (High Priority)
| Setting | Current Value | Issue |
|---------|---------------|-------|
| `button--primary-backgroundColor` | `#444444` | Generic grey; should use brand color (e.g., `$color-primary` = `#D30006`) |
| `button--primary-backgroundColorHover` | `#666666` | Grey hover; needs brand-aligned hover state |
| `button--primary-backgroundColorActive` | `#000000` | Black active; needs brand-aligned active state |
| `button--default-color` | `#666666` | Grey secondary button text |
| `button--default-borderColor` | `#8F8F8F` | Grey border |

#### Icons & Rating Stars
| Setting | Current Value | Issue |
|---------|---------------|-------|
| `icon-color` | `#757575` | Default grey icon color |
| `icon-ratingEmpty` | `#8F8F8F` | Grey empty stars |
| `icon-ratingFull` | `#474747` | Dark grey filled stars; consider brand accent |
| `button--icon-svg-color` | `#757575` | Grey icon buttons |

#### Carousel/Slider
| Setting | Current Value | Issue |
|---------|---------------|-------|
| `carousel-title-color` | `#444444` | Generic grey |
| `carousel-dot-color` | `#333333` | Dark grey dots |
| `carousel-dot-color-active` | `#757575` | Grey active dot |
| `carousel-arrow-color` | `#8f8f8f` | Grey arrows |

#### Product Cards
| Setting | Current Value | Issue |
|---------|---------------|-------|
| `card-title-color` | `#333333` | May need brand alignment |
| `card-title-color-hover` | `#757575` | Grey hover |

#### Navigation
| Setting | Current Value | Issue |
|---------|---------------|-------|
| `navPages-subMenu-backgroundColor` | `#e5e5e5` | Grey submenu background |
| `dropdown--quickSearch-backgroundColor` | `#e5e5e5` | Grey search dropdown |

#### Checkout Page (Full Review Needed)
The checkout page settings (`optimizedCheckout-*`) all use default Cornerstone values and should be comprehensively reviewed for brand alignment.

### 📋 Implementation Roadmap

#### Phase 1: Fix Hardcoded Colors (1-2 hours)
1. [ ] **Homepage grids heading color**
   - File: `assets/scss/components/stencil/homepage/_grids.scss`
   - Replace `#000000` with `$color-textBase` or create `$color-headingPrimary`

2. [ ] **Payment methods colors**
   - File: `assets/scss/components/stencil/paymentMethods/_paymentMethods.scss`
   - Replace `#e5e5e5` with `$color-greyLight` or new token
   - Replace `#fff` with `$color-white`

3. [ ] **Announcement bar background**
   - File: `assets/scss/components/stencil/announcementBar/_component.scss`
   - Create Theme Editor key `color-announcementBar-bg` in `schema.json`
   - Add default value in `config.json`
   - Update SCSS to use `stencilColor("color-announcementBar-bg")`

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

#### Phase 3: Theme Config Brand Alignment (2-4 hours)
Update `config.json` settings from Cornerstone defaults to Partyworld brand values:

1. [ ] **Primary Button Colors**
   - Update `button--primary-backgroundColor` to use brand red (`#D30006` or aligned value)
   - Update hover/active states to brand-aligned colors
   - Test across all button instances (Add to Cart, Checkout, etc.)

2. [ ] **Secondary Button Colors**
   - Review `button--default-*` settings
   - Align border and text colors with brand palette

3. [ ] **Icon & Rating Colors**
   - Update `icon-color` and hover state
   - Update `icon-ratingEmpty` and `icon-ratingFull` for brand alignment
   - Consider using brand accent for filled stars

4. [ ] **Carousel Colors**
   - Update dot colors for brand alignment
   - Review arrow colors against backgrounds

5. [ ] **Navigation Dropdowns**
   - Review `navPages-subMenu-backgroundColor`
   - Review `dropdown--quickSearch-backgroundColor`

6. [ ] **Checkout Page Branding**
   - Full audit of `optimizedCheckout-*` settings
   - Update primary button to brand colors
   - Ensure consistent typography with main theme

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
| Announcement Bar | ✅ | ⚠️ | ⚠️ | Needs token cleanup |
| Category Card | ✅ | ✅ | ✅ | Complete |
| Category Grid | ✅ | ✅ | N/A | Complete |
| Hero | ✅ | ✅ | ✅ | Complete |
| Share Bar | ✅ | ✅ | N/A | Complete |
| Testimonial | ✅ | ✅ | N/A | Scaffolded |
| Homepage Grids | ⚠️ | ✅ | N/A | Needs token cleanup |
| Payment Methods | ⚠️ | ✅ | N/A | Needs token cleanup |
| Faceted Search | ✅ | ✅ | ✅ | Complete |
| Product View | ✅ | ✅ | ✅ | Complete |
| Nav Pages | ✅ | ✅ | ✅ | Complete |
| Nav User | ✅ | ✅ | ✅ | Complete |

## References

- [Copilot Instructions](/.github/copilot-instructions.md)
- [Design System Rules](./design_system_rules.md)
- [Implementation Plan](../IMPLEMENTATION_PLAN.md)
- [BigCommerce Cornerstone Documentation](https://developer.bigcommerce.com/stencil-docs)
