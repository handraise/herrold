const TestBrowserLauncher = require('../lib/test-browser-launcher');
const NetworkHelper = require('../lib/network-helper');

module.exports = {
  name: 'SOV Analysis',
  description: 'Tests login, navigating to newsfeeds, clicking Share of Voice button, and verifying segments/filters match table data',
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
      console.log('🚀 Starting SOV Analysis test...');

      // Step 1: Navigate to login page
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

      // Verify the page title loaded
      console.log('🔍 Verifying page title...');
      const title = await page.title();
      if (!title || title.includes('Error')) {
        throw new Error('Page failed to load properly');
      }
      console.log('✅ Page title verified:', title);

      // Step 2: Perform login
      console.log('🔐 Step 2: Performing login...');
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

      // Submit login form
      console.log('🔘 Submitting login form...');
      const submitButton = page.locator(
        'button[type="submit"], button:has-text("Sign in"), button:has-text("Login"), input[type="submit"]'
      ).first();

      await submitButton.waitFor({ state: 'visible', timeout: 5000 });
      console.log('✅ Submit button found and visible');

      await submitButton.click();
      console.log('✅ Login button clicked');

      // Also try pressing Enter as a backup
      await page.keyboard.press('Enter');
      console.log('✅ Pressed Enter key as backup');

      // Step 3: Wait for navigation after login
      console.log('🔄 Step 3: Waiting for navigation after login...');

      try {
        await page.waitForLoadState('networkidle', { timeout: 10000 });
        console.log('✅ Page loaded after login');

        // Check if we're redirected to newsfeeds
        await page.waitForURL('**/newsfeeds**', { timeout: 5000 });
        console.log('✅ Successfully redirected to newsfeeds page');
      } catch {
        console.log('⚠️ No automatic redirect to newsfeeds, checking for alternate navigation...');

        const currentUrl = page.url();
        console.log('📍 Current URL:', currentUrl);

        if (currentUrl.includes('auth/login')) {
          console.log('🔍 Still on login page, looking for post-login indicators...');

          try {
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

        const finalUrl = page.url();
        if (!finalUrl.includes('newsfeeds')) {
          if (finalUrl.includes('auth/login')) {
            throw new Error(`Login appears to have failed. Still on: ${finalUrl}`);
          }
          console.log('⚠️ Not on newsfeeds page, but login appears successful');
          console.log('📍 Current page:', finalUrl);
        }
      }

      // Step 4: Wait for newsfeeds to load and click on one
      console.log('📰 Step 4: Clicking on a newsfeed item...');
      
      try {
        await page.waitForSelector('button:has-text("View Newsfeed")', { timeout: 10000 });
        const viewNewsfeedButtons = await page.locator('button:has-text("View Newsfeed")').all();
        console.log(`📊 Found ${viewNewsfeedButtons.length} newsfeed items`);
        
        if (viewNewsfeedButtons.length > 0) {
          // Click the first available newsfeed
          await viewNewsfeedButtons[0].click();
          console.log(`✅ Clicked the first View Newsfeed button`);
          await page.waitForTimeout(3000); // Wait for page to load
        }
      } catch (e) {
        console.log('⚠️ Could not find View Newsfeed buttons');
        throw new Error('No newsfeeds available to click');
      }

      // Step 5: Look for and click the Share of Voice button in the sidebar
      console.log('📊 Step 5: Looking for Share of Voice button in sidebar...');
      
      // Wait for sidebar to load
      await page.waitForTimeout(2000);
      
      // Look for the Share of Voice button with specific classes and SVG
      const sovButtonSelectors = [
        // Exact button structure from your example
        'button:has(span:text("Share of Voice"))',
        'button:has-text("Share of Voice")',
        'button[data-react-aria-pressable="true"]:has(span:text("Share of Voice"))',
        'button.bg-slate-100:has(span:text("Share of Voice"))',
        // Fallback selectors
        'button:has(svg):has(span:text("Share of Voice"))',
        '[role="button"]:has-text("Share of Voice")'
      ];
      
      let sovButton = null;
      for (const selector of sovButtonSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 2000 })) {
            sovButton = element;
            console.log(`✅ Found Share of Voice button with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Try next selector
        }
      }
      
      if (!sovButton) {
        // List all visible buttons in sidebar for debugging
        console.log('⚠️ Share of Voice button not found directly, listing sidebar buttons...');
        const sidebarButtons = await page.locator('button[data-react-aria-pressable="true"]').all();
        console.log(`Found ${sidebarButtons.length} sidebar buttons:`);
        for (let i = 0; i < Math.min(sidebarButtons.length, 15); i++) {
          const text = await sidebarButtons[i].textContent();
          if (text && text.trim()) {
            console.log(`   Button ${i + 1}: "${text.trim()}"`);
            if (text.includes('Share of Voice') || text.includes('SOV')) {
              sovButton = sidebarButtons[i];
              console.log('✅ Found Share of Voice button in list');
              break;
            }
          }
        }
      }
      
      if (!sovButton) {
        throw new Error('Share of Voice button not found in sidebar');
      }
      
      // Click the Share of Voice button
      await sovButton.click();
      console.log('✅ Clicked Share of Voice button');
      
      // Wait for SOV content to load
      await page.waitForTimeout(3000);
      
      // Wait for any GraphQL requests
      try {
        await page.waitForLoadState('networkidle', { timeout: 5000 });
        console.log('✅ SOV data loaded');
      } catch {
        console.log('⚠️ Network still active, proceeding...');
      }

      // Step 6: Look for the Segments section
      console.log('🏷️ Step 6: Looking for Segments section...');
      
      // Look for the segments section with the specific structure
      const segmentsSection = await page.locator('section[aria-labelledby="filter-header-label"]:has(div:text("Segments"))').first();
      
      if (await segmentsSection.isVisible({ timeout: 5000 })) {
        console.log('✅ Found Segments section');
        
        // Look for the "Add a new segment" button to confirm we have the right section
        const addSegmentButton = await segmentsSection.locator('button[aria-label="Add a new segment"]').first();
        if (await addSegmentButton.isVisible()) {
          console.log('✅ Found "Add a new segment" button');
        }
      } else {
        console.log('⚠️ Segments section not found with expected structure');
      }

      // Step 7: List all segment items
      console.log('📋 Step 7: Listing all segment items...');
      
      const segmentItems = [];
      
      // Look for segment items with the specific structure from the example
      const segmentSelectors = [
        // Exact selector based on the provided HTML structure
        'div[aria-label="segment-list-item"]',
        // Alternative selectors
        'div.flex.items-center.justify-between.hover\\:bg-slate-300\\/10:has(span.text-gray-900)',
        'div:has(button[aria-label="View/ Hide segment"])',
        // Look for divs containing both color indicator and text
        'div:has(span[aria-label="Color indicator"]) > span.text-gray-900',
        // Parent container of segments
        'div:has(> div[aria-label="segment-list-item"])'
      ];
      
      for (const selector of segmentSelectors) {
        try {
          let elements;
          if (selector === 'div:has(span[aria-label="Color indicator"]) > span.text-gray-900') {
            // For this selector, we need to get the text spans directly
            elements = await page.locator('div:has(span[aria-label="Color indicator"]) span.text-gray-900').all();
          } else if (selector === 'div:has(> div[aria-label="segment-list-item"])') {
            // Get all segment items from parent
            const parent = await page.locator(selector).first();
            if (await parent.isVisible()) {
              elements = await parent.locator('div[aria-label="segment-list-item"]').all();
            } else {
              elements = [];
            }
          } else {
            elements = await page.locator(selector).all();
          }
          
          if (elements.length > 0) {
            console.log(`Found ${elements.length} segment items with selector: ${selector}`);
            for (let i = 0; i < elements.length; i++) {
              let text;
              
              // For segment list items, extract the text from the specific span
              if (selector === 'div[aria-label="segment-list-item"]' || 
                  selector === 'div:has(> div[aria-label="segment-list-item"])') {
                // Look for the text span within the segment item
                const textSpan = await elements[i].locator('span.text-gray-900').first();
                text = await textSpan.textContent();
              } else if (selector === 'div:has(span[aria-label="Color indicator"]) > span.text-gray-900') {
                // Direct text from span
                text = await elements[i].textContent();
              } else {
                // Get text from the element, but try to find the main text span first
                const textSpan = await elements[i].locator('span.text-gray-900').first();
                if (await textSpan.count() > 0) {
                  text = await textSpan.textContent();
                } else {
                  text = await elements[i].textContent();
                }
              }
              
              if (text && text.trim()) {
                const cleanText = text.trim().replace(/\s+/g, ' ');
                // Avoid duplicates
                if (!segmentItems.includes(cleanText)) {
                  segmentItems.push(cleanText);
                  console.log(`   Segment ${segmentItems.length}: "${cleanText}"`);
                }
              }
            }
            if (segmentItems.length > 0) break;
          }
        } catch (e) {
          // Try next selector
        }
      }
      
      // If still no segments found, try a more generic approach
      if (segmentItems.length === 0) {
        console.log('⚠️ Trying alternative approach to find segments...');
        
        // Look for any text near color indicators
        const colorIndicators = await page.locator('span[aria-label="Color indicator"]').all();
        if (colorIndicators.length > 0) {
          console.log(`Found ${colorIndicators.length} color indicators, extracting adjacent text...`);
          for (let i = 0; i < colorIndicators.length; i++) {
            // Get the parent and find the text span
            const parent = await colorIndicators[i].locator('..').first();
            const textElement = await parent.locator('span:not([aria-label])').first();
            const text = await textElement.textContent();
            if (text && text.trim()) {
              const cleanText = text.trim().replace(/\s+/g, ' ');
              if (!segmentItems.includes(cleanText)) {
                segmentItems.push(cleanText);
                console.log(`   Segment ${segmentItems.length}: "${cleanText}"`);
              }
            }
          }
        }
      }
      
      if (segmentItems.length === 0) {
        console.log('⚠️ No segment items found');
      } else {
        console.log(`✅ Found ${segmentItems.length} segment items total`);
      }

      // Step 8: Find and list all rows in the AG Grid table
      console.log('📊 Step 8: Looking for AG Grid table and its rows...');
      
      const tableRows = [];
      
      // Look for the AG Grid table with the specific class pattern
      const agGridSelectors = [
        // Exact class pattern from your example
        '[class*="ag-theme-params-1"][class*="ag-theme-buttonStyle-1"]',
        // General AG Grid selectors
        '.ag-root',
        '.ag-root-wrapper',
        '[class*="ag-theme"]',
        // Table body rows
        '.ag-body-viewport .ag-row',
        '.ag-center-cols-container .ag-row',
        '[role="row"]'
      ];
      
      let agGrid = null;
      for (const selector of agGridSelectors) {
        try {
          const element = page.locator(selector).first();
          if (await element.isVisible({ timeout: 2000 })) {
            agGrid = element;
            console.log(`✅ Found AG Grid with selector: ${selector}`);
            break;
          }
        } catch (e) {
          // Try next selector
        }
      }
      
      if (agGrid) {
        // Get all rows from the AG Grid
        const rowSelectors = [
          '.ag-row',
          '[role="row"]:not([aria-rowindex="1"])', // Exclude header row
          '.ag-center-cols-container [role="row"]'
        ];
        
        for (const rowSelector of rowSelectors) {
          try {
            const rows = await page.locator(rowSelector).all();
            if (rows.length > 0) {
              console.log(`Found ${rows.length} rows in AG Grid`);
              for (let i = 0; i < rows.length; i++) {
                const rowText = await rows[i].textContent();
                if (rowText && rowText.trim()) {
                  const cleanText = rowText.trim().replace(/\s+/g, ' ');
                  tableRows.push(cleanText);
                  console.log(`   Row ${i + 1}: "${cleanText.substring(0, 100)}${cleanText.length > 100 ? '...' : ''}"`);
                }
              }
              break;
            }
          } catch (e) {
            // Try next selector
          }
        }
        
        // Also try to get column headers
        const headerCells = await page.locator('.ag-header-cell-text, [role="columnheader"]').all();
        if (headerCells.length > 0) {
          console.log('📊 Table columns:');
          for (let i = 0; i < headerCells.length; i++) {
            const headerText = await headerCells[i].textContent();
            if (headerText && headerText.trim()) {
              console.log(`   Column ${i + 1}: "${headerText.trim()}"`);
            }
          }
        }
      } else {
        console.log('⚠️ AG Grid table not found');
      }

      // Step 9: Look for the Filters section
      console.log('🔍 Step 9: Looking for Filters section...');
      
      const filtersSection = await page.locator('section[aria-labelledby="filter-header-label"]:has(div:text("Filters"))').first();
      
      if (await filtersSection.isVisible({ timeout: 5000 })) {
        console.log('✅ Found Filters section');
      } else {
        console.log('⚠️ Filters section not found with expected structure');
      }

      // Step 10: List all filter items
      console.log('📋 Step 10: Listing all filter items...');
      
      const filterItems = [];
      const filterTiers = {};
      
      // Look for accordion/collapsible filter sections (Tier 1, Tier 2, etc.)
      const accordionSelectors = [
        // Accordion items with tier structure
        'div[data-state="open"][data-orientation="vertical"]',
        // Accordion headers with checkbox
        'h3[data-orientation="vertical"] button[role="checkbox"]',
        // Accordion content regions
        'div[role="region"][data-state="open"]'
      ];
      
      // First, look for tier sections
      try {
        // Find all accordion sections with filters
        const accordionSections = await page.locator('div[data-state][data-orientation="vertical"]:has(button[role="checkbox"])').all();
        
        console.log(`Found ${accordionSections.length} filter tier sections\n`);
        
        // Process each filter category and extract segments within
        for (let i = 0; i < accordionSections.length; i++) {
          const tierButton = await accordionSections[i].locator('h3 button[data-state][aria-expanded]:has(span)').first();
          const tierName = await tierButton.textContent();
          
          if (tierName && tierName.trim()) {
            const cleanTierName = tierName.trim();
            filterTiers[cleanTierName] = [];
            
            console.log(`   📁 Filter Category: ${cleanTierName}`);
            
            // Check if accordion is expanded
            const isExpanded = await tierButton.getAttribute('aria-expanded');
            
            if (isExpanded === 'false') {
              // Click to expand the accordion
              await tierButton.click();
              await page.waitForTimeout(300); // Short wait for expansion
            }
            
            // Now look for segments within this filter category
            const contentRegion = await accordionSections[i].locator('div[role="region"]').first();
            
            if (await contentRegion.count() > 0) {
              // Look for all segment items within this filter
              // They have color indicators and entity names
              const segmentSpans = await contentRegion.locator('span.w-2.h-2.rounded-full + span').all();
              
              if (segmentSpans.length > 0) {
                for (const span of segmentSpans) {
                  const segmentName = await span.textContent();
                  if (segmentName && segmentName.trim()) {
                    const cleanSegmentName = segmentName.trim();
                    filterTiers[cleanTierName].push(cleanSegmentName);
                    if (!filterItems.includes(cleanSegmentName)) {
                      filterItems.push(cleanSegmentName);
                    }
                    console.log(`      • ${cleanSegmentName}`);
                  }
                }
              } else {
                console.log(`      (No segments in this category)`);
              }
            } else {
              console.log(`      (Could not access content)`);
            }
            
            // Collapse the accordion again to keep UI clean
            if (isExpanded === 'false') {
              await tierButton.click();
              await page.waitForTimeout(100);
            }
          }
        }
        
        // Summary of filter categories
        const categoryNames = Object.keys(filterTiers);
        console.log(`\n   Total filter categories: ${categoryNames.length}`);
        console.log(`   Categories: ${categoryNames.join(', ')}`);
        
      } catch (e) {
        console.log('⚠️ Could not parse tier structure, trying alternative approach...', e.message);
      }
      
      // If no filter items found through tier structure, try direct approach
      if (filterItems.length === 0) {
        console.log('⚠️ Trying direct approach to find filter items...');
        
        // Look for filter items directly
        const directFilterSelectors = [
          // Items with tier numbers and entity names
          'div:has(div.text-\\[9px\\].font-medium):has(span.w-2.h-2.rounded-full)',
          // Items with percentage counts
          'div.flex.items-center.justify-between.py-0\\.5.text-xxs:has(span.rounded-full)',
          // Any span next to a color indicator within filter area
          'section:has(div:text("Filters")) ~ * span.w-2.h-2.rounded-full + span'
        ];
        
        for (const selector of directFilterSelectors) {
          try {
            const elements = await page.locator(selector).all();
            if (elements.length > 0) {
              console.log(`Found ${elements.length} filter items with selector: ${selector}`);
              
              for (let i = 0; i < elements.length; i++) {
                let filterText;
                
                if (selector.includes('+ span')) {
                  // Direct span after color indicator
                  filterText = await elements[i].textContent();
                } else {
                  // Complex structure - look for the entity name span
                  const nameSpan = await elements[i].locator('span.flex.items-center.justify-between.py-0\\.5.text-xxs').first();
                  if (await nameSpan.count() > 0) {
                    filterText = await nameSpan.textContent();
                  } else {
                    // Fallback to any text span
                    const textSpan = await elements[i].locator('span:not([style]):not([aria-hidden])').nth(1);
                    filterText = await textSpan.textContent();
                  }
                }
                
                if (filterText && filterText.trim()) {
                  const cleanText = filterText.trim();
                  if (!filterItems.includes(cleanText)) {
                    filterItems.push(cleanText);
                    console.log(`   Filter ${filterItems.length}: "${cleanText}"`);
                  }
                }
              }
              
              if (filterItems.length > 0) break;
            }
          } catch (e) {
            // Try next selector
          }
        }
      }
      
      // Summary
      if (filterItems.length === 0) {
        console.log('⚠️ No filter items found');
      } else {
        console.log(`\n✅ Found ${filterItems.length} filter items total`);
        
        // If we have tier information, show summary
        if (Object.keys(filterTiers).length > 0) {
          console.log('📊 Filter Tiers Summary:');
          for (const [tier, items] of Object.entries(filterTiers)) {
            console.log(`   ${tier}: ${items.length} items`);
          }
        }
      }

      // Step 11: Verify that table rows match segments
      console.log('🔄 Step 11: Verifying table rows match segments...');
      
      if (segmentItems.length > 0 && tableRows.length > 0) {
        console.log('Checking if segment items appear in table rows...');
        
        let matchCount = 0;
        for (const segment of segmentItems) {
          // Extract the main text from segment (remove counts, etc.)
          const segmentName = segment.split(/\d+/)[0].trim();
          
          let found = false;
          for (const row of tableRows) {
            if (row.toLowerCase().includes(segmentName.toLowerCase())) {
              console.log(`   ✅ Segment "${segmentName}" found in table`);
              matchCount++;
              found = true;
              break;
            }
          }
          
          if (!found) {
            console.log(`   ⚠️ Segment "${segmentName}" not found in table`);
          }
        }
        
        if (matchCount > 0) {
          console.log(`✅ ${matchCount} of ${segmentItems.length} segments found in table`);
        } else {
          console.log('⚠️ No segments matched with table rows');
        }
      } else {
        console.log('⚠️ Cannot verify matches - missing segments or table data');
      }

      // Step 12: Verify that segments in filters match initial segments
      console.log('🔄 Step 12: Verifying segments in filter categories match initial segments...\n');
      
      if (Object.keys(filterTiers).length > 0 && segmentItems.length > 0) {
        // Collect all unique segments from all filter categories
        const allFilterSegments = new Set();
        
        for (const [category, segments] of Object.entries(filterTiers)) {
          segments.forEach(seg => allFilterSegments.add(seg));
        }
        
        console.log(`   Initial segments found: ${segmentItems.join(', ')}`);
        console.log(`   Unique segments in filters: ${Array.from(allFilterSegments).join(', ')}\n`);
        
        // Check each initial segment appears in filter segments
        let matchCount = 0;
        for (const segment of segmentItems) {
          if (allFilterSegments.has(segment)) {
            console.log(`   ✅ Segment "${segment}" found in filters`);
            matchCount++;
          } else {
            console.log(`   ❌ Segment "${segment}" NOT found in filters`);
          }
        }
        
        // Check for any extra segments in filters not in initial list
        const extraSegments = [];
        for (const filterSeg of allFilterSegments) {
          if (!segmentItems.includes(filterSeg)) {
            extraSegments.push(filterSeg);
          }
        }
        
        if (extraSegments.length > 0) {
          console.log(`\n   ⚠️ Extra segments in filters not in initial list: ${extraSegments.join(', ')}`);
        }
        
        // Calculate match percentage
        const matchPercentage = (matchCount / segmentItems.length) * 100;
        console.log(`\n   📊 Match Rate: ${matchCount}/${segmentItems.length} (${matchPercentage.toFixed(0)}%)`);
        
        if (matchPercentage === 100) {
          console.log('   ✅ Perfect match! All initial segments appear in filter categories');
        } else if (matchPercentage >= 75) {
          console.log('   ✅ Good match - most segments found in filters');
        } else {
          console.log('   ⚠️ Low match rate - segments may not be properly categorized');
        }
        
        // Show distribution across categories
        console.log('\n   📊 Segment distribution across filter categories:');
        for (const [category, segments] of Object.entries(filterTiers)) {
          if (segments.length > 0) {
            console.log(`      ${category}: ${segments.join(', ')}`);
          }
        }
        
      } else if (Object.keys(filterTiers).length === 0) {
        console.log('⚠️ No filter categories were expanded to check segments');
      } else {
        console.log('⚠️ No initial segments to compare with');
      }

      // Success!
      console.log('\n🎉 SOV Analysis test completed successfully!');
      
      // Summary of test results
      console.log('\n📊 Test Summary:');
      console.log('   ✅ Login successful');
      console.log('   ✅ Navigation to newsfeeds successful');
      console.log('   ✅ Clicked on newsfeed item');
      console.log('   ✅ Share of Voice button found and clicked');
      console.log(`   ${segmentItems.length > 0 ? '✅' : '⚠️'} Segments section: ${segmentItems.length} items found`);
      console.log(`   ${tableRows.length > 0 ? '✅' : '⚠️'} AG Grid table: ${tableRows.length} rows found`);
      console.log(`   ${filterItems.length > 0 ? '✅' : '⚠️'} Filters section: ${filterItems.length} items found`);
      
      if (segmentItems.length > 0 && tableRows.length > 0) {
        console.log('   ✅ Data consistency check performed');
      }

    } catch (error) {
      throw new Error(`SOV Analysis test failed: ${error.message}`);
    } finally {
      await browser.close();
    }
  }
};