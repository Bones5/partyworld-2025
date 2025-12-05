#!/usr/bin/env node

/**
 * BigCommerce Product Image Uploader
 * 
 * Uploads downloaded images to a cloud storage bucket (S3, R2, GCS, etc.)
 * Uses the manifest from download-images.js.
 * 
 * Supported providers:
 *   - AWS S3
 *   - Cloudflare R2
 *   - Google Cloud Storage
 *   - DigitalOcean Spaces
 *   - Any S3-compatible storage
 * 
 * Usage:
 *   node upload-to-cdn.js <images-dir> <bucket-url> [options]
 * 
 * Example:
 *   AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=yyy \
 *   node upload-to-cdn.js ./product-images s3://my-bucket/products
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
    maxConcurrent: 10,
    dryRun: false,
};

/**
 * Check if AWS CLI is available
 */
function checkAwsCli() {
    try {
        execSync('aws --version', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

/**
 * Check if gsutil (Google Cloud SDK) is available
 */
function checkGsutil() {
    try {
        execSync('gsutil --version', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

/**
 * Upload directory to S3/R2 using AWS CLI
 */
function uploadToS3(sourceDir, bucketUrl, options = {}) {
    const args = [
        'aws', 's3', 'sync',
        sourceDir,
        bucketUrl,
        '--exclude', '"*.json"',  // Don't upload manifest/error files
        '--exclude', '".*"',       // Don't upload hidden files
    ];

    if (options.endpoint) {
        args.push('--endpoint-url', options.endpoint);
    }

    if (options.acl) {
        args.push('--acl', options.acl);
    }

    if (options.cacheControl) {
        args.push('--cache-control', options.cacheControl);
    }

    if (CONFIG.dryRun) {
        args.push('--dryrun');
    }

    const cmd = args.join(' ');
    console.log(`\n📤 Uploading to: ${bucketUrl}`);
    console.log(`   Command: ${cmd}\n`);

    try {
        execSync(cmd, { stdio: 'inherit' });
        return true;
    } catch (err) {
        console.error('❌ Upload failed:', err.message);
        return false;
    }
}

/**
 * Upload directory to Google Cloud Storage using gsutil
 */
function uploadToGCS(sourceDir, bucketUrl, options = {}) {
    // Build gsutil rsync command (similar to aws s3 sync)
    const args = [
        'gsutil', '-m',  // Enable parallel uploads
    ];

    // Add cache-control header if specified
    if (options.cacheControl) {
        args.push('-h', `Cache-Control:${options.cacheControl}`);
    }

    args.push(
        'rsync', '-r',
        '-x', '".*\\.json$|^\\..*"',  // Exclude json and hidden files (quoted for shell)
    );

    if (CONFIG.dryRun) {
        args.push('-n');  // Dry run
    }

    args.push(sourceDir, bucketUrl);

    const cmd = args.join(' ');
    console.log(`\n📤 Uploading to: ${bucketUrl}`);
    console.log(`   Command: ${cmd}\n`);

    try {
        execSync(cmd, { stdio: 'inherit' });
        
        // Set ACL if specified (public-read maps to allUsers:R)
        if (options.acl === 'public-read' && !CONFIG.dryRun) {
            console.log('\n🔓 Setting public read access...');
            execSync(`gsutil -m acl ch -r -u AllUsers:R ${bucketUrl}`, { stdio: 'inherit' });
        }
        
        return true;
    } catch (err) {
        console.error('❌ Upload failed:', err.message);
        return false;
    }
}

/**
 * Generate public URLs from manifest
 */
function generatePublicUrls(manifestPath, publicBaseUrl, outputPath) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
    const publicManifest = manifest.map(entry => ({
        ...entry,
        publicUrl: `${publicBaseUrl}/${entry.sku}/${path.basename(entry.localPath)}`,
    }));

    fs.writeFileSync(outputPath, JSON.stringify(publicManifest, null, 2));
    console.log(`📄 Public URL manifest saved: ${outputPath}`);
    
    return publicManifest;
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.log(`
BigCommerce Product Image Uploader
===================================

Uploads downloaded images to cloud storage (S3, R2, GCS, etc.)
Automatically detects provider from bucket URL prefix.

Usage:
  node upload-to-cdn.js <images-dir> <bucket-url> [options]

Arguments:
  images-dir   Directory containing downloaded images (from download-images.js)
  bucket-url   Bucket URL:
               - gs://bucket-name/path   (Google Cloud Storage)
               - s3://bucket-name/path   (AWS S3, R2, Spaces)

Options:
  --endpoint <url>      Custom S3 endpoint (for R2, Spaces, etc.)
  --acl <policy>        ACL policy (e.g., public-read)
  --cache-control <val> Cache-Control header
  --public-url <url>    Public CDN URL for generating manifest
  --dry-run             Preview without uploading

Google Cloud Storage:
  Requires gcloud CLI: brew install google-cloud-sdk
  Authenticate with: gcloud auth login

AWS/S3-compatible:
  Requires AWS CLI: brew install awscli
  Set environment variables: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

Examples:

  # Upload to Google Cloud Storage
  node upload-to-cdn.js ./product-images gs://my-bucket/products \\
    --acl public-read \\
    --public-url https://storage.googleapis.com/my-bucket/products

  # Upload to AWS S3
  AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=yyy \\
  node upload-to-cdn.js ./product-images s3://my-bucket/products \\
    --acl public-read \\
    --public-url https://my-bucket.s3.amazonaws.com/products

  # Upload to Cloudflare R2
  AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=yyy \\
  node upload-to-cdn.js ./product-images s3://my-bucket/products \\
    --endpoint https://xxx.r2.cloudflarestorage.com \\
    --public-url https://pub-xxx.r2.dev/products

  # Upload to DigitalOcean Spaces
  AWS_ACCESS_KEY_ID=xxx AWS_SECRET_ACCESS_KEY=yyy \\
  node upload-to-cdn.js ./product-images s3://my-space/products \\
    --endpoint https://nyc3.digitaloceanspaces.com \\
    --acl public-read \\
    --public-url https://my-space.nyc3.cdn.digitaloceanspaces.com/products
`);
        process.exit(1);
    }

    // Parse arguments
    const imagesDir = args[0];
    const bucketUrl = args[1];
    const options = {};

    for (let i = 2; i < args.length; i++) {
        switch (args[i]) {
            case '--endpoint':
                options.endpoint = args[++i];
                break;
            case '--acl':
                options.acl = args[++i];
                break;
            case '--cache-control':
                options.cacheControl = args[++i];
                break;
            case '--public-url':
                options.publicUrl = args[++i];
                break;
            case '--dry-run':
                CONFIG.dryRun = true;
                break;
        }
    }

    // Validate
    if (!fs.existsSync(imagesDir)) {
        console.error(`❌ Images directory not found: ${imagesDir}`);
        process.exit(1);
    }

    // Detect provider from bucket URL
    const isGCS = bucketUrl.startsWith('gs://');
    const isS3 = bucketUrl.startsWith('s3://');

    if (!isGCS && !isS3) {
        console.error(`❌ Invalid bucket URL. Must start with gs:// (GCS) or s3:// (AWS/R2)`);
        process.exit(1);
    }

    if (isGCS && !checkGsutil()) {
        console.error(`❌ gsutil not found. Install with: brew install google-cloud-sdk`);
        console.error(`   Then authenticate with: gcloud auth login`);
        process.exit(1);
    }

    if (isS3 && !checkAwsCli()) {
        console.error(`❌ AWS CLI not found. Install with: brew install awscli`);
        process.exit(1);
    }

    console.log('\n☁️  BigCommerce Product Image Uploader');
    console.log('======================================\n');
    console.log(`☁️  Provider: ${isGCS ? 'Google Cloud Storage' : 'AWS S3 / S3-compatible'}`);

    if (CONFIG.dryRun) {
        console.log('🔍 DRY RUN MODE - No files will be uploaded\n');
    }

    // Count files
    const manifestPath = path.join(imagesDir, 'manifest.json');
    if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        console.log(`📊 Found ${manifest.length} images in manifest`);
    }

    // Upload using appropriate provider
    const success = isGCS 
        ? uploadToGCS(imagesDir, bucketUrl, options)
        : uploadToS3(imagesDir, bucketUrl, options);

    if (success && options.publicUrl) {
        // Generate public URL manifest
        if (fs.existsSync(manifestPath)) {
            const publicManifestPath = path.join(imagesDir, 'manifest-public.json');
            generatePublicUrls(manifestPath, options.publicUrl, publicManifestPath);
        }
    }

    if (success) {
        console.log('\n✅ Upload complete!\n');
        
        if (options.publicUrl) {
            console.log(`🌐 Public base URL: ${options.publicUrl}`);
            console.log(`\nNext steps:`);
            console.log(`  1. Update your CSV with new image URLs using update-csv-urls.js`);
            console.log(`  2. Import the updated CSV to your BigCommerce store\n`);
        }
    }
}

// Run
main().catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
});
