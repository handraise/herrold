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

Herrold supports both email and webhook notifications for test results. Both notification types support multiple configuration formats for maximum flexibility.

### Email Notifications

#### Environment Configuration

Configure SMTP settings in `.env`:

```env
# SMTP Server Settings (Required for email)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false                                    # true for port 465, false for port 587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password                         # For Gmail, use App Password, not regular password

# Email Settings
EMAIL_FROM="Test Runner <noreply@example.com>"      # Sender address
EMAIL_TO=recipient@example.com                      # Default recipient(s) - comma separated for multiple
```

#### Gmail Setup
1. Enable 2-factor authentication on your Google account
2. Generate an App Password: Google Account → Security → 2-Step Verification → App passwords
3. Use the generated password as `SMTP_PASS`

**Important Gmail Limitation**: Gmail will always show emails as sent from your authenticated Gmail account (SMTP_USER) for security reasons. The EMAIL_FROM setting will:
- Set the display name (e.g., "Herrold Test Runner")
- Set the reply-to address (where replies will be directed)
- But the actual "from" address will remain your Gmail account

To use a fully custom sender address, consider:
- Using your organization's SMTP server (e.g., handraise.com mail server)
- Using a transactional email service (SendGrid, Mailgun, AWS SES, etc.)
- Setting up Google Workspace with domain authentication

#### Alternative SMTP Providers

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM="Herrold Test Runner <noreply@handraise.com>"
```

**Office 365:**
```env
SMTP_HOST=smtp.office365.com
SMTP_PORT=587
SMTP_USER=your-email@company.com
SMTP_PASS=your-password
EMAIL_FROM="Herrold Test Runner <noreply@company.com>"
```

**AWS SES:**
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASS=your-ses-smtp-password
EMAIL_FROM="Herrold Test Runner <noreply@handraise.com>"
```

#### Configuration Formats

Email notifications can be configured in multiple ways when calling the API:

```javascript
// 1. Boolean true - uses EMAIL_TO from environment
{ "email": true }

// 2. String - single email address
{ "email": "user@example.com" }

// 3. Object with enabled only - uses EMAIL_TO from environment
{ "email": { "enabled": true } }

// 4. Object with single recipient
{ "email": { "enabled": true, "to": "user@example.com" } }

// 5. Object with multiple recipients
{ "email": { "enabled": true, "to": ["user1@example.com", "user2@example.com"] } }
```

#### API Examples

```bash
# Use default EMAIL_TO from environment
curl -X POST http://localhost:3005/api/trigger-suite \
  -H "Content-Type: application/json" \
  -d '{"notifications": {"email": {"enabled": true}}}'

# Send to specific recipients
curl -X POST http://localhost:3005/api/trigger-suite \
  -H "Content-Type: application/json" \
  -d '{"notifications": {"email": {"enabled": true, "to": ["dev@example.com", "qa@example.com"]}}}'

# Simple string format
curl -X POST http://localhost:3005/api/trigger-suite \
  -H "Content-Type: application/json" \
  -d '{"notifications": {"email": "manager@example.com"}}'
```

#### Email Content
Email notifications include:
- Test suite summary with pass/fail counts
- Individual test results with status
- Detailed error messages for failed tests
- Execution time and timestamps
- HTML and plain text versions

### Webhook Notifications (Slack/Custom)

#### Environment Configuration

Configure webhook in `.env`:

```env
# Webhook URL (Slack or custom endpoint)
WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
# or
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

#### Slack Webhook Setup
1. Go to https://api.slack.com/apps
2. Create a new app or select existing
3. Go to "Incoming Webhooks" and activate
4. Add new webhook to workspace
5. Copy the webhook URL to your `.env` file

#### Configuration Formats

Webhook notifications support multiple configuration formats:

```javascript
// 1. Boolean true - uses WEBHOOK_URL from environment
{ "webhook": true }

// 2. String - direct webhook URL
{ "webhook": "https://hooks.slack.com/services/..." }

// 3. Object with enabled only - uses WEBHOOK_URL from environment
{ "webhook": { "enabled": true } }

// 4. Object with URL
{ "webhook": { "enabled": true, "url": "https://hooks.slack.com/services/..." } }
```

#### API Examples

```bash
# Use default WEBHOOK_URL from environment
curl -X POST http://localhost:3005/api/trigger-suite \
  -H "Content-Type: application/json" \
  -d '{"notifications": {"webhook": {"enabled": true}}}'

# Provide webhook URL directly
curl -X POST http://localhost:3005/api/trigger-suite \
  -H "Content-Type: application/json" \
  -d '{"notifications": {"webhook": "https://hooks.slack.com/services/..."}}'
```

#### Slack Message Format
The webhook sends a formatted Slack message with:
- Header with pass/fail status emoji
- Summary section with:
  - Total Tests
  - Duration
  - Passed count ✅
  - Failed count ❌
- Job metadata (ID, environment, timestamp)
- Detailed failed test information (if any)
- Success celebration message (if all pass) 🎉

#### Generic Webhook Payload

For non-Slack webhooks, the payload format is:

```json
{
  "jobId": "uuid",
  "timestamp": "ISO-8601",
  "environment": "development",
  "summary": {
    "total": 3,
    "passed": 2,
    "failed": 1,
    "duration": 45000,
    "success": false
  },
  "results": [
    {
      "name": "Test Name",
      "status": "passed",
      "duration": 15000,
      "error": null
    }
  ]
}
```

### Using Both Notifications

You can enable both email and webhook notifications simultaneously:

```bash
# Use environment defaults for both
curl -X POST http://localhost:3005/api/trigger-suite \
  -H "Content-Type: application/json" \
  -d '{"notifications": {"email": true, "webhook": true}}'

# Mixed configuration
curl -X POST http://localhost:3005/api/trigger-suite \
  -H "Content-Type: application/json" \
  -d '{
    "notifications": {
      "email": {
        "enabled": true,
        "to": ["team@example.com"]
      },
      "webhook": "https://hooks.slack.com/services/..."
    }
  }'

# Specify test suite to run with notifications
curl -X POST http://localhost:3005/api/trigger-suite \
  -H "Content-Type: application/json" \
  -d '{
    "tests": ["Key Message Insights", "Narrative Cluster Insights"],
    "notifications": {
      "email": "qa-team@example.com",
      "webhook": true
    }
  }'
```

### Troubleshooting Notifications

#### Email Issues
- **"Email service not configured"**: Check SMTP_HOST, SMTP_USER, and SMTP_PASS are set
- **"No recipients defined"**: Ensure EMAIL_TO is set or provide recipients in the API call
- **Gmail authentication failed**: Use App Password, not regular password
- **Connection timeout**: Check firewall settings for SMTP ports (587/465)

#### Webhook Issues
- **404 Not Found**: Verify the webhook URL is correct and active
- **"Invalid webhook URL format"**: Ensure URL starts with http:// or https://
- **No notification sent**: Check server logs for detailed error messages
- **Slack "no_team" error**: The webhook URL might be expired or invalid

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

