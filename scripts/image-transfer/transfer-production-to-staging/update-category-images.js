#!/usr/bin/env node

/**
 * Update Category Images via BigCommerce API
 * 
 * Updates staging categories with GCS image URLs from category-image-updates.json
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Staging config
const STORE_HASH = 'ma3w17th1k';
const ACCESS_TOKEN = 'p2ezz07sj031ptoj0akrod1075d35ik';

const UPDATES_FILE = path.join(__dirname, 'category-image-updates.json');

/**
 * Make API request
 */
async function apiRequest(method, endpoint, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.bigcommerce.com',
            path: `/stores/${STORE_HASH}/v3${endpoint}`,
            method,
            headers: {
                'X-Auth-Token': ACCESS_TOKEN,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve({ status: res.statusCode, data: data ? JSON.parse(data) : {} });
                    } catch {
                        resolve({ status: res.statusCode, data });
                    }
                } else {
                    reject({ status: res.statusCode, message: data });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

/**
 * Update a category's image URL
 */
async function updateCategoryImage(categoryId, imageUrl) {
    return apiRequest('PUT', `/catalog/categories/${categoryId}`, {
        image_url: imageUrl
    });
}

/**
 * Main function
 */
async function main() {
    console.log('🖼️  Category Image Updater');
    console.log('='.repeat(50));

    // Load updates
    if (!fs.existsSync(UPDATES_FILE)) {
        console.error('❌ category-image-updates.json not found!');
        console.log('   Run transfer-category-images.js first.');
        process.exit(1);
    }

    const updates = JSON.parse(fs.readFileSync(UPDATES_FILE, 'utf-8'));
    console.log(`📋 Found ${updates.length} categories to update\n`);

    let success = 0;
    let failed = 0;
    const errors = [];

    // Process in batches to avoid rate limits
    const BATCH_SIZE = 10;
    const DELAY_MS = 500;

    for (let i = 0; i < updates.length; i += BATCH_SIZE) {
        const batch = updates.slice(i, i + BATCH_SIZE);
        
        const results = await Promise.allSettled(
            batch.map(async (cat) => {
                try {
                    await updateCategoryImage(cat.id, cat.new_image_url);
                    return { success: true, id: cat.id, name: cat.name };
                } catch (err) {
                    return { success: false, id: cat.id, name: cat.name, error: err };
                }
            })
        );

        for (const result of results) {
            if (result.status === 'fulfilled' && result.value.success) {
                success++;
            } else {
                failed++;
                const val = result.status === 'fulfilled' ? result.value : result.reason;
                errors.push(val);
            }
        }

        // Progress update
        const progress = Math.min(i + BATCH_SIZE, updates.length);
        process.stdout.write(`\r   Progress: ${progress}/${updates.length} (✓ ${success} / ✗ ${failed})`);

        // Rate limit delay
        if (i + BATCH_SIZE < updates.length) {
            await new Promise(r => setTimeout(r, DELAY_MS));
        }
    }

    console.log('\n');
    console.log('='.repeat(50));
    console.log(`✅ Success: ${success}`);
    console.log(`❌ Failed: ${failed}`);

    if (errors.length > 0) {
        console.log('\n⚠️  Failed updates:');
        errors.slice(0, 10).forEach(err => {
            console.log(`   - ${err.name || err.id}: ${err.error?.status || 'unknown error'}`);
        });
        if (errors.length > 10) {
            console.log(`   ... and ${errors.length - 10} more`);
        }

        // Save errors for debugging
        fs.writeFileSync(
            path.join(__dirname, 'category-update-errors.json'),
            JSON.stringify(errors, null, 2)
        );
        console.log('\n   Saved to: category-update-errors.json');
    }
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
