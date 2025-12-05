#!/usr/bin/env node

/**
 * Transfer Homepage Banners & Page Builder Content
 * 
 * Downloads images from production widgets/placements, uploads to GCS,
 * then transfers widgets with updated image URLs to staging.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync, spawn } = require('child_process');

// Configuration
const PRODUCTION = {
    name: 'production',
    storeHash: '63na2lr4oh',
    accessToken: 'jzv8jfngz349rij9zy0v8i7vl4ggb3',
};

const STAGING = {
    name: 'staging',
    storeHash: 'ma3w17th1k',
    accessToken: 'p2ezz07sj031ptoj0akrod1075d35ik',
};

const GCS_BUCKET = 'gs://partyworld-staging-images';
const GCS_PUBLIC_URL = 'https://storage.googleapis.com/partyworld-staging-images';

const OUTPUT_DIR = path.join(__dirname, 'page-builder-content');
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images');

/**
 * Make API request
 */
async function apiRequest(config, method, endpoint, body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.bigcommerce.com',
            path: `/stores/${config.storeHash}/v3${endpoint}`,
            method,
            headers: {
                'X-Auth-Token': config.accessToken,
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
                        resolve(data ? JSON.parse(data) : {});
                    } catch {
                        resolve(data);
                    }
                } else {
                    reject({ status: res.statusCode, message: data, endpoint });
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

/**
 * Fetch all items with pagination
 */
async function fetchAll(config, endpoint, label) {
    const items = [];
    let page = 1;
    const limit = 50;

    console.log(`📦 Fetching ${label} from ${config.name}...`);

    while (true) {
        const sep = endpoint.includes('?') ? '&' : '?';
        const response = await apiRequest(config, 'GET', `${endpoint}${sep}page=${page}&limit=${limit}`);
        
        if (!response.data || response.data.length === 0) break;
        items.push(...response.data);
        if (response.data.length < limit) break;
        page++;
    }

    console.log(`   ✓ Found ${items.length} ${label}`);
    return items;
}

/**
 * Extract image URLs from content (recursive)
 */
function extractImageUrls(obj, urls = new Set()) {
    if (!obj) return urls;

    if (typeof obj === 'string') {
        // Match BigCommerce CDN URLs
        const cdnPattern = /https:\/\/cdn\d+\.bigcommerce\.com\/s-[a-z0-9]+\/(?:images|product_images|content)\/[^"'\s)>]+/gi;
        const matches = obj.match(cdnPattern);
        if (matches) {
            matches.forEach(url => urls.add(url));
        }
        return urls;
    }

    if (Array.isArray(obj)) {
        obj.forEach(item => extractImageUrls(item, urls));
        return urls;
    }

    if (typeof obj === 'object') {
        Object.values(obj).forEach(value => extractImageUrls(value, urls));
    }

    return urls;
}

/**
 * Download an image
 */
async function downloadImage(url, destPath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(destPath);
        
        const request = (url) => {
            const protocol = url.startsWith('https') ? https : require('http');
            protocol.get(url, (res) => {
                if (res.statusCode === 301 || res.statusCode === 302) {
                    request(res.headers.location);
                    return;
                }
                if (res.statusCode !== 200) {
                    reject(new Error(`HTTP ${res.statusCode}`));
                    return;
                }
                res.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(destPath);
                });
            }).on('error', reject);
        };

        request(url);
    });
}

/**
 * Upload directory to GCS
 */
function uploadToGcs(localDir, gcsPath) {
    console.log(`\n📤 Uploading to GCS: ${gcsPath}`);
    try {
        execSync(`gsutil -m cp -r "${localDir}/*" "${gcsPath}/"`, {
            stdio: 'inherit'
        });
        return true;
    } catch (err) {
        console.error('GCS upload failed:', err.message);
        return false;
    }
}

/**
 * Replace image URLs in content
 */
function replaceImageUrls(obj, urlMapping) {
    if (!obj) return obj;

    if (typeof obj === 'string') {
        let result = obj;
        for (const [oldUrl, newUrl] of Object.entries(urlMapping)) {
            result = result.split(oldUrl).join(newUrl);
        }
        return result;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => replaceImageUrls(item, urlMapping));
    }

    if (typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = replaceImageUrls(value, urlMapping);
        }
        return result;
    }

    return obj;
}

/**
 * Main transfer function
 */
