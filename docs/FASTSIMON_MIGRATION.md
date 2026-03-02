# Fast Simon Migration Plan — Clerk.io → Fast Simon

## Overview

This document outlines the migration from **Clerk.io** to **Fast Simon** for AI-powered product recommendations, search, and merchandising on the Partyworld BigCommerce Stencil theme. It also covers the **Fast Simon ↔ Klaviyo** integration for email/SMS personalisation.

---

## 1. What is Fast Simon?

Fast Simon is a Verified BigCommerce Technology Partner that provides:

- **AI Search & Autocomplete** — instant, typo-tolerant full-text search with facets
- **Smart Collections** — AI-merchandised category pages
- **Upsell & Cross-Sell Recommendations** — widget-based, configured in the Fast Simon dashboard
- **Visual Discovery / Look-a-Like** — visually similar product suggestions
- **AI Merchandising** — rule-based & AI product ranking in collections
- **Klaviyo Integration** — intent-based flows, personalised email/SMS product recommendations
- **No-Code Editor** — dashboard-driven widget styling (optional)
- **API & SDK** — REST API for headless/custom integrations

### Key Differences from Clerk.io

| Aspect | Clerk.io (current) | Fast Simon (target) |
|--------|-------------------|---------------------|
| Rec endpoint | `api.clerk.io/v2/recommendations/*` | `api.fastsimon.com/upsell_cross_sell_recommendation` |
| Widget config | Type-based (`similar`, `complementary`, `popular`, …) in code | **Widget IDs** created in the Fast Simon dashboard |
| Returns | Array of product IDs | `widget_responses[].items[]` — full product objects with title, URL, image, price |
| Search | Clerk JS SDK (`<span class="clerk">`) | `api.fastsimon.com/full_text_search` + `/ac` for autocomplete |
| Collections | Clerk `recommendations/category/popular` | `api.fastsimon.com/categories_navigation` (AI-ranked) |
| Event tracking | Not implemented in theme (Clerk SDK handles) | Explicit shopper activity reporting via `/post_load` and `/post_load_ac` |
| User identity | `clerk_visitor_id` (random UUID) | `isp_token` from `/post_load` + session timestamp |
| Dashboard | Clerk.io dashboard for templates | Fast Simon dashboard for widget creation, merchandising rules, analytics |

---

## 2. Fast Simon API Architecture

### Core Endpoints

| Endpoint | URL | Purpose |
|----------|-----|---------|
| **Site Config** | `GET /load` | Returns `cdn_cache_key` (required for search/collection calls) |
| **Autocomplete Searches** | `GET suggest.fastsimon.com/` | Popular search suggestions for a prefix |
| **Autocomplete Products** | `GET /ac` | Product + category suggestions for search dropdown |
| **Full-Text Search** | `GET /full_text_search` | Search results page with facets |
| **Collections** | `GET /categories_navigation` | Smart Collection products with facets |
| **Upsell / Cross-Sell** | `GET /upsell_cross_sell_recommendation` | Widget-based product recommendations |
| **Look-a-Like** | `GET /lookalike` | Visually similar products |
| **Shopper Activity** | `GET ping.fastsimon.com/post_load` | Event reporting for analytics & personalisation |
| **AC Activity** | `GET ping.fastsimon.com/post_load_ac` | Autocomplete event reporting |

### Authentication

All requests require:
- `store_id` — from Fast Simon dashboard → Settings
- `UUID` — from Fast Simon dashboard → Settings

For upsell/cross-sell, also need:
- `widgets_ids[]` — array of widget IDs from the Fast Simon dashboard

### Product Data in Responses

Unlike Clerk (which only returns product IDs), Fast Simon's upsell/cross-sell endpoint returns **full product objects** with:
- `l` (label/title), `u` (URL), `t` (thumbnail), `id`, `sku`
- `p` (price), `p_c` (compare-at price), `p_min`/`p_max` (variant range)
- `c` (currency), `vra` (variant attributes)

**This means we may NOT need the GraphQL product fetch step** — Fast Simon returns enough data to render cards directly. However, for feature parity (reviews, inventory badges, tax-inclusive pricing), we may still want to hydrate via BigCommerce GraphQL for the recommendation widgets.

