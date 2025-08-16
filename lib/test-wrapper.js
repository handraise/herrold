const TestHelpers = require('./test-helpers');

/**
 * Wraps a test function with error handling and artifact capture
 * @param {Object} testModule - The test module with name, description, and test function
 * @returns {Object} - Enhanced test module with error handling
 */
function wrapTestWithErrorHandling(testModule) {
  const originalTest = testModule.test;
  
  // Create enhanced test function
  testModule.test = async function() {
    const { chromium } = require('@playwright/test');
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Array to capture console logs
    const consoleLogs = [];
    
    // Setup console capture
    TestHelpers.setupConsoleCapture(page, consoleLogs);
    
    // Track test start time
    const startTime = Date.now();
    let testPassed = false;
    let artifacts = {};
    
    try {
      console.log(`🧪 Starting test: ${testModule.name}`);
      
      // Call original test function with page
      await originalTest.call(this, { page, browser });
      
      testPassed = true;
      console.log(`✅ Test "${testModule.name}" completed successfully!`);
      
    } catch (error) {
      console.error(`❌ Test "${testModule.name}" failed:`, error.message);
      
      // Capture failure artifacts
      try {
        // Add current URL to error
        error.url = page.url();
        
        // Capture screenshot
        const screenshotPath = await TestHelpers.captureFailureScreenshot(
          page, 
          testModule.name, 
          error
        );
        if (screenshotPath) artifacts.screenshot = screenshotPath;
        
        // Save page HTML
        const htmlPath = await TestHelpers.savePageHTML(page, testModule.name);
        if (htmlPath) artifacts.html = htmlPath;
        
        // Save error log with console output
        const logPath = TestHelpers.saveErrorLog(
          testModule.name, 
          error, 
          consoleLogs
        );
        if (logPath) artifacts.errorLog = logPath;
        
        // Capture page state
        const pageState = await TestHelpers.capturePageState(page);
        if (pageState) {
          const stateDir = TestHelpers.ensureLogsDir();
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const stateFile = `${testModule.name.replace(/\s+/g, '-')}_${timestamp}_state.json`;
          const statePath = require('path').join(stateDir, stateFile);
          require('fs').writeFileSync(statePath, JSON.stringify(pageState, null, 2));
          artifacts.pageState = statePath;
          console.log(`📊 Page state saved: ${statePath}`);
        }
        
      } catch (captureError) {
        console.error('Failed to capture error artifacts:', captureError);
      }
      
      // Re-throw the original error
      throw error;
      
    } finally {
      // Calculate duration
      const duration = Date.now() - startTime;
      
      // Create test report
      const reportPath = TestHelpers.createTestReport(
        testModule.name,
        testPassed,
        duration,
        artifacts
      );
      console.log(`📋 Test report saved: ${reportPath}`);
      
      // Always close browser
      try {
        await browser.close();
      } catch (e) {
        console.error('Failed to close browser:', e.message);
      }
    }
  };
  
  return testModule;
}

/**
 * Creates a test module with built-in error handling
 * @param {Object} config - Test configuration
 * @returns {Object} - Test module
 */
function createTestWithErrorHandling(config) {
  return wrapTestWithErrorHandling({
    name: config.name,
    description: config.description,
    test: config.test
  });
}

module.exports = {
  wrapTestWithErrorHandling,
  createTestWithErrorHandling
};