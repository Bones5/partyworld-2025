#!/usr/bin/env node

/**
 * BigCommerce Page Builder Content Transfer
 * 
 * Transfers Page Builder pages and widgets between BigCommerce stores
 * using the Content/Pages API.
 * 
 * Usage:
 *   node transfer-pages.js --from staging --to production [options]
 * 
 * Prerequisites:
 *   - Environment configs in /environments/ with API credentials
 *   - API tokens with Content scope (modify)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT_DIR = path.join(__dirname, '../..');
const ENVS_DIR = path.join(ROOT_DIR, 'environments');

// API Configuration
const API_VERSION = 'v3';

/**
 * Load environment configuration with API credentials
 */
function loadEnvConfig(envName) {
    const configPath = path.join(ENVS_DIR, `${envName}.config.json`);
    const secretsPath = path.join(ENVS_DIR, `${envName}.secrets.json`);

    if (!fs.existsSync(configPath)) {
        throw new Error(`Environment "${envName}" not found. Run: npm run env:init`);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    
    if (!fs.existsSync(secretsPath)) {
        throw new Error(`Secrets file not found for "${envName}". Create: ${secretsPath}`);
    }
    
    const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf-8'));

    // Get store hash - prefer explicit config, fallback to URL extraction
    let storeHash = config.storeHash || extractStoreHash(config.normalStoreUrl);
    if (!storeHash) {
        throw new Error(`Store hash not found. Add "storeHash" to ${configPath} or use a mybigcommerce.com URL`);
    }

    return {
        name: envName,
        storeUrl: config.normalStoreUrl,
        storeHash,
        accessToken: secrets.accessToken,
        clientId: secrets.clientId || null,
    };
}

/**
 * Extract store hash from BigCommerce URL
 */
function extractStoreHash(url) {
    // Format: https://store-{hash}.mybigcommerce.com or https://{name}.mybigcommerce.com
    // For API calls we need the hash, which should be in the secrets file for sandbox stores
    const match = url.match(/store-([a-z0-9]+)\.mybigcommerce\.com/i);
    if (match) return match[1];
    
    // For sandbox stores, the hash needs to be provided in the config
    return null;
}

/**
 * Make API request to BigCommerce
 */
async function apiRequest(config, method, endpoint, body = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(`https://api.bigcommerce.com/stores/${config.storeHash}/${API_VERSION}${endpoint}`);
        
        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
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
                    const error = new Error(`API Error: ${res.statusCode}`);
                    error.statusCode = res.statusCode;
                    error.response = data;
                    reject(error);
                }
            });
        });

        req.on('error', reject);

        if (body) {
            req.write(JSON.stringify(body));
        }

        req.end();
    });
}

/**
 * Fetch all pages from a store
 */
async function fetchAllPages(config, options = {}) {
    const pages = [];
    let page = 1;
    const limit = 50;

    console.log(`\n📄 Fetching pages from ${config.name}...`);

    while (true) {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            include: 'body',
        });

        if (options.channelId) {
            params.set('channel_id', options.channelId.toString());
        }

        const response = await apiRequest(config, 'GET', `/content/pages?${params}`);
        
        if (!response.data || response.data.length === 0) {
            break;
        }

        pages.push(...response.data);
        console.log(`   Fetched ${pages.length} pages...`);

        if (response.data.length < limit) {
            break;
        }

        page++;
    }

    console.log(`   ✓ Total: ${pages.length} pages`);
    return pages;
}

/**
 * Fetch page widgets (Page Builder content)
 */
async function fetchPageWidgets(config, pageId) {
    try {
        const response = await apiRequest(config, 'GET', `/content/pages/${pageId}/widgets`);
        return response.data || [];
    } catch (err) {
        if (err.statusCode === 404) {
            return [];
        }
        throw err;
    }
}

/**
 * Fetch all widget templates
 */
async function fetchWidgetTemplates(config) {
    const templates = [];
    let page = 1;
    const limit = 50;

    console.log(`\n🧩 Fetching widget templates from ${config.name}...`);

    while (true) {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        const response = await apiRequest(config, 'GET', `/content/widget-templates?${params}`);
        
        if (!response.data || response.data.length === 0) {
            break;
        }

        templates.push(...response.data);

        if (response.data.length < limit) {
            break;
        }

        page++;
    }

    console.log(`   ✓ Total: ${templates.length} widget templates`);
    return templates;
}

/**
 * Fetch all widgets (placements)
 */
