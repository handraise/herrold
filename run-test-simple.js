#!/usr/bin/env node

/**
 * Simple test runner without complex error handling
 * For debugging the "Maximum call stack size exceeded" error
 */

require('dotenv').config();

const testName = process.argv[2] || 'Key Message Insights';

async function runSimpleTest() {
  console.log(`Running test: ${testName}\n`);
  
  try {
    // Load test cases
    const fs = require('fs');
    const path = require('path');
    const casesDir = path.join(__dirname, 'cases');
    const files = fs.readdirSync(casesDir).filter(file => file.endsWith('.js'));
    
    let testModule = null;
    for (const file of files) {
      const filePath = path.join(casesDir, file);
      const module = require(filePath);
      if (module.name === testName) {
        testModule = module;
        break;
      }
    }
    
    if (!testModule) {
      console.error(`Test "${testName}" not found`);
      process.exit(1);
    }
    
    // Run the test
    console.log('Starting test...\n');
    await testModule.test();
    
    console.log('\n✅ Test passed!');
  } catch (error) {
    console.error('\n❌ Test failed:');
    console.error('Error message:', error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
  }
}

runSimpleTest();