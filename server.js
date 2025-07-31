const express = require('express');
const { runTests, runTest, getTestCases } = require('./test-runner');

const app = express();

app.use(express.static('.'));

app.get('/test-cases', (req, res) => {
  const testCases = getTestCases();
  res.json(testCases);
});

app.get('/run-tests', async (req, res) => {
  const results = await runTests();
  res.json(results);
});

app.get('/run-test/:testName', async (req, res) => {
  const testName = decodeURIComponent(req.params.testName);
  const result = await runTest(testName);
  res.json(result);
});

// SSE endpoint for streaming single test execution
app.get('/run-test-stream/:testName', async (req, res) => {
  const testName = decodeURIComponent(req.params.testName);
  
  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send initial connection message
  res.write('data: ' + JSON.stringify({ type: 'connected' }) + '\n\n');

  // Run test with step callback
  await runTest(testName, (data) => {
    res.write('data: ' + JSON.stringify(data) + '\n\n');
  });

  // Close the connection
  res.end();
});

// SSE endpoint for streaming all tests execution
app.get('/run-tests-stream', async (req, res) => {
  // Set up SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send initial connection message
  res.write('data: ' + JSON.stringify({ type: 'connected' }) + '\n\n');

  // Run all tests with step callback
  const results = await runTests((data) => {
    res.write('data: ' + JSON.stringify(data) + '\n\n');
  });

  // Send final results
  res.write('data: ' + JSON.stringify({ type: 'all-complete', results }) + '\n\n');

  // Close the connection
  res.end();
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));