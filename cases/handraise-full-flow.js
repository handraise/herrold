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
      console.log('🚀 Starting Handraise full login flow test...');
      
      // Step 1: Navigate to the URL and wait for React app to load
      console.log('📄 Step 1: Navigating to:', url);
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      console.log('✅ Page navigation completed');
      
      // Wait for React app to mount - look for common React indicators
      console.log('⚛️ Waiting for React app to mount...');
      try {
        await page.waitForSelector('#root, [id*="app"], main, .app', { timeout: 15000 });
        console.log('✅ React app container found');
      } catch {
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

      // Step 2: Wait for login form elements and perform login
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

      // Fill authentication form
      console.log('✍️ Filling login form...');
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

      // Find and click submit button
      console.log('🔘 Clicking login button...');
      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Sign in"), button:has-text("Login"), input[type="submit"]'
      ).first();
      
      await submitButton.click();
      console.log('✅ Login button clicked');

      // Step 3: Wait for redirect and verify we're on newsfeeds page
      console.log('🔄 Step 3: Waiting for redirect to newsfeeds...');
      try {
        await page.waitForURL('**/newsfeeds**', { timeout: 15000 });
        console.log('✅ Successfully redirected to newsfeeds page');
      } catch {
        // If URL doesn't contain newsfeeds, check current URL
        const currentUrl = page.url();
        console.log('⚠️ Checking current URL:', currentUrl);
        if (!currentUrl.includes('newsfeeds')) {
          throw new Error(`Expected redirect to newsfeeds page, but got: ${currentUrl}`);
        }
        console.log('✅ Current URL contains newsfeeds');
      }

      // Step 4: Verify newsfeed page structure
      console.log('📱 Step 4: Verifying newsfeed page structure...');
      // Wait for the main container with specific class
      await page.waitForSelector(
        'main.overflow-y-auto.flex-col.items-center.p-6', 
        { timeout: 10000 }
      );
      console.log('✅ Main container with correct styling found');

      // Step 5: Verify newsfeed content exists
      console.log('📰 Step 5: Looking for newsfeed content...');
      // Look for newsfeed cards with the specific structure
      await page.waitForSelector(
        'div[role="button"][tabindex="0"].relative.focus-visible\\:outline-none.w-\\[900px\\]', 
        { timeout: 10000 }
      );
      console.log('✅ Newsfeed cards structure found');

      // Verify the main container contains newsfeed elements
      console.log('🔍 Counting newsfeed cards...');
      const mainContainer = page.locator('main.overflow-y-auto.flex-col.items-center.p-6');
      const newsfeedCards = mainContainer.locator('div[role="button"]');
      
      const cardCount = await newsfeedCards.count();
      console.log(`📊 Found ${cardCount} newsfeed cards`);
      
      if (cardCount === 0) {
        throw new Error('No newsfeed cards found in main container');
      }

      // Verify at least one card has the expected structure
      console.log('🔍 Verifying card structure...');
      const firstCard = newsfeedCards.first();
      const hasTitle = await firstCard.locator('h1.text-xl.text-gray-800.font-serif').count() > 0;
      const hasViewButton = await firstCard.locator('button:has-text("View Newsfeed")').count() > 0;
      
      if (!hasTitle) {
        throw new Error('Newsfeed card missing title element');
      }
      console.log('✅ Card titles found');
      
      if (!hasViewButton) {
        throw new Error('Newsfeed card missing "View Newsfeed" button');
      }
      console.log('✅ "View Newsfeed" buttons found');

      // Success - all checks passed!
      console.log(`🎉 Full login flow completed successfully! Found ${cardCount} newsfeed cards.`);

    } catch (error) {
      throw new Error(`Full login flow failed: ${error.message}`);
    } finally {
      await browser.close();
    }
  }
};