---

## 3. Widget Mapping — Clerk.io → Fast Simon

### 6 Recommendation Widgets to Replace

| # | Clerk Widget Name | Current Clerk Config | Page | Fast Simon Equivalent | Fast Simon Widget Type |
|---|------------------|---------------------|------|----------------------|----------------------|
| 1 | **Top Picks for You** | `type="popular"`, endpoint `recommendations/popular` | Homepage | Fast Simon **Upsell/Cross-Sell widget** (visitor/personalised) | Create widget in FS dashboard: "Homepage Top Picks" — personalised popular products |
| 2 | **Top Category Products** | `type="category"`, endpoint `recommendations/category/popular` | Category page | Fast Simon **Upsell/Cross-Sell widget** or **Smart Collection** (`/categories_navigation`) | Create widget in FS dashboard: "Category Best Sellers" with category context |
| 3 | **Add to Basket / Other Also Bought** | `type="visitor"`, endpoint `recommendations/visitor/complementary` | Cart page | Fast Simon **Upsell/Cross-Sell widget** with `cart_token` | Create widget in FS dashboard: "Also Bought" (Frequently Bought Together) |
| 4 | **Product Page — Other Alternatives** | `type="similar"`, endpoint `recommendations/similar` | PDP | Fast Simon **Upsell/Cross-Sell widget** or **Look-a-Like** (`/lookalike`) | Create widget in FS dashboard: "Similar Products" |
| 5 | **Cart Best Cross-Sell Products** | `type="complementary"` or `type="visitor"` | Cart page | Fast Simon **Upsell/Cross-Sell widget** with `cart_token` | Create widget in FS dashboard: "Cross-Sell" |
| 6 | **Product Page — Cross-Sell** | `type="complementary"`, endpoint `recommendations/complementary` | PDP | Fast Simon **Upsell/Cross-Sell widget** | Create widget in FS dashboard: "Complete the Look" / "Goes Well With" |

### Current vs New Implementation by Page

#### Homepage
- **Before:** `clerk-recommendations` partial with `type="popular"` → calls `recommendations/popular` → returns IDs → GraphQL fetch → render cards in carousel
- **After:** Fast Simon `/upsell_cross_sell_recommendation` with a "Homepage Top Picks" widget ID. No product context needed — FS uses visitor behaviour + global popularity to personalise.

#### Category Page
- **Before:** `clerk-recommendations` partial → calls `recommendations/category/popular` → returns IDs → GraphQL fetch → render cards
- **After (Option A):** Fast Simon `/upsell_cross_sell_recommendation` with a "Category Best Sellers" widget ID + `product_id` context
- **After (Option B):** Fast Simon `/categories_navigation` endpoint to get AI-ranked products for the category (more powerful — includes facets, merchandising rules)

#### Product Detail Page (PDP)
- **Before:** Single `clerk-recommendations` partial → calls `recommendations/similar` → renders one carousel
- **After:** Two Fast Simon widgets:
  1. **"Other Alternatives"** widget → `/upsell_cross_sell_recommendation` with widget ID for "Similar" + `product_id`
  2. **"Cross-Sell"** widget → `/upsell_cross_sell_recommendation` with widget ID for "Complementary" + `product_id`

#### Cart Page
- **Before:** Cart Clerk recommendations template exists but is **NOT currently included** in `cart.html`
- **After:** Two Fast Simon widgets:
  1. **"Also Bought"** widget → `/upsell_cross_sell_recommendation` with widget ID + `cart_token` + `products[]` (cart product IDs)
  2. **"Cross-Sell"** widget → `/upsell_cross_sell_recommendation` with widget ID + `cart_token`

---

## 4. Implementation Plan

### Phase 1: Fast Simon Setup (Dashboard — No Code)

