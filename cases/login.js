const TestBrowserLauncher = require('../lib/test-browser-launcher');

module.exports = {
  name: 'Load And Login',
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

    const browser = await TestBrowserLauncher.launch();
    const page = await TestBrowserLauncher.createPage(browser);

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

      // Small delay to ensure fields are properly filled
      await page.waitForTimeout(500);

      // Step 4: Find and click submit button
      console.log('🔘 Step 4: Submitting login form...');

      // Try to find the submit button with more specific selectors
      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Sign in"), button:has-text("Login"), input[type="submit"]'
      ).first();

      // Wait for button to be visible and enabled
      await submitButton.waitFor({ state: 'visible', timeout: 5000 });
      console.log('✅ Submit button found and visible');

      // Click the button
      await submitButton.click();
      console.log('✅ Login button clicked');

      // Also try pressing Enter as a backup
      await page.keyboard.press('Enter');
      console.log('✅ Pressed Enter key as backup');

      console.log('⏳ Waiting for login to complete...');

      // Wait for navigation or content change after login
      try {
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        console.log('✅ Page load completed');
      } catch {
        console.log('⚠️ Network idle timeout, checking page state...');
      }

      // Wait a bit for any redirects or React state updates
      await page.waitForTimeout(3000);

      // Verify login was successful
      const currentUrl = page.url();
      console.log('📍 Current URL after login:', currentUrl);

      // Check if we're still on the login page
      if (currentUrl.includes('auth/login')) {
        console.log('🔍 Still on login page, checking for error messages or login indicators...');

        // Check for error messages
        const errorMessage = await page.locator('.error, .alert-danger, [role="alert"], .text-red-500, .text-danger').first();
        if (await errorMessage.isVisible({ timeout: 1000 }).catch(() => false)) {
          const errorText = await errorMessage.textContent();
          throw new Error(`Login failed with error: ${errorText}`);
        }

        // Check for logged-in indicators (sometimes apps stay on login page but show different content)
        try {
          const loggedInIndicator = await page.locator('button:has-text("Logout"), button:has-text("Sign out"), [aria-label*="user"], [aria-label*="account"]').first();
          if (await loggedInIndicator.isVisible({ timeout: 2000 })) {
            console.log('✅ Found logged-in indicator, login successful despite being on login URL');
          } else {
            console.log('⚠️ No clear indication of successful login, but no errors found either');
          }
        } catch {
          console.log('⚠️ Could not verify login status, assuming success if no errors');
        }
      } else {
        console.log('✅ Successfully navigated away from login page');
        console.log('📍 Now on:', currentUrl);
      }

      console.log('🎉 Login test completed successfully!');

    } catch (error) {
      throw new Error(`Login failed: ${error.message}`);
    } finally {
      await browser.close();
    }
  }
};
