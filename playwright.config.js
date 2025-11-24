// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * Playwright configuration for acceptance and visual regression testing
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  testDir: './tests/acceptance',
  
  /* Maximum time one test can run for */
  timeout: 30 * 1000,
  
  /* Run tests in files in parallel */
  // Set to false if tests have dependencies or shared state
  fullyParallel: false,
  
  /* Fail the build on CI if you accidentally left test.only in the source code */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use */
  reporter: [
    ['html', { outputFolder: 'tests/acceptance/results/html-report' }],
    ['list']
  ],
  
  /* Shared settings for all the projects below */
  use: {
    /* Base URL to use in actions like `await page.goto('/')` */
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    /* Collect trace when retrying the failed test */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure */
    video: 'retain-on-failure',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 720 }
      },
    },
    
    /* Test against mobile viewports */
    {
      name: 'mobile',
      use: { 
        ...devices['iPhone 12'],
      },
    },
    
    /* Test against tablet viewports */
    {
      name: 'tablet',
      use: {
        ...devices['iPad Pro'],
      },
    },
  ],

  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: 'tests/acceptance/results/test-results/',
  
  /* Folder for snapshots */
  snapshotDir: 'tests/acceptance/screenshots/baseline',
  
  /* Configure visual comparison settings */
  expect: {
    toHaveScreenshot: {
      /* Maximum number of pixels that can differ */
      maxDiffPixels: 100,
      
      /* Maximum acceptable pixel diff ratio (0-1) */
      maxDiffPixelRatio: 0.01,
      
      /* Threshold for considering pixel as different (0-1) */
      threshold: 0.2,
      
      /* Animation settings */
      animations: 'disabled',
      
      /* CSS media type */
      scale: 'css',
    },
  },
});