1. **Install Fast Simon app** from BigCommerce App Marketplace
2. **Note credentials** from Settings tab: `store_id` and `UUID`
3. **Create 6 Upsell/Cross-Sell widgets** in the Fast Simon dashboard:

   | Widget Name | Type | Context | Notes |
   |-------------|------|---------|-------|
   | `homepage-top-picks` | Popular / Personalised | Visitor | Homepage "Our Top Picks for You" |
   | `category-best-sellers` | Category Popular | Category ID | For category pages |
   | `pdp-alternatives` | Similar Products | Product ID | PDP "Other Alternatives" |
   | `pdp-cross-sell` | Complementary / Complete the Look | Product ID | PDP "Cross-Sell" |
   | `cart-also-bought` | Frequently Bought Together | Cart products | Cart "Also Bought" |
   | `cart-cross-sell` | Cross-Sell | Cart products | Cart "Best Cross-Sell" |

4. **Note each widget's ID** — these are passed to the API as `widgets_ids[]`

### Phase 2: Theme Config Changes

#### 2a. Add Fast Simon settings to `schema.json`

Replace the Clerk.io section with Fast Simon settings:

```json
{
  "name": "Fast Simon Integration",
  "settings": [
    {
      "type": "checkbox",
      "label": "Enable Fast Simon",
      "id": "fastsimon_enabled",
      "force_reload": true
    },
    {
      "type": "text",
      "label": "Fast Simon Store ID",
      "id": "fastsimon_store_id"
    },
    {
      "type": "text",
      "label": "Fast Simon UUID",
      "id": "fastsimon_uuid"
    },
    {
      "type": "checkbox",
      "label": "Enable Homepage Recommendations",
      "id": "fastsimon_homepage_enabled",
      "force_reload": true
    },
    {
      "type": "text",
      "label": "Homepage Top Picks Widget ID",
      "id": "fastsimon_homepage_widget_id"
    },
    {
      "type": "checkbox",
      "label": "Enable PDP Recommendations",
      "id": "fastsimon_pdp_enabled",
      "force_reload": true
    },
    {
      "type": "text",
      "label": "PDP Alternatives Widget ID",
      "id": "fastsimon_pdp_alternatives_widget_id"
    },
    {
      "type": "text",
      "label": "PDP Cross-Sell Widget ID",
      "id": "fastsimon_pdp_crosssell_widget_id"
    },
    {
      "type": "checkbox",
      "label": "Enable Category Recommendations",
      "id": "fastsimon_category_enabled",
      "force_reload": true
    },
    {
      "type": "text",
      "label": "Category Best Sellers Widget ID",
      "id": "fastsimon_category_widget_id"
    },
    {
      "type": "checkbox",
      "label": "Enable Cart Recommendations",
      "id": "fastsimon_cart_enabled",
      "force_reload": true
    },
    {
      "type": "text",
      "label": "Cart Also-Bought Widget ID",
      "id": "fastsimon_cart_alsobought_widget_id"
    },
    {
      "type": "text",
      "label": "Cart Cross-Sell Widget ID",
      "id": "fastsimon_cart_crosssell_widget_id"
    },
    {
      "type": "checkbox",
      "label": "Enable Fast Simon Search",
      "id": "fastsimon_search_enabled",
      "force_reload": true
    },
    {
      "type": "checkbox",
      "label": "Enable Fast Simon Autocomplete",
      "id": "fastsimon_autocomplete_enabled",
      "force_reload": true
    }
  ]
}
```

#### 2b. Inject context in `layout/base.html`

```handlebars
{{!-- Fast Simon context --}}
{{inject "fastsimonEnabled" theme_settings.fastsimon_enabled}}
{{inject "fastsimonStoreId" theme_settings.fastsimon_store_id}}
{{inject "fastsimonUuid" theme_settings.fastsimon_uuid}}
{{inject "fastsimonHomepageEnabled" theme_settings.fastsimon_homepage_enabled}}
{{inject "fastsimonHomepageWidgetId" theme_settings.fastsimon_homepage_widget_id}}
{{inject "fastsimonPdpEnabled" theme_settings.fastsimon_pdp_enabled}}
{{inject "fastsimonPdpAlternativesWidgetId" theme_settings.fastsimon_pdp_alternatives_widget_id}}
{{inject "fastsimonPdpCrosssellWidgetId" theme_settings.fastsimon_pdp_crosssell_widget_id}}
{{inject "fastsimonCategoryEnabled" theme_settings.fastsimon_category_enabled}}
{{inject "fastsimonCategoryWidgetId" theme_settings.fastsimon_category_widget_id}}
{{inject "fastsimonCartEnabled" theme_settings.fastsimon_cart_enabled}}
{{inject "fastsimonCartAlsoboughtWidgetId" theme_settings.fastsimon_cart_alsobought_widget_id}}
{{inject "fastsimonCartCrosssellWidgetId" theme_settings.fastsimon_cart_crosssell_widget_id}}
```