async function fetchWidgets(config, options = {}) {
    const widgets = [];
    let page = 1;
    const limit = 50;

    console.log(`\n📦 Fetching widgets from ${config.name}...`);

    while (true) {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        if (options.channelId) {
            params.set('channel_id', options.channelId.toString());
        }

        const response = await apiRequest(config, 'GET', `/content/widgets?${params}`);
        
        if (!response.data || response.data.length === 0) {
            break;
        }

        widgets.push(...response.data);

        if (response.data.length < limit) {
            break;
        }

        page++;
    }

    console.log(`   ✓ Total: ${widgets.length} widgets`);
    return widgets;
}

/**
 * Fetch all placements
 */
async function fetchPlacements(config, options = {}) {
    const placements = [];
    let page = 1;
    const limit = 50;

    console.log(`\n📍 Fetching placements from ${config.name}...`);

    while (true) {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        if (options.channelId) {
            params.set('channel_id', options.channelId.toString());
        }

        const response = await apiRequest(config, 'GET', `/content/placements?${params}`);
        
        if (!response.data || response.data.length === 0) {
            break;
        }

        placements.push(...response.data);

        if (response.data.length < limit) {
            break;
        }

        page++;
    }

    console.log(`   ✓ Total: ${placements.length} placements`);
    return placements;
}

/**
 * Fetch regions
 */
async function fetchRegions(config, templateFile = 'pages/home') {
    console.log(`\n🗺️  Fetching regions from ${config.name}...`);
    
    const params = new URLSearchParams({ template_file: templateFile });
    const response = await apiRequest(config, 'GET', `/content/regions?${params}`);
    
    console.log(`   ✓ Found ${response.data?.length || 0} regions`);
    return response.data || [];
}

/**
 * Create a page in the target store
 */
async function createPage(config, pageData) {
    // Remove source-specific fields
    const { id, ...createData } = pageData;
    
    // Ensure required fields
    createData.type = createData.type || 'page';
    createData.is_visible = createData.is_visible ?? true;
    
    return apiRequest(config, 'POST', '/content/pages', createData);
}

/**
 * Update an existing page
 */
async function updatePage(config, pageId, pageData) {
    const { id, ...updateData } = pageData;
    return apiRequest(config, 'PUT', `/content/pages/${pageId}`, updateData);
}

/**
 * Create or update widget template
 */
async function createWidgetTemplate(config, templateData) {
    const { uuid, date_created, date_modified, ...createData } = templateData;
    return apiRequest(config, 'POST', '/content/widget-templates', createData);
}

/**
 * Create widget
 */
async function createWidget(config, widgetData) {
    // widgetData should already contain only writable fields
    return apiRequest(config, 'POST', '/content/widgets', widgetData);
}

/**
 * Create placement
 */
async function createPlacement(config, placementData) {
    const { uuid, date_created, date_modified, ...createData } = placementData;
    return apiRequest(config, 'POST', '/content/placements', createData);
}

/**
 * Process image URLs in content - replace source CDN with target
 */
