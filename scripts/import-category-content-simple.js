#!/usr/bin/env node
/**
 * Category Content Import Script (Description-based)
 *
 * Simpler version that imports all content to category description field.
 * This makes content editable directly in BigCommerce admin.
 *
 * Imports content from content_import.json:
 * - h1_content → First part of category description (intro at top of page)
 * - h2_sections → Appended to category description (SEO content)
 *
 * Usage:
 *   node scripts/import-category-content-simple.js [--dry-run] [--slug=category-slug]
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

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SINGLE_SLUG = args.find(a => a.startsWith('--slug='))?.split('=')[1];
const VERBOSE = args.includes('--verbose');
const SKIP_EXISTING = args.includes('--skip-existing');

// Validate environment
if (!STORE_HASH || !ACCESS_TOKEN) {
    console.error('❌ Missing required environment variables:');
    console.error('   BC_STORE_HASH and BC_ACCESS_TOKEN must be set');
    console.error('\nExample:');
    console.error('   export BC_STORE_HASH="your-store-hash"');
    console.error('   export BC_ACCESS_TOKEN="your-api-token"');
    process.exit(1);
}

// API helper
async function apiRequest(endpoint, options = {}) {
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

    while (hasMore) {
        const response = await apiRequest(`/v3/catalog/categories?page=${page}&limit=250`);
        categories.push(...response.data);
        hasMore = response.data.length === 250;
        page++;
    }

    return categories;
}

// Find category by URL slug
function findCategoryBySlug(categories, slug) {
    const urlPath = `/${slug}/`;
    return categories.find(cat => cat.custom_url?.url === urlPath
        || cat.custom_url?.url === `/${slug}`
        || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slug);
}

// Update category description
async function updateCategoryDescription(categoryId, description) {
    if (DRY_RUN) {
        console.log(`   [DRY RUN] Would update category ${categoryId} description`);
        return { success: true, dryRun: true };
    }

    await apiRequest(`/v3/catalog/categories/${categoryId}`, {
        method: 'PUT',
        body: JSON.stringify({ description }),
    });

    return { success: true };
}

// Format h1_content to HTML paragraphs
function formatH1ContentToHtml(content) {
    if (!content) return '';

    const paragraphs = content.split('\n\n').filter(p => p.trim());
    return paragraphs.map(p => {
        const text = p.replace(/\n/g, ' ').trim();
        return `<p>${text}</p>`;
    }).join('\n');
}

// Format h2_sections into HTML
function formatH2SectionsToHtml(h2Sections) {
    if (!h2Sections || !Array.isArray(h2Sections) || h2Sections.length === 0) {
        return '';
    }

    return h2Sections.map(section => {
        let html = '';
        if (section.heading) {
            html += `<h2>${section.heading}</h2>\n`;
        }
        if (section.content) {
            const paragraphs = section.content.split('\n\n').filter(p => p.trim());
            html += paragraphs.map(p => `<p>${p.replace(/\n/g, ' ').trim()}</p>`).join('\n');
        }
        return html;
    }).join('\n\n');
}

// Build full description from content
function buildCategoryDescription(content) {
    const parts = [];

    // h1_content becomes the intro (will show at top via category.description)
    if (content.h1_content) {
        parts.push(formatH1ContentToHtml(content.h1_content));
    }

    // h2_sections become additional SEO content
    if (content.h2_sections && content.h2_sections.length > 0) {
        const h2Html = formatH2SectionsToHtml(content.h2_sections);
        if (h2Html) {
            parts.push(h2Html);
        }
    }

    return parts.join('\n\n');
}

// Main import function
async function importContent() {
    console.log('🚀 Category Content Import Script (Simple/Description-based)');
    console.log('='.repeat(60));

    if (DRY_RUN) {
        console.log('⚠️  DRY RUN MODE - No changes will be made\n');
    }

    // Load content import file
    const possiblePaths = [
        path.resolve(process.cwd(), 'content_import.json'),
        path.resolve(__dirname, 'content_import.json'),
        '/Users/bones/Downloads/Content/content_import.json',
        path.resolve(__dirname, '../content_import.json'),
    ];

    let contentData;
    let loadedPath;

    for (const p of possiblePaths) {
        try {
            if (fs.existsSync(p)) {
                contentData = JSON.parse(fs.readFileSync(p, 'utf8'));
                loadedPath = p;
                break;
            }
        } catch (e) {
            continue;
        }
    }

    if (!contentData) {
        console.error('❌ Could not find content_import.json');
        console.error('   Tried paths:', possiblePaths);
        process.exit(1);
    }

    console.log(`📄 Loaded content from: ${loadedPath}`);
    console.log(`   Found ${Object.keys(contentData).length} entries\n`);

    // Get all categories from BigCommerce
    console.log('📦 Fetching categories from BigCommerce...');
    const categories = await getAllCategories();
    console.log(`   Found ${categories.length} categories\n`);

    // Process each content entry
    const results = {
        success: [],
        notFound: [],
        errors: [],
        skipped: [],
    };

    const entries = Object.entries(contentData);
    const entriesToProcess = SINGLE_SLUG
        ? entries.filter(([slug]) => slug === SINGLE_SLUG)
        : entries;

    console.log(`📝 Processing ${entriesToProcess.length} entries...\n`);

    for (const [slug, content] of entriesToProcess) {
        process.stdout.write(`Processing: ${slug}... `);

        try {
            // Find matching category
            const category = findCategoryBySlug(categories, slug);

            if (!category) {
                console.log('❌ Category not found');
                results.notFound.push(slug);
                continue;
            }

            // Check if category already has description
            if (SKIP_EXISTING && category.description && category.description.trim()) {
                console.log('⏭️  Has existing description, skipping');
                results.skipped.push({ slug, reason: 'has_description' });
                continue;
            }

            // Build combined description
            const description = buildCategoryDescription(content);

            if (!description) {
                console.log('⏭️  No content to import');
                results.skipped.push({ slug, reason: 'no_content' });
                continue;
            }

            // Update category
            await updateCategoryDescription(category.id, description);
            console.log(`✅ Updated (${description.length} chars)`);
            results.success.push({ slug, categoryId: category.id, chars: description.length });
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
            results.errors.push({ slug, error: error.message });
        }

        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Print summary
    console.log(`\n${'='.repeat(60)}`);
    console.log('📊 Import Summary');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${results.success.length}`);
    console.log(`⏭️  Skipped: ${results.skipped.length}`);
    console.log(`❌ Not found: ${results.notFound.length}`);
    console.log(`🚫 Errors: ${results.errors.length}`);

    if (results.notFound.length > 0 && VERBOSE) {
        console.log('\nCategories not found:');
        results.notFound.forEach(slug => console.log(`   - ${slug}`));
    }

    if (results.errors.length > 0) {
        console.log('\nErrors:');
        results.errors.forEach(({ slug, error }) => console.log(`   - ${slug}: ${error}`));
    }

    // Save results
    const resultsPath = path.resolve(__dirname, 'import-results-simple.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Results saved to: ${resultsPath}`);
}

// Run
importContent().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
