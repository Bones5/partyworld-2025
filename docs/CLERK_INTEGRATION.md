# Clerk.io Integration Guide

This guide explains how to integrate Clerk.io product recommendations into the Partyworld 2025 BigCommerce Stencil theme.

## Overview

Clerk.io is an AI-powered product recommendation engine that provides personalized product suggestions to customers based on their browsing behavior, purchase history, and other factors. 

### Architecture

This integration uses a **hybrid approach**:

1. **Clerk.io API** provides AI-powered product ID recommendations
2. **BigCommerce Storefront GraphQL API** fetches full product data
3. **Native theme product cards** render the products with consistent styling

This approach gives you:
- ✅ Clerk's AI recommendations
- ✅ Native theme product card styling (same as rest of site)
- ✅ Full control over markup and styling
- ✅ No need to configure Clerk.io templates in their dashboard

### Integration Points

- **Product Pages**: Show related and complementary products
- **Category Pages**: Display popular products in the category
- **Homepage**: Feature personalized recommendations for visitors
- **Cart Page**: Suggest additional items to complete the order

---

## Prerequisites

Before implementing this integration, you need:

1. **Clerk.io Account**: Sign up at [clerk.io](https://clerk.io/)
2. **Public API Key**: Get your public key from the Clerk.io dashboard
3. **Product Data Feed**: Sync your BigCommerce product catalog with Clerk.io

---

## Installation & Configuration

### Step 1: Enable Clerk.io in Theme Editor

1. Log in to your BigCommerce admin panel
2. Navigate to **Storefront** → **Themes** → **Customize**
3. Scroll down to find the **Clerk.io Integration** section
4. Configure the following settings:

#### Settings

| Setting | Description | Default |
|---------|-------------|---------|
| **Enable Clerk.io** | Master toggle for all Clerk.io features | `false` |
| **Clerk.io Public Key** | Your Clerk.io public API key | `""` |
| **Enable Product Page Recommendations** | Show recommendations on product detail pages | `false` |
| **Enable Category Recommendations** | Show recommendations on category pages | `false` |
| **Enable Homepage Recommendations** | Show recommendations on the homepage | `false` |
| **Enable Cart Page Recommendations** | Show recommendations on cart page | `false` |

### Step 2: Add Product Data Feed

Clerk.io needs access to your product catalog:

1. In Clerk.io dashboard, go to **Data** → **Products**
2. Select **BigCommerce** as the platform
3. Follow the setup wizard to connect your store
4. Clerk.io will automatically sync your product catalog

---

## Template Usage

### Homepage Recommendations

```handlebars
{{> components/page/clerk-recommendations 
    heading="Recommended For You"
    subheading="Handpicked products based on your preferences"
    type="popular"
    limit=8
}}
```

**Parameters**:
- `heading`: Section heading text (default: "Recommended For You")
- `subheading`: Optional subheading text
- `type`: Recommendation type - `popular`, `trending`, `new`, `visitor` (default: `popular`)
- `limit`: Number of products to show (default: 8)

### Product Page Recommendations

```handlebars
{{> components/products/clerk-recommendations 
    heading="You May Also Like"
    type="similar"
    limit=8
}}
```

**Parameters**:
- `heading`: Section heading text (default: "Recommended For You")
- `type`: Recommendation type - `similar`, `complementary` (default: `similar`)
- `product_id`: Override product ID (default: current product)
- `limit`: Number of products to show (default: 8)

### Category Page Recommendations

```handlebars
{{> components/category/clerk-recommendations 
    heading="Popular in This Category"
    limit=8
}}
```

**Parameters**:
- `heading`: Section heading text (default: "Popular in This Category")
- `category_id`: Override category ID (default: current category)
- `limit`: Number of products to show (default: 8)

### Cart Page Recommendations

```handlebars
{{> components/cart/clerk-recommendations 
    heading="Complete Your Order"
    type="visitor"
    limit=8
}}
```

**Parameters**:
- `heading`: Section heading text (default: "Complete Your Order")
- `type`: Clerk.io API endpoint - `recommendations/complementary`, `recommendations/visitor/complementary` (default: `recommendations/visitor/complementary`)
- `limit`: Number of products to show (default: 8)

---

## Architecture Overview

### How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Clerk.io API  │────▶│  Product IDs    │────▶│ BigCommerce     │
│  (Recommendations)    │  (Array)        │     │ GraphQL API     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │  Product Data   │
                                                │  (Full Details) │
                                                └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │  Theme Product  │
                                                │  Cards (HTML)   │
                                                └─────────────────┘
```

1. **Clerk.io JavaScript API**: Calls Clerk.io to get recommended product IDs
2. **BigCommerce Storefront GraphQL**: Fetches full product data for those IDs
3. **Theme Rendering**: JavaScript generates product cards matching the theme design

### Benefits of This Approach

- **Full Design Control**: Product cards use theme CSS, not Clerk.io templates
- **Consistent UX**: Recommendations look identical to other product grids
- **No Clerk.io Template Management**: No need to maintain separate templates in Clerk.io dashboard
- **Theme Editor Integration**: Simple on/off toggle and API key configuration

---

## Styling & Customization

### SCSS Customization

The recommendations component is styled in:

`/assets/scss/components/stencil/clerkRecommendations/_clerkRecommendations.scss`

#### Example Customizations

**Change heading color:**
```scss
.c-clerkRecommendations__heading {
    color: stencilColor("color-textHeading");
}
```

**Adjust spacing:**
```scss
.c-clerkRecommendations {
    margin-top: spacing("double") + spacing("single");
    padding: spacing("double") spacing("single");
}
```

**Style product cards:**
```scss
.c-clerkRecommendations__card {
    border: 1px solid stencilColor("color-greyLight");
    border-radius: $global-radius;
    
    &:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
}
```

### Product Card Structure

Each product card is rendered with this HTML structure:

```html
<article class="c-clerkRecommendations__card card">
    <figure class="c-clerkRecommendations__card-figure card-figure">
        <a href="/product-url/" class="c-clerkRecommendations__card-figure-link">
            <img src="..." alt="Product Name" class="c-clerkRecommendations__card-image card-image" loading="lazy">
        </a>
    </figure>
    <div class="c-clerkRecommendations__card-body card-body">
        <p class="c-clerkRecommendations__card-brand">Brand Name</p>
        <h3 class="c-clerkRecommendations__card-title card-title">
            <a href="/product-url/">Product Name</a>
        </h3>
        <div class="c-clerkRecommendations__card-price">€19.99</div>
        <div class="c-clerkRecommendations__card-rating">
            <span class="rating--small">
                <span class="rating--small-filled" style="width: 80%">
                    <span class="u-hiddenVisually">Rated 4.0 out of 5</span>
                </span>
            </span>
            <span class="c-clerkRecommendations__card-reviewCount">(12)</span>
        </div>
    </div>
</article>
```

---

## JavaScript Module

### ClerkRecommendations Class

The core logic is in `/assets/js/theme/common/clerk-recommendations.js`:

```javascript
import utils from '@bigcommerce/stencil-utils';

export default class ClerkRecommendations {
    constructor(context) {
        this.context = context;
        this.storefrontApiToken = context.storefrontApiToken;
        this.clerkPublicKey = context.clerkPublicKey;
        this.clerkEnabled = context.clerkEnabled;
    }

    init() {
        if (!this.clerkEnabled || !this.clerkPublicKey) return;
        this.initContainers();
    }
    
    // ... methods for fetching and rendering
}
```

### GraphQL Query

Product data is fetched via BigCommerce Storefront GraphQL:

```graphql
query getProductsByIds($entityIds: [Int!]) {
    site {
        products(entityIds: $entityIds, first: 50) {
            edges {
                node {
                    entityId
                    name
                    path
                    prices {
                        price { value currencyCode }
                        salePrice { value currencyCode }
                    }
                    defaultImage {
                        url(width: 320)
                        altText
                    }
                    brand { name }
                    reviewSummary {
                        summationOfRatings
                        numberOfReviews
                    }
                }
            }
        }
    }
}
```

---

## Testing & Verification

### Step 1: Verify Clerk.io Script Loading

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

### Step 3: Verify GraphQL Token

Check that the Storefront API token is injected:

```javascript
// In browser console
console.log(window.BCData?.storefrontApiToken ? 'Token present' : 'Token missing');
```

### Step 4: Test Recommendations

1. Navigate to any page with recommendations
2. Open Developer Tools → Network
3. Look for GraphQL requests to `/graphql`
4. Verify product data is returned
5. Check that product cards render correctly

### Step 5: Verify Tracking

Clerk.io tracks user behavior automatically:

1. View several products
2. Add items to cart
3. Log in to Clerk.io dashboard
4. Navigate to **Analytics** → **Real-Time**
5. Verify your actions appear in the activity feed

---

## Troubleshooting

### Recommendations Not Displaying

**Symptoms**: Recommendation section is empty

**Solutions**:

1. **Verify Clerk.io is enabled**
   - Check Theme Editor → Clerk.io Integration → Enable Clerk.io is checked

2. **Check Public Key**
   - Ensure Clerk.io Public Key is correctly entered in Theme Editor
   - No extra spaces or quotes

3. **Verify Storefront API Token**
   - Check that `storefrontApiToken` is injected in `base.html`
   - Token should be available in `this.context.storefrontApiToken`

4. **Check Browser Console**
   - Look for JavaScript errors
   - Check for failed GraphQL requests

5. **Verify Product Data Feed**
   - Ensure products are synced in Clerk.io dashboard
   - Go to **Data** → **Products** to verify

### GraphQL Errors

**Symptoms**: GraphQL requests fail or return errors

**Solutions**:

1. **Check Token Permissions**
   - Storefront API token needs proper scopes
   - Verify in BigCommerce admin → API Accounts

2. **Verify Query Syntax**
   - Check browser console for GraphQL error messages
   - Validate query in BigCommerce GraphQL Playground

3. **Check Product IDs**
   - Clerk.io returns product IDs that should match BigCommerce entity IDs
   - Verify products exist in BigCommerce

### Styling Issues

**Symptoms**: Products don't match theme design

**Solutions**:

1. **Check CSS Classes**
   - Ensure `.c-clerkRecommendations__card` styles are loaded
   - Verify SCSS file is imported in `_components.scss`

2. **Inspect Generated HTML**
   - Use browser DevTools to inspect product cards
   - Check for missing or incorrect classes

3. **Override Styles**
   - Add custom styles in `_clerkRecommendations.scss`
   - Use more specific selectors if needed

---

## Performance Optimization

### Lazy Loading

Images are lazy-loaded by default (`loading="lazy"`).

For intersection observer-based lazy loading of the entire section:

```javascript
// In clerk-recommendations.js
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            this.loadRecommendations(entry.target);
            observer.unobserve(entry.target);
        }
    });
});
```

### Caching

- Clerk.io caches recommendation responses
- GraphQL responses can be cached using browser cache headers
- Consider implementing client-side caching for repeat views

### Limiting Products

Configure in Theme Editor:
- Set **Products Limit** to 4, 8, or 12
- Fewer products = faster load times

---

## Clerk.io API Endpoints

The integration supports various Clerk.io recommendation endpoints:

| Endpoint | Use Case | Context Required |
|----------|----------|------------------|
| `recommendations/popular` | Homepage popular products | None |
| `home/popular` | Homepage (alternative) | None |
| `recommendations/visitor/complementary` | Visitor-based recommendations | None |
| `recommendations/complementary` | Product page complementary | Product ID |
| `recommendations/alternatives` | Product page alternatives | Product ID |
| `category/popular` | Category bestsellers | Category ID |
| `cart/complementary` | Cart cross-sells | Cart product IDs |

### Custom Endpoints

You can use any Clerk.io endpoint by setting the `data-clerk-type` attribute:

```handlebars
<div data-clerk-recommendations 
     data-clerk-type="recommendations/trending" 
     data-clerk-limit="8">
