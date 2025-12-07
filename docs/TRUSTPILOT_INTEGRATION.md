# Trustpilot Integration Guide

This guide explains how to integrate Trustpilot reviews and badges into the Partyworld 2025 BigCommerce Stencil theme.

## Overview

The Partyworld 2025 theme includes two Trustpilot integration points:

1. **Trustpilot Badge** - Displayed in the header meta row (top-right)
2. **Customer Review Grid** - Displayed on the homepage as a testimonial section

Both components can be populated using Trustpilot's official widgets and APIs.

---

## 1. Trustpilot Badge Integration

The Trustpilot badge displays your overall rating and review count in the header.

### Current Implementation

**Location:** `templates/components/common/trustpilot-badge.html`

**Current Static HTML:**
```handlebars
<div class="trustpilot-badge" aria-label="Trustpilot rating: Excellent from 17 thousand reviews">
    <a class="trustpilot-badge__link" href="https://www.trustpilot.com/review/partyworld.com" rel="noopener" target="_blank">
        <span class="trustpilot-badge__label">Excellent</span>
        <span class="trustpilot-badge__stars" aria-hidden="true">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
        <span class="trustpilot-badge__count">17k reviews</span>
    </a>
</div>
```

**Displayed in:** Header meta row (top-right of page header)
- File: `templates/components/common/header.html`
- Position: Right column of the header meta row

### Option 1: Replace with Trustpilot TrustBox Widget (Recommended)

Replace the static HTML with a dynamic Trustpilot TrustBox widget:

#### Step 1: Get Your Trustpilot Business Unit ID

