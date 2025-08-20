# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm start` or `pnpm start` - Start the production server on port 3005 (or PORT env var)
- `npm dev` or `pnpm dev` - Start development server with auto-reload using nodemon
- `npm run format` or `pnpm format` - Format all files with Prettier
- `npm run format:check` or `pnpm format:check` - Check if files are properly formatted

### Testing
- `npm test` or `pnpm test` - Run all tests with the standard test runner
- `npm run test:single "Test Name"` or `pnpm test:single "Test Name"` - Run a single test by name
- `npm run test:debug "Test Name"` or `pnpm test:debug "Test Name"` - Run tests in headed mode with visible browser
- `npm run test:debug:slow "Test Name"` or `pnpm test:debug:slow "Test Name"` - Run tests in debug mode with 500ms slow motion
- `npm run test:debug:devtools "Test Name"` or `pnpm test:debug:devtools "Test Name"` - Run tests with Chrome DevTools open

### Browser Installation
- `npx playwright install chromium` or `pnpm exec playwright install chromium` - Install Playwright browsers (required after initial setup)

## Architecture

### Overview
Herrold is a Playwright-based test automation framework for testing the Handraise application. It provides both a web UI and REST API for test execution, with support for notifications via email and webhooks.

### Core Components

**Test Infrastructure:**
- `test-runner.js` - Core test orchestration that dynamically loads and executes test cases from the `cases/` directory
- `lib/test-browser-launcher.js` - Centralized Playwright browser management with debug mode support
- `lib/test-helpers.js` - Utilities for test artifacts (screenshots, logs) and error handling
- `lib/network-helper.js` - GraphQL request monitoring and waiting utilities

**Server & API:**
- `server.js` - Express server providing REST endpoints and Server-Sent Events (SSE) for real-time test updates
- Endpoints include `/api/trigger-suite` for async test execution with notifications
- SSE endpoints (`/run-test-stream/:testName`) for live test progress streaming

**Test Cases:**
- Located in `cases/` directory, each exporting an object with `name`, `description`, and `test` function
- Tests use TestBrowserLauncher for consistent browser setup and NetworkHelper for GraphQL monitoring
- Tests authenticate using HANDRAISE_USERNAME and HANDRAISE_PASSWORD from environment

**Notification System:**
- `lib/notifications/` - Modular notification system supporting email (via SMTP) and webhooks (Slack/custom)
- Email notifications support multiple recipient formats and SMTP providers
- Webhook notifications format messages for Slack or send JSON payloads to custom endpoints

### Key Patterns

**Dynamic Test Loading:**
The test runner dynamically discovers and loads test cases from the `cases/` folder at runtime, allowing hot reloading during development.

**GraphQL Monitoring:**
Tests can monitor and wait for specific GraphQL operations using NetworkHelper, essential for testing async operations in Handraise.

**Debug Mode:**
Tests support multiple debug modes controlled via environment variables (HEADED_MODE, SLOW_MO, DEVTOOLS) for troubleshooting.

**Test Artifacts:**
Failed tests automatically save screenshots, error logs, and HTML captures to `test-artifacts/` for debugging.

## Environment Configuration

Required environment variables (copy `.env.template` to `.env`):
- `HANDRAISE_URL` - URL of Handraise application to test
- `HANDRAISE_USERNAME` - Login email
- `HANDRAISE_PASSWORD` - Login password

Optional notification configuration:
- SMTP settings: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, `EMAIL_TO`
- Webhook: `WEBHOOK_URL` or `SLACK_WEBHOOK_URL`

## Adding New Test Cases

Create a new file in `cases/` directory following this structure:

```javascript
const TestBrowserLauncher = require('../lib/test-browser-launcher');
const NetworkHelper = require('../lib/network-helper');

module.exports = {
  name: 'Your Test Name',
  description: 'What the test does',
  test: async () => {
    const browser = await TestBrowserLauncher.launch();
    const page = await TestBrowserLauncher.createPage(browser);
    
    try {
      // Test implementation
    } finally {
      await browser.close();
    }
  }
};
```