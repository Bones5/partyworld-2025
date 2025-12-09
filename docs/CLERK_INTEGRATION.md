# Clerk.io Integration Guide

This guide explains how to integrate Clerk.io product recommendations into the Partyworld 2025 BigCommerce Stencil theme.

## Overview

Clerk.io is an AI-powered product recommendation engine that provides personalized product suggestions to customers based on their browsing behavior, purchase history, and other factors. This integration adds Clerk.io recommendation sections throughout the store:

- **Product Pages**: Show related and complementary products
- **Category Pages**: Display popular products in the category
- **Homepage**: Feature personalized recommendations for visitors
- **Cart Page**: Suggest additional items to complete the order

---

## Prerequisites

Before implementing this integration, you need:

1. **Clerk.io Account**: Sign up at [clerk.io](https://clerk.io/)
2. **Public API Key**: Get your public key from the Clerk.io dashboard
3. **Configured Templates**: Create recommendation templates in Clerk.io dashboard

---

## Installation & Configuration

### Step 1: Enable Clerk.io in Theme Editor

1. Log in to your BigCommerce admin panel
2. Navigate to **Storefront** → **Themes** → **Customize**
3. Scroll down to find the **Clerk.io Integration** section
4. Configure the following settings:

#### Master Settings

| Setting | Description | Default |
|---------|-------------|---------|
| **Enable Clerk.io** | Master toggle for all Clerk.io features | `false` |
| **Clerk.io Public Key** | Your Clerk.io public API key | `""` |

#### Product Page Recommendations

| Setting | Description | Default |
|---------|-------------|---------|
| **Enable Product Page Recommendations** | Show recommendations on product detail pages | `false` |
| **Product Page Template** | Clerk.io template name for product pages | `@product-page-recommendations` |

#### Category Page Recommendations

| Setting | Description | Default |
|---------|-------------|---------|
| **Enable Category Recommendations** | Show recommendations on category pages | `false` |
| **Category Page Template** | Clerk.io template name for category pages | `@category-page-recommendations` |

#### Homepage Recommendations

| Setting | Description | Default |
|---------|-------------|---------|
| **Enable Homepage Recommendations** | Show recommendations on the homepage | `false` |
| **Homepage Template** | Clerk.io template name for homepage | `@homepage-recommendations` |

#### Cart Page Recommendations

| Setting | Description | Default |
|---------|-------------|---------|
| **Enable Cart Page Recommendations** | Show recommendations on cart page | `false` |
| **Cart Page Template** | Clerk.io template name for cart | `@cart-page-recommendations` |

### Step 2: Configure Clerk.io Templates

1. Log in to your [Clerk.io Dashboard](https://my.clerk.io/)
2. Navigate to **Design** → **Templates**
3. Create or configure templates for each recommendation type:

#### Recommended Template Names

- Product Page: `@product-page-recommendations`
- Category Page: `@category-page-recommendations`
- Homepage: `@homepage-recommendations`
- Cart Page: `@cart-page-recommendations`

**Note**: You can use custom template names by updating the corresponding settings in the Theme Editor.

### Step 3: Add Product Data Feed

Clerk.io needs access to your product catalog. There are two methods:

#### Option A: API Integration (Recommended)

1. In Clerk.io dashboard, go to **Data** → **Products**
2. Select **BigCommerce** as the platform
3. Follow the setup wizard to connect your store
4. Clerk.io will automatically sync your product catalog

#### Option B: Manual Feed

1. Export your product catalog as CSV/JSON
2. Upload to Clerk.io via **Data** → **Products** → **Upload**
3. Set up a recurring sync schedule

---

## Template Usage

### Product Page Integration

The Clerk.io recommendations are automatically added to all product detail pages when enabled in Theme Editor.

**Default Location**: Below the product content, before reviews

**Customization Example**:

To customize the heading or template, edit `/templates/pages/product.html`:

```handlebars
{{!-- Custom product recommendations --}}
{{> components/products/clerk-recommendations 
    heading="You May Also Like"
    template="@custom-product-template"
}}
```

**Parameters**:
- `heading`: Custom heading text (optional)
- `template`: Override Clerk.io template (optional)
- `product_id`: Specific product ID for recommendations (optional, defaults to current product)

### Category Page Integration

To add Clerk.io recommendations to category pages, edit `/templates/pages/category.html`:

```handlebars
{{#partial "page"}}
    {{> components/common/breadcrumbs breadcrumbs=breadcrumbs}}
    
    {{{region name="category_below_header"}}}
    
    {{#if category.image}}
        {{> components/category/category-hero}}
    {{/if}}
    
    {{!-- Clerk.io category recommendations --}}
    {{> components/category/clerk-recommendations 
        heading="Popular in {{category.name}}"
    }}
    
    <div class="page">
        {{> components/category/product-listing}}
    </div>
{{/partial}}
```

**Parameters**:
- `heading`: Custom heading text (optional)
- `template`: Override Clerk.io template (optional)
- `category_id`: Specific category ID (optional, defaults to current category)

### Homepage Integration

To add Clerk.io recommendations to the homepage, edit `/templates/pages/home.html`:

```handlebars
{{#partial "page"}}
    {{{region name="home_below_menu"}}}
    
    {{> components/page/hero}}
    {{> components/page/hero-theme-slider}}
    {{> components/page/category-grid}}
    
    {{!-- Clerk.io homepage recommendations --}}
    {{> components/page/clerk-recommendations 
        heading="Recommended For You"
        subheading="Handpicked products based on your preferences"
        template="@homepage-visitor-recommendations"
    }}
    
    {{> components/page/customer-review-grid}}
{{/partial}}
```

**Parameters**:
- `heading`: Custom heading text (optional)
- `subheading`: Optional subheading text (optional)
- `template`: Override Clerk.io template (optional)

### Cart Page Integration

To add Clerk.io recommendations to the cart page, edit `/templates/pages/cart.html`:

```handlebars
{{#partial "page"}}
    {{> components/common/breadcrumbs breadcrumbs=breadcrumbs}}
    
    <h1 class="page-heading">{{lang 'cart.heading'}}</h1>
    
    {{> components/cart/content}}
    
    {{!-- Clerk.io cart recommendations --}}
    {{> components/cart/clerk-recommendations 
        heading="Complete Your Order"
    }}
{{/partial}}
```

**Parameters**:
- `heading`: Custom heading text (optional)
- `template`: Override Clerk.io template (optional)

---

## Styling & Customization

### SCSS Customization

The Clerk.io recommendations component uses theme styling by default, but can be customized in:

`/assets/scss/components/stencil/clerkRecommendations/_clerkRecommendations.scss`

#### Example Customizations

**Change heading color:**
```scss
.c-clerkRecommendations__heading {
    color: #ff0000; // Your custom color
}
```

**Adjust spacing:**
```scss
.c-clerkRecommendations {
    margin-top: spacing("quadruple");
    padding: spacing("double") spacing("single");
}
```

**Style recommendation cards:**
```scss
.c-clerkRecommendations {
    .clerk-product {
        border: 1px solid #e5e5e5;
        border-radius: $global-radius;
        
        &:hover {
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
    }
}
```

### Template Customization in Clerk.io Dashboard

For full control over recommendation appearance:

1. Log in to [Clerk.io Dashboard](https://my.clerk.io/)
2. Navigate to **Design** → **Templates**
3. Select your template
4. Customize HTML, CSS, and JavaScript
5. Preview changes in real-time
6. Save and publish

**Key Customization Options:**
- Product card layout
- Number of products displayed
- Slider/grid layout
- Add to cart buttons
- Price formatting
- Image sizes

---

## Advanced Features

### Dynamic Template Selection

You can dynamically change templates based on conditions:

```handlebars
{{#if product.custom_fields}}
    {{> components/products/clerk-recommendations 
        template="@premium-recommendations"
    }}
{{else}}
    {{> components/products/clerk-recommendations 
        template="@standard-recommendations"
    }}
{{/if}}
```

### Multiple Recommendation Sections

Add multiple Clerk.io sections to a single page:

```handlebars
{{!-- Similar products --}}
{{> components/products/clerk-recommendations 
    heading="Similar Products"
    template="@similar-products"
}}

{{!-- Frequently bought together --}}
{{> components/products/clerk-recommendations 
    heading="Frequently Bought Together"
    template="@frequently-bought-together"
}}
```

### Conditional Rendering

Show recommendations only for specific conditions:

```handlebars
{{#if customer}}
    {{!-- Logged-in customer recommendations --}}
    {{> components/products/clerk-recommendations 
        template="@personalized-recommendations"
    }}
{{else}}
    {{!-- Guest visitor recommendations --}}
    {{> components/products/clerk-recommendations 
        template="@popular-recommendations"
    }}
{{/if}}
```

---

## Testing & Verification

### Step 1: Verify Script Loading

1. Open your storefront in a browser
2. Open Developer Tools (F12)
3. Go to **Network** tab
4. Reload the page
5. Look for `clerk.js` in the network requests
6. Verify it loads with a 200 status code

### Step 2: Check Configuration

In the browser console, verify Clerk.io is initialized:

```javascript
// Check if Clerk is loaded
console.log(typeof Clerk); // Should output "function"

// Check your configuration
Clerk.inspect();
```

### Step 3: Verify Recommendations Display

1. Navigate to a product page
2. Scroll to the recommendations section
3. Verify products are displayed
4. Check that the layout matches your design

### Step 4: Test Tracking

Clerk.io tracks user behavior. Verify tracking works:

1. View several products
2. Add items to cart
3. Log in to Clerk.io dashboard
4. Navigate to **Analytics** → **Real-Time**
5. Verify your actions appear in the activity feed

---

## Troubleshooting

### Recommendations Not Displaying

**Symptoms**: Clerk.io section is empty or doesn't appear

**Solutions**:

1. **Verify Clerk.io is enabled**
   - Check Theme Editor → Clerk.io Integration → Enable Clerk.io is checked
   - Verify the specific page type is enabled (product/category/homepage/cart)

2. **Check Public Key**
   - Ensure Clerk.io Public Key is correctly entered in Theme Editor
   - No extra spaces or quotes
   - Key format: alphanumeric string

3. **Verify Template Name**
   - Template names must start with `@` symbol
   - Check for typos
   - Verify template exists in Clerk.io dashboard

4. **Check Product Data Feed**
   - Ensure products are synced in Clerk.io dashboard
   - Go to **Data** → **Products** to verify

5. **Clear Cache**
   - Clear BigCommerce store cache
   - Clear browser cache
   - Try incognito/private browsing

### Script Not Loading

**Symptoms**: `clerk.js` fails to load or shows errors

**Solutions**:

1. **Check Console Errors**
   - Open browser DevTools → Console
   - Look for JavaScript errors
   - Check for Content Security Policy (CSP) violations

2. **Verify CDN Access**
   - Ensure `https://cdn.clerk.io/clerk.js` is accessible
   - Check for firewall/network restrictions

3. **Test Script Manually**
   - Open browser console
   - Run: `fetch('https://cdn.clerk.io/clerk.js').then(r => console.log(r.status))`
   - Should output `200`

### Tracking Not Working

**Symptoms**: User activity doesn't appear in Clerk.io analytics

**Solutions**:

1. **Verify API Key**
   - Double-check the Public Key in Theme Editor
   - Test with a different key if available

2. **Check Configuration**
   - In browser console, run: `Clerk.inspect()`
   - Verify configuration looks correct

3. **Test in Real-Time Analytics**
   - Log in to Clerk.io dashboard
   - Navigate to **Analytics** → **Real-Time**
   - Perform actions on your store
   - Should see activity within 1-2 minutes

### Styling Issues

**Symptoms**: Recommendations don't match theme design

**Solutions**:

1. **Check for CSS Conflicts**
   - Inspect elements with browser DevTools
   - Look for conflicting styles
   - Add more specific selectors in SCSS

2. **Override Clerk.io Styles**
   - Edit `_clerkRecommendations.scss`
   - Use `!important` if needed for specificity

3. **Customize in Clerk.io Dashboard**
   - Modify template CSS directly in Clerk.io
   - Ensure it matches your theme colors and fonts

---

## Performance Optimization

### Lazy Loading

Clerk.io recommendations load asynchronously by default, but you can further optimize:

```handlebars
{{!-- Only load below the fold --}}
<div data-lazy-clerk>
    {{> components/products/clerk-recommendations}}
</div>
```

### Caching Recommendations

Clerk.io handles caching on their end, but ensure:

1. Don't disable Clerk.io caching in the dashboard
2. Use appropriate cache times (default: 1 hour)
3. Consider using Clerk.io's edge caching for faster delivery

### Limiting Products

To improve performance, limit the number of recommended products:

In Clerk.io dashboard:
1. Edit your template
2. Set **Max Products** to 6-8 (instead of 12+)
3. Use pagination or "load more" for additional products

---

## Best Practices

### Recommendation Strategy

1. **Product Pages**: Show complementary and similar products
2. **Category Pages**: Highlight bestsellers and popular items
3. **Homepage**: Personalized visitor recommendations
4. **Cart Page**: Cross-sells and frequently bought together

### Template Naming Convention

Use descriptive template names:
- `@product-alternatives` (not `@template1`)
- `@category-bestsellers` (not `@cat-rec`)
- `@homepage-personalized` (not `@home`)

### A/B Testing

1. Create multiple templates in Clerk.io
2. Use Clerk.io's built-in A/B testing
3. Measure conversion rates
4. Iterate on best-performing templates

### Data Quality

Ensure high-quality product data:
- Complete product descriptions
- High-quality images
- Accurate categorization
- Up-to-date inventory

---

## Security & Privacy

### Data Collection

Clerk.io collects:
- Browsing behavior (page views, clicks)
- Cart contents
- Purchase history (if tracking is enabled)

### GDPR Compliance

1. Update your Privacy Policy to mention Clerk.io
2. Clerk.io is GDPR compliant by default
3. Users can opt-out via cookie preferences

### Email Collection

The current integration has `collect_email: false` in configuration. If you need email tracking:

1. Edit `/templates/components/common/clerk-script.html`
2. Change `collect_email: false` to `collect_email: true`
3. Ensure GDPR compliance

---

## Support & Resources

### Clerk.io Resources

- **Dashboard**: https://my.clerk.io/
- **Documentation**: https://docs.clerk.io/
- **Support**: support@clerk.io
- **Community**: https://community.clerk.io/

### BigCommerce Resources

- **Stencil Docs**: https://developer.bigcommerce.com/stencil-docs
- **Theme Editor**: https://support.bigcommerce.com/s/article/Stencil-Themes
- **Support**: https://support.bigcommerce.com/

### Theme-Specific Files

- **Clerk.io Script**: `/templates/components/common/clerk-script.html`
- **Product Recommendations**: `/templates/components/products/clerk-recommendations.html`
- **Category Recommendations**: `/templates/components/category/clerk-recommendations.html`
- **Homepage Recommendations**: `/templates/components/page/clerk-recommendations.html`
- **Cart Recommendations**: `/templates/components/cart/clerk-recommendations.html`
- **Styles**: `/assets/scss/components/stencil/clerkRecommendations/_clerkRecommendations.scss`
- **Configuration**: `schema.json` (lines 3087-3160) and `config.json` (lines 433-442)

---

## Migration from Previous Clerk.io Implementation

If you previously had Clerk.io hardcoded in widgets or HTML blocks:

### Step 1: Remove Old Code

1. Check **Storefront** → **Widget Templates**
2. Remove any widgets with Clerk.io `<span class="clerk">` code
3. Check page content for hardcoded Clerk.io snippets
4. Remove manual script tags for `clerk.js`

### Step 2: Enable New Integration

1. Follow installation steps above
2. Configure in Theme Editor
3. Templates will automatically render in the correct locations

### Step 3: Verify Migration

1. Test all pages where Clerk.io was previously shown
2. Verify recommendations still appear
3. Check analytics in Clerk.io dashboard

---

## Summary

The Clerk.io integration provides:

✅ **Easy Configuration**: Enable/disable via Theme Editor
✅ **Flexible Templates**: Customize per page type
✅ **Theme-Matched Styling**: Inherits your theme design
✅ **Performance**: Async loading, no impact on page speed
✅ **Personalization**: AI-powered product recommendations
✅ **Analytics**: Track effectiveness in Clerk.io dashboard

**Quick Start Checklist**:

- [ ] Sign up for Clerk.io account
- [ ] Get Public API Key
- [ ] Enable Clerk.io in Theme Editor
- [ ] Enter Public Key
- [ ] Create recommendation templates in Clerk.io
- [ ] Enable desired page types
- [ ] Test on storefront
- [ ] Monitor analytics

For additional help, contact your theme developer or Clerk.io support.
