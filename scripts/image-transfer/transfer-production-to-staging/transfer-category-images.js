#!/usr/bin/env node

/**
 * Transfer Category and Marketing Images
 * 
 * 1. Downloads category images from production
 * 2. Uploads to GCS
 * 3. Updates staging categories with new URLs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { execSync } = require('child_process');

const OUTPUT_DIR = path.join(__dirname, 'category-images');
const GCS_BUCKET = 'gs://partyworld-staging-images/categories';
const GCS_PUBLIC_URL = 'https://storage.googleapis.com/partyworld-staging-images/categories';

// Load staging config
const envDir = path.join(__dirname, '..', '..', '..', 'environments');
const stagingConfig = JSON.parse(fs.readFileSync(path.join(envDir, 'staging.config.json'), 'utf-8'));
const stagingSecrets = JSON.parse(fs.readFileSync(path.join(envDir, 'staging.secrets.json'), 'utf-8'));

const STAGING_API_BASE = `https://api.bigcommerce.com/stores/${stagingConfig.storeHash}/v3`;
const STAGING_HEADERS = {
    'X-Auth-Token': stagingSecrets.accessToken,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function downloadFile(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        const protocol = url.startsWith('https') ? https : http;
        
        protocol.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                downloadFile(response.headers.location, destPath).then(resolve).catch(reject);
                return;
            }
            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode} for ${url}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(destPath, () => {});
            reject(err);
        });
    });
}

async function apiRequest(endpoint, options = {}) {
    const url = `${STAGING_API_BASE}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: { ...STAGING_HEADERS, ...options.headers },
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

    if (response.status === 204) return null;
    return response.json();
}

async function main() {
    console.log('\n🖼️  Category & Marketing Image Transfer');
    console.log('=========================================\n');

    // Load categories
    const categories = JSON.parse(fs.readFileSync(path.join(__dirname, 'categories.json'), 'utf-8'));
    
    // Find categories with images
    const categoriesWithImages = categories.filter(c => c.image_url && c.image_url.trim());
    console.log(`📁 Found ${categoriesWithImages.length} categories with images\n`);

    // Create output directory
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Step 1: Download images
    console.log('📥 Step 1: Downloading category images...\n');
    const imageMapping = [];
    let downloaded = 0;
    let failed = 0;

    for (const cat of categoriesWithImages) {
        const url = cat.image_url;
        const filename = `cat_${cat.id}_${path.basename(url).split('?')[0]}`;
        const destPath = path.join(OUTPUT_DIR, filename);

        try {
            if (!fs.existsSync(destPath)) {
                await downloadFile(url, destPath);
                downloaded++;
            }
            imageMapping.push({
                categoryId: cat.id,
                categoryName: cat.name,
                originalUrl: url,
                localPath: destPath,
                filename: filename,
                newUrl: `${GCS_PUBLIC_URL}/${filename}`,
            });
        } catch (err) {
            console.error(`   ❌ Failed to download ${cat.name}: ${err.message}`);
            failed++;
        }

        if ((downloaded + failed) % 20 === 0) {
            console.log(`   Downloaded ${downloaded}, failed ${failed}...`);
        }
    }

    console.log(`\n✅ Downloaded ${downloaded} images (${failed} failed)\n`);

    // Save mapping
    const mappingPath = path.join(__dirname, 'category-image-mapping.json');
    fs.writeFileSync(mappingPath, JSON.stringify(imageMapping, null, 2));
    console.log(`📄 Saved mapping to ${mappingPath}\n`);

    // Step 2: Upload to GCS
    console.log('📤 Step 2: Uploading to GCS...\n');
    try {
        execSync(`gsutil -m cp -r "${OUTPUT_DIR}/*" ${GCS_BUCKET}/`, { stdio: 'inherit' });
        console.log('\n✅ Upload complete!\n');
    } catch (err) {
        console.error('❌ GCS upload failed:', err.message);
        console.log('   You can manually upload with:');
        console.log(`   gsutil -m cp -r "${OUTPUT_DIR}/*" ${GCS_BUCKET}/\n`);
    }

    // Step 3: Update staging categories (if API has category scope)
    console.log('📝 Step 3: Category Image URL Mapping\n');
    console.log('   Since the API token may not have category write scope,');
    console.log('   here are the new URLs to update manually or via import:\n');
    
    // Create a simple mapping file for manual update
    const updateData = imageMapping.map(m => ({
        id: m.categoryId,
        name: m.categoryName,
        new_image_url: m.newUrl,
    }));
    
    const updatePath = path.join(__dirname, 'category-image-updates.json');
    fs.writeFileSync(updatePath, JSON.stringify(updateData, null, 2));
    console.log(`   Saved to: ${updatePath}`);
    console.log(`   Total: ${updateData.length} categories to update\n`);

    // Show sample
    console.log('📋 Sample updates:');
    for (const u of updateData.slice(0, 5)) {
        console.log(`   ${u.id}: ${u.name}`);
        console.log(`      → ${u.new_image_url}`);
    }

    console.log('\n✅ Transfer complete!');
    console.log('\nNext steps:');
    console.log('1. Verify images are accessible at GCS URLs');
    console.log('2. Import categories to staging with updated image_url');
    console.log('   Or update via API if token has category scope\n');
}

main().catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
});
