const { chromium } = require('@playwright/test');
require('dotenv').config();

const testCases = [
  {
    name: 'Google Search',
    description: 'Tests searching for "Playwright" on Google',
    test: async () => {
      const browser = await chromium.launch();
      const page = await browser.newPage();
      await page.goto('https://google.com');
      await page.fill('input[name="q"]', 'Playwright');
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1000);
      await browser.close();
    }
  },
  {
    name: 'Wikipedia Load',
    description: 'Tests loading the Wikipedia homepage',
    test: async () => {
      const browser = await chromium.launch();
      const page = await browser.newPage();
      await page.goto('https://wikipedia.org');
      await page.waitForTimeout(500);
      await browser.close();
    }
  },
  {
    name: 'Handraise Staging',
    description: 'Tests that Handraise staging app loads successfully',
    test: async () => {
      const url = process.env.HANDRAISE_URL || 'https://stage-app.handraise.com';
      const browser = await chromium.launch();
      const page = await browser.newPage();
      await page.goto(url);
      await page.waitForLoadState('networkidle');
      await browser.close();
    }
  },
  {
    name: 'Handraise Load And Login',
    description: 'Tests loading Handraise staging and performing login',
    test: async () => {
      const url = process.env.HANDRAISE_URL || 'https://stage-app.handraise.com';
      const username = process.env.HANDRAISE_USERNAME;
      const password = process.env.HANDRAISE_PASSWORD;

      if (!username || !password) {
        throw new Error('HANDRAISE_USERNAME and HANDRAISE_PASSWORD must be set in .env file');
      }

      const browser = await chromium.launch();
      const page = await browser.newPage();
      await page.goto(url);
      await page.waitForLoadState('networkidle');

      // Look for common login form elements
      const usernameField = await page.locator('input[type="email"], input[name="email"], input[name="username"], input[id="email"], input[id="username"]').first();
      const passwordField = await page.locator('input[type="password"], input[name="password"], input[id="password"]').first();
      
      if (await usernameField.isVisible() && await passwordField.isVisible()) {
        await usernameField.fill(username);
        await passwordField.fill(password);
        
        // Look for login/submit button
        const loginButton = await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In"), input[type="submit"]').first();
        if (await loginButton.isVisible()) {
          await loginButton.click();
          await page.waitForLoadState('networkidle');
        }
      } else {
        throw new Error('Login form not found on the page');
      }

      await browser.close();
    }
  }
];

function getTestCases() {
  return testCases.map(({ name, description }) => ({ name, description }));
}

async function runTest(testName) {
  const testCase = testCases.find(tc => tc.name === testName);
  if (!testCase) {
    return { name: testName, status: 'failed', error: 'Test case not found', duration: 0 };
  }

  const start = Date.now();
  try {
    await testCase.test();
    return { name: testName, status: 'passed', duration: Date.now() - start };
  } catch (err) {
    return { name: testName, status: 'failed', error: err.message, duration: Date.now() - start };
  }
}

async function runTests() {
  const results = [];

  for (const testCase of testCases) {
    const result = await runTest(testCase.name);
    results.push(result);
  }

  return results;
}

module.exports = { runTests, runTest, getTestCases };