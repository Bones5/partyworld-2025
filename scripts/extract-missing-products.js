#!/usr/bin/env node
/**
 * Extract Missing Products for Staging Import
 *
 * Reads the production CSV and mapping file to identify products
 * that don't exist on staging, then creates a new CSV for import.
 *
 * Usage: node scripts/extract-missing-products.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CSV_PATH = path.join(__dirname, 'image-transfer/transfer-production-to-staging/product_20251204_172825.csv');
const MAPPING_PATH = path.join(__dirname, 'product-id-mapping.json');
const OUTPUT_CSV = path.join(__dirname, 'missing-products-for-import.csv');
const MISSING_SKUS_PATH = path.join(__dirname, 'missing-skus.txt');

/**
 * Parse CSV line handling quoted values with commas
 */
function parseCSVLine(line) {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Escaped quote
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
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
 * Escape value for CSV output
 */
function escapeCSV(value) {
    if (value === undefined || value === null) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/**
 * Main function
 */
function main() {
    console.log('=== Extract Missing Products for Staging Import ===\n');

    // Load mapping (production ID -> staging ID)
    console.log('Loading product mapping...');
    const mapping = JSON.parse(fs.readFileSync(MAPPING_PATH, 'utf-8'));
    const mappedProductionIds = new Set(Object.keys(mapping).map(id => parseInt(id, 10)));
    console.log(`Found ${mappedProductionIds.size} products already on staging\n`);

    // Read CSV
    console.log('Reading production CSV...');
    const csvContent = fs.readFileSync(CSV_PATH, 'utf-8');
    const lines = csvContent.split('\n');
    const header = lines[0];
    const headerValues = parseCSVLine(header);

    // Find column indices (before any removals)
    const idIndex = headerValues.indexOf('ID');
    const typeIndex = headerValues.indexOf('Type');
    const skuIndex = headerValues.indexOf('SKU');
    const nameIndex = headerValues.indexOf('Name');
    const channelsIndex = headerValues.indexOf('Channels');
    const brandIdIndex = headerValues.indexOf('Brand ID');
    const weightIndex = headerValues.indexOf('Weight');
    const freeShippingIndex = headerValues.indexOf('Free Shipping');
    const productUrlIndex = headerValues.indexOf('Product URL');
    const categoriesIndex = headerValues.indexOf('Categories');

    console.log(`Column indices: ID=${idIndex}, Name=${nameIndex}, FreeShipping=${freeShippingIndex}, ProductURL=${productUrlIndex}, Categories=${categoriesIndex}, Weight=${weightIndex}`);

    // Track columns to remove (in descending order to avoid index shifting)
    const columnsToRemove = [idIndex, brandIdIndex].filter(i => i >= 0).sort((a, b) => b - a);

    // Invalid category IDs on staging (these don't exist)
    const invalidCategoryIds = new Set([
        '619', '697', '698', '699', '704', '708', '712', '716', '717', '718', '721', '589',
    ]);

    console.log(`CSV has ${lines.length - 1} total rows\n`);

    // Collect missing products and their variants
    const missingProducts = [];
    const missingProductIds = new Set();
    const missingSKUs = [];
    let variantCount = 0;

    /**
     * Generate a URL slug from product name
     */
    function generateSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .substring(0, 80);
    }

    /**
     * Clean row: fix validation issues
     */
    function cleanRow(line) {
        const values = parseCSVLine(line);

        // Remove channel 1125426
        if (channelsIndex >= 0 && values[channelsIndex]) {
            const channels = values[channelsIndex]
                .split(';')
                .filter(ch => ch.trim() !== '1125426')
                .join(';');
            values[channelsIndex] = channels;
        }

        // Ensure weight has a value (default to 0.1 if empty or 0)
        if (weightIndex >= 0) {
            const weight = parseFloat(values[weightIndex]) || 0;
            if (weight <= 0) {
                values[weightIndex] = '0.1';
            }
        }

        // Ensure Free Shipping has a value (default to FALSE)
        if (freeShippingIndex >= 0) {
            const freeShipping = values[freeShippingIndex]?.trim().toUpperCase();
            if (freeShipping !== 'TRUE' && freeShipping !== 'FALSE') {
                values[freeShippingIndex] = 'FALSE';
            }
        }

        // Ensure Product URL has a value (generate from name if missing)
        if (productUrlIndex >= 0 && !values[productUrlIndex]?.trim()) {
            const name = values[nameIndex] || 'product';
            values[productUrlIndex] = `/${generateSlug(name)}/`;
        }

        // Remove invalid category IDs
        if (categoriesIndex >= 0 && values[categoriesIndex]) {
            const categories = values[categoriesIndex]
                .split(';')
                .filter(cat => !invalidCategoryIds.has(cat.trim()))
                .join(';');
            values[categoriesIndex] = categories || '65'; // Default to category 65 if all removed
        }

        // Remove columns (in descending order to avoid index shifting)
        for (const idx of columnsToRemove) {
            values.splice(idx, 1);
        }

        return values.map(escapeCSV).join(',');
    }

    /**
     * Remove ID and Brand ID columns from header
     */
    function cleanHeader(headerLine) {
        const values = parseCSVLine(headerLine);
        for (const idx of columnsToRemove) {
            values.splice(idx, 1);
        }
        return values.map(escapeCSV).join(',');
    }

    // First pass: identify missing parent products
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCSVLine(line);
        const type = values[typeIndex];
        const id = parseInt(values[idIndex], 10);
        const sku = values[skuIndex]?.trim();

        // Only check parent products (physical/digital)
        if (type === 'physical' || type === 'digital') {
            if (!mappedProductionIds.has(id)) {
                missingProductIds.add(id);
                missingSKUs.push(sku);
            }
        }
    }

    console.log(`Found ${missingProductIds.size} missing parent products\n`);

    // Second pass: collect missing products and their variants
    let currentParentId = null;
    let collectingVariants = false;

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCSVLine(line);
        const type = values[typeIndex];
        const id = parseInt(values[idIndex], 10);

        if (type === 'physical' || type === 'digital') {
            // Parent product
            if (missingProductIds.has(id)) {
                missingProducts.push(cleanRow(line));
                currentParentId = id;
                collectingVariants = true;
            } else {
                collectingVariants = false;
                currentParentId = null;
            }
        } else if (type === 'variant' && collectingVariants) {
            // Variant of a missing product
            missingProducts.push(cleanRow(line));
            variantCount++;
        }
    }

    console.log(`Collected ${missingProducts.length} rows (${missingProductIds.size} products + ${variantCount} variants)\n`);

    // Write output CSV
    console.log('Writing output CSV...');
    const cleanedHeader = cleanHeader(header);
    const outputContent = `${cleanedHeader}\n${missingProducts.join('\n')}`;
    fs.writeFileSync(OUTPUT_CSV, outputContent);
    console.log(`Saved to: ${OUTPUT_CSV}\n`);

    // Write missing SKUs list
    fs.writeFileSync(MISSING_SKUS_PATH, missingSKUs.join('\n'));
    console.log(`Missing SKUs saved to: ${MISSING_SKUS_PATH}\n`);

    // Summary
    console.log('=== Summary ===');
    console.log('Total production products: 8,492');
    console.log(`Already on staging: ${mappedProductionIds.size}`);
    console.log(`Missing products: ${missingProductIds.size}`);
    console.log(`Missing + variants rows: ${missingProducts.length}`);
    console.log(`\nOutput file ready for BigCommerce import: ${OUTPUT_CSV}`);

    console.log('\n=== Import Instructions ===');
    console.log('1. Go to BigCommerce Admin → Products → Import');
    console.log('2. Select "Add new products and update existing products"');
    console.log('3. Upload the generated CSV file');
    console.log('4. Map columns and complete import');
    console.log('\nNote: Images will need to be handled separately.');
}

main();
