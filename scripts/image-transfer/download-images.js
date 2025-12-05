#!/usr/bin/env node

/**
 * BigCommerce Product Image Downloader
 * 
 * Downloads all product images from a BigCommerce product export CSV.
 * Organizes images by SKU in a structured folder hierarchy.
 * 
 * Usage:
 *   node download-images.js <path-to-csv> [output-dir]
 * 
 * Example:
 *   node download-images.js ./products_export.csv ./downloaded-images
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { parse } = require('csv-parse/sync');

// Configuration
const CONFIG = {
    maxConcurrent: 5,           // Max concurrent downloads
    retryAttempts: 3,           // Retry failed downloads
    retryDelay: 1000,           // Delay between retries (ms)
    timeout: 30000,             // Download timeout (ms)
    imageColumns: [             // CSV columns containing image URLs
        'Image File - 1',
        'Image File - 2', 
        'Image File - 3',
        'Image File - 4',
        'Image File - 5',
        'Image File - 6',
        'Image File - 7',
        'Image File - 8',
        'Image File - 9',
        'Image File - 10',
        'Product Image URL - 1',
        'Product Image URL - 2',
        'Product Image URL - 3',
    ],
    skuColumn: 'Product Code/SKU',
    nameColumn: 'Product Name',
    idColumn: 'Product ID',
};

// Stats tracking
const stats = {
    totalProducts: 0,
    totalImages: 0,
    downloaded: 0,
    skipped: 0,
    failed: 0,
    errors: [],
};

/**
 * Download a file from URL
 */
function downloadFile(url, destPath, attempt = 1) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        
        const dir = path.dirname(destPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Skip if file already exists
        if (fs.existsSync(destPath)) {
            stats.skipped++;
            return resolve({ status: 'skipped', path: destPath });
        }

        const file = fs.createWriteStream(destPath);
        
        const request = protocol.get(url, { timeout: CONFIG.timeout }, (response) => {
            // Handle redirects
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                file.close();
                fs.unlinkSync(destPath);
                return downloadFile(response.headers.location, destPath, attempt)
                    .then(resolve)
                    .catch(reject);
            }

            if (response.statusCode !== 200) {
                file.close();
                fs.unlinkSync(destPath);
                return reject(new Error(`HTTP ${response.statusCode}: ${url}`));
            }

            response.pipe(file);

            file.on('finish', () => {
                file.close();
                stats.downloaded++;
                resolve({ status: 'downloaded', path: destPath });
            });
        });

        request.on('error', (err) => {
            file.close();
            if (fs.existsSync(destPath)) {
                fs.unlinkSync(destPath);
            }
            
            // Retry logic
            if (attempt < CONFIG.retryAttempts) {
                console.log(`  ⟳ Retry ${attempt}/${CONFIG.retryAttempts}: ${path.basename(destPath)}`);
                setTimeout(() => {
                    downloadFile(url, destPath, attempt + 1)
                        .then(resolve)
                        .catch(reject);
                }, CONFIG.retryDelay);
            } else {
                reject(err);
            }
        });

        request.on('timeout', () => {
            request.destroy();
            reject(new Error(`Timeout: ${url}`));
        });
    });
}

/**
 * Process downloads with concurrency limit
 */
async function processQueue(queue) {
    const results = [];
    const executing = new Set();

    for (const task of queue) {
        const promise = task().then(result => {
            executing.delete(promise);
            return result;
        }).catch(error => {
            executing.delete(promise);
            return { status: 'failed', error };
        });

        executing.add(promise);
        results.push(promise);

        if (executing.size >= CONFIG.maxConcurrent) {
            await Promise.race(executing);
        }
    }

    return Promise.all(results);
}

/**
 * Sanitize filename for filesystem
 */
function sanitizeFilename(name) {
    return name
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/\s+/g, '_')
        .substring(0, 100);
}

/**
 * Get file extension from URL
 */
function getExtension(url) {
    const urlPath = new URL(url).pathname;
    const ext = path.extname(urlPath).toLowerCase();
    return ext || '.jpg';
}

/**
 * Parse CSV and extract image data
 */
