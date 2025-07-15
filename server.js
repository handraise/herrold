const express = require('express');
const { runTests, getTestCases } = require('./test-runner');

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

app.listen(3000, () => console.log('Server running on http://localhost:3000'));