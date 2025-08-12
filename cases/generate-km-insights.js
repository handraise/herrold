const { chromium } = require('@playwright/test');

module.exports = {
  name: 'Handraise Generate KM Insights',
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

    const browser = await chromium.launch();
    const page = await browser.newPage();

    // Helper function to wait for the first selector to appear
    async function raceSelector(page, selectors, opts = {}) {
      const timeout = opts.timeout ?? 10000;
      const waits = selectors.map(sel =>
        page.waitForSelector(sel, { timeout })
          .then(() => sel)
          .catch(() => null)
      );
      const result = await Promise.race(waits);
      if (!result) {
        // If race didn't find anything, try them sequentially with better error
        for (const sel of selectors) {
          try {
            await page.waitForSelector(sel, { timeout: 1000 });
            return sel;
          } catch (e) {
            // Continue to next selector
          }
        }
        throw new Error(`None of the selectors were found: ${selectors.join(', ')}`);
      }
      return result;
    }

    try {
      console.log('🚀 Starting Generate Insights test...');

      // Step 1: Navigate to login page
      console.log('📄 Step 1: Navigating to:', url);
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      console.log('✅ Page navigation completed');

      // Wait for React app to mount
      console.log('⚛️ Waiting for React app to mount...');
      await page.waitForSelector('#root, [id*="app"], main, .app', { timeout: 15000 }).catch(() => {
        console.log('⚠️ React container not found, waiting for interactive elements...');
        return page.waitForSelector('button, input, a, [role="button"]', { timeout: 10000 });
      });
      console.log('✅ React app loaded');

      // Step 2: Perform login
      console.log('🔐 Step 2: Logging in...');

      // Find and fill email field
      console.log('✍️ Filling email field...');
      const emailSelectors = [
        'input[type="email"]',
        'input[name="email"]',
        'input[name="username"]',
        '#email',
        'input[placeholder*="email" i]',
        'aria=Email'
      ];
      const emailSelector = await raceSelector(page, emailSelectors);
      await page.locator(emailSelector).fill(username);
      console.log('✅ Email filled');

      // Find and fill password field
      console.log('✍️ Filling password field...');
      const passwordSelectors = [
        'input[type="password"]',
        'input[name="password"]',
        '#password',
        'aria=Password'
      ];
      const passwordSelector = await raceSelector(page, passwordSelectors);
      await page.locator(passwordSelector).fill(password);
      console.log('✅ Password filled');

      // Small delay to ensure fields are properly filled
      await page.waitForTimeout(500);

      // Submit login form
      console.log('🔘 Submitting login form...');
      const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("Sign In")',
        'button:has-text("Sign in")',
        'button:has-text("Login")',
        'input[type="submit"]',
        'aria=Sign In'
      ];
      const submitSelector = await raceSelector(page, submitSelectors);
      await page.locator(submitSelector).click();
      console.log('✅ Login form submitted');

      // Wait for navigation after login
      console.log('⏳ Waiting for login to complete...');
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        console.log('⚠️ Network idle timeout, continuing...');
      });
      await page.waitForTimeout(3000);
      console.log('✅ Login completed');

      // Step 3: Navigate to newsfeed
      console.log('📰 Step 3: Navigating to newsfeed...');
      const newsfeedSelectors = [
        'button:has-text("View Newsfeed")',
        'a:has-text("View Newsfeed")',
        '[aria-label*="View Newsfeed"]',
        'text=View Newsfeed'
      ];

      try {
        const newsfeedSelector = await raceSelector(page, newsfeedSelectors, { timeout: 10000 });
        await page.locator(newsfeedSelector).click();
        console.log('✅ Clicked View Newsfeed');

        // Wait for newsfeed to load
        await page.waitForTimeout(3000);
        console.log('✅ Newsfeed loaded');
      } catch (error) {
        console.log('⚠️ Could not find View Newsfeed button, might already be on newsfeed');
      }

      // Step 4: Generate Insights
      console.log('💡 Step 4: Generating insights...');

      // Click somewhere in the body first (as in original script)
      await page.locator('body').click({ position: { x: 350, y: 223 } });
      await page.waitForTimeout(500);

      const generateInsightsSelectors = [
        'button:has-text("Generate Insights")',
        'span:has-text("Generate Insights")',
        '[aria-label*="Generate Insights"]',
        'text=Generate Insights'
      ];

      const generateSelector = await raceSelector(page, generateInsightsSelectors, { timeout: 10000 });
      await page.locator(generateSelector).click();
      console.log('✅ Clicked Generate Insights');

      // Wait for insights to be generated
      console.log('⏳ Waiting for insights to be generated...');
      await page.waitForTimeout(5000); // Give time for AI to generate insights

      // Step 5: Copy summary
      console.log('📋 Step 5: Copying summary...');
      const copySummarySelectors = [
        'button:has-text("Copy summary")',
        '[aria-label="Copy summary"]',
        'text=Copy summary'
      ];

      try {
        const copySelector = await raceSelector(page, copySummarySelectors, { timeout: 10000 });
        await page.locator(copySelector).click();
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
      } catch (error) {
        throw new Error(`Failed to copy summary: ${error.message}`);
      }

      console.log('🎉 Generate Insights test completed successfully!');

    } catch (error) {
      throw new Error(`Generate Insights test failed: ${error.message}`);
    } finally {
      await browser.close();
    }
  }
};
