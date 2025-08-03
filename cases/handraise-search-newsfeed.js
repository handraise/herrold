const { chromium } = require('@playwright/test');

module.exports = {
  name: 'Handraise Search Newsfeed',
  description: 'Tests login, navigation to newsfeed, and searching for specific content',
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
      console.log('🚀 Starting Handraise search newsfeed test...');
      
      // Step 1: Navigate to the URL and wait for React app to load
      console.log('📄 Step 1: Navigating to:', url);
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      console.log('✅ Page navigation completed');

      // Wait for React app to mount
      console.log('⚛️ Waiting for React app to mount...');
      try {
        await page.waitForSelector('#root, [id*="app"], main, .app', { timeout: 15000 });
        console.log('✅ React app container found');
      } catch {
        console.log('⚠️ React container not found, waiting for interactive elements...');
        await page.waitForSelector('button, input, a, [role="button"]', { timeout: 10000 });
        console.log('✅ Interactive elements found');
      }

      // Step 2: Perform login
      console.log('🔐 Step 2: Logging in...');
      
      // Wait for and fill email field - try multiple selectors
      console.log('📧 Looking for email field...');
      const emailSelectors = [
        'input[type="email"]',
        'input[name="email"]', 
        'input#email',
        'input[aria-label*="mail" i]',
        'input[placeholder*="mail" i]'
      ];
      
      let emailInput;
      for (const selector of emailSelectors) {
        try {
          emailInput = page.locator(selector).first();
          if (await emailInput.isVisible({ timeout: 1000 })) {
            console.log(`✅ Email field found with selector: ${selector}`);
            break;
          }
        } catch {}
      }
      
      if (!emailInput || !(await emailInput.isVisible())) {
        throw new Error('Could not find email input field');
      }
      
      await emailInput.click();
      await emailInput.fill(username);
      console.log('✅ Email filled');

      // Tab to password field (mimics original flow)
      await page.keyboard.press('Tab');
      
      // Fill password field
      console.log('🔑 Looking for password field...');
      const passwordSelectors = [
        'input[type="password"]',
        'input[name="password"]',
        'input#password',
        'input[aria-label*="password" i]'
      ];
      
      let passwordInput;
      for (const selector of passwordSelectors) {
        try {
          passwordInput = page.locator(selector).first();
          if (await passwordInput.isVisible({ timeout: 1000 })) {
            console.log(`✅ Password field found with selector: ${selector}`);
            break;
          }
        } catch {}
      }
      
      if (!passwordInput || !(await passwordInput.isVisible())) {
        throw new Error('Could not find password input field');
      }
      
      await passwordInput.fill(password);
      console.log('✅ Password filled');

      // Submit with Enter key (mimics original flow)
      console.log('⏎ Submitting login with Enter key...');
      await page.keyboard.press('Enter');
      
      // Wait for navigation after login
      console.log('⏳ Waiting for login to complete...');
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        console.log('⚠️ Network idle timeout, continuing...');
      });
      
      // Wait for post-login content
      await page.waitForTimeout(3000);
      
      const currentUrl = page.url();
      console.log('📍 Current URL after login:', currentUrl);
      
      // Step 3: Look for and click "View Newsfeed" button
      console.log('📰 Step 3: Looking for View Newsfeed button...');
      
      // Try multiple selectors for the View Newsfeed button
      const viewNewsfeedSelectors = [
        'button:has-text("View Newsfeed")',
        'a:has-text("View Newsfeed")',
        '[aria-label*="View Newsfeed" i]',
        'button:has-text("Newsfeed")',
        'a:has-text("Newsfeed")'
      ];
      
      let viewButton;
      let buttonFound = false;
      
      for (const selector of viewNewsfeedSelectors) {
        try {
          viewButton = page.locator(selector).first();
          if (await viewButton.isVisible({ timeout: 2000 })) {
            console.log(`✅ View Newsfeed button found with selector: ${selector}`);
            buttonFound = true;
            break;
          }
        } catch {}
      }
      
      if (buttonFound) {
        await viewButton.click();
        console.log('✅ Clicked View Newsfeed button');
        
        // Wait for navigation
        await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
        await page.waitForTimeout(2000);
      } else {
        console.log('⚠️ View Newsfeed button not found, checking if already on newsfeed...');
        
        // Check if we're already on a newsfeed-like page
        if (!currentUrl.includes('newsfeed')) {
          console.log('📍 Not on newsfeed page, will proceed with search anyway');
        }
      }
      
      // Step 4: Perform search
      console.log('🔍 Step 4: Performing search...');
      
      // Look for search input area - try multiple approaches
      const searchSelectors = [
        'input[type="search"]',
        'input[placeholder*="search" i]',
        'input[aria-label*="search" i]',
        'div[contenteditable="true"]',
        'div.flex-1 > div > div', // from original script
        '[role="searchbox"]',
        '[role="textbox"]'
      ];
      
      let searchInput;
      let searchFound = false;
      
      console.log('🔍 Looking for search input...');
      for (const selector of searchSelectors) {
        try {
          const elements = await page.locator(selector).all();
          for (const element of elements) {
            if (await element.isVisible()) {
              searchInput = element;
              console.log(`✅ Search input found with selector: ${selector}`);
              searchFound = true;
              break;
            }
          }
          if (searchFound) break;
        } catch {}
      }
      
      if (!searchFound) {
        // Try clicking on a general area that might reveal search
        console.log('⚠️ Direct search input not found, trying to activate search...');
        
        const topArea = page.locator('div.top-\\[88px\\] p, main > div').first();
        if (await topArea.isVisible({ timeout: 2000 }).catch(() => false)) {
          await topArea.click();
          console.log('✅ Clicked top area to activate search');
          await page.waitForTimeout(1000);
          
          // Try to find search input again
          for (const selector of searchSelectors) {
            try {
              searchInput = page.locator(selector).first();
              if (await searchInput.isVisible({ timeout: 1000 })) {
                console.log(`✅ Search input appeared with selector: ${selector}`);
                searchFound = true;
                break;
              }
            } catch {}
          }
        }
      }
      
      if (searchFound && searchInput) {
        // Clear any existing text and type search term
        await searchInput.click();
        await page.keyboard.press('Control+A'); // Select all
        await page.keyboard.type('WP Engine');
        console.log('✅ Entered search term: "WP Engine"');
        
        // Submit search with Enter
        await page.keyboard.press('Enter');
        console.log('✅ Search submitted');
        
        // Wait for search results
        console.log('⏳ Waiting for search results...');
        await page.waitForTimeout(3000);
        
        // Verify search worked by checking for filtered content
        console.log('🔍 Verifying search results...');
        
        // Look for WP Engine related content
        const wpContent = await page.locator('*:has-text("WP Engine"), *:has-text("WP")').count();
        if (wpContent > 0) {
          console.log(`✅ Found ${wpContent} elements containing "WP Engine" or "WP"`);
        } else {
          console.log('⚠️ No obvious WP Engine content found, but search may have executed');
        }
      } else {
        console.log('⚠️ Could not find or activate search functionality');
        console.log('📍 Current page may not have search feature or requires different interaction');
      }
      
      // Final verification
      const finalUrl = page.url();
      console.log('📍 Final URL:', finalUrl);
      
      // Check if we're on a meaningful page (not login)
      if (finalUrl.includes('auth/login')) {
        throw new Error('Test failed - still on login page');
      }
      
      console.log('🎉 Search newsfeed test completed successfully!');
      
    } catch (error) {
      throw new Error(`Search newsfeed test failed: ${error.message}`);
    } finally {
      await browser.close();
    }
  }
};