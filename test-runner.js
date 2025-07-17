const { chromium } = require('@playwright/test');

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