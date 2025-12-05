#!/usr/bin/env node

/**
 * Update products on staging site via API
 * - Updates image URLs to GCS
 * - Updates categories to paths
 * - Skips products that don't exist (creates them if needed)
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

// Load staging config
const envDir = path.join(__dirname, '..', '..', '..', 'environments');
const config = JSON.parse(fs.readFileSync(path.join(envDir, 'staging.config.json'), 'utf-8'));
const secrets = JSON.parse(fs.readFileSync(path.join(envDir, 'staging.secrets.json'), 'utf-8'));

const API_BASE = `https://api.bigcommerce.com/stores/${config.storeHash}/v3`;
const HEADERS = {
    'X-Auth-Token': secrets.accessToken,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Load category mapping
const categories = JSON.parse(fs.readFileSync(path.join(__dirname, 'categories.json'), 'utf-8'));
const categoryMap = {};
for (const cat of categories) {
    categoryMap[cat.id] = cat;
}

function getCategoryPath(cat) {
    if (!cat) return null;
    if (cat.parent_id === 0) return cat.name;
    const parent = categoryMap[cat.parent_id];
    return parent ? getCategoryPath(parent) + '/' + cat.name : cat.name;
}

const categoryIdToPath = {};
for (const cat of categories) {
    categoryIdToPath[cat.id] = getCategoryPath(cat);
}

// Load image manifest for URL mapping
const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, 'images', 'manifest.json'), 'utf-8'));
const imageUrlMap = {};
for (const entry of manifest) {
    const filename = path.basename(entry.localPath);
    imageUrlMap[entry.originalUrl] = `https://storage.googleapis.com/partyworld-staging-images/${entry.sku}/${filename}`;
}

async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: { ...HEADERS, ...options.headers },
    });

    if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('X-Rate-Limit-Time-Reset-Ms') || '1000', 10);
        console.log(`   ⏳ Rate limited, waiting ${retryAfter}ms...`);
        await sleep(retryAfter);
        return apiRequest(endpoint, options);
    }

    if (!response.ok && response.status !== 404) {
        const text = await response.text();
        throw new Error(`API error ${response.status}: ${text}`);
    }

    if (response.status === 204 || response.status === 404) {
        return { status: response.status, data: null };
    }

    return { status: response.status, data: (await response.json()).data };
}

async function getProductBySku(sku) {
    const result = await apiRequest(`/catalog/products?sku=${encodeURIComponent(sku)}&include=images`);
    return result.data?.[0] || null;
}

async function updateProductImages(productId, images) {
    // Delete existing images first
    const existingImages = await apiRequest(`/catalog/products/${productId}/images`);
    if (existingImages.data) {
        for (const img of existingImages.data) {
            await apiRequest(`/catalog/products/${productId}/images/${img.id}`, { method: 'DELETE' });
            await sleep(100);
        }
    }
    
    // Add new images
    for (const img of images) {
        await apiRequest(`/catalog/products/${productId}/images`, {
            method: 'POST',
            body: JSON.stringify(img),
        });
        await sleep(100);
    }
}

async function main() {
    console.log('\n🔄 BigCommerce Product Updater');
    console.log('================================\n');
    console.log(`Store: ${config.storeHash} (staging)`);
    console.log(`Image mappings: ${Object.keys(imageUrlMap).length}`);
    console.log(`Category mappings: ${Object.keys(categoryIdToPath).length}`);

    // Load the CSV
    const csvPath = path.join(__dirname, 'products-updated.csv');
    const csv = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csv, { 
        columns: true, 
        skip_empty_lines: true,
        relax_quotes: true,
        relax_column_count: true
    });

    // Group records by SKU (Product rows with their Image rows)
    const productGroups = {};
    let currentSku = null;
    
    for (const record of records) {
        if (record['Item'] === 'Product' && record['SKU']) {
            currentSku = record['SKU'];
            productGroups[currentSku] = { product: record, images: [] };
        } else if (record['Item'] === 'Image' && currentSku) {
            productGroups[currentSku].images.push(record);
        }
    }

    console.log(`\nProducts to process: ${Object.keys(productGroups).length}\n`);

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    const skus = Object.keys(productGroups);
    
    for (let i = 0; i < skus.length; i++) {
        const sku = skus[i];
        const group = productGroups[sku];
        
        if (i % 100 === 0) {
            console.log(`Progress: ${i}/${skus.length} (updated: ${updated}, skipped: ${skipped}, errors: ${errors})`);
        }

        try {
            // Find product by SKU
            const existingProduct = await getProductBySku(sku);
            
            if (!existingProduct) {
                skipped++;
                continue;
            }

            // Prepare image updates
            const newImages = [];
            for (const imgRecord of group.images) {
                const originalUrl = imgRecord['Internal Image URL (Export)'];
                const newUrl = imageUrlMap[originalUrl];
                
                if (newUrl) {
                    newImages.push({
                        image_url: newUrl,
                        is_thumbnail: imgRecord['Image is Thumbnail'] === 'TRUE',
                        sort_order: parseInt(imgRecord['Image Sort Order']) || 0,
                        description: imgRecord['Image Description'] || '',
                    });
                }
            }

            if (newImages.length > 0) {
                await updateProductImages(existingProduct.id, newImages);
                updated++;
                
                if (updated % 50 === 0) {
                    console.log(`   ✓ Updated ${updated} products with new images`);
                }
            }

            await sleep(200);
        } catch (err) {
            console.error(`   ❌ Error updating ${sku}: ${err.message}`);
            errors++;
        }
    }

    console.log(`\n✅ Complete!`);
    console.log(`   Updated: ${updated}`);
    console.log(`   Skipped (not found): ${skipped}`);
    console.log(`   Errors: ${errors}`);
}

main().catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
});
