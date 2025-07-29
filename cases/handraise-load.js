const { chromium } = require('@playwright/test');

module.exports = {
  name: 'Handraise Login Load',
  description: 'Tests that Handraise staging app login loads successfully',
  test: async () => {
    const url = process.env.HANDRAISE_URL;
    if (!url) {
      throw new Error('HANDRAISE_URL must be set in .env file');
    }

    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
      // Navigate and wait for basic load
      await page.goto(url, { waitUntil: 'domcontentloaded' });

      // Wait for React app to mount - look for common React indicators
      try {
        // Option 1: Wait for React root div or main app container
        await page.waitForSelector('#root, [id*="app"], main, .app', { timeout: 15000 });
      } catch {
        // Option 2: If no common selectors, wait for any interactive element
        await page.waitForSelector('button, input, a, [role="button"]', { timeout: 10000 });
      }

      // Verify the page title loaded
      const title = await page.title();
      if (!title || title.includes('Error')) {
        throw new Error('Page failed to load properly');
      }

    } catch (error) {
      throw new Error(`React app load failed: ${error.message}`);
    } finally {
      await browser.close();
    }
  }
};
