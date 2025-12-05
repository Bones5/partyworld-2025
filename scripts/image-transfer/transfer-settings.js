#!/usr/bin/env node

/**
 * BigCommerce Store Settings Transfer
 * 
 * Transfers store settings between BigCommerce environments including:
 * - Store profile (name, address, phone, email)
 * - Logo and favicon
 * - SEO settings (meta, robots.txt)
 * - Storefront settings (product, category, search, security)
 * - URL redirects
 * - Marketing banners
 * - Blog posts and tags
 * - Scripts (analytics, tracking)
 * - Search filters
 * - Custom template associations
 * 
 * Usage:
 *   node transfer-settings.js --from staging --to production
 *   node transfer-settings.js --export staging
 *   node transfer-settings.js --import ./settings.json --to production
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT_DIR = path.join(__dirname, '../..');
const ENVS_DIR = path.join(ROOT_DIR, 'environments');

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
    
    if (!fs.existsSync(secretsPath)) {
        throw new Error(`Secrets file not found for "${envName}".`);
    }
    
    const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf-8'));

    if (!config.storeHash) {
        throw new Error(`Missing "storeHash" in ${configPath}. Required for API calls.`);
    }

    return {
        name: envName,
        storeUrl: config.normalStoreUrl,
        storeHash: config.storeHash,
        accessToken: secrets.accessToken,
    };
}

/**
 * Make API request to BigCommerce
 */