1. Log in to your [Trustpilot Business account](https://businessapp.b2b.trustpilot.com/)
2. Navigate to **Integrations** → **Website Widgets**
3. Copy your Business Unit ID (format: `1234567890abcdef12345678`)

#### Step 2: Choose a Widget Type

Trustpilot offers several micro widgets suitable for headers:

- **Micro Star Rating** - Compact stars + review count
- **Micro TrustScore** - Score badge + review count
- **Micro Review Count** - Text-based review count

Preview widgets at: https://businessapp.b2b.trustpilot.com/integrations/trustbox

#### Step 3: Update the Template

Edit `templates/components/common/trustpilot-badge.html`:

```handlebars
{{!-- Trustpilot TrustBox Widget - Micro Star Rating --}}
<div class="trustpilot-badge">
    <div class="trustpilot-widget" 
         data-locale="en-US"
         data-template-id="5419b6a8b0d04a076446a9ad"
         data-businessunit-id="{{YOUR_BUSINESS_UNIT_ID}}"
         data-style-height="24px"
         data-style-width="100%"
         data-theme="light">
        <a href="https://www.trustpilot.com/review/partyworld.com" 
           target="_blank" 
           rel="noopener">Trustpilot</a>
    </div>
</div>
```

**Replace** `{{YOUR_BUSINESS_UNIT_ID}}` with your actual Business Unit ID.

#### Step 4: Add Trustpilot Script

Add the Trustpilot widget loader script to your theme. You have two options:

**Option A: Add to Base Layout** (Loads on all pages)

Edit `templates/layout/base.html` and add before the closing `</body>` tag:

```handlebars
{{!-- Trustpilot Widget Loader --}}
<script type="text/javascript" src="//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js" async></script>
```

**Option B: Add via BigCommerce Script Manager** (Recommended)

1. Log in to your BigCommerce admin panel
2. Navigate to **Storefront** → **Script Manager**
3. Click **Create a Script**
4. Configure:
   - **Name:** Trustpilot Widget Loader
   - **Description:** Loads Trustpilot TrustBox widgets
   - **Location:** Footer
   - **Script type:** Script URL
   - **Script URL:** `https://widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js`
   - **Load method:** Async
   - **Pages:** All pages
5. Click **Save**

#### Widget Template IDs

Common widget template IDs for header badges:

| Widget Name | Template ID | Description |
|-------------|-------------|-------------|
| Micro Star Rating | `5419b6a8b0d04a076446a9ad` | Stars + review count |
| Micro TrustScore | `5419b6ffb0d04a076446a9af` | Score badge + count |
| Micro Review Count | `5419b732b0d04a076446a9ae` | Text-only count |
| Mini | `53aa8807dec7e10d38f59f32` | Compact star display |

Find more at: https://support.trustpilot.com/hc/en-us/articles/115011421468

### Option 2: Use Trustpilot API (Advanced)

For full customization, fetch data from the Trustpilot API and update the template dynamically.

#### Step 1: Get API Credentials

1. Contact Trustpilot Support to request API access
2. Obtain your API Key and Business Unit ID

#### Step 2: Create a Custom Endpoint

Create a serverless function or backend endpoint that:
1. Fetches your business unit data from Trustpilot API
2. Caches the response (recommended: 1-6 hours)
3. Returns formatted data to your storefront

#### Step 3: Fetch and Render with JavaScript

Example implementation in `assets/js/theme/global.js`:

```javascript
async function loadTrustpilotBadge() {
    try {
        const response = await fetch('/api/trustpilot-summary');
        const data = await response.json();
        
        const badge = document.querySelector('.trustpilot-badge__link');
        if (badge && data) {
            badge.querySelector('.trustpilot-badge__label').textContent = data.trustScore.label;
            badge.querySelector('.trustpilot-badge__count').textContent = 
                `${(data.numberOfReviews / 1000).toFixed(0)}k reviews`;
            
            // Update stars based on score
            const stars = badge.querySelector('.trustpilot-badge__stars');
            const fullStars = Math.floor(data.trustScore.stars);
            stars.innerHTML = '★'.repeat(fullStars) + '☆'.repeat(5 - fullStars);
        }
    } catch (error) {
        console.error('Failed to load Trustpilot badge:', error);
    }
}

// Call on page load
if (document.querySelector('.trustpilot-badge')) {
    loadTrustpilotBadge();
}
```

**Note:** This approach requires backend infrastructure and is more complex than using Trustpilot widgets.

---

## 2. Customer Review Grid Integration

The customer review grid displays individual customer testimonials on the homepage.

### Current Implementation

**Location:** `templates/components/page/customer-review-grid.html`

**Template Usage:**
```handlebars
{{!-- In templates/pages/home.html --}}
{{> components/page/customer-review-grid 
    heading="What Our Customers Say"
    reviews=theme_settings.homepage_reviews
}}
```

**Component Structure:**
- Grid of testimonial cards
- Each card displays: star rating, review text, and author name
- Responsive layout (stacks on mobile, grid on desktop)

### Option 1: Trustpilot Review Widget (Recommended)

Replace the static reviews with a dynamic Trustpilot review carousel or grid widget.

#### Step 1: Choose a Review Widget

Popular options for homepage testimonials:

| Widget Name | Template ID | Best For |
|-------------|-------------|----------|
| Carousel | `53aa8912dec7e10d38f59f36` | Rotating reviews |
| Grid | `539adbd6dec7e10e686debee` | Static grid layout |
| List | `539ad0ffdec7e10e686debd7` | Vertical list |
| Mini Carousel | `54ad5defc6454f065c28af8b` | Compact carousel |

#### Step 2: Update Customer Review Grid Template

Edit `templates/components/page/customer-review-grid.html`:

**Replace the entire file content with:**

```handlebars
{{!-- Customer Review Grid component - Trustpilot Integration --}}
{{!-- 
  Usage:
    {{> components/page/customer-review-grid 
        heading="What Our Customers Say"
    }}
  
  Displays Trustpilot reviews using TrustBox widget.
--}}
<section class="c-customerReviewGrid">
    {{#if heading}}
        <h2 class="c-customerReviewGrid__heading">{{heading}}</h2>
    {{/if}}
    
    {{!-- Widget Region for Custom Content (optional) --}}
    {{{region name="home_customer_reviews"}}}
    
    {{!-- Trustpilot TrustBox Widget --}}
    <div class="c-customerReviewGrid__items">
        <div class="trustpilot-widget" 
             data-locale="en-US"
             data-template-id="539ad0ffdec7e10e686debd7"
             data-businessunit-id="{{YOUR_BUSINESS_UNIT_ID}}"
             data-style-height="500px"
             data-style-width="100%"
             data-theme="light"
             data-stars="4,5"
             data-review-languages="en">
            <a href="https://www.trustpilot.com/review/partyworld.com" 
               target="_blank" 
               rel="noopener">Trustpilot</a>
        </div>
    </div>
</section>
```

**Key Configuration Options:**

- `data-template-id`: Widget layout type (see table above)
- `data-businessunit-id`: Your Trustpilot Business Unit ID
- `data-style-height`: Widget height (e.g., `"500px"`, `"auto"`)
- `data-stars`: Filter by rating (e.g., `"4,5"` shows only 4-5 star reviews)
- `data-review-languages`: Language filter (e.g., `"en"`)
- `data-theme`: `"light"` or `"dark"`

Full configuration options: https://support.trustpilot.com/hc/en-us/articles/115011566948

#### Step 3: Ensure Trustpilot Script is Loaded

The Trustpilot widget loader script must be included (see Badge Integration Step 4 above).

#### Step 4: Style Integration (Optional)

The widget inherits styles from your theme. To customize spacing and alignment, edit:

`assets/scss/components/stencil/customerReviewGrid/_component.scss`

Example customizations:

```scss
.c-customerReviewGrid {
    padding: spacing("double") 0;
    background: $color-white;
    
    &__heading {
        text-align: center;
        margin-bottom: spacing("double");
        font-size: $fontSize-hero;
        color: $color-textBase;
    }
    
    &__items {
        max-width: remCalc(1280px);
        margin: 0 auto;
        padding: 0 spacing("single");
        
        // Override Trustpilot widget styles if needed
        .trustpilot-widget {
            min-height: 400px;
        }
    }
}
```

### Option 2: Static Reviews with Manual Updates

Keep the existing static template structure and manually curate reviews.

#### Step 1: Export Reviews from Trustpilot

1. Log in to your Trustpilot Business account
2. Navigate to **Reviews** → **Export**
3. Download reviews as CSV or JSON
4. Select your best 4-5 star reviews

#### Step 2: Add Reviews to Theme Editor

Edit `schema.json` to add review configuration fields:

```json
{
    "name": "homepage_reviews",
    "label": "Homepage Customer Reviews",
    "type": "text",
    "default": "",
    "force_reload": true
}
```

**Note:** BigCommerce's Theme Editor doesn't support complex arrays natively. For multiple reviews, you'll need to either:

1. Use multiple individual settings (`homepage_review_1_text`, `homepage_review_1_author`, etc.)
2. Use a JSON-formatted text field
3. Use BigCommerce Page Builder widgets (recommended)

#### Step 3: Use Page Builder Widgets (Recommended for Static Reviews)

1. In BigCommerce admin, navigate to **Storefront** → **Web Pages**
2. Edit your homepage
3. In the Page Builder, add content to the `home_customer_reviews` widget region
4. Use HTML widgets to add individual testimonial cards:

```html
<article class="c-customerReviewGrid__item c-testimonial">
    <div class="c-testimonial__stars" aria-label="5 out of 5 stars">
        <svg class="c-testimonial__star c-testimonial__star--filled" width="16" height="16" aria-hidden="true">
            <use href="/assets/img/icon-sprite.svg#icon-star"></use>
        </svg>
        <svg class="c-testimonial__star c-testimonial__star--filled" width="16" height="16" aria-hidden="true">
            <use href="/assets/img/icon-sprite.svg#icon-star"></use>
        </svg>
        <svg class="c-testimonial__star c-testimonial__star--filled" width="16" height="16" aria-hidden="true">
            <use href="/assets/img/icon-sprite.svg#icon-star"></use>
        </svg>
        <svg class="c-testimonial__star c-testimonial__star--filled" width="16" height="16" aria-hidden="true">
            <use href="/assets/img/icon-sprite.svg#icon-star"></use>
        </svg>
        <svg class="c-testimonial__star c-testimonial__star--filled" width="16" height="16" aria-hidden="true">
            <use href="/assets/img/icon-sprite.svg#icon-star"></use>
        </svg>
    </div>
    <blockquote class="c-testimonial__body">
        Amazing products and fast shipping! The party supplies were exactly what we needed.
    </blockquote>
    <cite class="c-testimonial__author">— Sarah M.</cite>
</article>
```

### Option 3: Trustpilot API with Custom Rendering (Advanced)

Fetch reviews via API and render with full design control.

#### Step 1: Create API Endpoint

Create a serverless function that fetches reviews:

```javascript
// Example: Fetch reviews from Trustpilot API
async function getTrustpilotReviews() {
    const response = await fetch(
        `https://api.trustpilot.com/v1/business-units/${'{{YOUR_BUSINESS_UNIT_ID}}'}/reviews`,
        {
            headers: {
                'apikey': '{{YOUR_API_KEY}}'
            },
            params: {
                stars: '4,5',
                perPage: 6,
                language: 'en'
            }
        }
    );
    
    return await response.json();
}
```

#### Step 2: Render with JavaScript

Add to `assets/js/theme/home.js`:

```javascript
async function loadTrustpilotReviews() {
    try {
        const data = await fetch('/api/trustpilot-reviews').then(r => r.json());
        const container = document.querySelector('.c-customerReviewGrid__items');
        
        if (!container || !data.reviews) return;
        
        container.innerHTML = data.reviews.map(review => `
            <article class="c-customerReviewGrid__item c-testimonial">
                <div class="c-testimonial__stars" aria-label="${review.stars} out of 5 stars">
                    ${'★'.repeat(review.stars)}${'☆'.repeat(5 - review.stars)}
                </div>
                <blockquote class="c-testimonial__body">
                    ${escapeHtml(review.text)}
                </blockquote>
                <cite class="c-testimonial__author">— ${escapeHtml(review.consumer.displayName)}</cite>
            </article>
        `).join('');
    } catch (error) {
        console.error('Failed to load Trustpilot reviews:', error);
    }
}
```

---

## 3. Testing Your Integration

### Verify Badge Display

1. Navigate to your storefront homepage
2. Check the top-right of the header for the Trustpilot badge
3. Verify:
   - Rating displays correctly
   - Review count is accurate
   - Link opens Trustpilot profile in new tab
   - Badge is responsive on mobile

### Verify Review Grid Display

1. Scroll to the "What Our Customers Say" section
2. Verify:
   - Reviews load successfully
   - Star ratings display correctly
   - Layout is responsive
   - Reviews are relevant and recent

### Browser Testing

Test in multiple browsers:
- Chrome (desktop & mobile)
- Safari (desktop & iOS)
- Firefox
- Edge

### Performance Check

1. Run Google PageSpeed Insights: https://pagespeed.web.dev/
2. Verify Trustpilot widgets don't significantly impact performance
3. Ensure async loading is configured (see Badge Integration Step 4)

---

## 4. Customization & Styling

### Styling the Trustpilot Badge

The badge inherits theme styles but can be customized. Create a new file or add to header styles:

`assets/scss/components/stencil/trustpilotBadge/_component.scss`

```scss
.trustpilot-badge {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    
    &__link {
        display: flex;
        align-items: center;
        gap: spacing("quarter");
        text-decoration: none;
        color: $color-textBase;
        transition: opacity 0.2s;
        
        &:hover,
        &:focus {
            opacity: 0.8;
        }
    }
    
    &__label {
        font-weight: $fontWeight-semibold;
        font-size: $fontSize-base;
    }
    
    &__stars {
        color: $color-success; // Or use Trustpilot green: #00B67A
        font-size: $fontSize-large;
    }
    
    &__count {
        font-size: $fontSize-small;
        color: $color-textSecondary;
    }
}
```

**Import in** `assets/scss/components/_components.scss`:

```scss
@import "stencil/trustpilotBadge/component";
```

### Matching Trustpilot Colors to Your Theme

Trustpilot brand colors:

- **Trustpilot Green:** `#00B67A`
- **Star Yellow:** `#FFD700` or `#FFC107`
- **Dark Text:** `#191919`
- **Light Background:** `#F7F7F7`

