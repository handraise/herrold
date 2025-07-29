const { chromium } = require('@playwright/test');

module.exports = {
  name: 'Handraise Full Login Flow',
  description: 'Tests complete login flow and verifies newsfeed page loads with content',
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
        await page.waitForSelector('#root, [id*="app"], main, .app', { timeout: 15000 });
      } catch {
        await page.waitForSelector('button, input, a, [role="button"]', { timeout: 10000 });
      }
      
      // Verify the page title loaded
      const title = await page.title();
      if (!title || title.includes('Error')) {
        throw new Error('Page failed to load properly');
      }

      // Step 2: Wait for login form elements and perform login
      await page.waitForSelector(
        'input[type="email"], input[name="email"], input[name="username"]',
        { timeout: 10000 }
      );
      await page.waitForSelector(
        'input[type="password"], input[name="password"]',
        { timeout: 5000 }
      );

      // Fill authentication form
      const emailInput = page.locator(
        'input[type="email"], input[name="email"], input[name="username"]'
      ).first();
      const passwordInput = page.locator(
        'input[type="password"], input[name="password"]'
      ).first();

      await emailInput.fill(username);
      await passwordInput.fill(password);

      // Find and click submit button
      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Sign in"), button:has-text("Login"), input[type="submit"]'
      ).first();
      
      await submitButton.click();

      // Step 3: Wait for redirect and verify we're on newsfeeds page
      try {
        await page.waitForURL('**/newsfeeds**', { timeout: 15000 });
      } catch {
        // If URL doesn't contain newsfeeds, check current URL
        const currentUrl = page.url();
        if (!currentUrl.includes('newsfeeds')) {
          throw new Error(`Expected redirect to newsfeeds page, but got: ${currentUrl}`);
        }
      }

      // Step 4: Verify newsfeed page structure
      // Wait for the main container with specific class
      await page.waitForSelector(
        'main.overflow-y-auto.flex-col.items-center.p-6', 
        { timeout: 10000 }
      );

      // Step 5: Verify newsfeed content exists
      // Look for newsfeed cards with the specific structure
      await page.waitForSelector(
        'div[role="button"][tabindex="0"].relative.focus-visible\\:outline-none.w-\\[900px\\]', 
        { timeout: 10000 }
      );

      // Verify the main container contains newsfeed elements
      const mainContainer = page.locator('main.overflow-y-auto.flex-col.items-center.p-6');
      const newsfeedCards = mainContainer.locator('div[role="button"]');
      
      const cardCount = await newsfeedCards.count();
      if (cardCount === 0) {
        throw new Error('No newsfeed cards found in main container');
      }

      // Verify at least one card has the expected structure
      const firstCard = newsfeedCards.first();
      const hasTitle = await firstCard.locator('h1.text-xl.text-gray-800.font-serif').count() > 0;
      const hasViewButton = await firstCard.locator('button:has-text("View Newsfeed")').count() > 0;
      
      if (!hasTitle) {
        throw new Error('Newsfeed card missing title element');
      }
      if (!hasViewButton) {
        throw new Error('Newsfeed card missing "View Newsfeed" button');
      }

      // Success - all checks passed!
      console.log(`✅ Full login flow completed successfully. Found ${cardCount} newsfeed cards.`);

    } catch (error) {
      throw new Error(`Full login flow failed: ${error.message}`);
    } finally {
      await browser.close();
    }
  }
};