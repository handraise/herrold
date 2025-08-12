const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { runTests, runTest, getTestCases } = require('./test-runner');
const NotificationService = require('./lib/notifications');

const app = express();
const notificationService = new NotificationService();

app.use(express.json());
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

// New REST endpoint to trigger test suite with notifications
app.post('/api/trigger-suite', async (req, res) => {
  const jobId = uuidv4();
  const { notifications, tests } = req.body || {};

  // Validate request
  if (!notifications || (!notifications.email && !notifications.webhook)) {
    return res.status(400).json({
      success: false,
      error: 'At least one notification method (email or webhook) must be specified'
    });
  }

  // Validate notification config
  const validation = NotificationService.validateConfig({ notifications });
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      errors: validation.errors
    });
  }

  // Send immediate response
  res.json({
    success: true,
    jobId,
    message: 'Test suite triggered',
    notifications: {
      email: notifications.email ? 'scheduled' : undefined,
      webhook: notifications.webhook ? 'scheduled' : undefined
    }
  });

  // Run tests asynchronously
  process.nextTick(async () => {
    try {
      console.log(`[${jobId}] Starting test suite execution...`);
      
      // Run all tests or specific tests
      let results;
      if (tests && Array.isArray(tests) && tests.length > 0 && tests[0] !== 'all') {
        // Run specific tests
        results = [];
        for (const testName of tests) {
          const result = await runTest(testName);
          results.push(result);
        }
      } else {
        // Run all tests
        results = await runTests();
      }

      console.log(`[${jobId}] Test suite completed. Sending notifications...`);

      // Send notifications
      const notificationResult = await notificationService.send(
        results,
        notifications,
        jobId
      );

      if (notificationResult.success) {
        console.log(`[${jobId}] All notifications sent successfully`);
      } else {
        console.error(`[${jobId}] Some notifications failed:`, notificationResult.errors);
      }
    } catch (error) {
      console.error(`[${jobId}] Test suite execution failed:`, error);
      
      // Try to send error notification
      try {
        await notificationService.send(
          [{ name: 'Suite Execution', status: 'failed', error: error.message }],
          notifications,
          jobId
        );
      } catch (notifyError) {
        console.error(`[${jobId}] Failed to send error notification:`, notifyError);
      }
    }
  });
});

// Optional: Add endpoint to check job status (for future enhancement)
app.get('/api/job-status/:jobId', (req, res) => {
  // This is a placeholder for future implementation
  // Could store job results in memory or database
  res.json({
    message: 'Job status tracking not yet implemented',
    jobId: req.params.jobId
  });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));