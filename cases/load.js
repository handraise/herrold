const { chromium } = require('@playwright/test');

module.exports = {
  name: 'Load',
  description: 'Tests that Handraise app loads successfully',
  test: async () => {
    const url = process.env.HANDRAISE_URL;
    if (!url) {
      throw new Error('HANDRAISE_URL must be set in .env file');
    }

    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
      console.log('🚀 Starting Handraise load test...');

      // Navigate and wait for basic load
      console.log('📄 Navigating to:', url);
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      console.log('✅ Page navigation completed');

      // Wait for React app to mount - look for common React indicators
      console.log('⚛️ Waiting for React app to mount...');
      try {
        // Option 1: Wait for React root div or main app container
        await page.waitForSelector('#root, [id*="app"], main, .app', { timeout: 15000 });
        console.log('✅ React app container found');
      } catch {
        // Option 2: If no common selectors, wait for any interactive element
        console.log('⚠️ React container not found, waiting for interactive elements...');
        await page.waitForSelector('button, input, a, [role="button"]', { timeout: 10000 });
        console.log('✅ Interactive elements found');
      }

      // Verify the page title loaded
      console.log('🔍 Verifying page title...');
      const title = await page.title();
      if (!title || title.includes('Error')) {
        throw new Error('Page failed to load properly');
      }
      console.log('✅ Page title verified:', title);
      console.log('🎉 Load test completed successfully!');

    } catch (error) {
      throw new Error(`React app load failed: ${error.message}`);
    } finally {
      await browser.close();
    }
  }
};