Add to your theme's color settings if needed:

`assets/scss/settings/global/color/_color.scss`

```scss
// Trustpilot brand colors
$color-trustpilot: #00B67A;
$color-star: #FFC107;
```

### Responsive Behavior

Ensure the badge and reviews are mobile-friendly:

```scss
.trustpilot-badge {
    @include breakpoint(medium down) {
        justify-content: center;
        margin-top: spacing("half");
    }
}

.c-customerReviewGrid {
    @include breakpoint(medium down) {
        &__items {
            grid-template-columns: 1fr;
        }
    }
}
```

---

## 5. Troubleshooting

### Badge Not Displaying

**Symptoms:** Trustpilot badge area is empty or shows fallback text only.

**Solutions:**

1. **Verify Business Unit ID is correct**
   - Check for typos
   - Ensure no extra spaces or quotes
   
2. **Check Trustpilot script is loaded**
   - Open browser DevTools → Network tab
   - Look for `tp.widget.bootstrap.min.js`
   - Verify it loads with 200 status
   
3. **Check console for errors**
   - Open DevTools → Console
   - Look for Trustpilot-related errors
   
4. **Verify widget template ID**
   - Ensure `data-template-id` matches a valid widget
   - Try a different widget template ID

5. **Clear cache**
   - Clear BigCommerce store cache
   - Clear browser cache
   - Try incognito/private browsing

