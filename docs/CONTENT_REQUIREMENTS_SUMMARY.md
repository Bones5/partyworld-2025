# Partyworld 2025 Content Requirements - Quick Reference

This is a condensed summary of content requirements for the Partyworld 2025 theme. For detailed instructions, see [CONTENT_REQUIREMENTS.md](./CONTENT_REQUIREMENTS.md).

## Essential Content Checklist

### 1. Branding Assets
- [ ] **Logo**: 250x100px PNG
- [ ] **Favicon**: 32x32px PNG/ICO
- [ ] **Social Share Image**: 1200x630px

### 2. Homepage Hero Banner
- [ ] **Background Image**: 1920x800px minimum
- [ ] **Heading Text**: Main headline
- [ ] **Subheading Text**: Supporting text
- [ ] **CTA Button**: Text and URL

### 3. Category Structure

**Themes Category** (for theme grid section):
- [ ] Create "Themes" parent category
- [ ] Add 3+ child categories with 500x500px images
  - Examples: Birthday, Wedding, Halloween, Christmas

**Occasions Category** (for occasion grid section):
- [ ] Create "Occasions" parent category  
- [ ] Add 5+ child categories with 500x500px images
  - Examples: Baby Shower, Graduation, Retirement, Anniversary

**Product Types** (for standard navigation):
- [ ] Create product categories
  - Examples: Balloons, Tableware, Decorations, Party Favors

### 4. Products

**Minimum Products**: 20+ for testing, 50+ for launch

**Per Product:**
- [ ] Product name and SKU
- [ ] Main image (500x659px) + 2-4 additional images
- [ ] Product description
- [ ] Price and sale price (if applicable)
- [ ] Product options/variants
- [ ] Inventory levels
- [ ] Category assignment

**Featured Products:**
- [ ] Mark 4-12 products as featured

### 5. Homepage Content

**Customer Reviews Section:**
- [ ] 3-6 customer testimonials with:
  - Customer name
  - Star rating (1-5)
  - Review text

**Brand Intro & Promises:**
- [ ] Brand heading
- [ ] 2-3 paragraphs of brand intro text
- [ ] Promises heading
- [ ] 4-6 promise items with icons and text

### 6. Blog Content
- [ ] Minimum 3 blog posts
- [ ] Each with:
  - Title
  - Featured image (300x200px)
  - Body content
  - Summary/excerpt
  - Publication date

### 7. Store Information
- [ ] Store name, address, phone
- [ ] Contact email
- [ ] Social media URLs (Facebook, Instagram, etc.)
- [ ] Privacy policy page
- [ ] Terms & conditions page
- [ ] Shipping policy page
- [ ] Return policy page

### 8. Theme Settings

**Access:** Storefront → Themes → Customize

**Essential Settings:**
- [ ] Brand primary color
- [ ] Body and heading fonts
- [ ] Logo position and size
- [ ] Header and footer colors
- [ ] Button styles (primary, secondary)
- [ ] Homepage product counts (featured, new, top sellers)
- [ ] Enable/configure carousel
- [ ] Social media icon placement
- [ ] Payment method icons

## Image Size Reference

| Usage | Dimensions | Format |
|-------|------------|--------|
| Hero Banner | 1920x800px | JPG |
| Category Cards | 500x500px | JPG/PNG |
| Product Images | 500x659px | JPG |
| Product Thumbnails | 100x100px | JPG |
| Product Zoom | 1280x1280px | JPG |
| Blog Featured Image | 300x200px | JPG |
| Logo | 250x100px | PNG |
| Favicon | 32x32px | ICO/PNG |
| Social Share | 1200x630px | JPG |

## Quick Setup Steps

### Week 1: Branding & Setup
1. Upload logo and favicon
2. Configure brand colors and fonts in Theme Editor
3. Complete store profile information
4. Set up payment and shipping methods

### Week 2: Categories & Products
1. Create category structure (Themes, Occasions, Product Types)
2. Upload category images
3. Add minimum 20 products with images and descriptions
4. Mark featured products

### Week 3: Homepage Content
1. Configure hero banner (image, text, CTA)
2. Add customer reviews via widget region
3. Write brand intro and promises content
4. Create 3+ blog posts

### Week 4: Navigation & Polish
1. Organize main navigation menu
2. Configure footer content and payment icons
3. Create legal pages (Privacy, Terms, Returns)
4. Add social media icons

