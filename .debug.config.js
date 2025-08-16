/**
 * Debug configuration for Playwright tests
 * These settings are applied when running tests in debug mode
 */

module.exports = {
  // Browser launch options for debug mode
  browserOptions: {
    headless: false,  // Show browser window
    slowMo: parseInt(process.env.SLOW_MO || '100'), // Slow down actions
    devtools: process.env.DEVTOOLS === 'true', // Open DevTools
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--start-maximized' // Start browser maximized
    ]
  },

  // Context options for debug mode
  contextOptions: {
    viewport: null, // Use full browser window
    ignoreHTTPSErrors: true,
    permissions: ['clipboard-read', 'clipboard-write'],
    recordVideo: {
      dir: './test-artifacts/videos',
      size: { width: 1280, height: 720 }
    }
  },

  // Test timeouts for debug mode
  timeouts: {
    test: parseInt(process.env.DEBUG_TIMEOUT || '120000'), // 2 minutes
    navigation: 30000, // 30 seconds
    action: 10000 // 10 seconds for each action
  },

  // Debug helpers
  debug: {
    pauseOnFailure: process.env.PAUSE_ON_FAILURE === 'true',
    screenshot: {
      fullPage: true,
      animations: 'disabled' // Disable animations for cleaner screenshots
    },
    trace: {
      enabled: process.env.TRACE === 'true',
      screenshots: true,
      snapshots: true,
      sources: true
    }
  },

  // Helper function to get browser launch options
  getBrowserOptions() {
    if (process.env.HEADED_MODE === 'true') {
      return this.browserOptions;
    }
    // Default headless options
    return {
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    };
  },

  // Helper function to get context options
  getContextOptions() {
    if (process.env.HEADED_MODE === 'true') {
      return this.contextOptions;
    }
    // Default context options
    return {
      viewport: { width: 1280, height: 720 },
      ignoreHTTPSErrors: true,
      permissions: ['clipboard-read', 'clipboard-write']
    };
  }
};