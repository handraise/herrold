const { chromium } = require('@playwright/test');

module.exports = {
  name: 'Handraise Load And Login',
  description: 'Tests loading Handraise and performing login',
  test: async () => {
    const url = process.env.HANDRAISE_URL;
    const username = process.env.HANDRAISE_USERNAME;
    const password = process.env.HANDRAISE_PASSWORD;

    if (!url) {
      throw new Error('HANDRAISE_URL must be set in .env file');
    }
    if (!username || !password) {
      throw new Error('HANDRAISE_USERNAME and HANDRAISE_PASSWORD must be set in .env file');
    }

    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
      // Step 1: Navigate to the URL and wait for React app to load
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

      // Step 2: Wait for login form elements with explicit timeouts
      await page.waitForSelector(
        'input[type="email"], input[name="email"], input[name="username"]',
        { timeout: 10000 }
      );
      await page.waitForSelector(
        'input[type="password"], input[name="password"]',
        { timeout: 5000 }
      );

      // Step 3: Fill authentication form
      const emailInput = page.locator(
        'input[type="email"], input[name="email"], input[name="username"]'
      ).first();
      const passwordInput = page.locator(
        'input[type="password"], input[name="password"]'
      ).first();

      await emailInput.fill(username);
      await passwordInput.fill(password);

      // Step 4: Find and click submit button
      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Sign in"), button:has-text("Login"), input[type="submit"]'
      ).first();

      await submitButton.click();
      await page.waitForLoadState('networkidle');

      // Optional: Wait a bit more to ensure login completes
      await page.waitForTimeout(2000);

    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    } finally {
      await browser.close();
    }
  }
};
