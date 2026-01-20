/**
 * Theme Screenshot Capture Script
 *
 * Captures screenshots for BigCommerce theme thumbnails from localhost.
 *
 * Requirements:
 * - Playwright must be installed: npm install -D @playwright/test
 * - Stencil must be running: npm start
 *
 * Usage:
 * node scripts/capture-screenshots.js
 *
 * BigCommerce thumbnail requirements:
 * - composed.png: 600x760 (combined desktop + mobile preview)
 * - desktop_*.png: 2048x2600
 * - mobile_*.png: 304x540
 */

const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const LOCALHOST_URL = 'http://localhost:3000';
const OUTPUT_DIR = path.join(__dirname, '..', 'meta');

// Screenshot configurations
const screenshots = [
    {
        name: 'desktop_light',
        url: LOCALHOST_URL,
        viewport: { width: 2048, height: 2600 },
        fullPage: false,
    },
    {
        name: 'mobile_light',
        url: LOCALHOST_URL,
        viewport: { width: 375, height: 812 },
        clip: {
            x: 0, y: 0, width: 304, height: 540,
        },
    },
];

async function captureScreenshots() {
    console.log('🚀 Starting screenshot capture...\n');

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const browser = await chromium.launch({
        headless: true,
    });

    try {
        for (const config of screenshots) {
            console.log(`📸 Capturing ${config.name}...`);

            const context = await browser.newContext({
                viewport: config.viewport,
                deviceScaleFactor: 1,
            });

            const page = await context.newPage();

            // Navigate and wait for network idle
            await page.goto(config.url, {
                waitUntil: 'networkidle',
                timeout: 60000,
            });

            // Wait a bit for any animations to settle
            await page.waitForTimeout(2000);

            // Hide any cookie banners or modals that might interfere
            await page.evaluate(() => {
                const selectors = [
                    '[data-consent-manager]',
                    '.cookie-banner',
                    '.modal-background',
                    '#modal',
                ];
                selectors.forEach(sel => {
                    document.querySelectorAll(sel).forEach(el => {
                        el.style.display = 'none';
                    });
                });
            });

            const screenshotOptions = {
                path: path.join(OUTPUT_DIR, `${config.name}.png`),
                type: 'png',
            };

            if (config.clip) {
                screenshotOptions.clip = config.clip;
            } else if (config.fullPage) {
                screenshotOptions.fullPage = true;
            }

            await page.screenshot(screenshotOptions);

            console.log(`   ✅ Saved to meta/${config.name}.png`);

            await context.close();
        }

        // Create composed image (requires sharp or similar - manual step)
        console.log('\n📝 Note: composed.png (600x760) needs to be created manually');
        console.log('   Combine desktop and mobile screenshots in an image editor\n');

        console.log('✨ Screenshot capture complete!');
        console.log(`   Output directory: ${OUTPUT_DIR}\n`);
    } catch (error) {
        console.error('❌ Error capturing screenshots:', error.message);

        if (error.message.includes('net::ERR_CONNECTION_REFUSED')) {
            console.log('\n💡 Tip: Make sure stencil is running with "npm start"');
        }
    } finally {
        await browser.close();
    }
}

// Run the capture
captureScreenshots();
