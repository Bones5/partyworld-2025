# Product Image Migration Guide

**Goal:** Duplicate product images from production to staging, then re-upload to production at launch to ensure proper image isolation and clean promotion workflow.

## Overview

This guide covers the complete workflow for managing product images when preparing a BigCommerce staging site for the Partyworld 2025 theme. This approach ensures:
- Image isolation between environments
- Accurate preview capabilities
- Clean promotion with no staging/production hotlinks
- Proper image hosting on each store's CDN

---

## Checklist for Duplicating Product Images

### 1. Staging Store Preparation

- [ ] **Export product catalog CSV from production**
  - Navigate to: Products → Export
  - Ensure Image URL columns are included
  - Download the complete product CSV file
  - Save with timestamp: `products_export_YYYY-MM-DD.csv`

- [ ] **Download all product images from production**
  - Use original source images (not CDN URLs)
  - Organize by product SKU or category
  - Maintain folder structure for easy reference
  - Document image dimensions and formats

- [ ] **Optional: Set up private temporary CDN or bucket**
  - AWS S3, Cloudflare R2, or similar
  - Provides data integrity and transparency
  - Allows version control of image assets
  - Document bucket/CDN URL structure

---

### 2. Bulk Import Images to Staging

- [ ] **Update CSV Image URL columns**
  - Point to new source (private CDN or original URLs)
  - Use find/replace for bulk URL updates
  - Verify all image paths are accessible
  - Example column headers:
    - `Image File - 1`
    - `Image File - 2`
    - `Image File - 3`

- [ ] **Import revised CSV to staging store**
  - Navigate to: Products → Import
  - Upload modified CSV file
  - BigCommerce will ingest and host images under staging CDN
  - Monitor import job for errors
  - Review import log for failed image downloads

- [ ] **Spot-check image display**
  - Test key PDPs (Product Detail Pages)
  - Check category grid/list views
  - Verify image zoom functionality
  - Test on mobile and desktop viewports
  - Confirm image alt text is preserved

---

### 3. Content and Page Builder Images

- [ ] **Upload images directly in staging Page Builder**
  - **DO NOT** paste production image URLs
  - Navigate to: Storefront → Web Pages
  - Upload images for each page/block
  - Use staging store's Page Builder interface

- [ ] **Document image sources for Page Builder assets**
  - Create inventory list:
    - Banner images (homepage, category pages)
    - Hero section images
    - Static page content images
    - Widget/block images
  - Record dimensions and file names
  - Note placement and usage context

- [ ] **Handle promotional banners**
  - Upload to: Marketing → Banners
  - Configure banner locations and visibility
  - Test banner display across pages

---

### 4. Theme Assets

- [ ] **Add static/canonical images to theme's `/assets` directory**
  - Logo files (SVG, PNG variants)
  - Icon sets and sprite sheets
  - Background patterns or textures
  - Style images (decorative elements)
  - Location: `/assets/img/`

- [ ] **Install identical theme build on both stores**
  - Use same theme version
  - Ensures asset path consistency
  - No CDN differences for theme files
  - Upload via Stencil CLI:
    ```bash
    stencil push
    ```

- [ ] **Verify theme asset loading**
  - Check browser console for 404 errors
  - Confirm CDN paths resolve correctly
  - Test icon sprite usage
  - Verify logo display in header

---

### 5. Promotion to Production

- [ ] **Prepare final production CSV**
  - Start with staging CSV as baseline
  - Update image URLs to point to:
    - Private CDN (if using)
    - Original source URLs
    - Or staging store CDN (to be re-ingested)
  - Verify all product data is current

- [ ] **Repeat CSV import to production store**
  - Navigate to: Products → Import
  - Upload final production CSV
  - Monitor import job completion
  - Review import log for any errors

- [ ] **Re-upload Page Builder images in production**
  - Navigate to: Storefront → Web Pages
  - Upload same images used in staging
  - Match layout and placement exactly
  - Verify responsive behavior

