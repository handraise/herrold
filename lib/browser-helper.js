const { chromium } = require('@playwright/test');
const debugConfig = require('../.debug.config');
const fs = require('fs');
const path = require('path');

/**
 * Helper for launching browser with debug mode support
 */
class BrowserHelper {
  /**
   * Launch browser with appropriate settings based on environment
   */
  static async launchBrowser() {
    const options = debugConfig.getBrowserOptions();
    
    if (process.env.HEADED_MODE === 'true') {
      console.log('🖥️  Launching browser in headed mode (visible)...');
      console.log(`⚡ Slow motion: ${options.slowMo}ms between actions`);
      if (options.devtools) {
        console.log('🔧 DevTools will open automatically');
      }
    }
    
    return await chromium.launch(options);
  }

  /**
   * Create browser context with appropriate settings
   */
  static async createContext(browser) {
    const options = debugConfig.getContextOptions();
    
    // Ensure video directory exists if recording
    if (options.recordVideo && options.recordVideo.dir) {
      const videoDir = options.recordVideo.dir;
      if (!fs.existsSync(videoDir)) {
        fs.mkdirSync(videoDir, { recursive: true });
        console.log(`📹 Video recording enabled: ${videoDir}`);
      }
    }
    
    return await browser.newContext(options);
  }

  /**
   * Create a new page with debug helpers
   */
  static async createPage(context) {
    const page = await context.newPage();
    
    // Set default timeout based on debug mode
    if (process.env.HEADED_MODE === 'true') {
      const timeout = debugConfig.timeouts.test;
      page.setDefaultTimeout(timeout);
      page.setDefaultNavigationTimeout(debugConfig.timeouts.navigation);
    }
    
    // Add debug helpers
    if (process.env.HEADED_MODE === 'true') {
      // Add pause helper
      page.pauseOnError = async (error) => {
        if (debugConfig.debug.pauseOnFailure) {
          console.log('⏸️  Paused on error. Press Enter to continue...');
          console.log(`Error: ${error.message}`);
          await page.pause();
        }
      };
      
      // Log navigation
      page.on('framenavigated', frame => {
        if (frame === page.mainFrame()) {
          console.log(`📍 Navigated to: ${frame.url()}`);
        }
      });
      
      // Log console messages in debug mode
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log(`🌐 Browser error: ${msg.text()}`);
        }
      });
    }
    
    return page;
  }

  /**
   * Take enhanced screenshot in debug mode
   */
  static async takeDebugScreenshot(page, name) {
    if (process.env.HEADED_MODE === 'true') {
      const screenshotDir = path.join(__dirname, '..', 'test-artifacts', 'debug-screenshots');
      if (!fs.existsSync(screenshotDir)) {
        fs.mkdirSync(screenshotDir, { recursive: true });
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${name}_${timestamp}.png`;
      const filepath = path.join(screenshotDir, filename);
      
      await page.screenshot({
        path: filepath,
        ...debugConfig.debug.screenshot
      });
      
      console.log(`📸 Debug screenshot saved: ${filepath}`);
      return filepath;
    }
    return null;
  }

  /**
   * Highlight element before interaction (debug mode only)
   */
  static async highlightElement(page, selector) {
    if (process.env.HEADED_MODE === 'true' && process.env.HIGHLIGHT === 'true') {
      try {
        await page.evaluate((sel) => {
          const element = document.querySelector(sel);
          if (element) {
            const originalStyle = element.style.cssText;
            element.style.cssText = `${originalStyle}; border: 3px solid red !important; background-color: rgba(255, 0, 0, 0.1) !important;`;
            setTimeout(() => {
              element.style.cssText = originalStyle;
            }, 1000);
          }
        }, selector);
        // Wait a bit to see the highlight
        await page.waitForTimeout(500);
      } catch (e) {
        // Ignore highlight errors
      }
    }
  }
}

module.exports = BrowserHelper;