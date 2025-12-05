#!/usr/bin/env node

/**
 * Update Staging Widgets with GCS Image URLs
 * 
 * Replaces production CDN URLs with GCS URLs in existing staging widgets
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Staging config
const STORE_HASH = 'ma3w17th1k';
const ACCESS_TOKEN = 'p2ezz07sj031ptoj0akrod1075d35ik';

const OUTPUT_DIR = path.join(__dirname, 'page-builder-content');
const MAPPING_FILE = path.join(OUTPUT_DIR, 'image-url-mapping.json');

/**
 * Make API request
 */
function apiRequest(method, endpoint, body = null) {
    return new Promise((resolve, reject) => {
        const bodyStr = body ? JSON.stringify(body) : null;
        
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

        if (bodyStr) {
            options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
        }

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
                    reject({ status: res.statusCode, message: data, endpoint });
                }
            });
        });

        req.on('error', reject);
        if (bodyStr) req.write(bodyStr);
        req.end();
    });
}

/**
 * Fetch all items with pagination
 */
async function fetchAll(endpoint, label) {
    const items = [];
    let page = 1;
    const limit = 50;

    console.log(`📦 Fetching ${label}...`);

    while (true) {
        const sep = endpoint.includes('?') ? '&' : '?';
        const response = await apiRequest('GET', `${endpoint}${sep}page=${page}&limit=${limit}`);
        
        if (!response.data?.data || response.data.data.length === 0) break;
        items.push(...response.data.data);
        if (response.data.data.length < limit) break;
        page++;
    }

    console.log(`   ✓ Found ${items.length} ${label}`);
    return items;
}

/**
 * Replace URLs in object recursively
 */
function replaceUrls(obj, urlMapping) {
    if (!obj) return obj;

    if (typeof obj === 'string') {
        let result = obj;
        for (const [oldUrl, newUrl] of Object.entries(urlMapping)) {
            // Exact match
            if (result === oldUrl) {
                result = newUrl;
            }
            // Partial replacement (for embedded URLs)
            result = result.split(oldUrl).join(newUrl);
        }
        return result;
    }

    if (Array.isArray(obj)) {
        return obj.map(item => replaceUrls(item, urlMapping));
    }

    if (typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
            result[key] = replaceUrls(value, urlMapping);
        }
        return result;
    }

    return obj;
}

/**
 * Check if object contains production URLs
 */
function containsProductionUrls(obj, productionPattern = 'cdn11.bigcommerce.com/s-63na2lr4oh') {
    const str = JSON.stringify(obj);
    return str.includes(productionPattern);
}

async function main() {
    console.log('🔄 Update Staging Widgets with GCS URLs');
    console.log('='.repeat(50));

    // Load URL mapping
    if (!fs.existsSync(MAPPING_FILE)) {
        console.error('❌ image-url-mapping.json not found!');
        console.log('   Run transfer-page-builder.js first.');
        process.exit(1);
    }

    const urlMapping = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf-8'));
    console.log(`📋 Loaded ${Object.keys(urlMapping).length} URL mappings\n`);

    // Fetch staging widgets
    const widgets = await fetchAll('/content/widgets', 'widgets');
    
    // Find widgets with production URLs
    const widgetsToUpdate = widgets.filter(w => containsProductionUrls(w));
    console.log(`\n🔍 Found ${widgetsToUpdate.length} widgets with production URLs\n`);

    if (widgetsToUpdate.length === 0) {
        console.log('✅ No widgets need updating');
        return;
    }

    // Update each widget
    let updated = 0;
    let failed = 0;
    const errors = [];

    for (const widget of widgetsToUpdate) {
        try {
            // Replace URLs in widget configuration
            const updatedConfig = replaceUrls(widget.widget_configuration, urlMapping);
            
            // Only update if there are actual changes
            if (JSON.stringify(updatedConfig) === JSON.stringify(widget.widget_configuration)) {
                console.log(`   ⏭️  ${widget.name}: No URL changes needed`);
                continue;
            }

            // Update the widget
            await apiRequest('PUT', `/content/widgets/${widget.uuid}`, {
                widget_configuration: updatedConfig
            });

            updated++;
            process.stdout.write(`\r   Progress: ${updated + failed}/${widgetsToUpdate.length} (✓ ${updated} updated)`);

        } catch (err) {
            failed++;
            errors.push({ name: widget.name, uuid: widget.uuid, error: err });
        }

        // Small delay to avoid rate limits
        await new Promise(r => setTimeout(r, 100));
    }

    console.log('\n');
    console.log('='.repeat(50));
    console.log(`✅ Updated: ${updated}`);
    console.log(`❌ Failed: ${failed}`);

    if (errors.length > 0) {
        console.log('\n⚠️  Failed updates:');
        errors.slice(0, 10).forEach(err => {
            console.log(`   - ${err.name}: ${err.error?.status || 'unknown'}`);
        });
        
        fs.writeFileSync(
            path.join(OUTPUT_DIR, 'widget-update-errors.json'),
            JSON.stringify(errors, null, 2)
        );
    }

    // Also update placements if needed
    console.log('\n--- Checking Placements ---');
    const placements = await fetchAll('/content/placements', 'placements');
    const placementsToUpdate = placements.filter(p => containsProductionUrls(p));
    
    if (placementsToUpdate.length > 0) {
        console.log(`🔍 Found ${placementsToUpdate.length} placements with production URLs`);
        
        let pUpdated = 0;
        for (const placement of placementsToUpdate) {
            try {
                const updatedConfig = replaceUrls(placement, urlMapping);
                
                await apiRequest('PUT', `/content/placements/${placement.uuid}`, {
                    widget_uuid: placement.widget_uuid,
                    template_file: placement.template_file,
                    region: placement.region,
                    sort_order: placement.sort_order,
                    status: placement.status
                });
                
                pUpdated++;
            } catch (err) {
                // Placements may not need config updates
            }
        }
        console.log(`   ✓ Placements processed: ${pUpdated}`);
    }

    console.log('\n✅ Done! Refresh the staging homepage to verify.');
}

main().catch(err => {
    console.error('\n❌ Fatal error:', err);
    process.exit(1);
});
