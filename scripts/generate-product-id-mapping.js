#!/usr/bin/env node
/**
 * Generate Production to Staging Product ID Mapping
 *
 * Reads production product IDs and SKUs from CSV,
 * fetches staging products by SKU, and outputs a mapping object.
 *
 * Usage: node scripts/generate-product-id-mapping.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CSV_PATH = path.join(__dirname, 'image-transfer/transfer-production-to-staging/product_20251204_172825.csv');
const STAGING_CONFIG = require('../environments/staging.config.json');
const STAGING_SECRETS = require('../environments/staging.secrets.json');

const STORE_HASH = STAGING_CONFIG.storeHash;
const ACCESS_TOKEN = STAGING_SECRETS.accessToken;
const API_BASE = `https://api.bigcommerce.com/stores/${STORE_HASH}/v3`;

/**
 * Parse CSV file and extract product ID and SKU
 */
function parseCSV(csvPath) {
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n');

    // Parse header to find column indices
    const header = parseCSVLine(lines[0]);
    const idIndex = header.indexOf('ID');
    const skuIndex = header.indexOf('SKU');
    const nameIndex = header.indexOf('Name');
    const typeIndex = header.indexOf('Type');

    console.log(`Found columns - ID: ${idIndex}, SKU: ${skuIndex}, Name: ${nameIndex}`);

    const products = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCSVLine(line);
        const type = values[typeIndex];

        // Only include products (not variants)
        if (type !== 'physical' && type !== 'digital') continue;

        const id = parseInt(values[idIndex], 10);
        const sku = values[skuIndex]?.trim();
        const name = values[nameIndex];

        if (id && sku) {
            products.push({ id, sku, name });
        }
    }

    return products;
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            values.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    values.push(current);

    return values;
}

/**
 * Fetch product from staging by SKU
 */
async function fetchStagingProductBySKU(sku) {
    const url = `${API_BASE}/catalog/products?sku=${encodeURIComponent(sku)}&include_fields=id,sku,name`;

    try {
        const response = await fetch(url, {
            headers: {
                'X-Auth-Token': ACCESS_TOKEN,
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });

        if (!response.ok) {
            console.error(`API error for SKU ${sku}: ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (data.data && data.data.length > 0) {
            return data.data[0];
        }

        return null;
    } catch (error) {
        console.error(`Error fetching SKU ${sku}:`, error.message);
        return null;
    }
}

/**
 * Add delay between API calls
 */
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Main function
 */
async function main() {
    console.log('=== Production to Staging Product ID Mapping Generator ===\n');

    // Parse CSV
    console.log('Parsing CSV...');
    const products = parseCSV(CSV_PATH);
    console.log(`Found ${products.length} products in CSV\n`);

    // Build mapping
    const mapping = {};
    let found = 0;
    let notFound = 0;

    console.log('Fetching staging products by SKU...\n');

    for (let i = 0; i < products.length; i++) {
        const { id: prodId, sku, name } = products[i];

        process.stdout.write(`[${i + 1}/${products.length}] SKU: ${sku}... `);

        const stagingProduct = await fetchStagingProductBySKU(sku);

        if (stagingProduct) {
            mapping[prodId] = stagingProduct.id;
            console.log(`✓ ${prodId} → ${stagingProduct.id}`);
            found++;
        } else {
            console.log('✗ Not found');
            notFound++;
        }

        // Rate limit: 150ms between calls
        await delay(150);
    }

    console.log('\n=== Results ===');
    console.log(`Found: ${found}`);
    console.log(`Not found: ${notFound}`);
    console.log(`Total: ${products.length}\n`);

    // Output mapping as JS object
    console.log('=== JavaScript Mapping Object ===\n');
    console.log('const PRODUCTION_TO_STAGING_ID_MAP = {');

    const entries = Object.entries(mapping);
    entries.forEach(([prodId, stagingId], index) => {
        const comma = index < entries.length - 1 ? ',' : '';
        console.log(`    ${prodId}: ${stagingId}${comma}`);
    });

    console.log('};\n');

    // Also save to a JSON file
    const outputPath = path.join(__dirname, 'product-id-mapping.json');
    fs.writeFileSync(outputPath, JSON.stringify(mapping, null, 2));
    console.log(`Mapping saved to: ${outputPath}`);
}

main().catch(console.error);
