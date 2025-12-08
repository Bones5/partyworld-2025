# Newsletter and Footer QA Documentation

## Implementation Date: 2025-11-27

## Components Updated

### Newsletter Subscription Form
- **Location**: `templates/components/common/subscription-form.html`
- **SCSS**: `assets/scss/components/stencil/newsletter/`
- **JavaScript**: `assets/js/theme/global/newsletter.js`

#### Features Implemented:
1. **Accessible Form Structure**
   - Email input with `aria-describedby` linked to error message
   - `aria-invalid` attribute toggled based on validation state
   - `aria-required="true"` for required field indication
   - Screen reader-only labels with `u-hiddenVisually` class
   - `role="alert"` and `aria-live="polite"` for error announcements

2. **Icon Button CTA**
   - Square button (48×48px) with chevron-right SVG icon
   - Primary brand color background
   - Accessible focus ring with 2px offset
   - Screen reader accessible via `aria-label`

3. **Validation States**
   - Error state: Red border on input, error message displayed
   - Success state: Form hidden, success message shown
   - Client-side email format validation

4. **Typography & Spacing**
   - Heading: `fontSize("larger")`, `$lineHeight-larger`
   - Description: `fontSize("base")`, `$lineHeight-base`
   - Consistent spacing using `spacing()` tokens

### Footer Layout
- **Location**: `templates/components/common/footer.html`
- **SCSS**: `assets/scss/layouts/footer/_footer.scss`

#### Features Implemented:
1. **Responsive Grid Layout**
   - Mobile: Single column, stacked sections
   - Tablet: 2 columns (6/12 each)
   - Desktop: 4 columns (3/12 each) for nav sections

2. **Newsletter Section**
   - Positioned at top of footer content
   - Separated with bottom border
   - Full width on all breakpoints

3. **Footer Bottom Bar**
   - Social icons (left on desktop)
   - Payment icons (center on desktop)
   - Copyright/legal text (right on desktop)
   - Vertical stacking on mobile

4. **Accessibility**
   - Proper heading hierarchy (h2, h3)
   - Keyboard navigable links with focus states
   - Phone number as clickable `tel:` link

### Social Links
- **Location**: `assets/scss/components/stencil/socialLinks/`

#### Features Implemented:
1. **Button-Style Icons**
   - 40×40px circular touch targets
   - 24×24px icon size (up from 20/21px)
   - Transparent background with hover state
   - Accessible focus ring

2. **Layout**
   - Flexbox with gap spacing
   - No margin-based spacing (cleaner)

## Testing Checklist

### Keyboard Navigation
- [ ] Tab through footer links in logical order
- [ ] Newsletter form input receives focus
- [ ] Submit button is focusable
- [ ] Social links are focusable with visible focus ring
- [ ] Payment icons are decorative (no focus needed)

### Screen Reader Testing
- [ ] Newsletter heading announces correctly
- [ ] Form labels read for email input
- [ ] Error messages announce when validation fails
- [ ] Success message announces on form submission
- [ ] Footer navigation sections are announced

### Responsive Testing
- [ ] Mobile (< 480px): Single column, stacked layout
- [ ] Tablet (480-800px): Two column footer links
- [ ] Desktop (> 800px): Four column footer links, horizontal bottom bar

### Visual Verification
- [ ] Newsletter form matches Figma design
- [ ] Icon button has correct size and color
- [ ] Social icons are circular and properly sized
- [ ] Footer spacing is consistent with design tokens
- [ ] Error state styling is visible and accessible

## Screenshots Location

Screenshots will be captured during QA testing and stored at:
- `docs/qa/newsletter-footer/YYYY-MM-DD-desktop.png`
- `docs/qa/newsletter-footer/YYYY-MM-DD-mobile.png`

Note: Screenshots require a running BigCommerce Stencil development server
with store connection, which is not available in this environment.

## Language Strings Added

| Key | Value |
|-----|-------|
| `newsletter.subscribe_success` | Thank you for subscribing! |
| `newsletter.subscribe_error` | There was an error subscribing. Please try again. |
| `newsletter.email_required` | Please enter your email address. |
| `newsletter.email_invalid` | Please enter a valid email address. |

## Settings Used

All settings use existing Theme Editor variables:
- Colors: `footer-backgroundColor`, `footer-heading-fontColor`, `color-textSecondary`
- Error: `color-error`, `color-success`
- Buttons: `button--primary-*` color series
- Icons: `icon-color`, `icon-color-hover`
