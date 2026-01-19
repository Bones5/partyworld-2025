#!/usr/bin/env node
/**
 * Category Content Import Script
 *
 * Imports content from content_import.json:
 * - h1_content → Widget in category_below_header region
 * - h2_sections → Category description field
 *
 * Usage:
 *   node scripts/import-category-content.js [--dry-run] [--slug=category-slug]
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
const FORCE_WIDGETS = args.includes('--force-widgets');

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
    // The URL in content_import.json is like: https://www.partyworld.ie/confetti/
    // We need to match against category custom_url.url which is like: /confetti/
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

// Get or create HTML widget template
async function getHtmlWidgetTemplate() {
    // First, try to find existing HTML widget template
    const response = await apiRequest('/v3/content/widget-templates?limit=250');

    let htmlTemplate = response.data.find(t => t.name === 'HTML'
        || t.name === 'html'
        || t.schema?.some(s => s.id === 'html'));

    if (!htmlTemplate) {
        // Create a simple HTML widget template
        if (DRY_RUN) {
            console.log('   [DRY RUN] Would create HTML widget template');
            return { uuid: 'dry-run-template-uuid' };
        }

        const createResponse = await apiRequest('/v3/content/widget-templates', {
            method: 'POST',
            body: JSON.stringify({
                name: 'Category Intro HTML',
                schema: [
                    {
                        type: 'html',
                        label: 'HTML Content',
                        id: 'html_content',
                        default: '',
                    },
                ],
                template: '{{{html_content}}}',
            }),
        });
        htmlTemplate = createResponse.data;
    }

    return htmlTemplate;
}

// Create widget for category intro
async function createIntroWidget(categoryId, htmlContent, widgetTemplateUuid) {
    if (DRY_RUN) {
        console.log(`   [DRY RUN] Would create widget for category ${categoryId}`);
        return { success: true, dryRun: true };
    }

    // Create the widget using the built-in HTML widget template
    // The HTML widget template uses 'htmlCode' as the field name
    const widgetResponse = await apiRequest('/v3/content/widgets', {
        method: 'POST',
        body: JSON.stringify({
            name: `Category Intro - ${categoryId}`,
            widget_template_uuid: widgetTemplateUuid,
            widget_configuration: {
                htmlCode: `<div class="category-intro">${htmlContent}</div>`,
            },
        }),
    });

    const widget = widgetResponse.data;

    // Place the widget in the category_below_header region
    await apiRequest('/v3/content/placements', {
        method: 'POST',
        body: JSON.stringify({
            widget_uuid: widget.uuid,
            template_file: 'pages/category',
            region: 'category_below_header',
            entity_id: String(categoryId),
            sort_order: 1,
            status: 'active',
        }),
    });

    return { success: true, widgetUuid: widget.uuid };
}

// Format h2_sections into HTML for description
function formatH2SectionsToHtml(h2Sections) {
    if (!h2Sections || !Array.isArray(h2Sections) || h2Sections.length === 0) {
        return null;
    }

    return h2Sections.map(section => {
        let html = '';
        if (section.heading) {
            html += `<h2>${section.heading}</h2>\n`;
        }
        if (section.content) {
            // Convert newlines to paragraphs
            const paragraphs = section.content.split('\n\n').filter(p => p.trim());
            html += paragraphs.map(p => `<p>${p.trim()}</p>`).join('\n');
        }
        return html;
    }).join('\n\n');
}

// Format h1_content for widget (convert newlines to proper HTML)
function formatH1ContentToHtml(content) {
    if (!content) return null;

    // Split by double newlines for paragraphs
    const paragraphs = content.split('\n\n').filter(p => p.trim());

    // Replace single newlines within paragraphs with spaces, wrap in <p> tags
    return paragraphs.map(p => {
        const text = p.replace(/\n/g, ' ').trim();
        return `<p>${text}</p>`;
    }).join('\n');
}

// Cache for all category placements (loaded once)
let allCategoryPlacementsCache = null;

// Check for existing widgets on a category
async function getExistingPlacements(categoryId) {
    try {
        // Load all category placements once and cache them
        // (BigCommerce API entity_id filter doesn't work properly)
        if (!allCategoryPlacementsCache) {
            const allPlacements = [];
            let page = 1;
            let hasMore = true;

            while (hasMore) {
                const response = await apiRequest(
                    `/v3/content/placements?template_file=pages/category&region=category_below_header&limit=250&page=${page}`,
                );
                allPlacements.push(...(response.data || []));
                hasMore = response.data?.length === 250;
                page++;
            }

            allCategoryPlacementsCache = allPlacements;
            if (VERBOSE) {
                console.log(`   Cached ${allCategoryPlacementsCache.length} existing category placements`);
            }
        }

        // Filter for this specific category
        const categoryIdStr = String(categoryId);
        return allCategoryPlacementsCache.filter(p => p.entity_id === categoryIdStr);
    } catch (e) {
        return [];
    }
}

// Main import function
async function importContent() {
    console.log('🚀 Category Content Import Script');
    console.log('='.repeat(50));

    if (DRY_RUN) {
        console.log('⚠️  DRY RUN MODE - No changes will be made\n');
    }

    // Load content import file
    const contentPath = path.resolve(__dirname, '../Downloads/Content/content_import.json');

    // Try alternative paths
    const possiblePaths = [
        contentPath,
        path.resolve(process.cwd(), 'content_import.json'),
        path.resolve(__dirname, 'content_import.json'),
        '/Users/bones/Downloads/Content/content_import.json',
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

    // Get or create widget template
    console.log('🔧 Getting HTML widget template...');
    const widgetTemplate = await getHtmlWidgetTemplate();
    console.log(`   Template UUID: ${widgetTemplate.uuid}\n`);

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

    console.log(`\n📝 Processing ${entriesToProcess.length} entries...\n`);

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

            const updates = [];

            // Import h1_content as widget
            if (content.h1_content) {
                let shouldCreateWidget = FORCE_WIDGETS;

                if (!FORCE_WIDGETS) {
                    const existingPlacements = await getExistingPlacements(category.id);
                    shouldCreateWidget = existingPlacements.length === 0;

                    if (!shouldCreateWidget && VERBOSE) {
                        console.log('\n   ⏭️  Widget already exists, skipping');
                    }
                }

                if (shouldCreateWidget) {
                    const formattedIntro = formatH1ContentToHtml(content.h1_content);
                    await createIntroWidget(category.id, formattedIntro, widgetTemplate.uuid);
                    updates.push('widget');
                } else if (!FORCE_WIDGETS) {
                    results.skipped.push({ slug, reason: 'widget_exists' });
                }
            }

            // Import h2_sections as description
            if (content.h2_sections && content.h2_sections.length > 0) {
                const formattedDescription = formatH2SectionsToHtml(content.h2_sections);
                if (formattedDescription) {
                    await updateCategoryDescription(category.id, formattedDescription);
                    updates.push('description');
                }
            }

            if (updates.length > 0) {
                console.log(`✅ Updated: ${updates.join(', ')}`);
                results.success.push({ slug, categoryId: category.id, updates });
            } else {
                console.log('⏭️  No content to import');
                results.skipped.push({ slug, reason: 'no_content' });
            }
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
            results.errors.push({ slug, error: error.message });
        }

        // Rate limiting - small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Print summary
    console.log(`\n${'='.repeat(50)}`);
    console.log('📊 Import Summary');
    console.log('='.repeat(50));
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

    // Save results to file
    const resultsPath = path.resolve(__dirname, 'import-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Results saved to: ${resultsPath}`);
}

// Run the script
importContent().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
