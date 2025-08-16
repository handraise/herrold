#!/usr/bin/env node

/**
 * Debug runner for tests with headed browser mode
 * Usage: 
 *   node run-debug.js              # Run all tests in debug mode
 *   node run-debug.js "Test Name"  # Run specific test in debug mode
 */

const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

// Load environment variables
require('dotenv').config();

// Get test name from command line arguments
const testName = process.argv[2];

// Set debug environment variables
process.env.HEADED_MODE = 'true';
process.env.SLOW_MO = process.env.SLOW_MO || '100'; // Default 100ms delay
process.env.DEVTOOLS = process.env.DEVTOOLS || 'false';
process.env.DEBUG_TIMEOUT = process.env.DEBUG_TIMEOUT || '120000'; // 2 minutes default

console.log('🔍 Debug Mode Configuration:');
console.log(`   Headed Mode: ${process.env.HEADED_MODE}`);
console.log(`   Slow Motion: ${process.env.SLOW_MO}ms`);
console.log(`   DevTools: ${process.env.DEVTOOLS}`);
console.log(`   Timeout: ${process.env.DEBUG_TIMEOUT}ms`);
console.log('');

// Load test cases directly to avoid test-runner.js issues
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
    // Save error log without trying to launch browser for screenshot
    try {
      const TestHelpers = require('./lib/test-helpers');
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
        'Environment:',
        `Node Version: ${process.version}`,
        `Platform: ${process.platform}`,
        ''
      ].join('\n');
      
      fs.writeFileSync(logPath, logContent);
      console.log(`📝 Error log saved: ${logPath}`);
    } catch (logError) {
      console.error('Could not save error log:', logError.message);
    }
    
    return { 
      name: testName, 
      status: 'failed', 
      error: err.message, 
      duration: Date.now() - start
    };
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

async function runDebugMode() {
  if (testName) {
    // Run specific test
    console.log(`🎯 Running test "${testName}" in debug mode...\n`);
    
    // Check if test exists
    const testCases = getTestCases();
    const testExists = testCases.some(tc => tc.name === testName);
    
    if (!testExists) {
      console.error(`❌ Test "${testName}" not found!`);
      console.log('\nAvailable tests:');
      testCases.forEach(tc => {
        console.log(`   - ${tc.name}`);
      });
      process.exit(1);
    }
    
    // Run the specific test
    const result = await runTest(testName);
    
    // Display result
    if (result.status === 'passed') {
      console.log(`\n✅ Test passed in ${result.duration}ms`);
    } else {
      console.log(`\n❌ Test failed: ${result.error}`);
      if (result.artifacts) {
        console.log('\n📁 Debug artifacts saved:');
        Object.entries(result.artifacts).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      }
      process.exit(1);
    }
  } else {
    // Run all tests
    console.log('🎯 Running all tests in debug mode...\n');
    
    const results = await runTests();
    
    // Display summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST RESULTS SUMMARY');
    console.log('='.repeat(60));
    
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    
    results.forEach(result => {
      const status = result.status === 'passed' ? '✅' : '❌';
      console.log(`${status} ${result.name}: ${result.status} (${result.duration}ms)`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
    console.log('='.repeat(60));
    
    if (failed > 0) {
      process.exit(1);
    }
  }
}

// Run debug mode
runDebugMode().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});