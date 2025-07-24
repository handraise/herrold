const fs = require('fs');
const path = require('path');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  throw new Error('.env file not found. Please copy .env.template to .env and configure your credentials.');
}

require('dotenv').config();

// Dynamically load test cases from the cases folder
function loadTestCases() {
  const casesDir = path.join(__dirname, 'cases');
  const testCases = [];

  if (!fs.existsSync(casesDir)) {
    throw new Error('Cases directory not found');
  }

  const files = fs.readdirSync(casesDir).filter(file => file.endsWith('.js'));

  for (const file of files) {
    try {
      const filePath = path.join(casesDir, file);
      // Clear require cache to allow for hot reloading
      delete require.cache[require.resolve(filePath)];
      const testCase = require(filePath);

      if (testCase.name && testCase.description && typeof testCase.test === 'function') {
        testCases.push(testCase);
      } else {
        console.warn(`Skipping invalid test case file: ${file}`);
      }
    } catch (error) {
      console.error(`Error loading test case from ${file}:`, error.message);
    }
  }

  return testCases;
}

function getTestCases() {
  const testCases = loadTestCases();
  return testCases.map(({ name, description }) => ({ name, description }));
}

async function runTest(testName) {
  const testCases = loadTestCases();
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
  const testCases = loadTestCases();
  const results = [];

  for (const testCase of testCases) {
    const result = await runTest(testCase.name);
    results.push(result);
  }

  return results;
}

module.exports = { runTests, runTest, getTestCases };
