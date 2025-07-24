const { chromium } = require('@playwright/test');

module.exports = {
  name: 'Handraise Staging Load',
  description: 'Tests that Handraise staging app loads successfully',
  test: async () => {
    const url = process.env.HANDRAISE_URL;
    if (!url) {
      throw new Error('HANDRAISE_URL must be set in .env file');
    }

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    await browser.close();
  }
};