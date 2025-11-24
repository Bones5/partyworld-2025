/**
 * Common constants for acceptance tests
 */

// Timeout values (in milliseconds)
module.exports = {
  // Wait times for page stability
  PAGE_STABLE_BUFFER: 300,      // Buffer time after page load
  ANIMATION_DURATION: 500,      // Time for CSS animations/transitions
  COOKIE_BANNER_TIMEOUT: 1000,  // Max time to check for cookie banner
  SCROLL_COMPLETE: 300,         // Time to wait after scrolling
  
  // Screenshot comparison thresholds
  DEFAULT_MAX_DIFF_PIXELS: 100,
  DEFAULT_MAX_DIFF_RATIO: 0.01,
  DEFAULT_THRESHOLD: 0.2,
  
  // Test timeouts
  TEST_TIMEOUT: 30000,          // 30 seconds per test
  
  // URLs (customize for your store)
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
};
