const fs = require('fs');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const csv = fs.readFileSync('products-updated.csv', 'utf-8');
const records = parse(csv, { 
    columns: true, 
    skip_empty_lines: true,
    relax_quotes: true,
    relax_column_count: true
});

// Load category mapping and build ID -> path lookup
const categories = JSON.parse(fs.readFileSync('categories.json', 'utf-8'));
const categoryMap = {};
for (const cat of categories) {
    categoryMap[cat.id] = cat;
}

function getCategoryPath(cat) {
    if (!cat) return null;
    if (cat.parent_id === 0) {
        return cat.name;
    }
    const parent = categoryMap[cat.parent_id];
    if (parent) {
        return getCategoryPath(parent) + '/' + cat.name;
    }
    return cat.name;
}

const categoryIdToPath = {};
for (const cat of categories) {
    categoryIdToPath[cat.id] = getCategoryPath(cat);
}
console.log(`   Loaded ${Object.keys(categoryIdToPath).length} category mappings`);

// Remove ID and Brand ID columns, set default weight, copy image URLs, remove channel 1125426
for (const record of records) {
    delete record['ID'];
    delete record['Brand ID'];
    // Set weight to 0.1 if empty or 0
    if (!record['Weight'] || record['Weight'] === '0' || record['Weight'] === '') {
        record['Weight'] = '0.1';
    }
    // Copy GCS URL from Export column to Import column
    if (record['Internal Image URL (Export)'] && record['Internal Image URL (Export)'].includes('storage.googleapis.com')) {
        record['Image URL (Import)'] = record['Internal Image URL (Export)'];
    }
    // Remove channel 1125426 from Channels
    if (record['Channels']) {
        record['Channels'] = record['Channels']
            .split(';')
            .filter(ch => ch.trim() !== '1125426')
            .join(';');
    }
    // Convert category IDs to paths
    if (record['Categories']) {
        const categoryIds = record['Categories'].split(';').map(id => id.trim()).filter(Boolean);
        const categoryPaths = categoryIds
            .map(id => categoryIdToPath[id])
            .filter(Boolean);
        record['Categories'] = categoryPaths.join(';');
    }
}

const output = stringify(records, { 
    header: true,
    quoted: true,
    quoted_empty: true
});

// Split into multiple files under 20MB (use 18MB to be safe)
const MAX_SIZE = 18 * 1024 * 1024; // 18MB
const lines = output.split('\n');
const header = lines[0];

let fileNum = 1;
let currentContent = header + '\n';
let currentSize = Buffer.byteLength(currentContent, 'utf8');
let filesCreated = [];

for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const lineSize = Buffer.byteLength(line + '\n', 'utf8');
    
    if (currentSize + lineSize > MAX_SIZE) {
        // Write current file and start new one
        const filename = `products-for-import-${fileNum}.csv`;
        fs.writeFileSync(filename, currentContent);
        filesCreated.push(filename);
        fileNum++;
        currentContent = header + '\n' + line + '\n';
        currentSize = Buffer.byteLength(currentContent, 'utf8');
    } else {
        currentContent += line + '\n';
        currentSize += lineSize;
    }
}

// Write final file
if (currentContent.length > header.length + 2) {
    const filename = `products-for-import-${fileNum}.csv`;
    fs.writeFileSync(filename, currentContent);
    filesCreated.push(filename);
}

// Also write combined file for reference
fs.writeFileSync('products-for-import.csv', output);

// Also create test file with a Product row and its Image row
// (reuse lines and header from above)

// Find a Product line followed by an Image line with GCS URL
let productRow = null;
let imageRow = null;
for (let i = 1; i < lines.length - 1; i++) {
    if (lines[i].startsWith('"Product"') && lines[i + 1].startsWith('"Image"') && lines[i + 1].includes('storage.googleapis.com')) {
        productRow = lines[i];
        imageRow = lines[i + 1];
        break;
    }
}

if (productRow && imageRow) {
    fs.writeFileSync('products-test-import.csv', header + '\n' + productRow + '\n' + imageRow + '\n');
} else {
    // Fallback - just find any line with image
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].includes('storage.googleapis.com')) {
            fs.writeFileSync('products-test-import.csv', header + '\n' + lines[i] + '\n');
            break;
        }
    }
}

console.log('✅ Created split import files:');
filesCreated.forEach(f => {
    const size = (fs.statSync(f).size / (1024 * 1024)).toFixed(1);
    console.log(`   - ${f} (${size} MB)`);
});
console.log('   - Removed ID and Brand ID columns');
console.log('   - Set default weight to 0.1 for empty/zero weights');
console.log('   - Copied GCS URLs to Image URL (Import) column');
console.log('   Rows:', records.length);
console.log('✅ Created products-test-import.csv (1 row with image for testing)');
