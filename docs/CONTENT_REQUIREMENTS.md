# Partyworld 2025 Theme Content Requirements

This document lists all content required to fully populate the Partyworld 2025 theme, along with instructions for how to add and customize this content.

## Table of Contents

1. [Theme Settings (Theme Editor)](#theme-settings-theme-editor)
2. [Homepage Content](#homepage-content)
3. [Product Catalog](#product-catalog)
4. [Categories and Navigation](#categories-and-navigation)
5. [Blog Content](#blog-content)
6. [Branding Assets](#branding-assets)
7. [Store Information](#store-information)
8. [Customization Guide](#customization-guide)

---

## Theme Settings (Theme Editor)

The theme uses BigCommerce's Theme Editor for easy customization. Access via: **Storefront** → **Themes** → **Customize**

### Global Settings

#### Colors and Background
- **Banner Background** (`color-primary`): Primary brand color - Default: #D30006
- **Page Background** (`body-bg`): Main background - Default: #ffffff
- **Common Dark Background** (`container-fill-dark`): Section backgrounds - Default: #e5e5e5
- **Modal Overlay Background** (`overlay-backgroundColor`): Default: #333333
- **Alert Popup Box Background** (`alert-backgroundColor`): Default: #ffffff
- **Alert Popup Text Color** (`alert-color`): Default: #333333
- **Horizontal Line** (`container-border-global-color-base`): Default: #e5e5e5

#### Typography
**Body Text:**
- **Font Family** (`body-font`): Choose from Karla, Roboto, Source Sans Pro, or Inter
  - Default: Google_Inter_600
- **Font Size** (`fontSize-root`): 12px, 13px, 14px (default), 16px, or 18px
- **Text Color** (`color-textBase`): Default: #333333
- **Text Hover Color** (`color-textBase--hover`): Default: #757575
- **Secondary Text Color** (`color-textSecondary`): Default: #757575
- **Link Color** (`color-textLink`): Default: #333333

**Headings:**
- **Font Family** (`headings-font`): Choose from Montserrat, Open Sans, Roboto, Volkhov, or Londrina Solid
  - Default: Google_Londrina+Solid_400
- **H1 Size** (`fontSize-h1`): 24px to 36px - Default: 28px
- **H2 Size** (`fontSize-h2`): 21px to 33px - Default: 25px
- **H3 Size** (`fontSize-h3`): 18px to 30px - Default: 22px
- **H4 Size** (`fontSize-h4`): 16px to 28px - Default: 20px
- **H5 Size** (`fontSize-h5`): 11px to 23px - Default: 15px
- **H6 Size** (`fontSize-h6`): 9px to 21px - Default: 13px
- **Heading Text Color** (`color-textHeading`): Default: #444444

#### Loading Indicators
- **Page Loading Bar** (`pace-progress-backgroundColor`): Default: #999999
- **Spinner Light Half** (`spinner-borderColor-light`): Default: #ffffff
- **Spinner Dark Half** (`spinner-borderColor-dark`): Default: #999999
- **Modal Loading Background** (`loadingOverlay-backgroundColor`): Default: #ffffff
- **Product Thumbnail Loading Background** (`container-fill-base`): Default: #ffffff

#### Image Loading
- **Lazyloading Mode** (`lazyload_mode`): Choose from:
  - `lazyload`: Standard lazy loading
  - `lazyload+lqip`: Lazy load with low-quality image placeholders (default)
  - `disabled`: Load all images immediately

#### Form Fields
- **Label Text Color** (`form-label-font-color`): Default: #666666
- **Field Text Color** (`input-font-color`): Default: #666666
- **Field Background** (`input-bg-color`): Default: #ffffff
- **Field Background Disabled** (`input-disabled-bg`): Default: #ffffff
- **Field Border** (`input-border-color`): Default: #cccccc
- **Field Border Active** (`input-border-color-active`): Default: #D30006

### Header and Footer Settings

#### Header
- **Header Background** (`header-backgroundColor`): Default: #ffffff

#### Logo
- **Logo Position** (`logo-position`): Right, Center (default), or Left
- **Logo Image Size** (`logo_size`): 
  - Recommended: 250x100 (default)
  - Original: Use uploaded image dimensions
  - Custom: Specify dimensions
- **Logo Font Size** (`logo_fontSize`): 14px to 74px - Default: 28px (if using text logo)
- **Logo Text Color** (`storeName-color`): Default: #333333

#### Utility Navigation
- **Channel Selector** (`show_channels`): Show/hide channel selector - Default: false
- **Text Color** (`navUser-color`): Default: #D30006
- **Text Hover Color** (`navUser-color-hover`): Default: #ffffff
- **Cart Dropdown Background** (`navUser-dropdown-backgroundColor`): Default: #ffffff
- **Cart Dropdown Border** (`navUser-dropdown-borderColor`): Default: #cccccc
- **Cart Counter Background** (`navUser-indicator-backgroundColor`): Default: #333333

#### Main Navigation
- **Hide Links to Web Pages** (`hide_content_navigation`): Default: false
- **Text Color** (`navPages-color`): Default: #ffffff
- **Text Hover Color** (`navPages-color-hover`): Default: #ffffff
- **Dropdown Menu Background** (`navPages-subMenu-backgroundColor`): Default: #f5f5f5
- **Dropdown Menu Border** (`navPages-subMenu-separatorColor`): Default: #cccccc
- **Dropdown Display Mode** (`navigation_design`): 
  - `simple`: Simple menu display
  - `alternate`: Alternate max menu display depth
- **Quick Search Background** (`dropdown--quickSearch-backgroundColor`): Default: #f5f5f5

#### Social Media Icons
- **Show in Header** (`social_icon_placement_top`): Default: false
- **Footer Placement** (`social_icon_placement_bottom`): 
  - `bottom_none`: None (default)
  - `bottom_right`: Right
  - `bottom_left`: Left
- **Icon Color** (`icon-color`): Default: #333333
- **Icon Hover Color** (`icon-color-hover`): Default: #D30006

**Note:** Social accounts must be configured in Store Settings → Social Media Links

#### Footer
- **Footer Background** (`footer-backgroundColor`): Default: #ffffff
- **Show Powered By BigCommerce** (`show_powered_by`): Default: true
- **Show Brands in Footer** (`shop_by_brand_show_footer`): Default: true
- **Show Copyright Footer** (`show_copyright_footer`): Default: true

#### Payment Icons
Configure which payment method icons to display:
- American Express (`show_accept_amex`)
- Discover (`show_accept_discover`)
- Mastercard (`show_accept_mastercard`)
- PayPal (`show_accept_paypal`)
- Visa (`show_accept_visa`)
- Amazon Pay (`show_accept_amazonpay`)
- Google Pay (`show_accept_googlepay`)
- Klarna (`show_accept_klarna`)

### Homepage Settings

#### Carousel
- **Show Carousel** (`homepage_show_carousel`): Default: true
- **Show Arrows** (`homepage_show_carousel_arrows`): Default: true
- **Show Play/Pause Button** (`homepage_show_carousel_play_pause_button`): Default: true
- **Allow Image to Stretch** (`homepage_stretch_carousel_images`): Default: false

**Carousel Colors:**
- Content Background (`carousel-bgColor`): Default: #ffffff
- Header Text (`carousel-title-color`): Default: #333333
- Description Text (`carousel-description-color`): Default: #333333
- Indicator (`carousel-dot-color`): Default: #cccccc
- Indicator Active (`carousel-dot-color-active`): Default: #D30006
- Indicator Background (`carousel-dot-bgColor`): Default: #ffffff
- Arrow (`carousel-arrow-color`): Default: #333333
- Arrow Background (`carousel-arrow-bgColor`): Default: #ffffff
- Arrow Border (`carousel-arrow-borderColor`): Default: #ffffff
- Play/Pause Button Text (`carousel-play-pause-button-textColor`): Default: #8f8f8f
- Play/Pause Button Background (`carousel-play-pause-button-bgColor`): Default: #ffffff
- Play/Pause Button Border (`carousel-play-pause-button-borderColor`): Default: #ffffff

#### Hero Banner
Editable via Theme Editor settings:
- **Hero Heading** (`homepage_hero_heading`): Main headline
- **Hero Subheading** (`homepage_hero_subheading`): Supporting text
- **Hero CTA Text** (`homepage_hero_cta_text`): Button label
- **Hero CTA URL** (`homepage_hero_cta_url`): Button destination
- **Hero Background Image** (`homepage_hero_image`): Full-width background image
  - Default: assets/img/coming-soon.jpg

#### Products
- **Number of Featured Products** (`homepage_featured_products_count`): 0-12 - Default: 4
- **Number of Most Popular Products** (`homepage_top_products_count`): 0-12 - Default: 4
- **Number of New Products** (`homepage_new_products_count`): 0-12 - Default: 5

### Product Settings

#### Product Sale Badges
- **Badge Style** (`product_sale_badges`):
  - `none`: No badges (default)
  - `topleft`: Top left corner
  - `sash`: Diagonal sash
  - `burst`: Burst/star shape
- **Badge Label** (`pdp_sale_badge_label`): Custom text
- **Badge Colors:**
  - Text Color (`color_text_product_sale_badges`): Default: #ffffff
  - Badge Color (`color_badge_product_sale_badges`): Default: #007dc6
  - Hover Color (`color_hover_product_sale_badges`): Default: #000000

#### Product Sold Out Badges
- **Badge Style** (`product_sold_out_badges`): Same options as sale badges
- **Badge Label** (`pdp_sold_out_label`): Custom text
- **Badge Colors:** Same settings as sale badges

#### Display Settings
- **Show Quick View Button** (`show_product_quick_view`): Default: true
- **Show Product Description Tabs** (`show_product_details_tabs`): Default: true
- **Show Custom Fields in Tabs** (`show_custom_fields_tabs`): Default: false
- **Custom Fields Tab Label** (`pdp-custom-fields-tab-label`): Custom label text
- **Show Product Weight** (`show_product_weight`): Default: true
- **Show Product Dimensions** (`show_product_dimensions`): Default: false
- **Show Product Swatch Names** (`show_product_swatch_names`): Default: true
- **Show Shop By Price** (`shop_by_price_visibility`): Default: true
- **Show Product Reviews** (`show_product_reviews`): Default: true
- **Number of Reviews** (`productpage_reviews_count`): 1-12 - Default: 9
- **Show Quick Payment Buttons** (`show_quick_payment_buttons`): Default: true

#### Products Per Page
- **Category Page** (`categorypage_products_per_page`): 6-20 - Default: 12
- **Brand Page** (`brandpage_products_per_page`): 6-20 - Default: 12
- **Search Result Page** (`searchpage_products_per_page`): 6-20 - Default: 12
- **Related Products** (`productpage_related_products_count`): 0-12 - Default: 10
- **Customers Also Viewed** (`productpage_similar_by_views_count`): 0-12 - Default: 10

#### Product Cards
- **Header Text Color** (`card-title-color`): Default: #333333
- **Header Text Hover Color** (`card-title-color-hover`): Default: #757575

### Button Settings

#### Primary Action Button
- **Text Color** (`button--primary-color`): Default: #ffffff
- **Text Hover Color** (`button--primary-colorHover`): Default: #ffffff
- **Text Active Color** (`button--primary-colorActive`): Default: #ffffff
- **Background** (`button--primary-backgroundColor`): Default: #D30006
- **Background Hover** (`button--primary-backgroundColorHover`): Default: #A00005
- **Background Active** (`button--primary-backgroundColorActive`): Default: #6D0003

#### Secondary Action Button
- **Text Color** (`button--default-color`): Default: #666666
- **Text Hover Color** (`button--default-colorHover`): Default: #333333
- **Text Active Color** (`button--default-colorActive`): Default: #000000
- **Border** (`button--default-borderColor`): Default: #8F8F8F
- **Border Hover** (`button--default-borderColorHover`): Default: #474747
- **Border Active** (`button--default-borderColorActive`): Default: #757575

#### Disabled Button
- **Text Color** (`button--disabled-color`): Default: #ffffff
- **Background** (`button--disabled-backgroundColor`): Default: #cccccc
- **Border** (`button--disabled-borderColor`): Default: transparent

### Page Settings
- **Hide Breadcrumbs** (`hide_breadcrumbs`): Default: false
- **Hide Page Heading** (`hide_page_heading`): Default: false
- **Hide Category Page Heading** (`hide_category_page_heading`): Default: false
- **Hide Blog Page Heading** (`hide_blog_page_heading`): Default: false
- **Hide Contact Us Page Heading** (`hide_contact_us_page_heading`): Default: false

### Product Display
- **Display Style** (`product_list_display_mode`):
  - `grid`: Show products in a grid (default)
  - `list`: Show products in a list

### Blog Settings
- **Size of Images** (`blog_size`):
  - 190x250: Optimized for theme (default)
  - Custom: Specify dimensions

### Pricing
- **Show Price Ranges for Products** (`price_ranges`): Default: true

---

## Homepage Content

The homepage is built with multiple sections that require various types of content:

### 1. Hero Banner
**Location:** Top of homepage, below navigation  
**Required Content:**
- Background image: 1920x800px minimum, hero banner background
- Heading: Main headline (e.g., "Welcome to Partyworld")
- Subheading: Supporting text (e.g., "Your one-stop party shop")
- CTA button text: (e.g., "Shop Now")
- CTA button URL: Link destination

**How to Add:**
1. Go to **Storefront** → **Themes** → **Customize**
2. Find **HomePage** section
3. Fill in Hero Banner fields:
   - Hero Heading
   - Hero Subheading
   - Hero CTA Text
   - Hero CTA URL
   - Hero Background Image

### 2. Theme Grid Section
**Location:** Below hero banner  
**Data Source:** Automatically populated from category tree  
**Required:**
- Create a top-level category called "Themes"
- Add at least 3 child categories under "Themes" (e.g., "Birthday", "Wedding", "Halloween")
- Each category needs:
  - Category image (square format recommended: 500x500px)
  - Category name
  - Category description (optional)

**How to Add:**
1. Go to **Products** → **Categories**
2. Create category: "Themes"
3. Add child categories with images

### 3. Celebrate/Occasions Grid
**Location:** Below theme grid  
**Data Source:** Automatically populated from category tree  
**Required:**
- Create a top-level category called "Occasions"
- Add at least 5 child categories (e.g., "Baby Shower", "Graduation", "Retirement", "Anniversary", "New Year")
- Each category needs:
  - Category image (500x500px recommended)
  - Category name
  - Category description (optional)

**How to Add:** Same as Theme Grid, but create "Occasions" category

### 4. Featured Products
**Location:** Mid-page section  
**Required Content:**
- Mark 4-12 products as "Featured" in your product catalog
- Each product needs:
  - Product image (500x659px recommended)
  - Product name
  - Price
  - Short description

**How to Add:**
1. Go to **Products** → **View**
2. Select products to feature
3. Click bulk action "Set as Featured"
4. Configure count in Theme Editor → HomePage → Number of Featured Products

### 5. Top Sellers
**Location:** Below featured products  
**Data Source:** Automatically based on sales data  
**Note:** Will populate automatically once sales are recorded

### 6. New Products
**Location:** Below top sellers  
**Data Source:** Automatically shows newest products  
**Required:** Add products to your catalog (newest will display automatically)

### 7. Customer Reviews Section
**Location:** Below product sections  
**Required Content:** This section uses a widget region for flexibility

**Option 1: Use Built-in Reviews**
- Enable product reviews in BigCommerce
- Collect customer reviews on products
- Display automatically

**Option 2: Use Custom Content (via Page Builder)**
1. Go to **Storefront** → **Web Pages** → Edit homepage
2. Find the `home_customer_reviews` widget region
3. Add custom HTML or use Page Builder widgets
4. Create testimonial cards with:
   - Customer name
   - Star rating (1-5)
   - Review text

**Example Review Structure:**
```
{
  "author": "Sarah M.",
  "rating": 5,
  "text": "Amazing party supplies! The quality exceeded my expectations and delivery was super fast."
}
```

### 8. Brand Intro & Promises Section
**Location:** Below customer reviews  
**Required Content:**

**Brand Introduction:**
- Heading (e.g., "Welcome to Partyworld")
- Introduction text: 2-3 paragraphs about your brand story, mission, values

**Brand Promises:**
- Promises heading (e.g., "Why Choose Us?")
- 4-6 promise items, each with:
  - Icon name (from available icon set)
  - Promise text

**Available Icons:**
- `checkmark` - Quality guarantee
- `truck` - Fast shipping
- `star` - Best prices
- `gift` - Special offers
- `support` - Customer service
- `returns` - Easy returns
- `secure` - Secure checkout
- `eco` - Eco-friendly

**How to Add:** Currently requires editing theme files or adding via Page Builder widget

**Example Promises:**
```
- Fast & Free Shipping: Orders over $50 ship free nationwide
- Quality Guaranteed: 100% satisfaction or your money back
- Best Price Promise: We match competitor prices
- Expert Support: Party planning help available 7 days a week
```

### 9. Blog Teaser Section
**Location:** Bottom of homepage  
**Data Source:** Automatically pulls from blog posts  
**Required:**
- Create 3+ blog posts
- Each blog post needs:
  - Featured image (300x200px or larger)
  - Title
  - Summary/excerpt (first 120 characters shown)
  - Publication date

**How to Add:**
1. Go to **Marketing** → **Blog**
2. Create new blog posts
3. Add featured images to each post
4. Posts will automatically appear in homepage blog teaser

---

## Product Catalog

### Required Product Information

For each product, you need:

#### Essential Fields
- **Product Name**: Clear, descriptive title
- **SKU**: Unique product identifier
- **Price**: Regular price
- **Sale Price** (optional): Discounted price
- **Product Images**:
  - Main image: 500x659px (vertical orientation)
  - Additional images: Same dimensions
  - Recommended: 3-5 images per product
  - Zoom images: 1280x1280px for zoom functionality
- **Product Description**: Full HTML description
- **Search Keywords**: Help customers find products
- **Sort Order**: Control display order

#### Product Options
- **Variants**: Size, color, quantity packages
- **SKU per variant**: Unique SKU for inventory tracking

#### Inventory
- **Stock Level**: Current inventory
- **Low Stock Level**: When to show "low stock" warning
- **Out of Stock Message**: Custom message when unavailable

#### Product Details
- **Weight**: For shipping calculations
- **Dimensions**: Length, width, height
- **Brand**: Product manufacturer/brand
- **Categories**: Assign to 1+ categories
- **Condition**: New, used, refurbished

#### Images Sizes
Configure in Theme Settings:
- **Product Gallery** (`gallery_size`): 300x300
- **Product Main Image** (`productgallery_size`): 500x659
- **Product Thumbnail** (`productthumb_size`): 100x100
- **Zoom Image** (`zoom_size`): 1280x1280

### Product Badges

#### Sale Badges
Configure in Theme Editor → Products → Product Sale Badges:
- Choose badge style (none, top left, sash, burst)
- Customize badge label text
- Set badge colors

Products will automatically show sale badges when:
- Sale price is set and less than regular price
- Sale dates are active (if configured)

#### Sold Out Badges
Configure similarly to sale badges
- Shows automatically when inventory = 0
- Can customize label and styling

### Custom Fields

Add custom product information:
1. Edit product
2. Go to **Custom Fields** tab
3. Add name/value pairs

Examples:
- Material: "100% Biodegradable Paper"
- Pack Size: "20 pieces"
- Dimensions: "9 inch plates"
- Theme: "Superhero"

**Display Options:**
- Show in separate tab: Enable `show_custom_fields_tabs`
- Set custom tab label: `pdp-custom-fields-tab-label`

### Product Videos

Add product videos:
1. Edit product
2. Go to **Videos** tab
3. Add YouTube or Vimeo URL
4. Configure up to 8 videos (`productpage_videos_count`)

### Product Reviews

Enable product reviews:
1. **Settings** → **Reviews**
2. Enable product reviews
3. Choose review provider (built-in or third-party)
4. Set moderation preferences

Configure display:
- Show reviews: `show_product_reviews`
- Number of reviews per page: `productpage_reviews_count`

---

## Categories and Navigation

### Category Requirements

#### Essential Category Information
- **Category Name**: Clear, descriptive
- **Category URL**: Auto-generated, customizable
- **Category Description**: HTML description shown on category pages
- **Category Image**: 
  - Card view: 500x500px (square)
  - Banner: 1200x400px (wide)
- **Meta Description**: For SEO
- **Page Title**: Custom browser title
- **Search Keywords**: Help customers find category

#### Category Structure

**Primary Navigation Structure:**
```
Themes (Parent Category)
├── Birthday
├── Wedding  
├── Halloween
├── Christmas
└── Baby Shower

Occasions (Parent Category)
├── Graduation
├── Retirement
├── Anniversary
└── New Year

Products by Type (Parent Category)
├── Balloons
├── Tableware
├── Decorations
└── Party Favors
```

#### Category Tree Configuration

The theme displays up to:
- **Tree Depth**: 2 levels (configured in home.html front matter)
- **Limit**: 200 categories

To modify:
1. Edit `templates/pages/home.html`
2. Update front matter:
```yaml
categories:
    tree:
        limit: 200
        depth: 2
```

### Navigation Menu

#### Main Navigation
Automatically generated from category tree:
- Shows top-level categories
- Dropdowns show subcategories
- Configure depth: `navigation_design` setting
  - `simple`: Single depth dropdown
  - `alternate`: Multi-level megamenu

#### Custom Navigation Links
Add custom links via BigCommerce:
1. **Storefront** → **Menus**
2. Edit main navigation
3. Add custom links alongside category links

Options:
- Web pages
- Custom URLs
- Category pages
- Brand pages

### Shop by Brand

Enable brand navigation:
1. Assign products to brands
2. Enable `shop_by_brand_show_footer` in Theme Editor
3. Brands appear in footer automatically
4. Brand limit: 10 (configurable in config.json)

---

## Blog Content

### Blog Structure

#### Required Blog Posts
Minimum 3 blog posts for homepage teaser

#### Blog Post Requirements

**Essential Fields:**
- **Title**: Post headline
- **Post Body**: Full HTML content
- **Summary**: First 120-150 characters (auto-excerpt for homepage)
- **Author**: Author name
- **Published Date**: Publication date
- **Thumbnail Image**: 
  - Homepage teaser: 300x200px
  - Blog page: 190x250px (configurable via `blog_size`)
- **Tags**: For organization and filtering
- **URL**: Custom URL path

#### Featured Image
- **Size**: 300x200px minimum for blog teaser cards
- **Format**: JPG or PNG
- **Aspect ratio**: 3:2 recommended

#### Blog Settings

Configure in Theme Editor:
- **Hide Blog Page Heading** (`hide_blog_page_heading`): Show/hide page title
- **Blog Image Size** (`blog_size`): Image dimensions

Configure in Front Matter:
- **Homepage Posts Count** (`homepage_blog_posts_count`): Number shown on homepage (default: 3)

### Blog Categories

Organize posts with categories:
1. **Marketing** → **Blog** → **Categories**
2. Create blog categories
3. Assign posts to categories

### Blog Tags

Add tags to posts for:
- Related post suggestions
- Tag-based filtering
- Content organization

---

## Branding Assets

### Logo

#### Logo Image Requirements
- **Recommended Size**: 250x100px (configurable)
- **Format**: PNG with transparency preferred
- **File Size**: Under 100KB for performance
- **Variations Needed**:
  - Standard logo (color)
  - Inverse logo (if header has dark background)

#### Logo Upload
1. **Storefront** → **Logos & Favicons**
2. Upload logo image
3. Configure size in Theme Editor:
   - Logo Position: Left, Center, Right
   - Logo Image Size: 250x100px or custom

#### Text Logo
Alternative to image logo:
- Uses store name as text
- Configure font size: 14px to 74px
- Set color: `storeName-color`

### Favicon

#### Favicon Requirements
- **Size**: 32x32px (appears in browser tabs)
- **Format**: PNG or ICO
- **Design**: Simple, recognizable at small size

#### Upload
**Storefront** → **Logos & Favicons** → Upload favicon

### Social Media Images

#### Open Graph / Social Sharing
- **Size**: 1200x630px
- **Purpose**: Appears when site is shared on Facebook, Twitter, LinkedIn
- **Content**: Logo + tagline or promotional image

Upload via:
**Storefront** → **SEO** → Open Graph Sharing Image

### Icon Sprite

The theme uses SVG sprite for icons:
- **Location**: `assets/img/icon-sprite.svg`
- **Available Icons**: View in `assets/icons/` directory

#### Adding Custom Icons
1. Add SVG file to `assets/icons/`
2. Run `grunt svgstore` to regenerate sprite
3. Use in templates: `<use href="#icon-filename">`

**Available Icons Include:**
- Social media (facebook, twitter, instagram, pinterest, youtube)
- E-commerce (cart, wishlist, account, search)
- UI elements (checkmark, star, arrow, close)
- Shipping (truck, box)
- Payments (credit card, paypal)

---

## Store Information

### Store Profile

Complete your store profile:
**Settings** → **Store Profile**

Required information:
- **Store Name**: Your business name
- **Store Address**: Physical address
- **Store Phone**: Contact number
- **Store Email**: Customer service email

### Store Timezone & Currency

Configure:
- **Timezone**: For order timestamps
- **Currency**: Display currency
- **Currency Location**: Symbol placement

### Social Media Links

Add social media URLs:
**Settings** → **Social Media**

Supported platforms:
- Facebook
- Twitter
- Instagram
- Pinterest
- YouTube
- LinkedIn
- Google+

**Theme Display:**
- Header: Enable via `social_icon_placement_top`
- Footer: Enable via `social_icon_placement_bottom`

### Contact Information

Set up contact page:
1. Create "Contact Us" web page
2. Enable contact form
3. Configure:
   - Email recipient
   - Success message
   - Form fields

### Shipping & Returns

Configure shipping information:
1. **Settings** → **Shipping**
2. Set up shipping zones
3. Configure shipping methods
4. Set shipping rates

Add return policy:
1. **Settings** → **Returns**
2. Enable returns
3. Set return window
4. Create return policy page

### Payment Methods

Enable payment methods:
1. **Settings** → **Payments**
2. Enable payment providers
3. Configure payment gateway credentials

Display payment icons in footer:
- Configure via Theme Editor → Header & Footer → Payment Icons
- Enable specific payment methods to display logos

### Privacy Policy & Terms

Create required legal pages:
1. **Storefront** → **Web Pages**
2. Create pages:
   - Privacy Policy
   - Terms & Conditions
   - Shipping Policy
   - Return Policy

Link in footer automatically or via custom footer menu.

---

## Customization Guide

### How to Customize Theme Settings

#### Using Theme Editor (No Code)

1. **Access Theme Editor:**
   - Go to **Storefront** → **Themes**
   - Find "Partyworld 2025"
   - Click **Customize**

2. **Navigate Sections:**
   - **Global**: Colors, typography, forms
   - **Header and Footer**: Navigation, logo, social icons
   - **HomePage**: Hero, carousel, products
   - **Products**: Badges, display settings
   - **Buttons & Icons**: Button styles, icon colors
   - **Checkout Page**: Optimized checkout styling

3. **Make Changes:**
   - Click on any setting
   - Modify value (color, size, text, etc.)
   - Preview changes in real-time
   - Click **Save** when satisfied

4. **Publish Changes:**
   - Click **Publish** to make changes live

#### Color Customization

**Brand Colors:**
1. Theme Editor → Global → Background and Lines
2. Set primary brand color: `color-primary`
3. System auto-generates shades:
   - `color-primaryDark`
   - `color-primaryDarker`
   - `color-primaryLight`

**Best Practice:**
- Choose 1-2 primary brand colors
- Use theme-generated shades for consistency
- Test contrast for accessibility

#### Typography Customization

**Changing Fonts:**
1. Theme Editor → Global → Body Text & Headings
2. Choose font family from available Google Fonts
3. Set font sizes for hierarchy
4. Preview across different pages

**Font Pairings Included:**
- **Modern:** Inter (body) + Londrina Solid (headings)
- **Classic:** Source Sans Pro (body) + Montserrat (headings)
- **Friendly:** Karla (body) + Open Sans (headings)

#### Button Customization

**Styling Buttons:**
1. Theme Editor → Buttons & Icons
2. Customize button colors:
   - Primary button: Main CTA color
   - Secondary button: Alternative actions
   - Disabled button: Inactive state
3. Set hover and active states

**Button Classes:**
- `.button.button--primary`: Main action buttons
- `.button.button--default`: Secondary buttons
- `.button.button--disabled`: Disabled state

### Using Widget Regions (Page Builder)

#### Available Widget Regions

Homepage regions:
- `home_below_menu`: Below navigation, above hero
- `home_below_carousel`: Below hero/carousel
- `home_below_category_grid`: After category grid
- `home_below_featured_products`: After featured products
- `home_below_occasion_grid`: After occasion grid
- `home_below_top_products`: After top sellers
- `home_below_new_products`: After new products
- `home_customer_reviews`: Customer reviews section
- `home_intro_promise`: Brand intro section
- `home_blog_teaser`: Blog teaser section

#### Adding Widget Content

1. **Access Page Builder:**
   - **Storefront** → **Web Pages**
   - Edit homepage or create new page
   - Click **Page Builder** button

2. **Add Widgets:**
   - Drag widgets into regions
   - Available widgets:
     - Text/HTML
     - Images
     - Buttons
     - Product Lists
     - Carousels
     - Custom HTML

3. **Configure Widgets:**
   - Click widget to edit
   - Modify content, styling
   - Preview changes

4. **Save and Publish:**
   - Save draft or publish immediately

### Advanced Customization (Code)

#### Template Files

Key template locations:
- **Homepage**: `templates/pages/home.html`
- **Product Page**: `templates/pages/product.html`
- **Category Page**: `templates/pages/category.html`
- **Components**: `templates/components/`

#### Custom Components

Create custom components:
1. Add new file in `templates/components/page/`
2. Use Handlebars syntax
3. Include in page template:
   ```handlebars
   {{> components/page/your-component}}
   ```

#### SCSS Customization

Style locations:
- **Components**: `assets/scss/components/`
- **Settings**: `assets/scss/settings/`
- **Custom**: `assets/scss/custom/`

**Important Rules:**
- Use `stencilColor()` for theme-editable colors
- Use existing SCSS variables (`$color-*`, `$spacing-*`, `$fontSize-*`)
- Follow BEM naming: `.c-component__element--modifier`
- Never use `!important`

#### Icon Usage

Use SVG icons:
```html
<svg aria-hidden="true" focusable="false">
  <use href="{{cdn 'assets/img/icon-sprite.svg'}}#icon-name"></use>
</svg>
```

### Theme Variations

The theme includes variations (if configured):
- **Light**: Default clean design
- **Bold**: High contrast, bold typography
- **Warm**: Warm color palette

Switch variations:
**Storefront** → **Themes** → Select variation → **Apply**

### Testing Your Customizations

#### Before Publishing

1. **Preview Changes:**
   - Use Theme Editor preview
   - Test on multiple screen sizes
   - Check mobile responsiveness

2. **Test Functionality:**
   - Add to cart
   - Checkout process
   - Search functionality
   - Navigation menus
   - Forms submission

3. **Check Performance:**
   - Page load times
   - Image optimization
   - Mobile speed

4. **Accessibility:**
   - Color contrast
   - Keyboard navigation
   - Screen reader compatibility

#### Browser Testing

Test on:
- Chrome
- Safari
- Firefox
- Edge
- Mobile browsers (iOS Safari, Chrome Mobile)

#### Device Testing

Test responsive design on:
- Desktop (1920px+)
- Laptop (1366px)
- Tablet (768px-1024px)
- Mobile (375px-414px)

### Getting Help

#### Documentation
- [BigCommerce Stencil Docs](https://developer.bigcommerce.com/stencil-docs)
- [Theme Editor Guide](https://support.bigcommerce.com/s/article/Stencil-Themes)
- [Page Builder Guide](https://support.bigcommerce.com/s/article/Page-Builder)

#### Support Resources
- BigCommerce Support: https://support.bigcommerce.com
- Developer Community: https://developer.bigcommerce.com/community
- Theme Documentation: See project README.md

#### Design System
- See `docs/design-system/design_system_rules.md` for component guidelines
- See `docs/SVG_STYLING.md` for icon usage
- See `docs/PLAYWRIGHT_TESTING.md` for testing guidelines

---

## Quick Start Checklist

### Initial Setup (Week 1)

- [ ] Upload logo and favicon
- [ ] Configure brand colors in Theme Editor
- [ ] Set up typography (fonts and sizes)
- [ ] Configure store profile information
- [ ] Add social media links
- [ ] Set up payment methods
- [ ] Configure shipping zones and methods

### Content Creation (Week 2-3)

- [ ] Create category structure (Themes, Occasions, Product Types)
- [ ] Add category images (500x500px)
- [ ] Upload products (minimum 20 for testing)
  - [ ] Product images (500x659px)
  - [ ] Product descriptions
  - [ ] Pricing and variants
  - [ ] Inventory levels
- [ ] Mark featured products
- [ ] Create hero banner content
  - [ ] Background image (1920x800px)
  - [ ] Headline and subheadline
  - [ ] CTA button text and URL

### Homepage Content (Week 3-4)

- [ ] Configure hero banner settings
- [ ] Verify theme grid displays (from Themes category)
- [ ] Verify occasion grid displays (from Occasions category)
- [ ] Add customer reviews (via widget or Page Builder)
- [ ] Write brand intro text
- [ ] Create brand promises list
- [ ] Create 3+ blog posts with featured images

### Navigation & Footer (Week 4)

- [ ] Organize main navigation menu
- [ ] Create custom navigation links (if needed)
- [ ] Configure footer content
- [ ] Add payment method icons
- [ ] Create legal pages (Privacy, Terms, Returns)
- [ ] Configure social media icons in header/footer

### Testing & Launch (Week 5)

- [ ] Test on desktop, tablet, mobile
- [ ] Test checkout process end-to-end
- [ ] Verify all links work
- [ ] Check page load speed
- [ ] Test contact forms
- [ ] Review SEO settings (meta descriptions, page titles)
- [ ] Final review in Theme Editor preview
- [ ] Publish live!

---

## Maintenance and Updates

### Regular Content Updates

**Weekly:**
- Add new products
- Update featured products
- Check inventory levels
- Add blog posts

**Monthly:**
- Review and update homepage hero
- Rotate featured products
- Update seasonal categories
- Review and respond to product reviews

**Quarterly:**
- Review color scheme (seasonal themes)
- Update brand promises if offerings change
- Review navigation structure
- Audit and remove outdated products

### Performance Optimization

**Image Optimization:**
- Keep images under 200KB when possible
- Use WebP format for better compression
- Enable lazy loading (default: enabled)
- Use appropriate image sizes per location

**Content Optimization:**
- Keep product descriptions concise
- Use headers for SEO
- Add alt text to images
- Minimize custom HTML in widgets

### Backup Before Major Changes

Before making major customizations:
1. Download theme backup via Stencil CLI
2. Export products and categories
3. Document current settings
4. Test changes in preview mode first

---

## Conclusion

This comprehensive guide covers all content requirements for populating the Partyworld 2025 theme. Start with the Quick Start Checklist and work through each section systematically. Use the Theme Editor for most customizations, and leverage Page Builder widgets for flexible content additions.

For technical customization beyond Theme Editor capabilities, refer to the theme's documentation in the `docs/` directory and BigCommerce's Stencil documentation.

**Key Takeaways:**
- Use Theme Editor for colors, fonts, and basic settings
- Organize products into clear category structures  
- Leverage widget regions for flexible content
- Start with minimum required content, then expand
- Test thoroughly before publishing
- Update content regularly for fresh user experience

For questions or support, refer to BigCommerce documentation or contact your theme developer.