async function main() {
    console.log('🎨 Page Builder Content Transfer');
    console.log('='.repeat(60));
    console.log(`📤 Source: ${PRODUCTION.name}`);
    console.log(`📥 Target: ${STAGING.name}`);
    console.log('='.repeat(60));

    // Create output directories
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

    // Step 1: Fetch widget templates
    console.log('\n--- Widget Templates ---');
    let widgetTemplates = [];
    try {
        widgetTemplates = await fetchAll(PRODUCTION, '/content/widget-templates', 'widget templates');
    } catch (err) {
        console.log('   ⚠️  Could not fetch widget templates:', err.status || err.message);
    }

    // Step 2: Fetch widgets
    console.log('\n--- Widgets ---');
    let widgets = [];
    try {
        widgets = await fetchAll(PRODUCTION, '/content/widgets', 'widgets');
    } catch (err) {
        console.log('   ⚠️  Could not fetch widgets:', err.status || err.message);
    }

    // Step 3: Fetch placements (where widgets are placed)
    console.log('\n--- Placements ---');
    let placements = [];
    try {
        placements = await fetchAll(PRODUCTION, '/content/placements', 'placements');
    } catch (err) {
        console.log('   ⚠️  Could not fetch placements:', err.status || err.message);
    }

    // Step 4: Fetch content pages
    console.log('\n--- Pages ---');
    let pages = [];
    try {
        pages = await fetchAll(PRODUCTION, '/content/pages', 'pages');
    } catch (err) {
        console.log('   ⚠️  Could not fetch pages:', err.status || err.message);
    }

    // Save raw data for reference
    fs.writeFileSync(path.join(OUTPUT_DIR, 'widget-templates.json'), JSON.stringify(widgetTemplates, null, 2));
    fs.writeFileSync(path.join(OUTPUT_DIR, 'widgets.json'), JSON.stringify(widgets, null, 2));
    fs.writeFileSync(path.join(OUTPUT_DIR, 'placements.json'), JSON.stringify(placements, null, 2));
    fs.writeFileSync(path.join(OUTPUT_DIR, 'pages.json'), JSON.stringify(pages, null, 2));
    console.log('\n💾 Saved raw content data');

    // Step 5: Extract all image URLs
    console.log('\n--- Extracting Images ---');
    const allImageUrls = new Set();
    
    [widgetTemplates, widgets, placements, pages].forEach(items => {
        items.forEach(item => extractImageUrls(item, allImageUrls));
    });

    console.log(`   📷 Found ${allImageUrls.size} unique image URLs`);

    // Step 6: Download images
    if (allImageUrls.size > 0) {
        console.log('\n--- Downloading Images ---');
        const urlMapping = {};
        let downloaded = 0;
        let failed = 0;

        for (const url of allImageUrls) {
            try {
                // Create filename from URL
                const urlPath = new URL(url).pathname;
                const filename = urlPath.split('/').pop() || `image_${downloaded}.jpg`;
                const safeName = `content_${Date.now()}_${filename}`.replace(/[^a-zA-Z0-9._-]/g, '_');
                const localPath = path.join(IMAGES_DIR, safeName);

                await downloadImage(url, localPath);
                
                // Create mapping
                const gcsUrl = `${GCS_PUBLIC_URL}/content/${safeName}`;
                urlMapping[url] = gcsUrl;
                downloaded++;

                process.stdout.write(`\r   Downloaded: ${downloaded}/${allImageUrls.size}`);
            } catch (err) {
                failed++;
                // Keep original URL if download fails
            }
        }

        console.log(`\n   ✓ Downloaded: ${downloaded}, Failed: ${failed}`);

        // Save URL mapping
        fs.writeFileSync(path.join(OUTPUT_DIR, 'image-url-mapping.json'), JSON.stringify(urlMapping, null, 2));

        // Step 7: Upload to GCS
        if (downloaded > 0) {
            const gcsPath = `${GCS_BUCKET}/content`;
            if (uploadToGcs(IMAGES_DIR, gcsPath)) {
                console.log('   ✅ Images uploaded to GCS');

                // Step 8: Update widgets with new URLs
                console.log('\n--- Updating Content with GCS URLs ---');
                
                const updatedWidgets = widgets.map(w => replaceImageUrls(w, urlMapping));
                const updatedPlacements = placements.map(p => replaceImageUrls(p, urlMapping));
                const updatedPages = pages.map(p => replaceImageUrls(p, urlMapping));
                const updatedTemplates = widgetTemplates.map(t => replaceImageUrls(t, urlMapping));

                fs.writeFileSync(path.join(OUTPUT_DIR, 'widgets-updated.json'), JSON.stringify(updatedWidgets, null, 2));
                fs.writeFileSync(path.join(OUTPUT_DIR, 'placements-updated.json'), JSON.stringify(updatedPlacements, null, 2));
                fs.writeFileSync(path.join(OUTPUT_DIR, 'pages-updated.json'), JSON.stringify(updatedPages, null, 2));
                fs.writeFileSync(path.join(OUTPUT_DIR, 'widget-templates-updated.json'), JSON.stringify(updatedTemplates, null, 2));

                console.log('   💾 Saved updated content with GCS URLs');
            }
        }
    }

    // Step 9: Transfer to staging
    console.log('\n--- Transferring to Staging ---');
    
    // Load updated content
    const updatedWidgets = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, 'widgets-updated.json'), 'utf-8'));
    const updatedPlacements = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, 'placements-updated.json'), 'utf-8'));
    const updatedTemplates = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, 'widget-templates-updated.json'), 'utf-8'));

    // Get existing staging content for comparison
    let stagingTemplates = [];
    let stagingWidgets = [];
    try {
        stagingTemplates = await fetchAll(STAGING, '/content/widget-templates', 'staging templates');
        stagingWidgets = await fetchAll(STAGING, '/content/widgets', 'staging widgets');
    } catch (err) {
        console.log('   Note: Could not fetch staging content for comparison');
    }

    const stagingTemplateNames = new Set(stagingTemplates.map(t => t.name));
    const stagingWidgetNames = new Set(stagingWidgets.map(w => w.name));

    // Transfer widget templates (skip if already exists)
    let templatesCreated = 0;
    let templatesSkipped = 0;
    
    for (const template of updatedTemplates) {
        if (stagingTemplateNames.has(template.name)) {
            templatesSkipped++;
            continue;
        }
        
        try {
            const { uuid, date_created, date_modified, current_version_uuid, ...createData } = template;
            await apiRequest(STAGING, 'POST', '/content/widget-templates', createData);
            templatesCreated++;
            process.stdout.write(`\r   Templates: ${templatesCreated} created, ${templatesSkipped} skipped`);
        } catch (err) {
            // Skip on error (might be duplicate)
            templatesSkipped++;
        }
    }
    console.log(`\n   ✓ Templates: ${templatesCreated} created, ${templatesSkipped} skipped`);

    // Transfer widgets (skip if already exists by name)
    let widgetsCreated = 0;
    let widgetsSkipped = 0;
    
    for (const widget of updatedWidgets) {
        if (stagingWidgetNames.has(widget.name)) {
            widgetsSkipped++;
            continue;
        }

        try {
            // Map widget template UUID if needed
            const { uuid, date_created, date_modified, ...createData } = widget;
            
            // Find matching template in staging by name
            if (widget.widget_template && widget.widget_template.uuid) {
                const prodTemplate = widgetTemplates.find(t => t.uuid === widget.widget_template.uuid);
                if (prodTemplate) {
                    const stagingTemplate = stagingTemplates.find(t => t.name === prodTemplate.name);
                    if (stagingTemplate) {
                        createData.widget_template_uuid = stagingTemplate.uuid;
                    }
                }
            }
            
            delete createData.widget_template;
            
            await apiRequest(STAGING, 'POST', '/content/widgets', createData);
            widgetsCreated++;
            process.stdout.write(`\r   Widgets: ${widgetsCreated} created, ${widgetsSkipped} skipped`);
        } catch (err) {
            widgetsSkipped++;
        }
    }
    console.log(`\n   ✓ Widgets: ${widgetsCreated} created, ${widgetsSkipped} skipped`);

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ Transfer Complete!');
    console.log('='.repeat(60));
    console.log(`\n📁 Output directory: ${OUTPUT_DIR}`);
    console.log('\nFiles saved:');
    console.log('   - widget-templates.json (original)');
    console.log('   - widgets.json (original)');
    console.log('   - placements.json (original)');
    console.log('   - pages.json (original)');
    console.log('   - *-updated.json (with GCS URLs)');
    console.log('   - image-url-mapping.json');
    console.log('\n💡 Check staging store to verify content is displaying correctly.');
}

main().catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
});