### Reviews Not Loading

**Symptoms:** Review grid shows loading state indefinitely or is empty.

**Solutions:**

1. **Check you have published reviews**
   - Log in to Trustpilot Business account
   - Verify you have approved, published reviews
   
2. **Verify review filters**
   - Check `data-stars` setting (e.g., `"4,5"`)
   - You may be filtering out all reviews
   - Try removing the filter temporarily
   
3. **Check review language**
   - Verify `data-review-languages` matches your reviews
   - Try `"en"` or remove language filter
   
4. **Increase widget height**
   - Set `data-style-height="auto"` or increase pixel value
   
5. **Test with different widget template**
   - Try the List widget: `539ad0ffdec7e10e686debd7`
   - Try the Carousel widget: `53aa8912dec7e10d38f59f36`

### Widget Styling Issues

**Symptoms:** Widget doesn't match theme design or looks broken.

**Solutions:**

1. **Check for CSS conflicts**
   - Inspect widget with DevTools
   - Look for conflicting styles
   - Add more specific selectors in your SCSS
   
2. **Override Trustpilot styles**
   ```scss
   .trustpilot-widget {
       // Override widget styles
       font-family: $fontFamily-base !important;
       
       iframe {
           width: 100% !important;
           height: auto !important;
       }
   }
   ```
   
