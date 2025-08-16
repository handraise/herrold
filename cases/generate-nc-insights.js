const TestBrowserLauncher = require('../lib/test-browser-launcher');

module.exports = {
  name: 'Narrative Cluster Insights',
  description: 'Tests login, navigating to newsfeed, generating a NC insights, and copying summary',
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
      console.log('🚀 Starting Generate AI Summary test...');

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

      // Step 4: Generate AI Summary
      console.log('🤖 Step 4: Generating AI summary...');

      // Click somewhere in the body first (as in original script)
      await page.locator('body').click({ position: { x: 348, y: 149 } });
      await page.waitForTimeout(500);

      // Look for Generate AI Summary button with multiple selectors
      const generateButton = page.locator(
        'button:has-text("Generate AI Summary"), span:has-text("Generate AI Summary"), [aria-label*="Generate AI Summary"], span.text-violet-800:has-text("Generate AI Summary")'
      ).first();

      await generateButton.waitFor({ state: 'visible', timeout: 10000 });
      await generateButton.click();
      console.log('✅ Clicked Generate AI Summary');

      // Wait for AI summary to be generated
      console.log('⏳ Waiting for AI summary to be generated...');
      await page.waitForTimeout(5000); // Give time for AI to generate summary

      // Step 5: Copy summary
      console.log('📋 Step 5: Copying AI summary...');

      // Look for Copy summary button
      const copyButton = page.locator(
        'button:has-text("Copy summary"), [aria-label="Copy summary"]'
      ).first();

      try {
        await copyButton.waitFor({ state: 'visible', timeout: 10000 });
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
            console.log('📄 Copied AI Summary Content:');
            console.log('=====================================');
            console.log(copiedText);
            console.log('=====================================');
            console.log('✅ AI Summary copied and logged successfully');
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
                '[class*="ai-summary"]',
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
              console.log('📄 AI Summary Content (from page):');
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
      } catch (error) {
        throw new Error(`Failed to copy AI summary: ${error.message}`);
      }

      console.log('🎉 Generate AI Summary test completed successfully!');

    } catch (error) {
      throw new Error(`Generate AI Summary test failed: ${error.message}`);
    } finally {
      await browser.close();
    }
  }
};
