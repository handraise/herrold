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
      console.log('🚀 Starting Handraise login test...');
      
      // Step 1: Navigate to the URL and wait for React app to load
      console.log('📄 Step 1: Navigating to:', url);
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

      // Step 2: Wait for login form elements with explicit timeouts
      console.log('🔐 Step 2: Looking for login form elements...');
      await page.waitForSelector(
        'input[type="email"], input[name="email"], input[name="username"]',
        { timeout: 10000 }
      );
      console.log('✅ Email input field found');
      
      await page.waitForSelector(
        'input[type="password"], input[name="password"]',
        { timeout: 5000 }
      );
      console.log('✅ Password input field found');

      // Step 3: Fill authentication form
      console.log('✍️ Step 3: Filling login form...');
      const emailInput = page.locator(
        'input[type="email"], input[name="email"], input[name="username"]'
      ).first();
      const passwordInput = page.locator(
        'input[type="password"], input[name="password"]'
      ).first();

      await emailInput.fill(username);
      console.log('✅ Email filled');
      await passwordInput.fill(password);
      console.log('✅ Password filled');

      // Step 4: Find and click submit button
      console.log('🔘 Step 4: Clicking login button...');
      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Sign in"), button:has-text("Login"), input[type="submit"]'
      ).first();

      await submitButton.click();
      console.log('✅ Login button clicked');
      
      console.log('⏳ Waiting for login to complete...');
      await page.waitForLoadState('networkidle');
      console.log('✅ Page load completed');

      // Optional: Wait a bit more to ensure login completes
      await page.waitForTimeout(2000);
      console.log('🎉 Login test completed successfully!');

    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    } finally {
      await browser.close();
    }
  }
};