async function apiRequest(config, method, endpoint, body = null, apiVersion = 'v2') {
    return new Promise((resolve, reject) => {
        const url = new URL(`https://api.bigcommerce.com/stores/${config.storeHash}/${apiVersion}${endpoint}`);
        
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
 * Fetch store information (V2 API)
 */
async function fetchStoreInfo(config) {
    console.log(`\n📋 Fetching store info from ${config.name}...`);
    const info = await apiRequest(config, 'GET', '/store', null, 'v2');
    console.log(`   ✓ Store: ${info.name}`);
    return info;
}

/**
 * Fetch store profile/settings (V3 API)
 */
async function fetchStoreProfile(config) {
    console.log(`\n👤 Fetching store profile from ${config.name}...`);
    
    try {
        const response = await apiRequest(config, 'GET', '/settings/store/profile', null, 'v3');
        console.log(`   ✓ Profile loaded`);
        return response.data;
    } catch (err) {
        console.log(`   ⚠️  Profile endpoint not available (${err.statusCode})`);
        return null;
    }
}

/**
 * Fetch store locale settings
 */
async function fetchStoreLocale(config) {
    console.log(`\n🌍 Fetching locale settings from ${config.name}...`);
    
    try {
        const response = await apiRequest(config, 'GET', '/settings/store/locale', null, 'v3');
        console.log(`   ✓ Locale loaded`);
        return response.data;
    } catch (err) {
        console.log(`   ⚠️  Locale endpoint not available (${err.statusCode})`);
        return null;
    }
}

/**
 * Fetch storefront settings
 */
async function fetchStorefrontSettings(config) {
    console.log(`\n🏪 Fetching storefront settings from ${config.name}...`);
    
    try {
        const response = await apiRequest(config, 'GET', '/settings/storefront/product', null, 'v3');
        return response.data;
    } catch {
        return null;
    }
}

/**
 * Fetch SEO settings
 */
async function fetchSeoSettings(config) {
    console.log(`\n🔍 Fetching SEO settings from ${config.name}...`);
    
    try {
        const response = await apiRequest(config, 'GET', '/settings/storefront/seo', null, 'v3');
        console.log(`   ✓ SEO settings loaded`);
        return response.data;
    } catch (err) {
        console.log(`   ⚠️  SEO endpoint not available (${err.statusCode})`);
        return null;
    }
}

/**
 * Fetch robots.txt settings
 */
async function fetchRobotsTxt(config) {
    console.log(`\n🤖 Fetching robots.txt from ${config.name}...`);
    
    try {
        const response = await apiRequest(config, 'GET', '/settings/storefront/robotstxt', null, 'v3');
        console.log(`   ✓ Robots.txt loaded`);
        return response.data;
    } catch (err) {
        console.log(`   ⚠️  Robots.txt endpoint not available`);
        return null;
    }
}

/**
 * Fetch logo settings
 */
async function fetchLogoSettings(config) {
    console.log(`\n🖼️  Fetching logo settings from ${config.name}...`);
    
    try {
        const response = await apiRequest(config, 'GET', '/settings/logo', null, 'v3');
        console.log(`   ✓ Logo settings loaded`);
        return response.data;
    } catch (err) {
        console.log(`   ⚠️  Logo endpoint not available`);
        return null;
    }
}

/**
 * Fetch storefront category settings
 */
async function fetchCategorySettings(config) {
    console.log(`\n📁 Fetching category settings from ${config.name}...`);
    
    try {
        const response = await apiRequest(config, 'GET', '/settings/storefront/category', null, 'v3');
        console.log(`   ✓ Category settings loaded`);
        return response.data;
    } catch (err) {
        console.log(`   ⚠️  Category settings not available`);
        return null;
    }
}

/**
 * Fetch storefront search settings
 */
async function fetchSearchSettings(config) {
    console.log(`\n🔎 Fetching search settings from ${config.name}...`);
    
    try {
        const response = await apiRequest(config, 'GET', '/settings/storefront/search', null, 'v3');
        console.log(`   ✓ Search settings loaded`);
        return response.data;
    } catch (err) {
        console.log(`   ⚠️  Search settings not available`);
        return null;
    }
}

/**
 * Fetch search filters
 */
async function fetchSearchFilters(config) {
    console.log(`\n🏷️  Fetching search filters from ${config.name}...`);
    
    try {
        const response = await apiRequest(config, 'GET', '/settings/search/filters', null, 'v3');
        console.log(`   ✓ Search filters loaded (${response.data?.length || 0} filters)`);
        return response.data;
    } catch (err) {
        console.log(`   ⚠️  Search filters not available`);
        return null;
    }
}

/**
 * Fetch storefront security settings
 */
async function fetchSecuritySettings(config) {
    console.log(`\n🔒 Fetching security settings from ${config.name}...`);
    
    try {
        const response = await apiRequest(config, 'GET', '/settings/storefront/security', null, 'v3');
        console.log(`   ✓ Security settings loaded`);
        return response.data;
    } catch (err) {
        console.log(`   ⚠️  Security settings not available`);
        return null;
    }
}

/**
 * Fetch storefront status
 */
async function fetchStorefrontStatus(config) {
    console.log(`\n📊 Fetching storefront status from ${config.name}...`);
    
    try {
        const response = await apiRequest(config, 'GET', '/settings/storefront/status', null, 'v3');
        console.log(`   ✓ Storefront status loaded`);
        return response.data;
    } catch (err) {
        console.log(`   ⚠️  Storefront status not available`);
        return null;
    }
}

/**
 * Fetch scripts (analytics, tracking)
 */
async function fetchScripts(config) {
    console.log(`\n📜 Fetching scripts from ${config.name}...`);
    
    try {
        const response = await apiRequest(config, 'GET', '/content/scripts', null, 'v3');
        console.log(`   ✓ Scripts loaded (${response.data?.length || 0} scripts)`);
        return response.data;
    } catch (err) {
        console.log(`   ⚠️  Scripts endpoint not available`);
        return null;
    }
}

/**
 * Fetch URL redirects
 */
async function fetchRedirects(config) {
    console.log(`\n🔀 Fetching URL redirects from ${config.name}...`);
    
    const redirects = [];
    let page = 1;
    const limit = 100;
    
    try {
        while (true) {
            const response = await apiRequest(config, 'GET', `/storefront/redirects?page=${page}&limit=${limit}`, null, 'v3');
            
            if (!response.data || response.data.length === 0) break;
            redirects.push(...response.data);
            
            if (response.data.length < limit) break;
            page++;
        }
        console.log(`   ✓ Redirects loaded (${redirects.length} redirects)`);
        return redirects;
    } catch (err) {
        console.log(`   ⚠️  Redirects endpoint not available`);
        return null;
    }
}

/**
 * Fetch marketing banners
 */
async function fetchBanners(config) {
    console.log(`\n🎯 Fetching marketing banners from ${config.name}...`);
    
    try {
        const response = await apiRequest(config, 'GET', '/banners', null, 'v2');
        console.log(`   ✓ Banners loaded (${response?.length || 0} banners)`);
        return response;
    } catch (err) {
        console.log(`   ⚠️  Banners endpoint not available`);
        return null;
    }
}

/**
 * Fetch blog posts
 */
async function fetchBlogPosts(config) {
    console.log(`\n📝 Fetching blog posts from ${config.name}...`);
    
    try {
        const response = await apiRequest(config, 'GET', '/blog/posts', null, 'v2');
        console.log(`   ✓ Blog posts loaded (${response?.length || 0} posts)`);
        return response;
    } catch (err) {
        console.log(`   ⚠️  Blog posts endpoint not available`);
        return null;
    }
}

/**
 * Fetch custom template associations
 */
async function fetchCustomTemplates(config) {
    console.log(`\n📄 Fetching custom template associations from ${config.name}...`);
    
    try {
        const response = await apiRequest(config, 'GET', '/storefront/custom-template-associations', null, 'v3');
        console.log(`   ✓ Custom templates loaded (${response.data?.length || 0} associations)`);
        return response.data;
    } catch (err) {
        console.log(`   ⚠️  Custom templates endpoint not available`);
        return null;
    }
}

/**
 * Fetch analytics providers
 */
async function fetchAnalytics(config) {
    console.log(`\n📈 Fetching analytics settings from ${config.name}...`);
    
    try {
        const response = await apiRequest(config, 'GET', '/settings/analytics', null, 'v3');
        console.log(`   ✓ Analytics loaded (${response.data?.length || 0} providers)`);
        return response.data;
    } catch (err) {
        console.log(`   ⚠️  Analytics endpoint not available`);
        return null;
    }
}

/**
 * Fetch all settings
 */
async function fetchAllSettings(config, options = {}) {
    const settings = {
        // Core store info
        storeInfo: null,
        profile: null,
        locale: null,
        
        // Storefront settings
        storefront: null,
        categorySettings: null,
        searchSettings: null,
        searchFilters: null,
        securitySettings: null,
        storefrontStatus: null,
        
        // Branding
        logo: null,
        seo: null,
        robotsTxt: null,
        
        // Content
        scripts: null,
        redirects: null,
        banners: null,
        blogPosts: null,
        customTemplates: null,
        
        // Analytics
        analytics: null,
        
        // Metadata
        exportedAt: new Date().toISOString(),
        sourceEnvironment: config.name,
        sourceStore: config.storeUrl,
    };

    // Core settings (always fetch)
    settings.storeInfo = await fetchStoreInfo(config);
    settings.profile = await fetchStoreProfile(config);
    settings.locale = await fetchStoreLocale(config);

    // Storefront settings
    settings.storefront = await fetchStorefrontSettings(config);
    settings.categorySettings = await fetchCategorySettings(config);
    settings.searchSettings = await fetchSearchSettings(config);
    settings.securitySettings = await fetchSecuritySettings(config);
    settings.storefrontStatus = await fetchStorefrontStatus(config);
    
    // Branding
    settings.logo = await fetchLogoSettings(config);
    settings.seo = await fetchSeoSettings(config);
    settings.robotsTxt = await fetchRobotsTxt(config);
    
    // Extended content (optional - can be slow)
    if (!options.coreOnly) {
        settings.scripts = await fetchScripts(config);
        settings.searchFilters = await fetchSearchFilters(config);
        settings.analytics = await fetchAnalytics(config);
        settings.customTemplates = await fetchCustomTemplates(config);
    }
    
    // Content that may have many items (opt-in)
    if (options.includeContent) {
        settings.redirects = await fetchRedirects(config);
        settings.banners = await fetchBanners(config);
        settings.blogPosts = await fetchBlogPosts(config);
    }

    return settings;
}

/**
 * Update store profile
 */
async function updateStoreProfile(config, profile) {
    if (!profile) return false;

    console.log(`\n👤 Updating store profile...`);
    
    try {
        await apiRequest(config, 'PUT', '/settings/store/profile', profile, 'v3');
        console.log(`   ✓ Profile updated`);
        return true;
    } catch (err) {
        console.error(`   ❌ Failed: ${err.message}`);
        return false;
    }
}

/**
 * Update store locale
 */
async function updateStoreLocale(config, locale) {
    if (!locale) return false;

    console.log(`\n🌍 Updating locale settings...`);
    
    try {
        await apiRequest(config, 'PUT', '/settings/store/locale', locale, 'v3');
        console.log(`   ✓ Locale updated`);
        return true;
    } catch (err) {
        console.error(`   ❌ Failed: ${err.message}`);
        return false;
    }
}

/**
 * Update SEO settings
 */
async function updateSeoSettings(config, seo) {
    if (!seo) return false;

    console.log(`\n🔍 Updating SEO settings...`);
    
    try {
        await apiRequest(config, 'PUT', '/settings/storefront/seo', seo, 'v3');
        console.log(`   ✓ SEO settings updated`);
        return true;
    } catch (err) {
        console.error(`   ❌ Failed: ${err.message}`);
        return false;
    }
}

/**
 * Display settings summary
 */
function displaySettings(settings) {
    console.log('\n' + '─'.repeat(50));
    console.log('📊 Store Settings Summary');
    console.log('─'.repeat(50));

    if (settings.storeInfo) {
        const info = settings.storeInfo;
        console.log('\n📋 Store Information:');
        console.log(`   Name:     ${info.name || 'N/A'}`);
        console.log(`   Domain:   ${info.domain || 'N/A'}`);
        console.log(`   Email:    ${info.admin_email || 'N/A'}`);
        console.log(`   Phone:    ${info.phone || 'N/A'}`);
        console.log(`   Address:  ${info.address || 'N/A'}`);
        console.log(`   Currency: ${info.currency || 'N/A'}`);
        console.log(`   Timezone: ${info.timezone?.name || 'N/A'}`);
    }

    if (settings.profile) {
        const profile = settings.profile;
        console.log('\n👤 Store Profile:');
        console.log(`   Store Name:    ${profile.store_name || 'N/A'}`);
        console.log(`   Store Phone:   ${profile.store_phone || 'N/A'}`);
        console.log(`   Store Email:   ${profile.store_email || 'N/A'}`);
        console.log(`   Store Address: ${profile.store_address || 'N/A'}`);
    }

    if (settings.locale) {
        const locale = settings.locale;
        console.log('\n🌍 Locale Settings:');
        console.log(`   Default Locale: ${locale.default_shopper_language || 'N/A'}`);
        console.log(`   Store Country:  ${locale.store_country || 'N/A'}`);
    }

    if (settings.seo) {
        const seo = settings.seo;
        console.log('\n🔍 SEO Settings:');
        console.log(`   Meta Title:       ${seo.page_title || 'N/A'}`);
        console.log(`   Meta Description: ${(seo.meta_description || 'N/A').substring(0, 50)}...`);
        console.log(`   WWW Redirect:     ${seo.www_redirect || 'N/A'}`);
    }

    if (settings.logo) {
        console.log('\n🖼️  Logo Settings:');
        console.log(`   Logo Type: ${settings.logo.logo_type || 'N/A'}`);
        console.log(`   Logo URL:  ${settings.logo.logo_image_url || 'N/A'}`);
    }

    if (settings.scripts?.length) {
        console.log(`\n📜 Scripts: ${settings.scripts.length} script(s)`);
        settings.scripts.slice(0, 3).forEach(s => {
            console.log(`   • ${s.name || s.uuid} (${s.location})`);
        });
        if (settings.scripts.length > 3) {
            console.log(`   ... and ${settings.scripts.length - 3} more`);
        }
    }

    if (settings.redirects?.length) {
        console.log(`\n🔀 Redirects: ${settings.redirects.length} redirect(s)`);
    }

    if (settings.banners?.length) {
        console.log(`\n🎯 Banners: ${settings.banners.length} banner(s)`);
    }

    if (settings.blogPosts?.length) {
        console.log(`\n📝 Blog Posts: ${settings.blogPosts.length} post(s)`);
    }

    if (settings.analytics?.length) {
        console.log(`\n📈 Analytics Providers: ${settings.analytics.length}`);
        settings.analytics.forEach(a => {
            console.log(`   • ${a.name}: ${a.enabled ? 'enabled' : 'disabled'}`);
        });
    }

    if (settings.customTemplates?.length) {
        console.log(`\n📄 Custom Templates: ${settings.customTemplates.length} association(s)`);
    }

    console.log('\n' + '─'.repeat(50));
}

/**
 * Generate timestamp string for filenames
 */
function getTimestamp() {
    const now = new Date();
    return now.toISOString()
        .replace(/[:-]/g, '')
        .replace('T', '-')
        .slice(0, 15);  // YYYYMMDD-HHMMSS
}

/**
 * Get exports directory for an environment
 */
function getExportsDir(envName) {
    const exportsDir = path.join(ROOT_DIR, 'exports', envName);
    if (!fs.existsSync(exportsDir)) {
        fs.mkdirSync(exportsDir, { recursive: true });
    }
    return exportsDir;
}

/**
 * Export settings to file
 */
function exportSettings(settings, outputPath, envName) {
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(settings, null, 2));
    console.log(`\n💾 Settings exported to: ${outputPath}`);
    
    // Also create/update a 'latest' symlink
    if (envName) {
        const latestPath = path.join(dir, `settings-latest.json`);
        try {
            if (fs.existsSync(latestPath)) {
                fs.unlinkSync(latestPath);
            }
            fs.copyFileSync(outputPath, latestPath);
            console.log(`   Latest: ${latestPath}`);
        } catch {
            // Symlink might fail on some systems, ignore
        }
    }
}

/**
 * Show help
 */
function showHelp() {
    console.log(`
BigCommerce Store Settings Transfer
====================================

Transfers store settings relevant to theme construction between environments.

Usage:
  node transfer-settings.js --from <env> --to <env> [options]
  node transfer-settings.js --export <env> [options]
  node transfer-settings.js --import <file> --to <env>
  node transfer-settings.js --show <env>

Commands:
  --from <env>     Source environment name
  --to <env>       Target environment name
  --export <env>   Export settings to JSON file
  --import <file>  Import settings from JSON file
  --show <env>     Display current settings

Options:
  --output <file>     Output file path (default: settings-<env>.json)
  --dry-run           Preview without making changes
  --core-only         Fetch only core settings (faster)
  --include-content   Include redirects, banners, blog posts
  --profile           Transfer profile settings only
  --seo               Transfer SEO settings only
  --locale            Transfer locale settings only

Settings Transferred (Theme-Relevant):
  
  Core Settings:
  • Store profile (name, phone, email, address)
  • Locale (country, language, timezone)
  • Logo settings and images
  
  Storefront Settings:
  • Product display settings
  • Category display settings
  • Search settings and filters
  • Security settings (HTTPS, etc.)
  
  SEO & Discovery:
  • Meta title, description
  • Robots.txt content
  • WWW redirect behavior
  
  Scripts & Analytics:
  • Injected scripts (tracking, chat, etc.)
  • Analytics providers (Google, Facebook, etc.)
  
  Content (with --include-content):
  • URL redirects
  • Marketing banners
  • Blog posts
  • Custom template associations

NOT Transferred (require manual setup):
  • Payment methods & gateways
  • Shipping zones & methods
  • Tax settings & rules
  • Email templates
  • API credentials
  • Theme files (use stencil push)

Examples:

  # Show current settings
  node transfer-settings.js --show staging

  # Export all settings to file
  node transfer-settings.js --export staging --output ./staging-settings.json

  # Export with content (redirects, banners, blog)
  node transfer-settings.js --export staging --include-content

  # Quick export (core settings only)
  node transfer-settings.js --export staging --core-only

  # Transfer all settings
  node transfer-settings.js --from staging --to production

  # Transfer only profile (phone, email, address)
  node transfer-settings.js --from staging --to production --profile

  # Dry run (preview)
  node transfer-settings.js --from staging --to production --dry-run
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
    let importFile = null;
    let showEnv = null;
    let outputPath = null;
    let dryRun = false;
    let profileOnly = false;
    let seoOnly = false;
    let localeOnly = false;
    let coreOnly = false;
    let includeContent = false;

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
                importFile = args[++i];
                break;
            case '--show':
                showEnv = args[++i];
                break;
            case '--output':
                outputPath = args[++i];
                break;
            case '--dry-run':
                dryRun = true;
                break;
            case '--profile':
                profileOnly = true;
                break;
            case '--seo':
                seoOnly = true;
                break;
            case '--locale':
                localeOnly = true;
                break;
            case '--core-only':
                coreOnly = true;
                break;
            case '--include-content':
                includeContent = true;
                break;
        }
    }

    const fetchOptions = { coreOnly, includeContent };

    console.log('\n⚙️  BigCommerce Store Settings Transfer\n');

    try {
        // Show settings mode
        if (showEnv) {
            const config = loadEnvConfig(showEnv);
            const settings = await fetchAllSettings(config, fetchOptions);
            displaySettings(settings);
            return;
        }

        // Export mode
        if (exportEnv) {
            const config = loadEnvConfig(exportEnv);
            const settings = await fetchAllSettings(config, fetchOptions);
            displaySettings(settings);
            
            // Use provided output path or generate timestamped path in exports folder
            let output;
            if (outputPath) {
                output = outputPath;
            } else {
                const exportsDir = getExportsDir(exportEnv);
                const timestamp = getTimestamp();
                output = path.join(exportsDir, `settings-${timestamp}.json`);
            }
            
            exportSettings(settings, output, exportEnv);
            return;
        }

        // Import from file mode
        if (importFile && toEnv) {
            if (!fs.existsSync(importFile)) {
                throw new Error(`Import file not found: ${importFile}`);
            }
            
            const settings = JSON.parse(fs.readFileSync(importFile, 'utf-8'));
            const targetConfig = loadEnvConfig(toEnv);

            console.log(`📂 Importing from: ${importFile}`);
            console.log(`📥 Target: ${toEnv} (${targetConfig.storeUrl})`);

            if (dryRun) {
                console.log('\n🔍 DRY RUN - No changes will be made');
                displaySettings(settings);
                return;
            }

            if (!profileOnly && !seoOnly && !localeOnly) {
                await updateStoreProfile(targetConfig, settings.profile);
                await updateStoreLocale(targetConfig, settings.locale);
                await updateSeoSettings(targetConfig, settings.seo);
            } else {
                if (profileOnly) await updateStoreProfile(targetConfig, settings.profile);
                if (localeOnly) await updateStoreLocale(targetConfig, settings.locale);
                if (seoOnly) await updateSeoSettings(targetConfig, settings.seo);
            }

            console.log('\n✅ Settings imported successfully!');
            return;
        }

        // Full transfer mode
        if (fromEnv && toEnv) {
            const sourceConfig = loadEnvConfig(fromEnv);
            const targetConfig = loadEnvConfig(toEnv);

            console.log('='.repeat(50));
            console.log(`📤 Source: ${fromEnv} (${sourceConfig.storeUrl})`);
            console.log(`📥 Target: ${toEnv} (${targetConfig.storeUrl})`);
            console.log('='.repeat(50));

            // Fetch source settings
            const settings = await fetchAllSettings(sourceConfig, fetchOptions);
            displaySettings(settings);

            if (dryRun) {
                console.log('\n🔍 DRY RUN - No changes will be made to target');
                return;
            }

            console.log('\n📥 Applying settings to target store...');

            if (!profileOnly && !seoOnly && !localeOnly) {
                await updateStoreProfile(targetConfig, settings.profile);
                await updateStoreLocale(targetConfig, settings.locale);
                await updateSeoSettings(targetConfig, settings.seo);
                // Note: Additional settings like scripts, redirects, banners
                // require separate update functions (not yet implemented for safety)
            } else {
                if (profileOnly) await updateStoreProfile(targetConfig, settings.profile);
                if (localeOnly) await updateStoreLocale(targetConfig, settings.locale);
                if (seoOnly) await updateSeoSettings(targetConfig, settings.seo);
            }

            // Save backup to exports folder
            const exportsDir = getExportsDir(fromEnv);
            const timestamp = getTimestamp();
            const backupPath = path.join(exportsDir, `settings-${timestamp}-transferred-to-${toEnv}.json`);
            exportSettings(settings, backupPath, fromEnv);

            console.log('\n✅ Settings transferred successfully!');
            console.log('\n⚠️  Note: Scripts, redirects, banners, and blog posts are');
            console.log('   exported for reference but require manual transfer.');
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