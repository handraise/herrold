const fs = require('fs');
const path = require('path');
const TestHelpers = require('./lib/test-helpers');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  throw new Error('.env file not found. Please copy .env.template to .env and configure your credentials.');
}

require('dotenv').config();

// Clean up old artifacts on startup (keep last 7 days)
TestHelpers.cleanupOldArtifacts(7);

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

async function runTest(testName, stepCallback) {
  const testCases = loadTestCases();
  const testCase = testCases.find(tc => tc.name === testName);
  if (!testCase) {
    return { name: testName, status: 'failed', error: 'Test case not found', duration: 0 };
  }

  // Ensure test artifacts directories exist
  TestHelpers.ensureScreenshotsDir();
  TestHelpers.ensureLogsDir();

  // Temporarily override console.log if stepCallback is provided
  const originalConsoleLog = console.log;
  const consoleLogs = [];
  
  if (stepCallback) {
    console.log = (...args) => {
      const message = args.join(' ');
      consoleLogs.push(`[${new Date().toISOString()}] ${message}`);
      stepCallback({ type: 'step', message, timestamp: new Date().toISOString() });
      originalConsoleLog(...args); // Still log to actual console
    };
  }

  const start = Date.now();
  let artifacts = {};
  
  // Create a wrapped test function that captures errors
  const runTestWithErrorHandling = async () => {
    try {
      // If test uses its own browser launch, let it run normally
      await testCase.test();
    } catch (err) {
      // Try to save error log (simplified to avoid recursion)
      try {
        // Save error log without launching browser for screenshot
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const logPath = path.join(__dirname, 'test-artifacts', 'logs', `${testName.replace(/\s+/g, '-')}-${timestamp}.log`);
        
        // Ensure logs directory exists
        const logsDir = path.dirname(logPath);
        if (!fs.existsSync(logsDir)) {
          fs.mkdirSync(logsDir, { recursive: true });
        }
        
        // Write error log
        const logContent = [
          `Test: ${testName}`,
          `Timestamp: ${new Date().toISOString()}`,
          `Error: ${err.message}`,
          '',
          'Stack Trace:',
          err.stack || 'No stack trace available',
          '',
          'Console Logs:',
          ...consoleLogs,
          '',
          'Environment:',
          `Node Version: ${process.version}`,
          `Platform: ${process.platform}`,
          ''
        ].join('\n');
        
        fs.writeFileSync(logPath, logContent);
        artifacts.errorLog = logPath;
      } catch (captureError) {
        console.error('Could not save error log:', captureError.message);
      }
      
      throw err; // Re-throw the error
    }
  };
  
  try {
    await runTestWithErrorHandling();
    const result = { name: testName, status: 'passed', duration: Date.now() - start };
    if (stepCallback) {
      stepCallback({ type: 'complete', result });
    }
    return result;
  } catch (err) {
    const result = { 
      name: testName, 
      status: 'failed', 
      error: err.message, 
      duration: Date.now() - start,
      artifacts: artifacts
    };
    
    if (stepCallback) {
      stepCallback({ type: 'complete', result });
    }
    
    // Log artifact locations
    if (Object.keys(artifacts).length > 0) {
      console.log('📁 Test artifacts saved:');
      if (artifacts.screenshot) console.log(`   📸 Screenshot: ${artifacts.screenshot}`);
      if (artifacts.errorLog) console.log(`   📝 Error log: ${artifacts.errorLog}`);
    }
    
    return result;
  } finally {
    // Restore original console.log
    if (stepCallback) {
      console.log = originalConsoleLog;
    }
  }
}

async function runTests(stepCallback) {
  const testCases = loadTestCases();
  const results = [];

  for (const testCase of testCases) {
    const result = await runTest(testCase.name, stepCallback ? 
      (data) => stepCallback({ ...data, testName: testCase.name }) : 
      undefined
    );
    results.push(result);
  }

  return results;
}

module.exports = { runTests, runTest, getTestCases };
