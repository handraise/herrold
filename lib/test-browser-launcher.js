const { chromium } = require('@playwright/test');

/**
 * Centralized browser launcher for tests
 * Handles both debug and headless modes
 */
class TestBrowserLauncher {
  static async launch() {
    const options = {
      headless: process.env.HEADED_MODE !== 'true',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    };

    // Add debug mode options
    if (process.env.HEADED_MODE === 'true') {
      options.slowMo = parseInt(process.env.SLOW_MO || '100');
      options.devtools = process.env.DEVTOOLS === 'true';
      options.args.push('--start-maximized');
      
      console.log('🖥️  Browser launching in debug mode:');
      console.log(`   Visible: yes`);
      console.log(`   Slow motion: ${options.slowMo}ms`);
      console.log(`   DevTools: ${options.devtools ? 'yes' : 'no'}`);
    }

    return await chromium.launch(options);
  }

  static async createPage(browser) {
    const context = await browser.newContext({
      viewport: process.env.HEADED_MODE === 'true' ? null : { width: 1280, height: 720 },
      permissions: ['clipboard-read', 'clipboard-write'],
      ignoreHTTPSErrors: true
    });

    const page = await context.newPage();

    // Set timeout based on debug mode
    if (process.env.HEADED_MODE === 'true') {
      const timeout = parseInt(process.env.DEBUG_TIMEOUT || '120000');
      page.setDefaultTimeout(timeout);
      page.setDefaultNavigationTimeout(30000);
    }

    return page;
  }
}

module.exports = TestBrowserLauncher;