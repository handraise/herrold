const { chromium } = require('@playwright/test');
const TestHelpers = require('./test-helpers');
const fs = require('fs');
const path = require('path');

/**
 * Enhanced test runner that wraps existing tests with error handling
 */
class EnhancedTestRunner {
  /**
   * Run a test with enhanced error handling and artifact capture
   */
  static async runTestWithCapture(testModule) {
    // Ensure directories exist
    TestHelpers.ensureScreenshotsDir();
    TestHelpers.ensureLogsDir();
    
    const consoleLogs = [];
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    
    // Capture console output
    console.log = (...args) => {
      const message = args.join(' ');
      consoleLogs.push(`[LOG] ${new Date().toISOString()} - ${message}`);
      originalConsoleLog(...args);
    };
    
    console.error = (...args) => {
      const message = args.join(' ');
      consoleLogs.push(`[ERROR] ${new Date().toISOString()} - ${message}`);
      originalConsoleError(...args);
    };
    
    const startTime = Date.now();
    let browser = null;
    let page = null;
    let testPassed = false;
    let artifacts = {};
    
    try {
      // Launch browser
      browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      // Create context with permissions
      const context = await browser.newContext({
        permissions: ['clipboard-read', 'clipboard-write']
      });
      
      page = await context.newPage();
      
      // Setup page event listeners
      const pageErrors = [];
      const networkFailures = [];
      
      page.on('pageerror', error => {
        const errorMsg = `Page error: ${error.message}`;
        pageErrors.push(errorMsg);
        console.error(errorMsg);
      });
      
      page.on('requestfailed', request => {
        const failureMsg = `Request failed: ${request.url()} - ${request.failure()?.errorText}`;
        networkFailures.push(failureMsg);
        console.error(failureMsg);
      });
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleLogs.push(`[BROWSER ERROR] ${msg.text()}`);
        }
      });
      
      // Create a modified test module that uses our page
      const modifiedTest = async () => {
        // Get the original test function
        const originalTest = testModule.test;
        
        // Check if test expects to create its own browser
        const testCode = originalTest.toString();
        const createsOwnBrowser = testCode.includes('chromium.launch');
        
        if (createsOwnBrowser) {
          // Let test create its own browser, but still try to capture on failure
          await originalTest();
        } else {
          // Inject our page into the test
          const testContext = {
            page,
            browser,
            context
          };
          await originalTest.call(testContext);
        }
      };
      
      // Run the test
      console.log(`🧪 Running test: ${testModule.name}`);
      await modifiedTest();
      
      testPassed = true;
      console.log(`✅ Test "${testModule.name}" passed!`);
      
    } catch (error) {
      console.error(`❌ Test "${testModule.name}" failed:`, error.message);
      
      // Try to capture artifacts
      try {
        if (page) {
          // Capture current URL
          error.url = page.url();
          console.log(`📍 Failed at URL: ${error.url}`);
          
          // Take screenshot
          const screenshotPath = await TestHelpers.captureFailureScreenshot(
            page,
            testModule.name,
            error
          );
          if (screenshotPath) {
            artifacts.screenshot = screenshotPath;
          }
          
          // Save page HTML
          const htmlPath = await TestHelpers.savePageHTML(page, testModule.name);
          if (htmlPath) {
            artifacts.html = htmlPath;
          }
          
          // Capture page state
          const pageState = await TestHelpers.capturePageState(page);
          if (pageState) {
            const stateDir = TestHelpers.ensureLogsDir();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const stateFile = `${testModule.name.replace(/\s+/g, '-')}_${timestamp}_state.json`;
            const statePath = path.join(stateDir, stateFile);
            fs.writeFileSync(statePath, JSON.stringify(pageState, null, 2));
            artifacts.pageState = statePath;
          }
        }
        
        // Always save error log
        const logPath = TestHelpers.saveErrorLog(
          testModule.name,
          error,
          consoleLogs
        );
        if (logPath) {
          artifacts.errorLog = logPath;
        }
        
      } catch (captureError) {
        console.error('Failed to capture all artifacts:', captureError.message);
      }
      
      throw error;
      
    } finally {
      // Restore console
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      
      // Calculate duration
      const duration = Date.now() - startTime;
      
      // Create test report
      const reportPath = TestHelpers.createTestReport(
        testModule.name,
        testPassed,
        duration,
        artifacts
      );
      
      if (Object.keys(artifacts).length > 0) {
        console.log('📁 Test artifacts created:');
        Object.entries(artifacts).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      }
      
      // Close browser
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          console.error('Failed to close browser:', e.message);
        }
      }
    }
  }
}

module.exports = EnhancedTestRunner;