3. **Use correct theme setting**
   - Try `data-theme="light"` vs `data-theme="dark"`
   - Ensure it matches your site's color scheme

### Performance Issues

**Symptoms:** Page loads slowly after adding Trustpilot widgets.

**Solutions:**

1. **Use async loading**
   - Ensure script has `async` attribute
   - Consider lazy loading widgets below the fold
   
2. **Limit number of reviews**
   - Use `data-per-page` attribute to limit reviews shown
   - Example: `data-per-page="6"`
   
3. **Cache API responses**
   - If using API approach, cache responses for 1-6 hours
   - Use CDN or edge caching if available
   
4. **Defer widget loading**
   - Load widgets after initial page render
   - Use Intersection Observer to load when scrolled into view

---

## 6. Best Practices

### Review Management

1. **Respond to reviews regularly**
   - Show engagement with customers
   - Address negative reviews professionally
   
2. **Showcase your best reviews**
   - Filter for 4-5 star reviews: `data-stars="4,5"`
   - Curate manually for static implementations
   
3. **Keep reviews fresh**
   - Dynamic widgets automatically show recent reviews
   - Update static reviews quarterly
   
4. **Feature diverse reviews**
   - Show variety of products and experiences
   - Include different review lengths

### SEO Optimization

1. **Enable review rich snippets**
   - Trustpilot widgets include structured data automatically
   - Verify with Google's Rich Results Test: https://search.google.com/test/rich-results
   
