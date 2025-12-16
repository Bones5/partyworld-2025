/**
 * Register Custom Homepage Banner Widgets
 *
 * This script creates custom widget templates in BigCommerce for homepage banners.
 * Run this once to register the widgets, then they'll appear in Page Builder.
 *
 * Usage:
 *   BIGCOMMERCE_STORE_HASH="xxx" BIGCOMMERCE_ACCESS_TOKEN="xxx" node scripts/widgets/register-widgets.js
 *
 * Prerequisites:
 *   - Set BIGCOMMERCE_STORE_HASH and BIGCOMMERCE_ACCESS_TOKEN environment variables
 */

// Optional dotenv support
try { require('dotenv').config(); } catch (e) { /* dotenv not installed, using env vars */ }

const fs = require('fs');
const path = require('path');

const STORE_HASH = process.env.BIGCOMMERCE_STORE_HASH;
const ACCESS_TOKEN = process.env.BIGCOMMERCE_ACCESS_TOKEN;
const API_BASE = `https://api.bigcommerce.com/stores/${STORE_HASH}/v3`;

if (!STORE_HASH || !ACCESS_TOKEN) {
    console.error('Error: Missing environment variables');
    console.error('Please set BIGCOMMERCE_STORE_HASH and BIGCOMMERCE_ACCESS_TOKEN');
    process.exit(1);
}

async function apiRequest(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'X-Auth-Token': ACCESS_TOKEN,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} - ${JSON.stringify(data)}`);
    }

    return data;
}

async function getExistingWidgetTemplates() {
    const response = await apiRequest('/content/widget-templates');
    return response.data || [];
}

async function createWidgetTemplate(widget) {
    const payload = {
        name: widget.name,
        schema: widget.schema,
        template: widget.template,
        storefront_api_query: widget.storefront_api_query || '',
    };

    return await apiRequest('/content/widget-templates', 'POST', payload);
}

async function updateWidgetTemplate(uuid, widget) {
    const payload = {
        name: widget.name,
        schema: widget.schema,
        template: widget.template,
    };

    return await apiRequest(`/content/widget-templates/${uuid}`, 'PUT', payload);
}

async function main() {
    console.log('🚀 Registering Homepage Banner Widgets...\n');

    // Load widget definitions
    const widgetsFile = path.join(__dirname, 'homepage-banner-widgets.json');
    const widgetData = JSON.parse(fs.readFileSync(widgetsFile, 'utf8'));

    // Get existing widget templates
    const existingTemplates = await getExistingWidgetTemplates();
    console.log(`Found ${existingTemplates.length} existing widget templates\n`);

    for (const widget of widgetData.widgets) {
        console.log(`Processing: ${widget.name}`);

        // Check if widget already exists
        const existing = existingTemplates.find(t => t.name === widget.name);

        try {
            if (existing) {
                console.log(`  ↳ Updating existing widget (UUID: ${existing.uuid})`);
                await updateWidgetTemplate(existing.uuid, widget);
                console.log('  ✅ Updated successfully\n');
            } else {
                console.log('  ↳ Creating new widget');
                const result = await createWidgetTemplate(widget);
                console.log(`  ✅ Created successfully (UUID: ${result.data.uuid})\n`);
            }
        } catch (error) {
            console.error(`  ❌ Error: ${error.message}\n`);
        }
    }

    console.log('✨ Done!');
    console.log('\nNext steps:');
    console.log('1. Go to Storefront → My Themes → Customize');
    console.log('2. Navigate to the Home Page');
    console.log('3. Click on a banner widget region');
    console.log('4. Select "Homepage Banner - Full Width" or "Homepage Banner - Compact"');
}

main().catch(console.error);
