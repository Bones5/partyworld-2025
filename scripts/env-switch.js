#!/usr/bin/env node

/**
 * Environment Switcher for BigCommerce Stencil
 * 
 * Switches between staging and production store credentials
 * by updating config.stencil.json and secrets.stencil.json
 * 
 * Usage:
 *   node scripts/env-switch.js staging
 *   node scripts/env-switch.js production
 *   node scripts/env-switch.js --list
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.join(__dirname, '..');
const ENVS_DIR = path.join(ROOT_DIR, 'environments');
const CONFIG_FILE = path.join(ROOT_DIR, 'config.stencil.json');
const SECRETS_FILE = path.join(ROOT_DIR, 'secrets.stencil.json');

/**
 * List available environments
 */
function listEnvironments() {
    if (!fs.existsSync(ENVS_DIR)) {
        console.log('\n❌ No environments directory found.');
        console.log('   Run: npm run env:init to create environment configs\n');
        return;
    }

    const envs = fs.readdirSync(ENVS_DIR)
        .filter(f => f.endsWith('.config.json'))
        .map(f => f.replace('.config.json', ''));

    if (envs.length === 0) {
        console.log('\n❌ No environments configured.');
        console.log('   Create files in /environments/ directory\n');
        return;
    }

    // Check current environment
    let current = null;
    if (fs.existsSync(CONFIG_FILE)) {
        const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
        for (const env of envs) {
            const envConfig = JSON.parse(
                fs.readFileSync(path.join(ENVS_DIR, `${env}.config.json`), 'utf-8')
            );
            if (config.normalStoreUrl === envConfig.normalStoreUrl) {
                current = env;
                break;
            }
        }
    }

    console.log('\n📦 Available Environments:\n');
    for (const env of envs) {
        const envConfig = JSON.parse(
            fs.readFileSync(path.join(ENVS_DIR, `${env}.config.json`), 'utf-8')
        );
        const marker = env === current ? ' ← current' : '';
        console.log(`   ${env}${marker}`);
        console.log(`      Store: ${envConfig.normalStoreUrl}`);
    }
    console.log('');
}

/**
 * Switch to a specific environment
 */
function switchEnvironment(envName) {
    const configPath = path.join(ENVS_DIR, `${envName}.config.json`);
    const secretsPath = path.join(ENVS_DIR, `${envName}.secrets.json`);

    // Validate environment exists
    if (!fs.existsSync(configPath)) {
        console.error(`\n❌ Environment "${envName}" not found.`);
        console.error(`   Expected file: ${configPath}`);
        console.error('\n   Available environments:');
        listEnvironments();
        process.exit(1);
    }

    if (!fs.existsSync(secretsPath)) {
        console.error(`\n❌ Secrets file for "${envName}" not found.`);
        console.error(`   Expected file: ${secretsPath}`);
        console.error('\n   Create it with your API access token:\n');
        console.error(`   {`);
        console.error(`     "accessToken": "your-api-token-here"`);
        console.error(`   }\n`);
        process.exit(1);
    }

    // Read environment configs
    const envConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const envSecrets = JSON.parse(fs.readFileSync(secretsPath, 'utf-8'));

    // Validate required fields
    if (!envConfig.normalStoreUrl) {
        console.error(`\n❌ Missing "normalStoreUrl" in ${configPath}\n`);
        process.exit(1);
    }

    if (!envSecrets.accessToken) {
        console.error(`\n❌ Missing "accessToken" in ${secretsPath}\n`);
        process.exit(1);
    }

    // Build final configs (merge with defaults)
    const finalConfig = {
        customLayouts: envConfig.customLayouts || {
            brand: {},
            category: {},
            page: {},
            product: {}
        },
        normalStoreUrl: envConfig.normalStoreUrl,
        port: envConfig.port || 3000,
        packageManager: envConfig.packageManager || 'npm'
    };

    const finalSecrets = {
        accessToken: envSecrets.accessToken
    };

    // Write to root config files
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(finalConfig, null, 2) + '\n');
    fs.writeFileSync(SECRETS_FILE, JSON.stringify(finalSecrets, null, 2) + '\n');

    console.log(`\n✅ Switched to "${envName}" environment`);
    console.log(`   Store: ${envConfig.normalStoreUrl}`);
    console.log(`\n   Run: npm start (or stencil start) to launch\n`);
}

