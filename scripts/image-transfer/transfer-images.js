#!/usr/bin/env node

/**
 * Transfer Images Between BigCommerce Environments
 * 
 * High-level script that orchestrates the full image transfer workflow
 * between staging and production stores.
 * 
 * Usage:
 *   node scripts/image-transfer/transfer-images.js --from staging --to production
 * 
 * Prerequisites:
 *   1. Environment configs in /environments/
 *   2. Cloud storage credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
 *   3. Product export CSV from source store
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const ROOT_DIR = path.join(__dirname, '../..');
const ENVS_DIR = path.join(ROOT_DIR, 'environments');
const SCRIPTS_DIR = __dirname;

/**
 * Load environment configuration
 */
function loadEnvConfig(envName) {
    const configPath = path.join(ENVS_DIR, `${envName}.config.json`);
    const secretsPath = path.join(ENVS_DIR, `${envName}.secrets.json`);

    if (!fs.existsSync(configPath)) {
        throw new Error(`Environment "${envName}" not found. Run: npm run env:init`);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    
    let secrets = {};
    if (fs.existsSync(secretsPath)) {
        secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf-8'));
    }

    return { ...config, ...secrets, name: envName };
}

/**
 * Get store hash from URL
 */
function getStoreHash(storeUrl) {
    // Extract store hash from URL like https://store-xxx.mybigcommerce.com
    const match = storeUrl.match(/store-([a-z0-9]+)\.mybigcommerce\.com/i);
    if (match) return match[1];
    
    // Or from sandbox URL like https://storename-sandbox.mybigcommerce.com
    const sandboxMatch = storeUrl.match(/([a-z0-9-]+)\.mybigcommerce\.com/i);
    if (sandboxMatch) return sandboxMatch[1];
    
    return null;
}

/**
 * Run a command and stream output
 */
function runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
        console.log(`\n$ ${command} ${args.join(' ')}\n`);
        
        const proc = spawn(command, args, {
            stdio: 'inherit',
            cwd: options.cwd || SCRIPTS_DIR,
            env: { ...process.env, ...options.env }
        });

        proc.on('close', code => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command failed with code ${code}`));
            }
        });

        proc.on('error', reject);
    });
}

/**
 * Main transfer workflow
 */
async function main() {
    const args = process.argv.slice(2);
    
    // Parse arguments
    let fromEnv = null;
    let toEnv = null;
    let csvPath = null;
    let bucketUrl = null;
    let publicUrl = null;
    let outputDir = null;
    let step = null;

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--from':
                fromEnv = args[++i];
                break;
            case '--to':
                toEnv = args[++i];
                break;
            case '--csv':
                // Resolve relative paths from current working directory
                csvPath = path.resolve(process.cwd(), args[++i]);
                break;
            case '--bucket':
                bucketUrl = args[++i];
                break;
            case '--public-url':
                publicUrl = args[++i];
                break;
            case '--output':
                // Resolve relative paths from current working directory
                outputDir = path.resolve(process.cwd(), args[++i]);
                break;
            case '--step':
                step = args[++i];
                break;
            case '--help':
            case '-h':
                showHelp();
                return;
        }
    }

    // Validate
    if (!fromEnv && !step) {
        showHelp();
        return;
    }

    console.log('\n🔄 BigCommerce Image Transfer\n');
    console.log('='.repeat(40));

    // Load environment configs
    let sourceConfig, targetConfig;
    
    if (fromEnv) {
        try {
            sourceConfig = loadEnvConfig(fromEnv);
            console.log(`📤 Source: ${fromEnv} (${sourceConfig.normalStoreUrl})`);
        } catch (err) {
            console.error(`❌ ${err.message}`);
            process.exit(1);
        }
    }

    if (toEnv) {
        try {
            targetConfig = loadEnvConfig(toEnv);
            console.log(`📥 Target: ${toEnv} (${targetConfig.normalStoreUrl})`);
        } catch (err) {
            console.error(`❌ ${err.message}`);
            process.exit(1);
        }
    }

    console.log('='.repeat(40));

    // Default output directory
    if (!outputDir) {
        outputDir = path.join(SCRIPTS_DIR, `transfer-${fromEnv}-to-${toEnv || 'cdn'}`);
    }

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Run workflow steps
    const steps = step ? [step] : ['download', 'upload', 'update-csv'];

    for (const currentStep of steps) {
        switch (currentStep) {
            case 'download':
                if (!csvPath) {
                    console.error('\n❌ CSV path required for download step');
                    console.error('   Use: --csv path/to/products.csv\n');
                    process.exit(1);
                }

                console.log('\n📥 Step 1: Downloading images from source store...\n');
                
                const imagesDir = path.join(outputDir, 'images');
                await runCommand('node', [
                    path.join(SCRIPTS_DIR, 'download-images.js'),
                    csvPath,
                    imagesDir,
                    '--concurrent', '5'
                ]);
                
                console.log(`\n✅ Images downloaded to: ${imagesDir}`);
                break;

            case 'upload':
                if (!bucketUrl) {
                    console.error('\n❌ Bucket URL required for upload step');
                    console.error('   Use: --bucket s3://bucket-name/path\n');
                    process.exit(1);
                }

                console.log('\n☁️  Step 2: Uploading images to cloud storage...\n');
                
                const uploadArgs = [
                    path.join(SCRIPTS_DIR, 'upload-to-cdn.js'),
                    path.join(outputDir, 'images'),
                    bucketUrl
                ];

                if (publicUrl) {
                    uploadArgs.push('--public-url', publicUrl);
                }

                await runCommand('node', uploadArgs);
                
                console.log('\n✅ Images uploaded to cloud storage');
                break;

            case 'update-csv':
                if (!csvPath) {
                    console.error('\n❌ CSV path required for update-csv step');
                    process.exit(1);
                }
                if (!publicUrl) {
                    console.error('\n❌ Public URL required for update-csv step');
                    console.error('   Use: --public-url https://cdn.example.com/path\n');
                    process.exit(1);
                }

                console.log('\n📝 Step 3: Updating CSV with new URLs...\n');
                
                const manifestPath = path.join(outputDir, 'images', 'manifest.json');
                const updatedCsvPath = path.join(outputDir, 'products-updated.csv');
                
                await runCommand('node', [
                    path.join(SCRIPTS_DIR, 'update-csv-urls.js'),
                    csvPath,
                    manifestPath,
                    publicUrl,
                    updatedCsvPath
                ]);
                
                console.log(`\n✅ Updated CSV saved to: ${updatedCsvPath}`);
                break;

            default:
                console.error(`❌ Unknown step: ${currentStep}`);
                process.exit(1);
        }
    }

    console.log('\n' + '='.repeat(40));
    console.log('✅ Transfer complete!\n');
    
    if (toEnv) {
        console.log(`Next steps:`);
        console.log(`  1. Import ${path.join(outputDir, 'products-updated.csv')} to ${toEnv}`);
        console.log(`  2. Verify products in BigCommerce admin`);
        console.log(`  3. Run: npm run start:${toEnv === 'production' ? 'prod' : toEnv}`);
    }
    console.log('');
}

/**
 * Show help
 */
function showHelp() {
    console.log(`
BigCommerce Image Transfer
==========================

Transfers product images between BigCommerce environments.

Usage:
  node transfer-images.js --from <env> [--to <env>] [options]

Options:
  --from <env>        Source environment (staging, production)
  --to <env>          Target environment (optional)
  --csv <path>        Path to product export CSV
  --bucket <url>      S3/R2 bucket URL (s3://bucket/path)
  --public-url <url>  Public CDN URL for images
  --output <dir>      Output directory for downloaded files
  --step <step>       Run single step (download, upload, update-csv)

Environment Variables:
  AWS_ACCESS_KEY_ID      Cloud storage access key
  AWS_SECRET_ACCESS_KEY  Cloud storage secret key

Examples:

  # Full transfer from staging to production
  node transfer-images.js \\
    --from staging \\
    --to production \\
    --csv ./products-export.csv \\
    --bucket s3://my-bucket/products \\
    --public-url https://cdn.example.com/products

  # Download only
  node transfer-images.js \\
    --from staging \\
    --csv ./products-export.csv \\
    --step download

  # Upload only (after download)
  node transfer-images.js \\
    --from staging \\
    --bucket s3://my-bucket/products \\
    --public-url https://cdn.example.com/products \\
    --step upload
`);
}

// Run
main().catch(err => {
    console.error('❌ Fatal error:', err.message);
    process.exit(1);
});