### Week 5: Testing & Launch
1. Test on desktop, tablet, mobile
2. Verify checkout process
3. Check all links and forms
4. Review SEO settings
5. Publish live

## Configuration Methods

### No-Code Customization (Theme Editor)
- Colors and typography
- Logo and layout settings
- Homepage content (hero, products)
- Button styles
- Product display options

**Access:** Storefront → Themes → Customize

### Content Management (Admin Panel)
- Products and categories
- Blog posts
- Web pages
- Store profile

**Access:** Various admin sections

### Flexible Content (Page Builder)
- Custom homepage sections
- Landing pages
- Widget regions

**Access:** Storefront → Web Pages → Page Builder

### Advanced (Code)
- Custom components
- Template modifications
- Custom styles

**Location:** Theme files in repository

## Available Widget Regions

Use these regions to add custom content via Page Builder:

**Homepage:**
- `home_below_menu` - Below navigation
- `home_below_carousel` - Below hero
- `home_below_category_grid` - After categories
- `home_below_featured_products` - After featured products
- `home_customer_reviews` - Customer reviews section
- `home_intro_promise` - Brand intro section
- `home_blog_teaser` - Blog section

## Brand Promises Example

Include 4-6 items with these suggested themes:
- ✓ Fast & Free Shipping (icon: `truck`)
- ✓ Quality Guaranteed (icon: `checkmark`)
- ✓ Best Prices (icon: `star`)
- ✓ Expert Support (icon: `support`)
- ✓ Easy Returns (icon: `returns`)
- ✓ Secure Checkout (icon: `secure`)

## Customer Review Example

```
Name: Sarah M.
Rating: ⭐⭐⭐⭐⭐
Review: "Amazing party supplies! The quality exceeded my expectations 
and delivery was super fast. Will definitely order again!"
```

## Hero Banner Examples

**Example 1 - Birthday Theme:**
- Heading: "Make Every Birthday Unforgettable"
- Subheading: "Shop our complete collection of birthday party supplies"
- CTA: "Shop Birthday Themes"

**Example 2 - General Welcome:**
- Heading: "Your One-Stop Party Shop"
- Subheading: "From birthdays to weddings, we've got everything you need"
- CTA: "Start Shopping"

**Example 3 - Promotional:**
- Heading: "New Customer? Get 15% Off!"
- Subheading: "Use code PARTY15 at checkout"
- CTA: "Shop Now"

## Key Theme Features

- **Responsive Design**: Mobile, tablet, desktop optimized
- **Product Quick View**: Fast product preview without leaving page
- **Lazy Loading**: Fast page loads with image optimization
- **Product Badges**: Sale and sold-out badges
- **Faceted Search**: Filter products by attributes
- **Product Reviews**: Built-in review system
- **Blog Integration**: Content marketing ready
- **SEO Optimized**: Meta tags and structured data
- **Accessibility**: WCAG 2.1 compliant

## Support Resources

- **Full Documentation**: [CONTENT_REQUIREMENTS.md](./CONTENT_REQUIREMENTS.md)
- **Design System**: [design-system/design_system_rules.md](./design-system/design_system_rules.md)
- **Testing Guide**: [PLAYWRIGHT_TESTING.md](./PLAYWRIGHT_TESTING.md)
- **BigCommerce Docs**: https://support.bigcommerce.com
- **Developer Docs**: https://developer.bigcommerce.com/stencil-docs

## Common Questions

**Q: Can I change colors without code?**  
A: Yes! Use Theme Editor → Global → Background and Lines

**Q: How do I add customer reviews?**  
A: Use Page Builder in the `home_customer_reviews` widget region

**Q: Where do I upload products?**  
A: Products → View → Add Product

**Q: How do I change the hero banner?**  
A: Theme Editor → HomePage → Hero Banner settings

**Q: Can I add custom content sections?**  
A: Yes! Use Page Builder and widget regions

**Q: How many products should I add initially?**  
A: Minimum 20 for testing, 50+ recommended for launch

**Q: Do I need all categories right away?**  
A: Start with Themes and Occasions for homepage display

**Q: Where are blog posts managed?**  
A: Marketing → Blog

---

For detailed instructions on each section, refer to the complete [CONTENT_REQUIREMENTS.md](./CONTENT_REQUIREMENTS.md) documentation.