</div>
```

---

## Security & Privacy

### Data Flow

1. **Clerk.io**: Receives browsing behavior, returns product IDs only
2. **BigCommerce GraphQL**: Provides product data (public API)
3. **No sensitive data**: No customer PII passes through Clerk.io

### GDPR Compliance

1. Update your Privacy Policy to mention Clerk.io
2. Clerk.io is GDPR compliant
3. Users can opt-out via cookie preferences

---

## Support & Resources

### Clerk.io Resources

- **Dashboard**: https://my.clerk.io/
- **Documentation**: https://docs.clerk.io/
- **JavaScript API**: https://docs.clerk.io/docs/javascript-api
- **Support**: support@clerk.io

### BigCommerce Resources

- **Storefront GraphQL**: https://developer.bigcommerce.com/docs/storefront/graphql
- **Stencil Docs**: https://developer.bigcommerce.com/stencil-docs
- **Support**: https://support.bigcommerce.com/

### Theme-Specific Files

| File | Purpose |
|------|---------|
| `/assets/js/theme/common/clerk-recommendations.js` | Main JS module |
| `/templates/components/common/clerk-script.html` | Clerk.io script loader |
| `/templates/components/products/clerk-recommendations.html` | Product page partial |
| `/templates/components/category/clerk-recommendations.html` | Category page partial |
| `/templates/components/page/clerk-recommendations.html` | Homepage partial |
| `/templates/components/cart/clerk-recommendations.html` | Cart page partial |
| `/assets/scss/components/stencil/clerkRecommendations/_clerkRecommendations.scss` | Component styles |
| `schema.json` | Theme Editor settings |
| `config.json` | Default configuration |

---

## Summary

The Clerk.io integration provides:

✅ **Theme-Native Rendering**: Product cards match your theme design exactly  
✅ **Simple Configuration**: Just enable and add API key in Theme Editor  
✅ **GraphQL-Powered**: Full product data from BigCommerce  
✅ **AI Recommendations**: Clerk.io's intelligent product suggestions  
✅ **Performance**: Async loading with lazy-loaded images  
✅ **No Template Management**: No need to maintain Clerk.io templates  

**Quick Start Checklist**:

- [ ] Sign up for Clerk.io account
- [ ] Get Public API Key from Clerk.io dashboard
- [ ] Enable Clerk.io in Theme Editor
- [ ] Enter Public Key in Theme Editor
- [ ] Sync product data in Clerk.io
- [ ] Test on storefront
- [ ] Monitor analytics in Clerk.io dashboard

For additional help, contact your theme developer or Clerk.io support.