- [ ] **Spot-check image display on production**
  - PDPs: zoom, thumbnails, gallery
  - Category pages: grid and list views
  - Custom content blocks and widgets
  - Theme assets: logo, icons, backgrounds
  - Mobile and desktop viewports

- [ ] **Confirm no broken links or missing images**
  - Use browser dev tools network tab
  - Look for 404 errors on image requests
  - Test with cache disabled
  - Check external link checker tools

---

### 6. Final QA / Launch

- [ ] **Run full catalog image audit**
  - Compare file counts between staging/production
  - Verify path structure consistency
  - Check for orphaned or duplicate images
  - Audit script example:
    ```bash
    # Count product images
    # Staging vs Production comparison
    ```

- [ ] **Confirm performance and caching**
  - Use Lighthouse or PageSpeed Insights
  - Check image optimization:
    - WebP/AVIF format support
    - Appropriate image dimensions
    - Lazy loading implementation
  - Tune image sizes if needed:
    - Thumbnail: 100x100
    - Gallery: 500x659
    - Zoom: 1280x1280

- [ ] **Remove or archive temporary CDN hosts**
  - If using temporary bucket, clean up
  - Archive original image files
  - Document final image source paths
  - Update internal wiki/docs

- [ ] **Mark images for SEO**
  - Verify alt text on all product images
  - Use descriptive, keyword-rich file names
  - Example: `red-party-balloons-50pk.jpg`
  - Remove any orphaned staging images
  - Submit updated sitemap to search engines

---

## Important Notes

### Image Isolation
- This workflow ensures complete image isolation between environments
- No hotlinks tie production to staging
- Each store hosts its own image assets on its CDN
- Prevents issues if staging store is deactivated

### Accurate Previews
- Staging environment accurately reflects production
- Clients can review without seeing production URLs
- Testing can proceed without affecting live store

### Clean Promotion
- All image updates are documented
- Version-controlled for future theme/content iterations
- Repeatable process for ongoing updates

### Best Practices
1. **Always use original source images** - Don't rely on CDN URLs
2. **Document everything** - Maintain image inventory spreadsheet
3. **Test thoroughly** - Check all viewports and contexts
4. **Optimize before upload** - Compress images appropriately
5. **Use consistent naming** - Follow file naming conventions

---

## Troubleshooting

### Images not appearing after import
- Verify CSV image URLs are publicly accessible
- Check BigCommerce import log for errors
- Confirm image file formats are supported (JPEG, PNG, WebP, GIF)
- Test URLs in browser directly

### CDN caching issues
- Use cache-busting parameters if needed
- Clear CloudFlare or BigCommerce CDN cache
- Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)

### Duplicate or orphaned images
- Use BigCommerce's bulk image cleanup tools
- Audit via API or export to identify unused images
- Remove via control panel or API

### Performance issues
- Ensure images are appropriately sized
- Use image optimization tools (TinyPNG, ImageOptim)
- Enable BigCommerce's built-in image optimization
- Consider using WebP format with JPEG fallbacks

---

## Related Documentation

- [BigCommerce Image Manager](https://support.bigcommerce.com/s/article/Product-Images-Videos)
- [CSV Import Guide](https://support.bigcommerce.com/s/article/Importing-Exporting-Products)
- [Page Builder Documentation](https://support.bigcommerce.com/s/article/Page-Builder)
- [Stencil CLI Guide](https://developer.bigcommerce.com/stencil-docs)

---

## Checklist Summary

Use this quick reference when executing the migration:

```
☐ Export production CSV
☐ Download product images
☐ Setup temporary CDN (optional)
☐ Update CSV with new image URLs
☐ Import to staging
☐ Spot-check staging images
☐ Upload Page Builder images to staging
☐ Add theme assets to /assets directory
☐ Install theme on both stores
☐ Prepare production CSV
☐ Import to production
☐ Upload Page Builder images to production
☐ Spot-check production images
☐ Run full image audit
☐ Optimize performance
☐ Clean up temporary resources
☐ Verify SEO (alt text, file names)
☐ Final QA before launch
```

---

**Last Updated:** December 4, 2025  
**Maintained by:** Partyworld Development Team
