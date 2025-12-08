const { test, expect } = require('@playwright/test');
const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');

// Build smoke test: SCSS + JS must compile without errors
test.describe('Build Smoke Tests', () => {
  test('theme compiles without SCSS or JS errors (webpack)', async () => {
    let buildOutput = '';
    let exitCode = 0;

    try {
      buildOutput = execSync('npm run buildDev', {
        cwd: ROOT,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 120000, // 2 minutes max
      });
    } catch (err) {
      exitCode = err.status || 1;
      buildOutput = (err.stdout || '') + '\n' + (err.stderr || '');
    }

    // Log output for debugging on failure
    if (exitCode !== 0) {
      console.error('Build failed with output:\n', buildOutput);
    }

    expect(exitCode, `Build failed. Output:\n${buildOutput}`).toBe(0);
  });

  test('theme SCSS compiles via Stencil bundle', async () => {
    let bundleOutput = '';
    let exitCode = 0;

    try {
      // stencil bundle compiles SCSS through Stencil's node-sass pipeline
      bundleOutput = execSync('npx stencil bundle', {
        cwd: ROOT,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 180000, // 3 minutes max
      });
    } catch (err) {
      exitCode = err.status || 1;
      bundleOutput = (err.stdout || '') + '\n' + (err.stderr || '');
    }

    // Log output for debugging on failure
    if (exitCode !== 0) {
      console.error('Stencil bundle failed with output:\n', bundleOutput);
    }

    expect(exitCode, `Stencil bundle failed. Output:\n${bundleOutput}`).toBe(0);
  });
});