### Phase 3: JavaScript Module — `fastsimon-recommendations.js`

Create `assets/js/theme/common/fastsimon-recommendations.js`:

**Key architecture decisions:**
- Mirror the existing Clerk module pattern: data-attribute → API call → render native cards
- Use the Fast Simon `/upsell_cross_sell_recommendation` endpoint for all 5 widgets
- Fall back to BigCommerce GraphQL hydration for reviews/inventory data if needed
- Reuse the existing `<template id="clerk-product-card-template">` (rename to generic ID)
- Keep Slick carousel initialization

**API call pattern:**

```javascript
const FASTSIMON_API_URL = 'https://api.fastsimon.com';

async function callFastSimonRecommendations(storeId, uuid, widgetIds, productId, products, cartToken) {
    const url = new URL(`${FASTSIMON_API_URL}/upsell_cross_sell_recommendation`);
    url.searchParams.set('store_id', storeId);
    url.searchParams.set('UUID', uuid);
    
    // Widget IDs as JSON array
    const encodedWidgets = widgetIds.map(id => `"${id}"`).join(',');
    url.searchParams.set('widgets_ids', `[${encodedWidgets}]`);
    
    if (productId) url.searchParams.set('product_id', productId);
    if (products?.length) {
        const encodedProducts = products.map(id => `"${id}"`).join(',');
        url.searchParams.set('products', `[${encodedProducts}]`);
    }
    if (cartToken) url.searchParams.set('cart_token', cartToken);
    
    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Fast Simon API error: ${response.status}`);
    
    return response.json();
}
```

**Response mapping:**

```javascript
// Fast Simon response → card data
function mapFastSimonProduct(item) {
    return {
        id: item.id,
        name: item.l,           // label
        url: item.u,            // URL path
        image: item.t,          // thumbnail
        price: item.p,          // price
        comparePrice: item.p_c, // compare-at price
        sku: item.sku,
        currency: item.c,
    };
}
```

### Phase 4: Template Changes

#### 4a. Create new recommendation partials

Rename/refactor templates from `clerk-*` to `fastsimon-*`:

| Old Template | New Template |
|-------------|-------------|
| `components/category/clerk-recommendations.html` | `components/category/fastsimon-recommendations.html` |
| `components/products/clerk-recommendations.html` | `components/products/fastsimon-recommendations.html` |
| `components/cart/clerk-recommendations.html` | `components/cart/fastsimon-recommendations.html` |
| `components/page/clerk-recommendations.html` | `components/page/fastsimon-recommendations.html` |

**Template pattern (example — PDP with two widgets):**

```handlebars
{{#all theme_settings.fastsimon_enabled theme_settings.fastsimon_pdp_enabled}}
  {{!-- PDP Alternatives --}}
  <section class="c-recommendations c-recommendations--pdp" data-fastsimon-section="pdp-alternatives">
    <h2 class="c-recommendations__heading">Other Alternatives</h2>
    <div class="c-recommendations__container"
         data-fastsimon-container
         data-fastsimon-widget-id="{{theme_settings.fastsimon_pdp_alternatives_widget_id}}"
         data-fastsimon-product-id="{{product.id}}"
         data-fastsimon-limit="8"
         data-fastsimon-cta-text="Shop Now">
      {{> components/common/recommendation-skeleton}}
    </div>
  </section>

  {{!-- PDP Cross-Sell --}}
  <section class="c-recommendations c-recommendations--pdp" data-fastsimon-section="pdp-crosssell">
    <h2 class="c-recommendations__heading">Goes Well With</h2>
    <div class="c-recommendations__container"
         data-fastsimon-container
         data-fastsimon-widget-id="{{theme_settings.fastsimon_pdp_crosssell_widget_id}}"
         data-fastsimon-product-id="{{product.id}}"
         data-fastsimon-limit="8"
         data-fastsimon-cta-text="Add to Cart">
      {{> components/common/recommendation-skeleton}}
    </div>
  </section>
{{/all}}
```

#### 4b. Update page templates

**`templates/pages/product.html`:**
```handlebars
{{!-- Replace: --}}
{{> components/products/clerk-recommendations}}
{{!-- With: --}}
{{> components/products/fastsimon-recommendations}}
```

**`templates/pages/category.html`:**
```handlebars
{{!-- Replace: --}}
{{> components/category/clerk-recommendations heading="Category Best Sellers" ctaText="Buy Now" limit=8}}
{{!-- With: --}}
{{> components/category/fastsimon-recommendations heading="Category Best Sellers" ctaText="Buy Now" limit=8}}
```

**`templates/pages/cart.html`** (ADD — not currently present):
```handlebars
{{!-- Add after cart actions: --}}
{{> components/cart/fastsimon-recommendations}}
```

**`templates/pages/home.html`:**
```handlebars
{{!-- Replace: --}}
{{> components/page/clerk-recommendations heading="Our Top Picks for You" showBrand="false"}}
{{!-- With: --}}
{{> components/page/fastsimon-recommendations heading="Our Top Picks for You" showBrand="false"}}
```

#### 4c. Update `layout/base.html`

- Remove Clerk.io preconnect (`cdn.clerk.io`)
- Remove `clerk-script.html` partial
- Remove `clerk-instant-search.html` partial (if migrating search)
- Add Fast Simon preconnect:
  ```html
  <link rel="preconnect" href="https://api.fastsimon.com" crossorigin>
  <link rel="preconnect" href="https://suggest.fastsimon.com" crossorigin>
  <link rel="preconnect" href="https://ping.fastsimon.com" crossorigin>
  ```

### Phase 5: Shopper Activity Reporting

Fast Simon requires explicit event reporting for its AI to learn. Implement a `fastsimon-events.js` module:

| Event | When | Endpoint |
|-------|------|----------|
| Product View (from search) | 5s after viewing product from search | `/post_load` with `pos`, `id`, `original_search_query` |
| Product View (direct) | 5s after viewing product directly | `/post_load` with `id`, `cart_token` |
| Upsell Widget Viewed | When widget renders/is visible | `/post_load` with `related_sources`, `found_related=1` |
| Upsell Product Clicked | Click on rec product | `/post_load` with `ref=isp_rel_prd`, `pos`, `id`, `from_product` |
| Search Results | Search results appear | `/post_load` with `prev_up_type=4`, `serp` |
| Smart Collection View | Category page load | `/post_load` with `prev_up_type=20`, `original_category_id` |

**User token (`isp_token`):**
```javascript
// Generate via: ping.fastsimon.com/post_load?store_id=X&UUID=Y&callback=cb
// Store in localStorage as 'isp_token'
```

**Session management:**
```javascript
// Session = start timestamp, restart after 30 min inactivity
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
```

### Phase 6: SCSS Updates

- Rename `.c-clerkRecommendations` → `.c-recommendations` (or add alias)
- Rename `.clerk-product-grid` → `.recommendations-product-grid`
- Rename `.clerk-skeleton-grid` → `.recommendations-skeleton-grid`
- Keep all existing styles; only change class names
- Remove Clerk search SCSS (`clerkSearch/_clerk-search.scss`) if migrating search

### Phase 7: Search Migration (Optional / Phase 2)

If also migrating search from Clerk to Fast Simon:

| Feature | Clerk.io | Fast Simon |
|---------|---------|------------|
| Instant search | `<span class="clerk" data-template="@live-search">` | Custom JS → `GET /ac` + `GET suggest.fastsimon.com/` |
| Search page | `<span class="clerk" data-template="@search-page">` | Custom JS → `GET /full_text_search` with facets |
| Facets | Clerk SDK handles | `data.facets` in response, custom rendering |

---

## 5. Fast Simon ↔ Klaviyo Integration

Fast Simon has a **native Klaviyo integration** that:

### What It Does

1. **Intent-Based Flows** — Fast Simon detects high-intent shoppers (searched but didn't buy, browsed specific categories, used filters) and pushes events/segments to Klaviyo
2. **Personalised Email Recommendations** — Klaviyo email templates can include Fast Simon product recommendation blocks powered by the same AI
3. **Audience Sync** — Fast Simon segments (based on search behaviour, category affinity, price sensitivity) sync to Klaviyo lists/segments

### Setup Steps

1. **In Fast Simon Dashboard:**
   - Navigate to **Integrations** → **Klaviyo**
   - Enter your Klaviyo **Public API Key** and **Private API Key**
   - Enable desired data flows:
     - Search activity → Klaviyo events
     - Browse activity → Klaviyo events
     - Recommendation clicks → Klaviyo events
   - Map Fast Simon audience segments to Klaviyo lists

2. **In Klaviyo Dashboard:**
   - Verify Fast Simon events appear under **Metrics** (e.g., `Fast Simon Search`, `Fast Simon Product View`)
   - Create **Flows** triggered by Fast Simon events:
     - **Search Abandonment Flow:** Triggered when a shopper searches but doesn't purchase within X hours
     - **Browse Abandonment Flow:** Triggered by category/product views without conversion
     - **Cross-Sell Follow-Up:** Triggered after purchase, recommending complementary products
   - Use Fast Simon's **Product Recommendation Block** in email templates (if available for BigCommerce) or use Klaviyo's native product feed with Fast Simon data

3. **In Theme (already done):**
   - Klaviyo JS SDK is already loaded via Script Manager (per `docs/KLAVIYO_INTEGRATION.md`)
   - Newsletter form already configured for Klaviyo
   - Fast Simon shopper events (Phase 5 above) will feed into Klaviyo's personalisation engine

### Data Flow

```
Shopper browses site
    ↓
Fast Simon JS tracks events (search, product views, rec clicks)
    ↓
Events sent to Fast Simon via /post_load
    ↓
Fast Simon syncs events + segments to Klaviyo
    ↓
Klaviyo triggers personalised flows (email/SMS)
    ↓
Emails include Fast Simon-powered product recommendations
```

---

## 6. Migration Checklist

### Pre-Migration
- [ ] Install Fast Simon app from BigCommerce marketplace
- [ ] Note `store_id` and `UUID` from Fast Simon dashboard
- [ ] Create 6 recommendation widgets in Fast Simon dashboard (incl. homepage top picks)
- [ ] Note all widget IDs
- [ ] Configure Fast Simon ↔ Klaviyo integration in FS dashboard
- [ ] Let Fast Simon sync product catalog (automatic via BigCommerce app)
- [ ] Wait for Fast Simon AI to train on historical data (1-2 weeks recommended)

### Theme Changes
- [ ] Add Fast Simon settings to `schema.json`
- [ ] Add context injection in `layout/base.html`
- [ ] Create `fastsimon-recommendations.js` module
- [ ] Create `fastsimon-events.js` module for shopper activity
- [ ] Create new recommendation template partials
- [ ] Update page templates (product, category, cart, home)
- [ ] Rename SCSS classes & update stylesheet imports
- [ ] Remove/disable Clerk.io script, templates, SCSS

### Testing
- [ ] Verify recommendations load on all 4 page types (home, category, PDP, cart)
- [ ] Verify homepage shows personalised "Top Picks" widget
- [ ] Verify PDP shows both "Alternatives" and "Cross-Sell" widgets
- [ ] Verify cart shows both "Also Bought" and "Cross-Sell" widgets
- [ ] Verify category shows "Best Sellers" widget
- [ ] Verify shopper events fire correctly (check Fast Simon dashboard analytics)
- [ ] Verify Klaviyo receives Fast Simon events
- [ ] Verify search works (if migrating search)
- [ ] Test on mobile — responsive carousel
- [ ] Test empty states (no recommendations)
- [ ] Test loading states (skeleton loaders)
- [ ] Performance audit — no regressions

### Post-Migration
- [ ] Monitor Fast Simon analytics for 1-2 weeks
- [ ] Compare conversion/AOV metrics with Clerk.io baseline
- [ ] Set up Klaviyo flows triggered by Fast Simon events
- [ ] Create A/B tests in Fast Simon for widget optimisation
- [ ] Remove all Clerk.io code and config once satisfied
- [ ] Cancel Clerk.io subscription

---

## 7. Risk & Rollback

### Risks
1. **AI Cold Start** — Fast Simon needs time to learn. Recommendations may be less relevant initially.
   - **Mitigation:** Run both systems in parallel for 2 weeks; use Clerk as fallback.
2. **Cart token access** — BigCommerce may not expose cart tokens easily in Stencil.
   - **Mitigation:** Use `products[]` parameter (recently viewed/cart product IDs) instead.
3. **Fast Simon product data quality** — FS returns product objects, but they may lack tax-inclusive prices or custom fields.
   - **Mitigation:** Keep GraphQL hydration as optional enrichment step.

### Rollback Plan
- The Clerk.io code should be **disabled via theme settings** (not deleted) during migration
- Set `fastsimon_enabled = false` and `clerk_enabled = true` to instantly revert
- Keep both JS modules in the bundle during transition period

---

## 8. File Change Summary

| Action | File | Notes |
|--------|------|-------|
| **CREATE** | `assets/js/theme/common/fastsimon-recommendations.js` | Core recommendation module |
| **CREATE** | `assets/js/theme/common/fastsimon-events.js` | Shopper activity reporting |
| **CREATE** | `templates/components/products/fastsimon-recommendations.html` | PDP: 2 widgets (alternatives + cross-sell) |
| **CREATE** | `templates/components/category/fastsimon-recommendations.html` | Category best sellers widget |
| **CREATE** | `templates/components/cart/fastsimon-recommendations.html` | Cart: 2 widgets (also-bought + cross-sell) |
| **CREATE** | `templates/components/page/fastsimon-recommendations.html` | Homepage recommendations |
| **CREATE** | `templates/components/common/recommendation-skeleton.html` | Shared skeleton loader partial |
| **MODIFY** | `schema.json` | Add Fast Simon settings section |
| **MODIFY** | `templates/layout/base.html` | Swap preconnects, context injection |
| **MODIFY** | `templates/pages/product.html` | Swap clerk → fastsimon partial |
| **MODIFY** | `templates/pages/category.html` | Swap clerk → fastsimon partial |
| **MODIFY** | `templates/pages/cart.html` | **Add** fastsimon recommendations (currently missing) |
| **MODIFY** | `templates/pages/home.html` | Swap clerk → fastsimon partial |
| **MODIFY** | `assets/js/theme/global.js` | Import + init fastsimon module |
| **MODIFY** | `assets/scss/components/_components.scss` | Add fastsimon SCSS import |
| **DEPRECATE** | `assets/js/theme/common/clerk-recommendations.js` | Keep until rollback period ends |
| **DEPRECATE** | All `clerk-*.html` templates | Keep until rollback period ends |
| **DEPRECATE** | `assets/scss/components/stencil/clerkRecommendations/` | Keep until rollback period ends |
| **DEPRECATE** | `assets/scss/components/stencil/clerkSearch/` | Keep until rollback period ends |

---

## 9. Timeline Estimate

| Phase | Duration | Dependencies |
|-------|----------|-------------|
| Phase 1: Dashboard setup | 1 day | Fast Simon account + BC app install |
| Phase 2: Theme config | 0.5 day | Widget IDs from Phase 1 |
| Phase 3: JS module | 2-3 days | API testing with real credentials |
| Phase 4: Templates | 1 day | JS module complete |
| Phase 5: Event tracking | 1-2 days | Can run in parallel with Phase 4 |
| Phase 6: SCSS | 0.5 day | Templates finalised |
| Phase 7: Search (if needed) | 3-5 days | Optional, can be Phase 2 project |
| Testing & QA | 2-3 days | All phases complete |
| Parallel run period | 1-2 weeks | Both systems running |
| **Total** | **~2-3 weeks** | Including parallel run |
