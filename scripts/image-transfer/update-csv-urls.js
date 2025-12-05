#!/usr/bin/env node

/**
 * BigCommerce Product Image URL Updater
 * 
 * Takes a manifest from download-images.js and updates a CSV
 * with new image URLs (e.g., for importing to a different store).
 * 
 * Usage:
 *   node update-csv-urls.js <original-csv> <manifest.json> <new-base-url> [output-csv]
 * 
 * Example:
 *   node update-csv-urls.js products.csv manifest.json https://my-cdn.com/images products_updated.csv
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

// Configuration
const CONFIG = {
    imageColumns: [
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
};

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 3) {
        console.log(`
BigCommerce Product Image URL Updater
======================================

Usage:
  node update-csv-urls.js <original-csv> <manifest.json> <new-base-url> [output-csv]

Arguments:
  original-csv   Original BigCommerce product export CSV
  manifest.json  Manifest file from download-images.js
  new-base-url   New base URL for images (CDN, bucket, etc.)
  output-csv     Output CSV path (default: products_updated.csv)

Example:
  node update-csv-urls.js products.csv ./product-images/manifest.json \\
    https://my-bucket.s3.amazonaws.com/products \\
    products_for_staging.csv

The script will:
  1. Read the original CSV
  2. Match SKUs from the manifest
  3. Replace image URLs with new-base-url + filename
  4. Output updated CSV ready for import
`);
        process.exit(1);
    }

    const csvPath = args[0];
    const manifestPath = args[1];
    const newBaseUrl = args[2].replace(/\/$/, ''); // Remove trailing slash
    const outputPath = args[3] || 'products_updated.csv';

    // Validate inputs
    if (!fs.existsSync(csvPath)) {
        console.error(`❌ CSV file not found: ${csvPath}`);
        process.exit(1);
    }
    if (!fs.existsSync(manifestPath)) {
        console.error(`❌ Manifest file not found: ${manifestPath}`);
        process.exit(1);
    }

    console.log('\n🔄 BigCommerce Product Image URL Updater');
    console.log('=========================================\n');

    // Load manifest
    console.log(`📄 Loading manifest: ${manifestPath}`);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    
    // Build lookup by original URL
    const urlLookup = {};
    for (const entry of manifest) {
        // Map original URL to new CDN URL
        const filename = path.basename(entry.localPath);
        const newUrl = `${newBaseUrl}/${entry.sku}/${filename}`;
        urlLookup[entry.originalUrl] = newUrl;
    }
    console.log(`   Found ${manifest.length} image mappings`);

    // Load CSV
    console.log(`📄 Loading CSV: ${csvPath}`);
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });
    console.log(`   Found ${records.length} products`);

    // Update URLs
    console.log(`\n🔄 Updating image URLs...`);
    let updatedCount = 0;

    // Get all columns that might contain image URLs
    const allColumns = Object.keys(records[0]);
    const imageColumns = allColumns.filter(col => 
        col.toLowerCase().includes('image') && 
        col.toLowerCase().includes('url')
    );
    
    // Also include configured columns
    const columnsToCheck = [...new Set([...imageColumns, ...CONFIG.imageColumns])];
    console.log(`   Checking columns: ${columnsToCheck.filter(c => allColumns.includes(c)).join(', ')}`);

    for (const record of records) {
        for (const col of columnsToCheck) {
            const currentUrl = record[col]?.trim();
            if (currentUrl && urlLookup[currentUrl]) {
                record[col] = urlLookup[currentUrl];
                updatedCount++;
            }
        }
    }

    console.log(`   Updated ${updatedCount} image URLs`);

    // Write output CSV
    console.log(`\n💾 Writing output: ${outputPath}`);
    const columns = Object.keys(records[0]);
    const output = stringify(records, {
        header: true,
        columns: columns,
    });
    fs.writeFileSync(outputPath, output);

    console.log(`\n✅ Complete!`);
    console.log(`   Output saved to: ${path.resolve(outputPath)}`);
    console.log(`   Ready for BigCommerce import.\n`);
}

// Run
main().catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
});
