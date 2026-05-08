#!/usr/bin/env node
/**
 * Update Category Intro Widget Flag
 *
 * Sets a metafield on categories that have h1_content in content_import.json,
 * indicating they should use the Page Builder intro widget instead of the
 * category description at the top of the page.
 *
 * Usage:
 *   node scripts/update-category-intro-flag.js [--dry-run] [--slug=category-slug]
 *
 * Environment variables required:
 *   BC_STORE_HASH - Your BigCommerce store hash
 *   BC_ACCESS_TOKEN - Your BigCommerce API access token
 */

const fs = require('fs');
const path = require('path');

// Configuration
const STORE_HASH = process.env.BC_STORE_HASH;
const ACCESS_TOKEN = process.env.BC_ACCESS_TOKEN;
const API_BASE = `https://api.bigcommerce.com/stores/${STORE_HASH}`;

// Metafield configuration
const METAFIELD_NAMESPACE = 'theme';
const METAFIELD_KEY = 'use_intro_widget';

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SINGLE_SLUG = args.find(a => a.startsWith('--slug='))?.split('=')[1];
const VERBOSE = args.includes('--verbose');

// Validate environment
if (!STORE_HASH || !ACCESS_TOKEN) {
    console.error('❌ Missing required environment variables:');
    console.error('   BC_STORE_HASH and BC_ACCESS_TOKEN must be set');
    console.error('\nExample:');
    console.error('   export BC_STORE_HASH="your-store-hash"');
    console.error('   export BC_ACCESS_TOKEN="your-api-token"');
    process.exit(1);
}

// API helper with rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 250; // ms between requests

async function apiRequest(endpoint, options = {}) {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
    }
    lastRequestTime = Date.now();

    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            'X-Auth-Token': ACCESS_TOKEN,
            'Content-Type': 'application/json',
            Accept: 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`API Error ${response.status}: ${error}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

// Get all categories with pagination
async function getAllCategories() {
    const categories = [];
    let page = 1;
    let hasMore = true;

    console.log('📦 Fetching all categories...');
    while (hasMore) {
        const response = await apiRequest(`/v3/catalog/categories?page=${page}&limit=250`);
        categories.push(...response.data);
        hasMore = response.data.length === 250;
        page++;
    }
    console.log(`   Found ${categories.length} categories`);

    return categories;
}

// Find category by URL slug
function findCategoryBySlug(categories, slug) {
    const urlPath = `/${slug}/`;
    return categories.find(cat => cat.custom_url?.url === urlPath
        || cat.custom_url?.url === `/${slug}`
        || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug);
}

// Get existing metafield for a category
async function getCategoryMetafield(categoryId) {
    try {
        const response = await apiRequest(
            `/v3/catalog/categories/${categoryId}/metafields?namespace=${METAFIELD_NAMESPACE}&key=${METAFIELD_KEY}`,
        );
        return response.data?.[0] || null;
    } catch (e) {
        return null;
    }
}

// Create or update category metafield
async function setCategoryMetafield(categoryId, value) {
    const existing = await getCategoryMetafield(categoryId);

    if (DRY_RUN) {
        if (existing) {
            console.log(`   [DRY RUN] Would update metafield for category ${categoryId} to "${value}"`);
        } else {
            console.log(`   [DRY RUN] Would create metafield for category ${categoryId} with value "${value}"`);
        }
        return { success: true, dryRun: true };
    }

    const metafieldData = {
        namespace: METAFIELD_NAMESPACE,
        key: METAFIELD_KEY,
        value,
        permission_set: 'read_and_sf_access', // Allow storefront access
    };

    if (existing) {
        // Update existing metafield
        await apiRequest(`/v3/catalog/categories/${categoryId}/metafields/${existing.id}`, {
            method: 'PUT',
            body: JSON.stringify(metafieldData),
        });
        return { success: true, action: 'updated' };
    }
    // Create new metafield
    await apiRequest(`/v3/catalog/categories/${categoryId}/metafields`, {
        method: 'POST',
        body: JSON.stringify(metafieldData),
    });
    return { success: true, action: 'created' };
}

// Main function
async function main() {
    console.log('🚀 Category Intro Widget Flag Updater\n');

    if (DRY_RUN) {
        console.log('⚠️  DRY RUN MODE - No changes will be made\n');
    }

    // Load content import data
    const contentPath = path.join(__dirname, 'content_import.json');
    if (!fs.existsSync(contentPath)) {
        console.error('❌ content_import.json not found');
        process.exit(1);
    }

    const contentData = JSON.parse(fs.readFileSync(contentPath, 'utf-8'));
    console.log(`📄 Loaded ${Object.keys(contentData).length} entries from content_import.json\n`);

    // Get all categories
    const categories = await getAllCategories();

    // Track results
    const results = {
        updated: 0,
        created: 0,
        skipped: 0,
        notFound: 0,
        errors: 0,
    };

    // Process each content entry
    const entries = Object.entries(contentData);
    for (const [slug, content] of entries) {
        // Skip if filtering by single slug
        if (SINGLE_SLUG && slug !== SINGLE_SLUG) {
            continue;
        }

        // Check if this entry has h1_content (intro widget content)
        const hasIntroContent = content.h1_content && content.h1_content.trim().length > 0;

        if (!hasIntroContent) {
            if (VERBOSE) {
                console.log(`⏭️  ${slug}: No h1_content, skipping`);
            }
            results.skipped++;
            continue;
        }

        // Find the category
        const category = findCategoryBySlug(categories, slug);
        if (!category) {
            console.log(`❓ ${slug}: Category not found`);
            results.notFound++;
            continue;
        }

        console.log(`📝 ${slug} (ID: ${category.id}): Has intro content`);

        try {
            const result = await setCategoryMetafield(category.id, 'true');
            if (result.action === 'updated') {
                results.updated++;
                console.log('   ✅ Metafield updated');
            } else if (result.action === 'created') {
                results.created++;
                console.log('   ✅ Metafield created');
            } else if (result.dryRun) {
                // Already logged in setCategoryMetafield
            }
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            results.errors++;
        }
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log(`   Created: ${results.created}`);
    console.log(`   Updated: ${results.updated}`);
    console.log(`   Skipped (no h1_content): ${results.skipped}`);
    console.log(`   Not found: ${results.notFound}`);
    console.log(`   Errors: ${results.errors}`);

    if (DRY_RUN) {
        console.log('\n⚠️  This was a dry run. Run without --dry-run to apply changes.');
    }
}

main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
});