function parseCSV(csvPath) {
    console.log(`\n📄 Reading CSV: ${csvPath}`);
    
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });

    console.log(`   Found ${records.length} products in CSV`);
    
    const products = [];
    
    for (const record of records) {
        const sku = record[CONFIG.skuColumn] || record['SKU'] || record['Product SKU'] || '';
        const name = record[CONFIG.nameColumn] || record['Name'] || '';
        const id = record[CONFIG.idColumn] || record['ID'] || '';
        
        const images = [];
        
        // Find all image URLs in the record
        for (const col of CONFIG.imageColumns) {
            if (record[col] && record[col].trim()) {
                images.push({
                    column: col,
                    url: record[col].trim(),
                });
            }
        }
        
        // Also check for any column containing 'image' in name
        for (const [col, value] of Object.entries(record)) {
            if (col.toLowerCase().includes('image') && 
                value && 
                value.startsWith('http') &&
                !images.find(img => img.url === value)) {
                images.push({
                    column: col,
                    url: value.trim(),
                });
            }
        }

        if (images.length > 0) {
            products.push({
                sku: sku || `product_${id}`,
                name,
                id,
                images,
            });
        }
    }

    return products;
}

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
        console.log(`
BigCommerce Product Image Downloader
=====================================

Usage:
  node download-images.js <csv-file> [output-dir]

Arguments:
  csv-file    Path to BigCommerce product export CSV
  output-dir  Output directory (default: ./product-images)

Example:
  node download-images.js products_export.csv ./images

Options (edit CONFIG in script):
  maxConcurrent: ${CONFIG.maxConcurrent}
  retryAttempts: ${CONFIG.retryAttempts}
  timeout: ${CONFIG.timeout}ms
`);
        process.exit(1);
    }

    const csvPath = args[0];
    const outputDir = args[1] || './product-images';

    if (!fs.existsSync(csvPath)) {
        console.error(`❌ CSV file not found: ${csvPath}`);
        process.exit(1);
    }

    console.log('\n🚀 BigCommerce Product Image Downloader');
    console.log('========================================');

    // Parse CSV
    const products = parseCSV(csvPath);
    stats.totalProducts = products.length;

    // Count total images
    for (const product of products) {
        stats.totalImages += product.images.length;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Products with images: ${stats.totalProducts}`);
    console.log(`   Total images to download: ${stats.totalImages}`);
    console.log(`   Output directory: ${path.resolve(outputDir)}`);

    // Create output directory
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Build download queue
    const downloadQueue = [];
    const manifest = [];

    for (const product of products) {
        const productDir = path.join(outputDir, sanitizeFilename(product.sku));
        
        for (let i = 0; i < product.images.length; i++) {
            const img = product.images[i];
            const ext = getExtension(img.url);
            const filename = `${sanitizeFilename(product.sku)}_${i + 1}${ext}`;
            const destPath = path.join(productDir, filename);

            manifest.push({
                sku: product.sku,
                name: product.name,
                imageIndex: i + 1,
                originalUrl: img.url,
                localPath: destPath,
                column: img.column,
            });

            downloadQueue.push(() => {
                return downloadFile(img.url, destPath).catch(err => {
                    stats.failed++;
                    stats.errors.push({
                        sku: product.sku,
                        url: img.url,
                        error: err.message,
                    });
                    return { status: 'failed', error: err };
                });
            });
        }
    }

    // Process downloads
    console.log(`\n⬇️  Downloading images (${CONFIG.maxConcurrent} concurrent)...\n`);
    
    const startTime = Date.now();
    let lastProgress = 0;

    // Progress tracking
    const progressInterval = setInterval(() => {
        const current = stats.downloaded + stats.skipped + stats.failed;
        if (current !== lastProgress) {
            const percent = Math.round((current / stats.totalImages) * 100);
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            process.stdout.write(`\r   Progress: ${current}/${stats.totalImages} (${percent}%) - ${elapsed}s`);
            lastProgress = current;
        }
    }, 100);

    await processQueue(downloadQueue);
    
    clearInterval(progressInterval);
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);

    // Save manifest
    const manifestPath = path.join(outputDir, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    // Save error log if any
    if (stats.errors.length > 0) {
        const errorLogPath = path.join(outputDir, 'errors.json');
        fs.writeFileSync(errorLogPath, JSON.stringify(stats.errors, null, 2));
    }

    // Final report
    console.log(`\n\n✅ Download Complete!`);
    console.log(`   ─────────────────────────`);
    console.log(`   Downloaded: ${stats.downloaded}`);
    console.log(`   Skipped (existing): ${stats.skipped}`);
    console.log(`   Failed: ${stats.failed}`);
    console.log(`   Total time: ${totalTime}s`);
    console.log(`   ─────────────────────────`);
    console.log(`   Manifest saved: ${manifestPath}`);
    
    if (stats.errors.length > 0) {
        console.log(`   ⚠️  Error log: ${path.join(outputDir, 'errors.json')}`);
    }

    console.log(`\n📁 Images saved to: ${path.resolve(outputDir)}\n`);
}

// Run
main().catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
});
