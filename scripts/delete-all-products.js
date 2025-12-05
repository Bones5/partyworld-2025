#!/usr/bin/env node

/**
 * Delete All Products from BigCommerce Store
 * 
 * ⚠️  WARNING: This script permanently deletes ALL products from the specified store.
 *     Use with extreme caution. There is no undo.
 * 
 * Usage:
 *   node delete-all-products.js --env staging
 *   node delete-all-products.js --env staging --dry-run
 */

const fs = require('fs');
const path = require('path');

// Parse command line arguments
const args = process.argv.slice(2);
let envName = 'staging';
let dryRun = false;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--env' && args[i + 1]) {
        envName = args[++i];
    } else if (args[i] === '--dry-run') {
        dryRun = true;
    }
}

// Load environment config
const envDir = path.join(__dirname, '..', 'environments');
const configPath = path.join(envDir, `${envName}.config.json`);
const secretsPath = path.join(envDir, `${envName}.secrets.json`);

if (!fs.existsSync(configPath)) {
    console.error(`❌ Config not found: ${configPath}`);
    process.exit(1);
}
if (!fs.existsSync(secretsPath)) {
    console.error(`❌ Secrets not found: ${secretsPath}`);
    process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf-8'));

const API_BASE = `https://api.bigcommerce.com/stores/${config.storeHash}/v3`;
const HEADERS = {
    'X-Auth-Token': secrets.accessToken,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
};

// Rate limiting
const RATE_LIMIT_DELAY = 200; // ms between requests
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Make API request with rate limiting
 */
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: { ...HEADERS, ...options.headers },
    });

    if (response.status === 429) {
        // Rate limited - wait and retry
        const retryAfter = parseInt(response.headers.get('X-Rate-Limit-Time-Reset-Ms') || '1000', 10);
        console.log(`   ⏳ Rate limited, waiting ${retryAfter}ms...`);
        await sleep(retryAfter);
        return apiRequest(endpoint, options);
    }

    if (!response.ok && response.status !== 204) {
        const text = await response.text();
        throw new Error(`API error ${response.status}: ${text}`);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

/**
 * Get all product IDs
 */
async function getAllProductIds() {
    const productIds = [];
    let page = 1;
    const limit = 250;

    console.log('📦 Fetching product IDs...');

    while (true) {
        const response = await apiRequest(`/catalog/products?page=${page}&limit=${limit}&include_fields=id`);
        const products = response.data || [];

        if (products.length === 0) break;

        for (const product of products) {
            productIds.push(product.id);
        }

        console.log(`   Page ${page}: found ${products.length} products (total: ${productIds.length})`);

        if (products.length < limit) break;
        page++;
        await sleep(RATE_LIMIT_DELAY);
    }

    return productIds;
}

/**
 * Delete products in batches
 */
async function deleteProducts(productIds) {
    const batchSize = 50; // BigCommerce allows batch delete
    let deleted = 0;

    console.log(`\n🗑️  Deleting ${productIds.length} products...`);

    for (let i = 0; i < productIds.length; i += batchSize) {
        const batch = productIds.slice(i, i + batchSize);
        const idsParam = batch.join(',');

        if (dryRun) {
            console.log(`   [DRY RUN] Would delete products: ${batch.slice(0, 5).join(', ')}${batch.length > 5 ? '...' : ''}`);
        } else {
            await apiRequest(`/catalog/products?id:in=${idsParam}`, {
                method: 'DELETE',
            });
            deleted += batch.length;
            console.log(`   Deleted ${deleted}/${productIds.length} products`);
        }

        await sleep(RATE_LIMIT_DELAY);
    }

    return deleted;
}

/**
 * Main
 */
async function main() {
    console.log('\n🚨 BigCommerce Product Deletion Script');
    console.log('=======================================\n');
    console.log(`Environment: ${envName}`);
    console.log(`Store Hash:  ${config.storeHash}`);
    console.log(`Store URL:   ${config.normalStoreUrl}`);
    console.log(`Dry Run:     ${dryRun ? 'YES (no changes will be made)' : 'NO (LIVE DELETE)'}`);
    console.log('');

    if (!dryRun) {
        console.log('⚠️  WARNING: This will PERMANENTLY DELETE all products!');
        console.log('    Press Ctrl+C within 5 seconds to cancel...\n');
        await sleep(5000);
    }

    // Get all product IDs
    const productIds = await getAllProductIds();

    if (productIds.length === 0) {
        console.log('\n✅ No products found. Store is already empty.');
        return;
    }

    console.log(`\n📊 Found ${productIds.length} products to delete.`);

    // Delete products
    const deleted = await deleteProducts(productIds);

    if (dryRun) {
        console.log(`\n✅ Dry run complete. Would have deleted ${productIds.length} products.`);
    } else {
        console.log(`\n✅ Deletion complete! Removed ${deleted} products.`);
    }
}

main().catch(err => {
    console.error('\n❌ Error:', err.message);
    process.exit(1);
});
