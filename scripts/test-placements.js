#!/usr/bin/env node

const STORE_HASH = process.env.BC_STORE_HASH;
const ACCESS_TOKEN = process.env.BC_ACCESS_TOKEN;

async function test() {
    // First check all placements for category pages
    const url = `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/content/placements?template_file=pages/category&limit=250`;
    const response = await fetch(url, {
        headers: {
            'X-Auth-Token': ACCESS_TOKEN,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    });
    const data = await response.json();
    console.log('Total category placements:', data.data?.length);
    console.log('Sample placements (first 3):', JSON.stringify(data.data?.slice(0, 3), null, 2));
    
    // Check specifically for category 61 (confetti) - one that was 'skipped'
    const url2 = `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/content/placements?template_file=pages/category&entity_id=61`;
    const response2 = await fetch(url2, {
        headers: {
            'X-Auth-Token': ACCESS_TOKEN,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    });
    const data2 = await response2.json();
    console.log('\nPlacements for category 61 (confetti):', data2.data?.length);
    console.log(JSON.stringify(data2.data, null, 2));

    // Also check the category_below_header region filter
    const url3 = `https://api.bigcommerce.com/stores/${STORE_HASH}/v3/content/placements?template_file=pages/category&entity_id=61&region=category_below_header`;
    const response3 = await fetch(url3, {
        headers: {
            'X-Auth-Token': ACCESS_TOKEN,
            'Content-Type': 'application/json',
            Accept: 'application/json',
        },
    });
    const data3 = await response3.json();
    console.log('\nPlacements for category 61 in category_below_header region:', data3.data?.length);
    console.log(JSON.stringify(data3.data, null, 2));
}

test().catch(console.error);
