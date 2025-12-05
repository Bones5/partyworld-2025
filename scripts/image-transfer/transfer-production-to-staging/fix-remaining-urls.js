#!/usr/bin/env node

/**
 * Fix Remaining Production URLs in Staging Widgets
 * 
 * Does a more aggressive replacement of any remaining production CDN URLs
 */

const https = require('https');

const STORE_HASH = 'ma3w17th1k';
const ACCESS_TOKEN = 'p2ezz07sj031ptoj0akrod1075d35ik';
const PROD_CDN_PATTERN = /https:\/\/cdn\d+\.bigcommerce\.com\/s-63na2lr4oh\/[^"'\s]+/g;

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

async function fetchAllWidgets() {
    const widgets = [];
    let page = 1;
    const limit = 50;

    while (true) {
        const response = await apiRequest('GET', `/content/widgets?page=${page}&limit=${limit}`);
        if (!response.data?.data || response.data.data.length === 0) break;
        widgets.push(...response.data.data);
        if (response.data.data.length < limit) break;
        page++;
    }

    return widgets;
}

/**
 * Replace production URLs with corresponding GCS URL
 * This builds a new URL based on the filename
 */
function replaceProductionUrls(obj) {
    if (!obj) return { changed: false, result: obj };

    const str = JSON.stringify(obj);
    let changed = false;
    
    const newStr = str.replace(PROD_CDN_PATTERN, (match) => {
        changed = true;
        // Extract filename from URL
        const urlPath = match.split('/').pop().split('?')[0];
        // Use a generic GCS URL - we'll use the "original" size image
        return `https://storage.googleapis.com/partyworld-staging-images/content/content_1764942000000_${urlPath}`;
    });

    return { changed, result: JSON.parse(newStr) };
}

/**
 * More targeted approach - find URLs that 404 and replace with nearest match
 */
function fixProductionUrls(config, urlMapping) {
    const str = JSON.stringify(config);
    let changed = false;
    
    // Find all production URLs in this config
    const matches = str.match(PROD_CDN_PATTERN) || [];
    
    if (matches.length === 0) {
        return { changed: false, result: config };
    }

    let newStr = str;
    
    for (const oldUrl of matches) {
        // Try to find a matching GCS URL based on filename
        const filename = oldUrl.split('/').pop().split('?')[0];
        
        // Look for a GCS URL with the same filename
        let newUrl = null;
        for (const [prodUrl, gcsUrl] of Object.entries(urlMapping)) {
            if (prodUrl.includes(filename)) {
                newUrl = gcsUrl;
                break;
            }
        }
        
        if (newUrl) {
            newStr = newStr.split(oldUrl).join(newUrl);
            changed = true;
            console.log(`   Replacing: ${filename}`);
        } else {
            // Fallback: use a placeholder or the original URL
            console.log(`   ⚠️  No mapping for: ${filename}`);
        }
    }

    return { changed, result: JSON.parse(newStr) };
}

async function main() {
    console.log('🔧 Fix Remaining Production URLs');
    console.log('='.repeat(50));

    // Load URL mapping
    const fs = require('fs');
    const path = require('path');
    const mappingFile = path.join(__dirname, 'page-builder-content', 'image-url-mapping.json');
    const urlMapping = JSON.parse(fs.readFileSync(mappingFile, 'utf-8'));
    console.log(`📋 Loaded ${Object.keys(urlMapping).length} URL mappings\n`);

    // Fetch all widgets
    console.log('📦 Fetching all widgets...');
    const widgets = await fetchAllWidgets();
    console.log(`   Found ${widgets.length} widgets\n`);

    // Find widgets with production URLs
    const widgetsToFix = widgets.filter(w => {
        const str = JSON.stringify(w.widget_configuration);
        return str.includes('cdn11.bigcommerce.com/s-63na2lr4oh') || 
               str.includes('cdn11.bigcommerce.com/s-ma3w17th1k');
    });

    console.log(`🔍 Found ${widgetsToFix.length} widgets with production URLs\n`);

    if (widgetsToFix.length === 0) {
        console.log('✅ All widgets are clean!');
        return;
    }

    // Fix each widget
    let fixed = 0;
    let failed = 0;

    for (const widget of widgetsToFix) {
        console.log(`\n📝 Widget: ${widget.name} (${widget.uuid})`);
        
        const { changed, result } = fixProductionUrls(widget.widget_configuration, urlMapping);
        
        if (!changed) {
            console.log('   No changes needed');
            continue;
        }

        try {
            await apiRequest('PUT', `/content/widgets/${widget.uuid}`, {
                widget_configuration: result
            });
            fixed++;
            console.log('   ✅ Updated');
        } catch (err) {
            failed++;
            console.log(`   ❌ Failed: ${err.status}`);
        }

        await new Promise(r => setTimeout(r, 200));
    }

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Fixed: ${fixed}`);
    console.log(`❌ Failed: ${failed}`);
}

main().catch(console.error);
