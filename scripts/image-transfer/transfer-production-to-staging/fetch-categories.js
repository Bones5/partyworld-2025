#!/usr/bin/env node

/**
 * Fetch categories from BigCommerce and create ID-to-path mapping
 */

const fs = require('fs');
const path = require('path');

// Load production config
const envDir = path.join(__dirname, '..', '..', '..', 'environments');
const config = JSON.parse(fs.readFileSync(path.join(envDir, 'production.config.json'), 'utf-8'));
const secrets = JSON.parse(fs.readFileSync(path.join(envDir, 'production.secrets.json'), 'utf-8'));

const API_BASE = `https://api.bigcommerce.com/stores/${config.storeHash}/v3`;
const HEADERS = {
    'X-Auth-Token': secrets.accessToken,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function apiRequest(endpoint) {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, { headers: HEADERS });
    
    if (response.status === 429) {
        const retryAfter = parseInt(response.headers.get('X-Rate-Limit-Time-Reset-Ms') || '1000', 10);
        console.log(`   ⏳ Rate limited, waiting ${retryAfter}ms...`);
        await sleep(retryAfter);
        return apiRequest(endpoint);
    }
    
    if (!response.ok) {
        throw new Error(`API error ${response.status}: ${await response.text()}`);
    }
    
    return response.json();
}

async function getAllCategories() {
    const categories = [];
    let page = 1;
    const limit = 250;
    
    console.log('📦 Fetching categories from production...');
    
    while (true) {
        const response = await apiRequest(`/catalog/categories?page=${page}&limit=${limit}`);
        const data = response.data || [];
        
        if (data.length === 0) break;
        
        categories.push(...data);
        console.log(`   Page ${page}: found ${data.length} categories (total: ${categories.length})`);
        
        if (data.length < limit) break;
        page++;
        await sleep(200);
    }
    
    return categories;
}

function buildCategoryPaths(categories) {
    // Build a map of id -> category
    const categoryMap = {};
    for (const cat of categories) {
        categoryMap[cat.id] = cat;
    }
    
    // Build full paths
    const pathMap = {};
    
    function getPath(cat) {
        if (!cat) return '';
        if (cat.parent_id === 0) {
            return cat.name;
        }
        const parent = categoryMap[cat.parent_id];
        if (parent) {
            return getPath(parent) + '/' + cat.name;
        }
        return cat.name;
    }
    
    for (const cat of categories) {
        pathMap[cat.id] = getPath(cat);
    }
    
    return pathMap;
}

async function main() {
    console.log('\n🏷️  BigCommerce Category Mapper');
    console.log('================================\n');
    
    const categories = await getAllCategories();
    const pathMap = buildCategoryPaths(categories);
    
    // Save mapping
    const outputPath = path.join(__dirname, 'category-mapping.json');
    fs.writeFileSync(outputPath, JSON.stringify(pathMap, null, 2));
    
    console.log(`\n✅ Saved category mapping to ${outputPath}`);
    console.log(`   Total categories: ${Object.keys(pathMap).length}`);
    
    // Show some examples
    console.log('\n📋 Sample mappings:');
    const sample = Object.entries(pathMap).slice(0, 5);
    for (const [id, path] of sample) {
        console.log(`   ${id} → ${path}`);
    }
}

main().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
