const fs = require('fs');
const path = require('path');

/**
 * Helper functions for test execution
 */
class TestHelpers {
  /**
   * Create screenshots directory if it doesn't exist
   */
  static ensureScreenshotsDir() {
    const screenshotsDir = path.join(__dirname, '..', 'test-artifacts', 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    return screenshotsDir;
  }

  /**
   * Create logs directory if it doesn't exist
   */
  static ensureLogsDir() {
    const logsDir = path.join(__dirname, '..', 'test-artifacts', 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    return logsDir;
  }

  /**
   * Capture screenshot on failure
   * @param {Page} page - Playwright page object
   * @param {string} testName - Name of the test
   * @param {Error} error - Error that occurred
   */
  static async captureFailureScreenshot(page, testName, error) {
    try {
      const screenshotsDir = this.ensureScreenshotsDir();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${testName.replace(/\s+/g, '-')}_${timestamp}_failure.png`;
      const filepath = path.join(screenshotsDir, filename);
      
      await page.screenshot({ 
        path: filepath,
        fullPage: true 
      });
      
      console.log(`📸 Screenshot saved: ${filepath}`);
      return filepath;
    } catch (screenshotError) {
      console.error('Failed to capture screenshot:', screenshotError.message);
      return null;
    }
  }

  /**
   * Save error logs to file
   * @param {string} testName - Name of the test
   * @param {Error} error - Error that occurred
   * @param {Array} consoleLogs - Array of console logs from the test
   */
  static saveErrorLog(testName, error, consoleLogs = []) {
    try {
      const logsDir = this.ensureLogsDir();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${testName.replace(/\s+/g, '-')}_${timestamp}_error.log`;
      const filepath = path.join(logsDir, filename);
      
      const logContent = `
========================================
Test: ${testName}
Timestamp: ${new Date().toISOString()}
========================================

ERROR:
${error.stack || error.message}

URL at failure: ${error.url || 'N/A'}

CONSOLE LOGS:
${consoleLogs.join('\n')}

========================================
      `.trim();
      
      fs.writeFileSync(filepath, logContent);
      console.log(`📝 Error log saved: ${filepath}`);
      return filepath;
    } catch (logError) {
      console.error('Failed to save error log:', logError.message);
      return null;
    }
  }

  /**
   * Capture page state information for debugging
   * @param {Page} page - Playwright page object
   */
  static async capturePageState(page) {
    try {
      const state = {
        url: page.url(),
        title: await page.title(),
        cookies: await page.context().cookies(),
        localStorage: await page.evaluate(() => {
          const items = {};
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            items[key] = localStorage.getItem(key);
          }
          return items;
        }),
        sessionStorage: await page.evaluate(() => {
          const items = {};
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            items[key] = sessionStorage.getItem(key);
          }
          return items;
        }),
        viewport: page.viewportSize(),
        consoleErrors: []
      };
      
      return state;
    } catch (e) {
      console.error('Failed to capture page state:', e.message);
      return null;
    }
  }

  /**
   * Save page HTML for debugging
   * @param {Page} page - Playwright page object
   * @param {string} testName - Name of the test
   */
  static async savePageHTML(page, testName) {
    try {
      const logsDir = this.ensureLogsDir();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${testName.replace(/\s+/g, '-')}_${timestamp}_page.html`;
      const filepath = path.join(logsDir, filename);
      
      const html = await page.content();
      fs.writeFileSync(filepath, html);
      
      console.log(`📄 Page HTML saved: ${filepath}`);
      return filepath;
    } catch (e) {
      console.error('Failed to save page HTML:', e.message);
      return null;
    }
  }

  /**
   * Setup console log capture
   * @param {Page} page - Playwright page object
   * @param {Array} logsArray - Array to store logs
   */
  static setupConsoleCapture(page, logsArray) {
    page.on('console', msg => {
      const logEntry = `[${msg.type()}] ${msg.text()}`;
      logsArray.push(logEntry);
      
      // Also log errors and warnings to console
      if (msg.type() === 'error' || msg.type() === 'warning') {
        console.log(`🌐 Browser ${msg.type()}: ${msg.text()}`);
      }
    });

    page.on('pageerror', error => {
      const errorEntry = `[PAGE ERROR] ${error.message}`;
      logsArray.push(errorEntry);
      console.log(`🌐 Page error: ${error.message}`);
    });

    page.on('requestfailed', request => {
      const failureEntry = `[REQUEST FAILED] ${request.url()} - ${request.failure().errorText}`;
      logsArray.push(failureEntry);
      console.log(`🌐 Request failed: ${request.url()}`);
    });
  }

  /**
   * Create a test report summary
   * @param {string} testName - Name of the test
   * @param {boolean} success - Whether test passed
   * @param {number} duration - Test duration in ms
   * @param {Object} artifacts - Paths to created artifacts
   */
  static createTestReport(testName, success, duration, artifacts = {}) {
    const reportsDir = path.join(__dirname, '..', 'test-artifacts', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString();
    const reportName = `${testName.replace(/\s+/g, '-')}_${timestamp.replace(/[:.]/g, '-')}.json`;
    const reportPath = path.join(reportsDir, reportName);

    const report = {
      testName,
      success,
      duration,
      timestamp,
      artifacts,
      environment: {
        node: process.version,
        platform: process.platform,
        handraise_url: process.env.HANDRAISE_URL
      }
    };

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    return reportPath;
  }

  /**
   * Clean up old test artifacts
   * @param {number} daysToKeep - Number of days to keep artifacts
   */
  static cleanupOldArtifacts(daysToKeep = 7) {
    const artifactsDir = path.join(__dirname, '..', 'test-artifacts');
    if (!fs.existsSync(artifactsDir)) return;

    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    const cleanDirectory = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const filepath = path.join(dir, file);
        const stats = fs.statSync(filepath);
        
        if (stats.isFile() && stats.mtime.getTime() < cutoffTime) {
          fs.unlinkSync(filepath);
          console.log(`🗑️ Deleted old artifact: ${file}`);
        }
      });
    };

    cleanDirectory(path.join(artifactsDir, 'screenshots'));
    cleanDirectory(path.join(artifactsDir, 'logs'));
    cleanDirectory(path.join(artifactsDir, 'reports'));
  }
}

module.exports = TestHelpers;