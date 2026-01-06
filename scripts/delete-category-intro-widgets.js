#!/usr/bin/env node
/**
 * Delete all Category Intro widgets and their placements
 */

const STORE_HASH = process.env.BC_STORE_HASH;
const ACCESS_TOKEN = process.env.BC_ACCESS_TOKEN;
const API_BASE = `https://api.bigcommerce.com/stores/${STORE_HASH}`;

async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const response = await fetch(url, {
        ...options,
        headers: {
            'X-Auth-Token': ACCESS_TOKEN,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok && response.status !== 204) {
        const error = await response.text();
        throw new Error(`API Error ${response.status}: ${error}`);
    }

    if (response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
}

async function getAllCategoryIntroWidgets() {
    const widgets = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const response = await apiRequest(`/v3/content/widgets?limit=250&page=${page}`);
        const introWidgets = response.data.filter(w => w.name && w.name.includes('Category Intro'));
        widgets.push(...introWidgets);
        hasMore = page < response.meta.pagination.total_pages;
        page++;
    }

    return widgets;
}

async function deletePlacementsForWidget(widgetUuid) {
    const response = await apiRequest(`/v3/content/placements?widget_uuid=${widgetUuid}`);
    for (const placement of response.data) {
        await apiRequest(`/v3/content/placements/${placement.uuid}`, { method: 'DELETE' });
        console.log(`   Deleted placement ${placement.uuid}`);
    }
}

async function main() {
    console.log('🗑️  Deleting Category Intro widgets and placements...\n');

    const widgets = await getAllCategoryIntroWidgets();
    console.log(`Found ${widgets.length} Category Intro widgets\n`);

    for (const widget of widgets) {
        console.log(`Deleting: ${widget.name} (${widget.uuid})`);

        // Delete placements first
        await deletePlacementsForWidget(widget.uuid);

        // Delete widget
        await apiRequest(`/v3/content/widgets/${widget.uuid}`, { method: 'DELETE' });
        console.log('   ✅ Deleted widget\n');
    }

    console.log(`\n✅ Done! Deleted ${widgets.length} widgets and their placements.`);
}

main().catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
});