2. **Add schema markup (if using static reviews)**
   ```html
   <script type="application/ld+json">
   {
       "@context": "https://schema.org",
       "@type": "Organization",
       "name": "Partyworld",
       "aggregateRating": {
           "@type": "AggregateRating",
           "ratingValue": "4.8",
           "reviewCount": "17000",
           "bestRating": "5"
       }
   }
   </script>
   ```

3. **Use descriptive anchor text**
   - Link to Trustpilot with meaningful text: "Read all reviews on Trustpilot"

### Accessibility

1. **Provide text alternatives**
   - Use `aria-label` on badge container
   - Include hidden text for screen readers
   
2. **Ensure keyboard navigation**
   - Test tabbing through reviews
   - Verify focus indicators are visible
   
3. **Use semantic HTML**
   - `<blockquote>` for review text
   - `<cite>` for author names
   - `<figure>` and `<figcaption>` where appropriate

### Brand Consistency

1. **Match your theme's design**
   - Use `data-theme` setting
   - Override widget styles to match typography
   
2. **Use consistent terminology**
   - "Customer Reviews" vs "Testimonials"
   - Align with your brand voice
   
3. **Maintain visual hierarchy**
   - Reviews shouldn't overpower product content
   - Balance trust signals with CTAs

---

## 7. Additional Resources

### Trustpilot Documentation

- **Widget Library:** https://businessapp.b2b.trustpilot.com/integrations/trustbox
- **Widget Configuration:** https://support.trustpilot.com/hc/en-us/articles/115011566948
- **API Documentation:** https://documentation-apidocumentation.trustpilot.com/
- **Developer Support:** https://support.trustpilot.com/hc/en-us/categories/360003316854-Developers

### BigCommerce Resources

- **Script Manager Guide:** https://support.bigcommerce.com/s/article/Using-Script-Manager
- **Page Builder Guide:** https://support.bigcommerce.com/s/article/Page-Builder
- **Stencil Theme Guide:** https://developer.bigcommerce.com/stencil-docs

### Theme-Specific Files

- **Trustpilot Badge Template:** `templates/components/common/trustpilot-badge.html`
- **Customer Review Grid Template:** `templates/components/page/customer-review-grid.html`
- **Header Template:** `templates/components/common/header.html`
- **Homepage Template:** `templates/pages/home.html`
- **Theme Map Documentation:** `docs/THEME_MAP.md`
- **Design System Rules:** `docs/design-system/design_system_rules.md`

### Support Contacts

- **Trustpilot Support:** support@trustpilot.com
- **BigCommerce Support:** https://support.bigcommerce.com/
- **Theme Developer:** [Contact your theme development team]

---

## Summary

This integration guide covers three approaches for each Trustpilot component:

### Trustpilot Badge (Header)
1. **TrustBox Widget** (Recommended) - Dynamic, auto-updating, minimal maintenance
2. **API Integration** (Advanced) - Full customization, requires backend
3. **Static HTML** (Current) - Manual updates, no external dependencies

### Customer Review Grid (Homepage)
1. **TrustBox Widget** (Recommended) - Dynamic reviews, automatic updates
2. **Static Reviews** (Manual) - Curated content via Page Builder or Theme Editor
3. **API Integration** (Advanced) - Custom rendering with full design control

**Recommended Quick Start:**

1. Get your Trustpilot Business Unit ID
2. Replace both components with TrustBox widgets
3. Add Trustpilot script via BigCommerce Script Manager
4. Test across devices and browsers
5. Customize styling to match your theme

For most users, the TrustBox widget approach offers the best balance of ease-of-use, maintenance, and functionality.