function processImageUrls(content, sourceUrl, targetUrl, urlMapping = {}) {
    if (!content) return content;
    
    let processed = typeof content === 'string' ? content : JSON.stringify(content);
    
    // Replace any image URLs from source store CDN
    // BigCommerce CDN format: https://cdn11.bigcommerce.com/s-{hash}/images/...
    const cdnPattern = /https:\/\/cdn\d+\.bigcommerce\.com\/s-[a-z0-9]+\/images\/[^"'\s)]+/gi;
    
    processed = processed.replace(cdnPattern, (match) => {
        // Check if we have a mapping for this URL
        if (urlMapping[match]) {
            return urlMapping[match];
        }
        // Otherwise keep original (will need manual update)
        return match;
    });
    
    return typeof content === 'string' ? processed : JSON.parse(processed);
}

/**
 * Export content to JSON file
 */
function exportToFile(data, filename, outputDir) {
    const filePath = path.join(outputDir, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`   💾 Saved: ${filename}`);
    return filePath;
}

/**
 * Main transfer function
 */
async function transferContent(sourceConfig, targetConfig, options = {}) {
    const outputDir = options.outputDir || path.join(__dirname, `transfer-${sourceConfig.name}-to-${targetConfig.name}`);
    
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('\n' + '='.repeat(50));
    console.log('📤 Source:', sourceConfig.name, `(${sourceConfig.storeUrl})`);
    console.log('📥 Target:', targetConfig.name, `(${targetConfig.storeUrl})`);
    console.log('='.repeat(50));

    // Step 1: Fetch all content from source
    console.log('\n📥 STEP 1: Fetching content from source store...');
    
    const pages = await fetchAllPages(sourceConfig, options);
    const widgetTemplates = await fetchWidgetTemplates(sourceConfig);
    const widgets = await fetchWidgets(sourceConfig, options);
    const placements = await fetchPlacements(sourceConfig, options);

    // Export source content
    console.log('\n💾 Saving source content to files...');
    exportToFile(pages, 'source-pages.json', outputDir);
    exportToFile(widgetTemplates, 'source-widget-templates.json', outputDir);
    exportToFile(widgets, 'source-widgets.json', outputDir);
    exportToFile(placements, 'source-placements.json', outputDir);

    if (options.exportOnly) {
        console.log('\n✅ Export complete! Files saved to:', outputDir);
        return { pages, widgetTemplates, widgets, placements };
    }

    // Step 2: Fetch existing content from target (to avoid duplicates)
    console.log('\n📋 STEP 2: Checking existing content in target store...');
    
    const existingPages = await fetchAllPages(targetConfig, options);
    const existingTemplates = await fetchWidgetTemplates(targetConfig);
    
    const existingPageUrls = new Set(existingPages.map(p => p.url));
    // Create a map of template name -> uuid for existing templates
    const existingTemplatesByName = new Map(existingTemplates.map(t => [t.name, t.uuid]));

    // Step 3: Create widget templates first (widgets depend on them)
    console.log('\n🧩 STEP 3: Creating widget templates...');
    
    const templateMapping = {}; // oldUuid -> newUuid
    let templatesCreated = 0;
    let templatesSkipped = 0;

    for (const template of widgetTemplates) {
        if (existingTemplatesByName.has(template.name)) {
            // Map source UUID to existing target UUID
            templateMapping[template.uuid] = existingTemplatesByName.get(template.name);
            console.log(`   ⏭️  Skipped (exists): ${template.name}`);
            templatesSkipped++;
            continue;
        }

        try {
            const result = await createWidgetTemplate(targetConfig, template);
            templateMapping[template.uuid] = result.data.uuid;
            console.log(`   ✓ Created: ${template.name}`);
            templatesCreated++;
        } catch (err) {
            console.error(`   ❌ Failed: ${template.name} - ${err.message}`);
        }
    }

    console.log(`   Templates: ${templatesCreated} created, ${templatesSkipped} skipped`);

    // Step 4: Create pages
    console.log('\n📄 STEP 4: Creating pages...');
    
    const pageMapping = {}; // oldId -> newId
    let pagesCreated = 0;
    let pagesSkipped = 0;

    for (const page of pages) {
        // Skip if page URL already exists
        if (existingPageUrls.has(page.url)) {
            console.log(`   ⏭️  Skipped (exists): ${page.name} (${page.url})`);
            pagesSkipped++;
            continue;
        }

        try {
            // Process any image URLs in the page body
            const processedPage = {
                ...page,
                body: processImageUrls(page.body, sourceConfig.storeUrl, targetConfig.storeUrl),
            };

            const result = await createPage(targetConfig, processedPage);
            pageMapping[page.id] = result.data.id;
            console.log(`   ✓ Created: ${page.name} (${page.url})`);
            pagesCreated++;
        } catch (err) {
            console.error(`   ❌ Failed: ${page.name} - ${err.message}`);
            if (err.response) {
                console.error(`      Response: ${err.response}`);
            }
        }
    }

    console.log(`   Pages: ${pagesCreated} created, ${pagesSkipped} skipped`);

    // Step 5: Create widgets (need to map template UUIDs)
    console.log('\n📦 STEP 5: Creating widgets...');
    console.log(`   Template mappings available: ${Object.keys(templateMapping).length}`);
    
    const widgetMapping = {}; // oldUuid -> newUuid
    let widgetsCreated = 0;
    let widgetsFailed = 0;
    let widgetsSkipped = 0;

    for (const widget of widgets) {
        try {
            // Get source template UUID from nested widget_template object
            const sourceTemplateUuid = widget.widget_template?.uuid || widget.widget_template_uuid;
            
            // Map template UUID - must exist in target store
            const targetTemplateUuid = templateMapping[sourceTemplateUuid];
            if (!targetTemplateUuid) {
                console.log(`   ⏭️  Skipped (no template mapping): ${widget.name} - source template: ${sourceTemplateUuid}`);
                widgetsSkipped++;
                continue;
            }
            
            // Build widget data for creation - only include writable fields
            const widgetData = {
                name: widget.name,
                description: widget.description || '',
                widget_template_uuid: targetTemplateUuid,
                widget_configuration: processImageUrls(
                    widget.widget_configuration, 
                    sourceConfig.storeUrl, 
                    targetConfig.storeUrl
                ),
                channel_id: widget.channel_id,
            };

            const result = await createWidget(targetConfig, widgetData);
            widgetMapping[widget.uuid] = result.data.uuid;
            console.log(`   ✓ Created widget: ${widget.name || widget.uuid}`);
            widgetsCreated++;
        } catch (err) {
            console.error(`   ❌ Failed widget: ${widget.name || widget.uuid} - ${err.message}`);
            if (err.response) {
                try {
                    const errorData = JSON.parse(err.response);
                    console.error(`      Details: ${JSON.stringify(errorData.errors || errorData.title || errorData, null, 2)}`);
                } catch {
                    console.error(`      Response: ${err.response.substring(0, 200)}`);
                }
            }
            widgetsFailed++;
        }
    }

    console.log(`   Widgets: ${widgetsCreated} created, ${widgetsSkipped} skipped, ${widgetsFailed} failed`);

    // Step 6: Create placements (map widget UUIDs and entity IDs)
    console.log('\n📍 STEP 6: Creating placements...');
    
    let placementsCreated = 0;
    let placementsFailed = 0;

    for (const placement of placements) {
        try {
            // Map widget UUID
            const newWidgetUuid = widgetMapping[placement.widget_uuid];
            if (!newWidgetUuid) {
                console.log(`   ⏭️  Skipped (no widget): ${placement.uuid}`);
                continue;
            }

            // Map entity ID for page placements
            let entityId = placement.entity_id;
            if (placement.template_file?.startsWith('pages/') && pageMapping[placement.entity_id]) {
                entityId = pageMapping[placement.entity_id];
            }

            const placementData = {
                ...placement,
                widget_uuid: newWidgetUuid,
                entity_id: entityId,
            };

            await createPlacement(targetConfig, placementData);
            console.log(`   ✓ Created placement: ${placement.region} on ${placement.template_file}`);
            placementsCreated++;
        } catch (err) {
            console.error(`   ❌ Failed placement: ${placement.uuid} - ${err.message}`);
            placementsFailed++;
        }
    }

    console.log(`   Placements: ${placementsCreated} created, ${placementsFailed} failed`);

    // Save mapping files
    console.log('\n💾 Saving mapping files...');
    exportToFile(pageMapping, 'page-mapping.json', outputDir);
    exportToFile(templateMapping, 'template-mapping.json', outputDir);
    exportToFile(widgetMapping, 'widget-mapping.json', outputDir);

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ TRANSFER COMPLETE');
    console.log('='.repeat(50));
    console.log(`   Pages:     ${pagesCreated} created, ${pagesSkipped} skipped`);
    console.log(`   Templates: ${templatesCreated} created, ${templatesSkipped} skipped`);
    console.log(`   Widgets:   ${widgetsCreated} created, ${widgetsFailed} failed`);
    console.log(`   Placements: ${placementsCreated} created, ${placementsFailed} failed`);
    console.log(`\n   Output: ${outputDir}`);

    return {
        pageMapping,
        templateMapping,
        widgetMapping,
        stats: {
            pages: { created: pagesCreated, skipped: pagesSkipped },
            templates: { created: templatesCreated, skipped: templatesSkipped },
            widgets: { created: widgetsCreated, failed: widgetsFailed },
            placements: { created: placementsCreated, failed: placementsFailed },
        },
    };
}

/**
 * Import content from previously exported files
 */
async function importFromFiles(targetConfig, inputDir, options = {}) {
    console.log('\n📂 Importing from files:', inputDir);

    const pages = JSON.parse(fs.readFileSync(path.join(inputDir, 'source-pages.json'), 'utf-8'));
    const widgetTemplates = JSON.parse(fs.readFileSync(path.join(inputDir, 'source-widget-templates.json'), 'utf-8'));
    const widgets = JSON.parse(fs.readFileSync(path.join(inputDir, 'source-widgets.json'), 'utf-8'));
    const placements = JSON.parse(fs.readFileSync(path.join(inputDir, 'source-placements.json'), 'utf-8'));

    // Create a mock source config for the transfer function
    const mockSourceConfig = {
        name: 'import',
        storeUrl: options.sourceUrl || 'https://source.mybigcommerce.com/',
    };

    // Use the same transfer logic
    return transferContent(
        { ...mockSourceConfig, pages, widgetTemplates, widgets, placements },
        targetConfig,
        { ...options, skipFetch: true }
    );
}

/**
 * Show help
 */
function showHelp() {
    console.log(`
BigCommerce Page Builder Content Transfer
=========================================

Transfers Page Builder pages, widgets, and placements between stores.

Usage:
  node transfer-pages.js --from <env> --to <env> [options]
  node transfer-pages.js --export <env> [options]
  node transfer-pages.js --import <dir> --to <env> [options]

Commands:
  --from <env>    Source environment name
  --to <env>      Target environment name
  --export <env>  Export content from environment only
  --import <dir>  Import from previously exported directory

Options:
  --output <dir>     Output directory for exports/mappings
  --channel <id>     Filter by channel ID
  --pages-only       Transfer only pages (no widgets)
  --dry-run          Preview without making changes

Environment Setup:
  Requires environments/<env>.config.json with:
  {
    "normalStoreUrl": "https://store-xxx.mybigcommerce.com/",
    "storeHash": "xxx"  // Required for API calls
  }

  And environments/<env>.secrets.json with:
  {
    "accessToken": "your-api-token"
  }

API Token Requirements:
  - Content: modify
  - Content: read-only (minimum for export)

Examples:

  # Transfer all content from staging to production
  node transfer-pages.js --from staging --to production

  # Export content only (for review/backup)
  node transfer-pages.js --export staging --output ./backup

  # Import from exported files
  node transfer-pages.js --import ./backup --to production

  # Transfer specific channel
  node transfer-pages.js --from staging --to production --channel 1
`);
}

/**
 * Main
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
        showHelp();
        return;
    }

    // Parse arguments
    let fromEnv = null;
    let toEnv = null;
    let exportEnv = null;
    let importDir = null;
    let outputDir = null;
    let channelId = null;
    let pagesOnly = false;
    let dryRun = false;

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--from':
                fromEnv = args[++i];
                break;
            case '--to':
                toEnv = args[++i];
                break;
            case '--export':
                exportEnv = args[++i];
                break;
            case '--import':
                importDir = args[++i];
                break;
            case '--output':
                outputDir = args[++i];
                break;
            case '--channel':
                channelId = parseInt(args[++i], 10);
                break;
            case '--pages-only':
                pagesOnly = true;
                break;
            case '--dry-run':
                dryRun = true;
                break;
        }
    }

    console.log('\n🔄 BigCommerce Page Builder Transfer\n');

    try {
        // Export only mode
        if (exportEnv) {
            const sourceConfig = loadEnvConfig(exportEnv);
            
            const pages = await fetchAllPages(sourceConfig, { channelId });
            const widgetTemplates = await fetchWidgetTemplates(sourceConfig);
            const widgets = await fetchWidgets(sourceConfig, { channelId });
            const placements = await fetchPlacements(sourceConfig, { channelId });

            const exportDir = outputDir || path.join(__dirname, `export-${exportEnv}`);
            if (!fs.existsSync(exportDir)) {
                fs.mkdirSync(exportDir, { recursive: true });
            }

            exportToFile(pages, 'source-pages.json', exportDir);
            exportToFile(widgetTemplates, 'source-widget-templates.json', exportDir);
            exportToFile(widgets, 'source-widgets.json', exportDir);
            exportToFile(placements, 'source-placements.json', exportDir);

            console.log(`\n✅ Export complete! Files saved to: ${exportDir}`);
            return;
        }

        // Import from files mode
        if (importDir && toEnv) {
            const targetConfig = loadEnvConfig(toEnv);
            await importFromFiles(targetConfig, importDir, { outputDir, channelId });
            return;
        }

        // Full transfer mode
        if (fromEnv && toEnv) {
            const sourceConfig = loadEnvConfig(fromEnv);
            const targetConfig = loadEnvConfig(toEnv);
            
            if (dryRun) {
                console.log('🔍 DRY RUN - No changes will be made\n');
                const pages = await fetchAllPages(sourceConfig, { channelId });
                console.log(`\nWould transfer ${pages.length} pages to ${toEnv}`);
                return;
            }

            await transferContent(sourceConfig, targetConfig, {
                outputDir,
                channelId,
                pagesOnly,
            });
            return;
        }

        // Invalid arguments
        console.error('❌ Invalid arguments. Use --help for usage information.');
        process.exit(1);

    } catch (err) {
        console.error('\n❌ Error:', err.message);
        if (err.response) {
            console.error('   API Response:', err.response);
        }
        process.exit(1);
    }
}

// Run
main();
