# BigCommerce Image Transfer Scripts

Scripts for downloading product images from BigCommerce export CSV and re-uploading them to a new environment.

Note: the main theme workflow in this repo is local-only. We do not maintain a dedicated BigCommerce staging store for routine development. The store-to-store examples in this directory are legacy migration utilities for one-off transfers, not the default day-to-day workflow.

## Overview

When migrating products between BigCommerce stores (e.g., staging → production), product images are hosted on BigCommerce's CDN and tied to the source store. These scripts help you:

1. **Download** all images from a product export CSV
2. **Upload** them to your own cloud storage (S3, R2, etc.)
3. **Update** the CSV with new image URLs for import

## Prerequisites

- Node.js 18+
- Google Cloud SDK (for GCS uploads) or AWS CLI (for S3/R2)
- A BigCommerce product export CSV
- Environment configs set up (see below)

## Installation

```bash
cd scripts/image-transfer
npm install
```

## Environment Setup

The scripts integrate with the project's environment switcher. Set up the stores you actually plan to transfer between:

```bash
# From project root
npm run env:init

# Edit environments/production.config.json
# Add your primary store URL

# Edit environments/production.secrets.json
# Add your API token

# If you need a second store for a one-off migration,
# create matching *.config.json and *.secrets.json files manually.
```

## Quick Start (Environment-Aware)

```bash
# Full transfer from staging to production (using GCS)
node scripts/image-transfer/transfer-images.js \
  --from staging \
  --to production \
  --csv ./products-export.csv \
  --bucket gs://my-bucket/products \
  --public-url https://storage.googleapis.com/my-bucket/products
```

## Workflow

### Step 1: Export Products from BigCommerce

1. Go to **Products** in your BigCommerce admin
2. Click **Export** → **Export template for editing products**
3. Export as CSV with all product data

### Step 2: Download Images

```bash
node download-images.js path/to/products.csv ./downloaded-images
```

Options:

- `--concurrent <n>` - Number of parallel downloads (default: 5)
- `--retries <n>` - Retry attempts per image (default: 3)

This creates:

- `downloaded-images/` - Images organized by SKU
- `downloaded-images/manifest.json` - Mapping of SKUs to local files
- `downloaded-images/errors.json` - Any failed downloads

### Step 3: Upload to Cloud Storage

Upload to Google Cloud Storage:

```bash
# Authenticate first (one-time)
gcloud auth login

# Upload images
node upload-to-cdn.js ./downloaded-images gs://your-bucket/products \
  --acl public-read \
  --public-url https://storage.googleapis.com/your-bucket/products
```

Upload to AWS S3:

```bash
AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=yyy \
node upload-to-cdn.js ./downloaded-images s3://your-bucket/products \
  --acl public-read \
  --public-url https://your-bucket.s3.amazonaws.com/products
```

Upload to Cloudflare R2:

```bash
AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=yyy \
node upload-to-cdn.js ./downloaded-images s3://your-bucket/products \
  --endpoint https://xxx.r2.cloudflarestorage.com \
  --public-url https://pub-xxx.r2.dev/products
```

### Step 4: Update CSV with New URLs

```bash
node update-csv-urls.js \
  path/to/products.csv \
  ./downloaded-images/manifest.json \
  https://your-cdn.com/products \
  ./products-updated.csv
```

### Step 5: Import to BigCommerce

1. Go to **Products** in your target BigCommerce admin
2. Click **Import**
3. Upload `products-updated.csv`

## File Structure

```
image-transfer/
├── package.json          # Dependencies
├── README.md            # This file
├── download-images.js   # Download images from CSV
├── upload-to-cdn.js     # Upload to S3/R2/GCS
└── update-csv-urls.js   # Update CSV with new URLs
```

## Image URL Columns

The scripts process these BigCommerce CSV columns:

- `Product Image URL - 1` through `Product Image URL - n`
- Multiple images per product are supported

## Troubleshooting

### Download Failures

Check `errors.json` for failed downloads. Common issues:

- **403 Forbidden**: Image no longer exists or is private
- **Network timeout**: Increase `--retries` or run again

Re-run the download script - it will skip already-downloaded images.

### Upload Issues

For Google Cloud Storage, ensure gcloud is installed and authenticated:

```bash
brew install google-cloud-sdk
gcloud auth login
```

Verify GCS access:

```bash
gsutil ls gs://your-bucket
```

For AWS/S3, ensure AWS CLI is installed:

```bash
brew install awscli
```

Verify AWS credentials:

```bash
aws sts get-caller-identity
```

### CSV Parse Errors

Ensure your CSV is properly formatted:

- UTF-8 encoding
- Standard comma delimiter
- Quoted fields containing commas

## Related Documentation

See `docs/PRODUCT_IMAGE_MIGRATION.md` for the complete migration guide.

---

## Page Builder Content Transfer

Transfer Page Builder pages, widgets, and placements between BigCommerce stores.

### Prerequisites

Your environment configs need the `storeHash` field:

```json
// environments/staging.config.json
{
  "normalStoreUrl": "https://store-xxx.mybigcommerce.com/",
  "storeHash": "xxx"
}
```

API tokens need **Content: modify** scope.

### Usage

```bash
# Transfer all Page Builder content from staging to production
npm run pages:transfer -- --from staging --to production

# Export only (for backup/review)
npm run pages:export -- staging --output ./backup

# Import from previously exported files
node scripts/image-transfer/transfer-pages.js --import ./backup --to production

# Dry run (preview without changes)
npm run pages:transfer -- --from staging --to production --dry-run
```

### What Gets Transferred

1. **Pages** - All page content including body HTML
2. **Widget Templates** - Custom widget template definitions
3. **Widgets** - Widget instances with configurations
4. **Placements** - Where widgets appear (regions, templates)

### Notes

- Duplicate pages (same URL) are automatically skipped
- Image URLs in content need to be updated separately (use image transfer scripts)
- Creates mapping files for reference (page IDs, widget UUIDs)
