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

app.listen(3000, () => console.log('Server running on http://localhost:3000'));