/**
 * Initialize environment directory with templates
 */
function initEnvironments() {
    if (!fs.existsSync(ENVS_DIR)) {
        fs.mkdirSync(ENVS_DIR, { recursive: true });
    }

    const stagingConfig = path.join(ENVS_DIR, 'staging.config.json');
    const stagingSecrets = path.join(ENVS_DIR, 'staging.secrets.json');
    const prodConfig = path.join(ENVS_DIR, 'production.config.json');
    const prodSecrets = path.join(ENVS_DIR, 'production.secrets.json');

    // Create staging template
    if (!fs.existsSync(stagingConfig)) {
        fs.writeFileSync(stagingConfig, JSON.stringify({
            normalStoreUrl: 'https://your-staging-store.mybigcommerce.com/',
            port: 3000,
            customLayouts: {
                brand: {},
                category: {},
                page: {},
                product: {}
            }
        }, null, 2) + '\n');
        console.log(`📄 Created ${stagingConfig}`);
    }

    if (!fs.existsSync(stagingSecrets)) {
        fs.writeFileSync(stagingSecrets, JSON.stringify({
            accessToken: 'your-staging-api-token'
        }, null, 2) + '\n');
        console.log(`🔐 Created ${stagingSecrets}`);
    }

    // Create production template
    if (!fs.existsSync(prodConfig)) {
        fs.writeFileSync(prodConfig, JSON.stringify({
            normalStoreUrl: 'https://your-production-store.mybigcommerce.com/',
            port: 3000,
            customLayouts: {
                brand: {},
                category: {},
                page: {},
                product: {}
            }
        }, null, 2) + '\n');
        console.log(`📄 Created ${prodConfig}`);
    }

    if (!fs.existsSync(prodSecrets)) {
        fs.writeFileSync(prodSecrets, JSON.stringify({
            accessToken: 'your-production-api-token'
        }, null, 2) + '\n');
        console.log(`🔐 Created ${prodSecrets}`);
    }

    console.log(`\n✅ Environment templates created in /environments/`);
    console.log(`\n⚠️  Update the config files with your actual store URLs and API tokens`);
    console.log(`   Then run: npm run env:staging or npm run env:prod\n`);
}

/**
 * Get current environment info (for scripts)
 */
function getCurrentEnv() {
    if (!fs.existsSync(CONFIG_FILE)) {
        return null;
    }

    const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    
    if (!fs.existsSync(ENVS_DIR)) {
        return { url: config.normalStoreUrl, name: 'unknown' };
    }

    const envs = fs.readdirSync(ENVS_DIR)
        .filter(f => f.endsWith('.config.json'))
        .map(f => f.replace('.config.json', ''));

    for (const env of envs) {
        const envConfig = JSON.parse(
            fs.readFileSync(path.join(ENVS_DIR, `${env}.config.json`), 'utf-8')
        );
        if (config.normalStoreUrl === envConfig.normalStoreUrl) {
            return { url: config.normalStoreUrl, name: env };
        }
    }

    return { url: config.normalStoreUrl, name: 'unknown' };
}

/**
 * Main
 */
function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (!command || command === '--help' || command === '-h') {
        console.log(`
BigCommerce Stencil Environment Switcher
=========================================

Usage:
  node scripts/env-switch.js <command>

Commands:
  staging       Switch to staging environment
  production    Switch to production environment  
  prod          Alias for production
  --list        List available environments
  --init        Create environment config templates
  --current     Show current environment

Examples:
  npm run env:staging     # Switch to staging
  npm run env:prod        # Switch to production
  npm run env:list        # List environments
`);
        return;
    }

    switch (command) {
        case '--list':
        case '-l':
            listEnvironments();
            break;

        case '--init':
        case 'init':
            initEnvironments();
            break;

        case '--current':
        case 'current':
            const env = getCurrentEnv();
            if (env) {
                console.log(`\n📍 Current environment: ${env.name}`);
                console.log(`   Store: ${env.url}\n`);
            } else {
                console.log('\n❌ No environment configured\n');
            }
            break;

        case 'prod':
            switchEnvironment('production');
            break;

        default:
            switchEnvironment(command);
    }
}

// Export for use in other scripts
module.exports = { getCurrentEnv, switchEnvironment };

// Run if called directly
if (require.main === module) {
    main();
}
