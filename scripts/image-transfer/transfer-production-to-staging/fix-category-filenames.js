#!/usr/bin/env node

/**
 * Fix category image filenames - remove special chars that break BigCommerce API
 * Then re-upload to GCS and update categories again
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

const GCS_BUCKET = 'gs://partyworld-staging-images/categories';
const GCS_PUBLIC_URL = 'https://storage.googleapis.com/partyworld-staging-images/categories';

const OUTPUT_DIR = path.join(__dirname, 'category-images');
const MAPPING_FILE = path.join(__dirname, 'category-image-updates.json');

const STORE_HASH = 'ma3w17th1k';
const ACCESS_TOKEN = 'p2ezz07sj031ptoj0akrod1075d35ik';

/**
 * Sanitize filename for BigCommerce
 */
function sanitizeFilename(name) {
    return name
        .replace(/%20/g, '_')
        .replace(/%26/g, '_')
        .replace(/%28/g, '_')
        .replace(/%29/g, '_')
        .replace(/\s+/g, '_')
        .replace(/&/g, '_')
        .replace(/\(/g, '_')
        .replace(/\)/g, '_')
        .replace(/[^a-zA-Z0-9._-]/g, '_')
        .replace(/__+/g, '_');
}

/**
 * API request
 */
async function updateCategoryImage(categoryId, imageUrl) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({ image_url: imageUrl });
        
        const options = {
            hostname: 'api.bigcommerce.com',
            path: `/stores/${STORE_HASH}/v3/catalog/categories/${categoryId}`,
            method: 'PUT',
            headers: {
                'X-Auth-Token': ACCESS_TOKEN,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
            },
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({ success: true });
                } else {
                    reject({ status: res.statusCode, message: data });
                }
            });
        });

        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function main() {
    console.log('🔧 Fixing Category Image Filenames');
    console.log('='.repeat(50));

    // Load current updates
    const updates = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf-8'));
    
    // Find ones with problematic characters
    const problematic = updates.filter(u => {
        const filename = path.basename(u.new_image_url);
        return filename !== sanitizeFilename(filename);
    });

    console.log(`\n📋 Found ${problematic.length} files with problematic names`);

    if (problematic.length === 0) {
        console.log('✅ All filenames are clean');
        return;
    }

    // Rename local files and track changes
    const renames = [];
    const newUpdates = [...updates];

    for (const item of problematic) {
        const oldFilename = path.basename(item.new_image_url);
        const newFilename = sanitizeFilename(oldFilename);
        
        const oldPath = path.join(OUTPUT_DIR, oldFilename);
        const newPath = path.join(OUTPUT_DIR, newFilename);
        
        if (fs.existsSync(oldPath)) {
            fs.renameSync(oldPath, newPath);
            renames.push({ old: oldFilename, new: newFilename });
        }

        // Update the mapping
        const idx = newUpdates.findIndex(u => u.id === item.id);
        if (idx !== -1) {
            newUpdates[idx].new_image_url = `${GCS_PUBLIC_URL}/${newFilename}`;
        }
    }

    console.log(`\n✅ Renamed ${renames.length} local files`);

    // Save updated mapping
    fs.writeFileSync(MAPPING_FILE, JSON.stringify(newUpdates, null, 2));
    console.log('💾 Updated category-image-updates.json');

    // Re-upload to GCS
    console.log('\n📤 Re-uploading to GCS...');
    try {
        execSync(`gsutil -m rsync -d "${OUTPUT_DIR}" "${GCS_BUCKET}"`, { stdio: 'inherit' });
        console.log('\n✅ GCS sync complete');
    } catch (err) {
        console.error('❌ GCS upload failed');
        return;
    }

    // Now retry the failed updates
    console.log('\n--- Retrying Failed Category Updates ---');
    
    const failedBefore = updates.filter(u => {
        const filename = path.basename(u.new_image_url);
        return filename !== sanitizeFilename(filename);
    });

    let success = 0;
    let failed = 0;

    for (const item of failedBefore) {
        const newUrl = `${GCS_PUBLIC_URL}/${sanitizeFilename(path.basename(item.new_image_url))}`;
        
        try {
            await updateCategoryImage(item.id, newUrl);
            success++;
            process.stdout.write(`\r   Progress: ${success + failed}/${failedBefore.length}`);
        } catch (err) {
            failed++;
        }
        
        // Small delay
        await new Promise(r => setTimeout(r, 100));
    }

    console.log(`\n\n✅ Success: ${success}`);
    console.log(`❌ Failed: ${failed}`);
}

main().catch(console.error);
