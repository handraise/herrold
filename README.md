# Herrold - Automated Test Runner for Handraise

A comprehensive test automation framework built with Playwright for testing the Handraise application. Herrold provides both UI-based test management and programmatic test execution with advanced features like GraphQL monitoring, debug modes, and notification systems.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Available Test Cases](#available-test-cases)
- [Running Tests](#running-tests)
- [API Endpoints](#api-endpoints)
- [Debug Mode](#debug-mode)
- [Test Artifacts](#test-artifacts)
- [Notification System](#notification-system)
- [Development](#development)
- [Troubleshooting](#troubleshooting)

## Features

- 🎭 **Playwright-based Testing** - Robust browser automation with Chromium
- 🔍 **GraphQL Monitoring** - Track and wait for GraphQL requests during tests
- 🖥️ **Web UI** - User-friendly interface for running and monitoring tests
- 🔔 **Notifications** - Email and webhook support for test results
- 🐛 **Debug Mode** - Run tests with visible browser for troubleshooting
- 📸 **Test Artifacts** - Automatic screenshots and error logs on failure
- 🔄 **Real-time Updates** - Server-Sent Events for live test progress
- 🚀 **REST API** - Programmatic test execution with async support

## Prerequisites

- Node.js 18.x or higher
- pnpm (recommended) or npm
- Access to Handraise application (staging or production)

## Installation

1. Clone the repository:
```bash
git clone git@github.com:handraise/herrold.git
cd herrold
```

2. Install dependencies:
```bash
pnpm install
# or
npm install
```

3. Install Playwright browsers:
```bash
pnpm exec playwright install chromium
# or
npx playwright install chromium
```

## Configuration

### Environment Variables

Create a `.env` file in the root directory by copying the template:

```bash
cp .env.template .env
```

Edit the `.env` file with your configuration:

```env
# Handraise Application Settings
HANDRAISE_URL=https://stage-app.handraise.com
HANDRAISE_USERNAME=your-email@example.com
HANDRAISE_PASSWORD=your-password

# Server Configuration
PORT=3005

# Email Notifications (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_TO=recipient@example.com

# Webhook Notifications (Optional)
WEBHOOK_URL=https://your-webhook-endpoint.com/webhook
WEBHOOK_SECRET=your-webhook-secret

# Debug Settings (Optional)
HEADED_MODE=false
SLOW_MO=0
DEVTOOLS=false
DEBUG_TIMEOUT=120000
```

### Required Environment Variables

- `HANDRAISE_URL` - The URL of the Handraise application to test
- `HANDRAISE_USERNAME` - Email for authentication
- `HANDRAISE_PASSWORD` - Password for authentication

### Optional Environment Variables

**Notification Settings:**
- `SMTP_*` - Email configuration for test result notifications
- `WEBHOOK_URL` - Webhook endpoint for test results
- `WEBHOOK_SECRET` - Secret for webhook authentication

**Debug Settings:**
- `HEADED_MODE` - Run browser in headed mode (visible)
- `SLOW_MO` - Slow down operations by specified milliseconds
- `DEVTOOLS` - Open Chrome DevTools automatically
- `DEBUG_TIMEOUT` - Timeout for debug mode tests (ms)

## Available Test Cases

The following test cases are available:

### 1. **Newsfeeds Test** (`newsfeeds.js`)
- Login to Handraise
- Navigate to newsfeeds
- Search for specific content
- Basic functionality verification

### 2. **Key Message Insights** (`generate-km-insights.js`)
- Login and navigate to newsfeeds
- Click on a newsfeed item
- Generate Key Message insights
- Wait for GraphQL completion
- Copy generated summary

### 3. **Narrative Cluster Insights** (`generate-nc-insights.js`)
- Login and navigate to newsfeeds
- Click on the last newsfeed item
- Access Narrative Clusters from sidebar
- Generate AI Summary via dropdown menu
- Copy generated summary

### 4. **Search Newsfeed** (`search-newsfeed.js`)
- Login to application
- Navigate to newsfeeds
- Perform search operations
- Verify search results

## Running Tests

### Start the Server

```bash
# Development mode with auto-reload
pnpm dev

# Production mode
pnpm start
```

The server will start on `http://localhost:3005` (or the port specified in `.env`)

### Web UI

Open your browser and navigate to `http://localhost:3005` to access the web interface.

Features:
- Run individual tests or all tests
- Real-time test progress updates
- View test results and duration

### Command Line

#### Run All Tests
```bash
pnpm test
```

#### Run Single Test
```bash
# Using simple runner (no debug features)
pnpm test:single "Test Name"

# Examples:
pnpm test:single "Key Message Insights"
pnpm test:single "Narrative Cluster Insights"
pnpm test:single "Newsfeeds"
```

#### Debug Mode
```bash
# Run with visible browser
pnpm test:debug "Test Name"

# Run with slow motion (500ms delay)
pnpm test:debug:slow "Test Name"

# Run with DevTools open
pnpm test:debug:devtools "Test Name"

# Run all tests in debug mode
pnpm test:debug
```

#### Simple Test Runner
```bash
# Run without complex error handling (useful for debugging)
pnpm test:simple "Test Name"
```

## API Endpoints

### GET `/`
Web UI for test management

### GET `/api/tests`
Get list of all available tests

**Response:**
```json
[
  {
    "name": "Key Message Insights",
    "description": "Tests login, navigating to newsfeed, generating a KM insights, and copying summary"
  }
]
```

### POST `/api/run-test`
Run a single test synchronously

**Request:**
```json
{
  "testName": "Key Message Insights"
}
```

**Response:**
```json
{
  "name": "Key Message Insights",
  "status": "passed",
  "duration": 25000
}
```

### GET `/api/run-test-stream?testName=TestName`
Run a test with Server-Sent Events for real-time updates

**Event Types:**
- `step` - Test progress updates
- `complete` - Test completion with results

### POST `/api/run-all-tests`
Run all tests sequentially

**Response:**
```json
[
  {
    "name": "Test 1",
    "status": "passed",
    "duration": 20000
  },
  {
    "name": "Test 2",
    "status": "failed",
    "error": "Error message",
    "duration": 15000
  }
]
```

### POST `/api/trigger-suite`
Trigger test suite asynchronously with notifications

**Request:**
```json
{
  "tests": ["Test 1", "Test 2"],  // Optional: specific tests to run
  "notifications": {
    "email": {
      "enabled": true,
      "to": ["recipient@example.com"]
    },
    "webhook": {
      "enabled": true,
      "url": "https://webhook.site/..."
    }
  }
}
```

**Response:**
```json
{
  "jobId": "uuid-v4-string",
  "status": "started",
  "message": "Test suite started"
}
```

## Debug Mode

Debug mode allows you to see the browser while tests run, making it easier to troubleshoot issues.

### Environment Variables for Debug Mode

```bash
# Run with these environment variables
HEADED_MODE=true       # Show browser
SLOW_MO=100           # Slow down by 100ms
DEVTOOLS=true         # Open Chrome DevTools
DEBUG_TIMEOUT=300000  # 5 minute timeout
```

### Debug Commands

```bash
# Basic debug mode
pnpm test:debug "Test Name"

# With slow motion
SLOW_MO=500 pnpm test:debug "Test Name"

# With DevTools
DEVTOOLS=true pnpm test:debug "Test Name"

# Custom timeout
DEBUG_TIMEOUT=300000 pnpm test:debug "Test Name"
```

## Test Artifacts

When tests fail, artifacts are automatically saved:

### Directory Structure
```
test-artifacts/
├── screenshots/
│   └── YYYY-MM-DD/
│       └── TestName-timestamp.png
├── logs/
│   └── YYYY-MM-DD/
│       └── TestName-timestamp.log
└── html/
    └── YYYY-MM-DD/
        └── TestName-timestamp.html
```

### Artifact Types

- **Screenshots** - Captured on test failure
- **Error Logs** - Detailed error information and stack traces
- **HTML Captures** - Full page HTML for debugging
- **Console Logs** - Browser console output

### Cleanup

Old artifacts are automatically cleaned up after 7 days. To manually clean:

```bash
rm -rf test-artifacts/*
```

## Notification System

### Email Notifications

Configure SMTP settings in `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=app-specific-password
EMAIL_FROM=your-email@gmail.com
EMAIL_TO=recipient@example.com
```

Email notifications include:
- Test suite summary
- Individual test results
- Failure details
- Execution time
- Timestamp

### Webhook Notifications

Configure webhook in `.env`:

```env
WEBHOOK_URL=https://your-endpoint.com/webhook
WEBHOOK_SECRET=your-secret
```

Webhook payload:
```json
{
  "jobId": "uuid",
  "timestamp": "ISO-8601",
  "summary": {
    "total": 3,
    "passed": 2,
    "failed": 1,
    "duration": 45000
  },
  "results": [
    {
      "name": "Test Name",
      "status": "passed",
      "duration": 15000
    }
  ]
}
```

## Development

### Project Structure

```
herrold/
├── cases/                 # Test case files
│   ├── newsfeeds.js
│   ├── generate-km-insights.js
│   └── generate-nc-insights.js
├── lib/                   # Utility libraries
│   ├── test-browser-launcher.js
│   ├── test-helpers.js
│   ├── network-helper.js
│   └── notifications/
│       ├── email.js
│       ├── webhook.js
│       └── formatter.js
├── public/               # Web UI assets
│   ├── index.html
│   └── style.css
├── server.js            # Express server
├── test-runner.js       # Core test runner
├── run-debug.js         # Debug mode runner
├── run-test-simple.js   # Simple test runner
├── package.json         # Dependencies
├── .env.template        # Environment template
└── README.md           # This file
```

### Adding New Test Cases

1. Create a new file in `cases/` directory
2. Export an object with the following structure:

```javascript
const TestBrowserLauncher = require('../lib/test-browser-launcher');
const NetworkHelper = require('../lib/network-helper');

module.exports = {
  name: 'Your Test Name',
  description: 'Description of what the test does',
  test: async () => {
    const browser = await TestBrowserLauncher.launch();
    const page = await TestBrowserLauncher.createPage(browser);
    
    // Optional: Setup GraphQL monitoring
    NetworkHelper.setupGraphQLMonitoring(page);
    
    try {
      // Your test logic here
      console.log('Starting test...');
      
      // Navigate, interact, assert
      await page.goto(process.env.HANDRAISE_URL);
      
      console.log('Test completed successfully!');
    } catch (error) {
      throw new Error(`Test failed: ${error.message}`);
    } finally {
      await browser.close();
    }
  }
};
```

3. The test will automatically be discovered and available in the UI

### Code Formatting

```bash
# Format all files
pnpm format

# Check formatting
pnpm format:check
```

## Troubleshooting

### Common Issues

#### 1. Maximum call stack size exceeded
**Solution:** Use the simple test runner:
```bash
pnpm test:simple "Test Name"
```

#### 2. Test timeouts
**Solution:** Increase timeout in debug mode:
```bash
DEBUG_TIMEOUT=300000 pnpm test:debug "Test Name"
```

#### 3. Cannot find button/element
**Solution:** Run in debug mode to see what's happening:
```bash
pnpm test:debug:slow "Test Name"
```

#### 4. GraphQL requests not completing
**Solution:** Check NetworkHelper configuration and wait times:
- Ensure proper operation names in `NetworkHelper.waitForGraphQL()`
- Increase timeout values if needed

#### 5. Login failures
**Solution:** Verify credentials in `.env` file:
- Check `HANDRAISE_USERNAME` and `HANDRAISE_PASSWORD`
- Ensure `HANDRAISE_URL` is correct
- Try logging in manually to verify credentials

### Debug Tips

1. **Use headed mode** to see what's happening:
   ```bash
   HEADED_MODE=true pnpm test:single "Test Name"
   ```

2. **Add console logs** in test files for debugging

3. **Check test artifacts** in `test-artifacts/` directory for:
   - Screenshots of failures
   - Error logs with stack traces
   - HTML captures of the page state

4. **Monitor GraphQL requests** using NetworkHelper:
   ```javascript
   NetworkHelper.setupGraphQLMonitoring(page);
   ```

5. **Use slow motion** to see interactions clearly:
   ```bash
   SLOW_MO=1000 pnpm test:debug "Test Name"
   ```

