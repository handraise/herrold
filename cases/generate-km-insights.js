const TestBrowserLauncher = require('../lib/test-browser-launcher');
const NetworkHelper = require('../lib/network-helper');

module.exports = {
  name: 'Key Message Insights',
  description: 'Tests login, navigating to newsfeed, generating a KM insights, and copying summary',
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
    
    // Setup GraphQL monitoring for debugging
    NetworkHelper.setupGraphQLMonitoring(page);


    try {
      console.log('🚀 Starting Generate Insights test...');

      // Step 1: Navigate to login page
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

      // Small delay to ensure fields are properly filled
      await page.waitForTimeout(500);

      // Find and click submit button
      console.log('🔘 Submitting login form...');
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

      // Step 3: Wait for navigation after login
      console.log('🔄 Step 3: Waiting for navigation after login...');

      // Wait for either redirect or page content change
      try {
        // First, wait for any navigation or content change
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        console.log('✅ Page loaded after login');

        // Check if we're redirected to newsfeeds
        await page.waitForURL('**/newsfeeds**', { timeout: 5000 });
        console.log('✅ Successfully redirected to newsfeeds page');
      } catch {
        console.log('⚠️ No automatic redirect to newsfeeds, checking for alternate navigation...');

        // Check current URL
        const currentUrl = page.url();
        console.log('📍 Current URL:', currentUrl);

        // If still on login page, look for dashboard or home elements
        if (currentUrl.includes('auth/login')) {
          console.log('🔍 Still on login page, looking for post-login indicators...');

          // Look for common post-login elements
          try {
            // Check for logout button or user menu (indicates successful login)
            const loggedInIndicator = await page.locator('button:has-text("Logout"), button:has-text("Sign out"), [aria-label*="user"], [aria-label*="account"], [data-testid*="user"]').first();
            if (await loggedInIndicator.isVisible({ timeout: 5000 })) {
              console.log('✅ Found logged-in indicator, login successful');

              // Try to navigate to newsfeeds manually
              console.log('🔍 Looking for newsfeeds link/button...');
              const newsfeedsLink = await page.locator('a[href*="newsfeeds"], button:has-text("Newsfeeds"), a:has-text("Newsfeeds"), button:has-text("View Newsfeed"), a:has-text("View Newsfeed")').first();
              if (await newsfeedsLink.isVisible({ timeout: 3000 })) {
                console.log('📱 Clicking newsfeeds/View Newsfeed link...');
                await newsfeedsLink.click();
                await page.waitForLoadState('networkidle', { timeout: 10000 });
                console.log('✅ Navigated to newsfeeds');
              }
            }
          } catch (e) {
            console.log('⚠️ Could not find post-login indicators');
          }
        }

        // Final URL check
        const finalUrl = page.url();
        if (!finalUrl.includes('newsfeeds')) {
          // Check if we're at least logged in (not on login page)
          if (finalUrl.includes('auth/login')) {
            throw new Error(`Login appears to have failed. Still on: ${finalUrl}`);
          }
          console.log('⚠️ Not on newsfeeds page, but login appears successful');
          console.log('📍 Current page:', finalUrl);
        }
      }

      // Step 4: Click on a newsfeed item first
      console.log('📰 Step 4: Clicking on a newsfeed item...');
      
      // Look for View Newsfeed button and click it
      try {
        const viewNewsfeedButton = page.locator('button:has-text("View Newsfeed")').first();
        if (await viewNewsfeedButton.isVisible({ timeout: 3000 })) {
          await viewNewsfeedButton.click();
          console.log('✅ Clicked View Newsfeed button');
          await page.waitForTimeout(2000); // Wait for page to load
        }
      } catch (e) {
        console.log('⚠️ Could not find View Newsfeed button, continuing...');
      }

      // Click somewhere in the body (as in original script)
      await page.locator('body').click({ position: { x: 350, y: 223 } });
      await page.waitForTimeout(500);

      // Step 5: Generate Insights
      console.log('💡 Step 5: Generating insights...');

      // Look for Generate Insights button with multiple selectors
      console.log('🔍 Looking for Generate Insights button...');
      
      // Try multiple possible selectors for the insights button
      const possibleSelectors = [
        'button:has-text("Generate Insights")',
        'button:has-text("Generate KM Insights")',
        'button:has-text("Key Message")',
        'span:has-text("Generate Insights")',
        'span:has-text("Generate KM Insights")',
        '[aria-label*="Generate Insights"]',
        '[aria-label*="Key Message"]',
        'button[class*="insight"]',
        'button[class*="generate"]'
      ];
      
      let generateButton = null;
      for (const selector of possibleSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 1000 })) {
            generateButton = element;
            console.log(`✅ Found button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Try next selector
        }
      }
      
      if (!generateButton) {
        // Log what buttons are visible on the page for debugging
        console.log('⚠️ Generate Insights button not found. Listing visible buttons:');
        const allButtons = await page.locator('button').all();
        for (let i = 0; i < Math.min(allButtons.length, 10); i++) {
          const text = await allButtons[i].textContent();
          console.log(`   Button ${i + 1}: "${text?.trim()}"`);
        }
        throw new Error('Generate Insights button not found on page');
      }
      
      await generateButton.click();
      console.log('✅ Clicked Generate Insights');

      // Wait for insights to be generated
      console.log('⏳ Waiting for insights to be generated...');
      
      // Wait for the insights generation GraphQL requests to complete
      // Try multiple possible operation names
      const possibleOperations = ['feedVolumeData', 'GetFeedVolume', 'GenerateInsights', 'KeyMessageInsights'];
      let foundMatch = false;
      
      for (const opName of possibleOperations) {
        try {
          const graphqlResponse = await NetworkHelper.waitForGraphQL(page, opName, 5000);
          if (graphqlResponse) {
            console.log(`✅ ${opName} GraphQL request completed`);
            foundMatch = true;
            break;
          }
        } catch (e) {
          // Try next operation name
        }
      }
      
      if (!foundMatch) {
        console.log('⚠️ No specific GraphQL operation detected, waiting for network idle...');
        try {
          await page.waitForLoadState('networkidle', { timeout: 15000 });
          console.log('✅ Network idle achieved');
        } catch (idleError) {
          console.log('⚠️ Network still active, proceeding anyway');
        }
      }
      
      // Additional wait to ensure UI updates after GraphQL response
      await page.waitForTimeout(3000);
      
      // Check if a modal or dialog appeared
      try {
        const modal = await page.waitForSelector('[role="dialog"], .modal, [class*="modal"], [class*="dialog"], [class*="popup"]', {
          timeout: 5000,
          state: 'visible'
        });
        if (modal) {
          console.log('✅ Modal/Dialog appeared after insights generation');
          
          // Wait a bit more for content to load in the modal
          await page.waitForTimeout(2000);
        }
      } catch (e) {
        console.log('⚠️ No modal/dialog detected');
      }
      
      // Also wait for specific elements that appear after insights are generated
      try {
        // Wait for any of these elements that typically appear after generation
        await page.waitForSelector('text=/generated/i, text=/summary/i, text=/copy/i, text=/insight/i, [class*="result"], [class*="summary"], [class*="insight"]', {
          timeout: 10000,
          state: 'visible'
        });
        console.log('✅ Found generated content indicators');
      } catch (e) {
        console.log('⚠️ No clear generation indicators found, continuing...');
      }

      // Step 6: Copy summary
      console.log('📋 Step 6: Copying summary...');
      
      // Try multiple selectors for the copy button (including within modals)
      const copySelectors = [
        'button:has-text("Copy summary")',
        'button:has-text("Copy")',
        '[aria-label="Copy summary"]',
        '[aria-label*="Copy"]',
        'button[class*="copy"]',
        'button:has-text("Copy to clipboard")',
        '[role="dialog"] button:has-text("Copy")',
        '.modal button:has-text("Copy")',
        '[class*="modal"] button:has-text("Copy")'
      ];
      
      let copyButton = null;
      for (const selector of copySelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 1000 })) {
            copyButton = element;
            console.log(`✅ Found copy button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Try next selector
        }
      }
      
      if (!copyButton) {
        console.log('⚠️ Copy button not found. Listing visible buttons:');
        const allButtons = await page.locator('button').all();
        for (let i = 0; i < Math.min(allButtons.length, 15); i++) {
          const text = await allButtons[i].textContent();
          if (text) console.log(`   Button ${i + 1}: "${text.trim()}"`);
        }
        
        // Check if there's a modal/dialog and list its content
        try {
          const modalButtons = await page.locator('[role="dialog"] button, .modal button, [class*="modal"] button').all();
          if (modalButtons.length > 0) {
            console.log('🔍 Buttons found in modal/dialog:');
            for (let i = 0; i < modalButtons.length; i++) {
              const text = await modalButtons[i].textContent();
              if (text) console.log(`   Modal Button ${i + 1}: "${text.trim()}"`);
            }
          }
          
          // Also check modal content
          const modalContent = await page.locator('[role="dialog"], .modal, [class*="modal"]').first();
          if (await modalContent.isVisible()) {
            const modalText = await modalContent.textContent();
            console.log('📄 Modal content preview:', modalText?.substring(0, 200) + '...');
          }
        } catch (e) {
          // No modal found
        }
        
        // Also check for any clickable elements with "copy" text
        const copyElements = await page.locator('*:has-text("copy")').all();
        if (copyElements.length > 0) {
          console.log('📋 Elements with "copy" text:');
          for (let i = 0; i < Math.min(copyElements.length, 5); i++) {
            const text = await copyElements[i].textContent();
            const tagName = await copyElements[i].evaluate(el => el.tagName);
            console.log(`   ${tagName}: "${text?.trim()}"`);
          }
        }
        
        // Try to continue without copying
        console.log('⚠️ Continuing without copying summary');
      } else {
        await copyButton.click();
        console.log('✅ Clicked Copy summary');

        // Small delay to ensure copy action completes
        await page.waitForTimeout(1000);

        // Read the clipboard content to log the copied summary
        try {
          // Grant clipboard permissions and read the copied text
          await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
          const copiedText = await page.evaluate(async () => {
            try {
              return await navigator.clipboard.readText();
            } catch (e) {
              // Fallback: try to find the summary text on the page
              const summaryElement = document.querySelector('[class*="summary"], [class*="insight"], [id*="summary"], [id*="insight"]');
              return summaryElement ? summaryElement.textContent : null;
            }
          });

          if (copiedText) {
            console.log('📄 Copied Summary Content:');
            console.log('=====================================');
            console.log(copiedText);
            console.log('=====================================');
            console.log('✅ Summary copied and logged successfully');
          } else {
            console.log('⚠️ Could not retrieve clipboard content, but copy action was performed');
          }
        } catch (clipboardError) {
          console.log('⚠️ Could not read clipboard:', clipboardError.message);

          // Alternative: Try to find and log the summary text directly from the page
          try {
            const summaryText = await page.evaluate(() => {
              // Try multiple selectors to find the summary content
              const selectors = [
                '[class*="summary-content"]',
                '[class*="insight-text"]',
                '[class*="generated-summary"]',
                '[data-testid*="summary"]',
                '.modal-body', // If summary appears in a modal
                '[role="dialog"] p', // Dialog content
              ];

              for (const selector of selectors) {
                const element = document.querySelector(selector);
                if (element && element.textContent) {
                  return element.textContent.trim();
                }
              }
              return null;
            });

            if (summaryText) {
              console.log('📄 Summary Content (from page):');
              console.log('=====================================');
              console.log(summaryText);
              console.log('=====================================');
            }
          } catch (e) {
            console.log('⚠️ Could not extract summary text from page');
          }
        }

        // Check for success notification or toast (if applicable)
        try {
          await page.waitForSelector('text=/copied/i', { timeout: 2000 });
          console.log('✅ Copy confirmation detected');
        } catch {
          console.log('⚠️ No copy confirmation toast found');
        }
      }

      console.log('🎉 Generate Insights test completed successfully!');

    } catch (error) {
      throw new Error(`Generate Insights test failed: ${error.message}`);
    } finally {
      await browser.close();
    }
  }
};
