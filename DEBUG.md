# Debug Mode Guide for Herrold Test Runner

## Overview
The test runner now supports running tests in "headed" mode where you can see the browser window and watch tests execute step-by-step. This is extremely useful for debugging test failures and understanding test behavior.

## Quick Start

### Run all tests with visible browser:
```bash
pnpm test:debug
```

### Run a specific test with visible browser:
```bash
pnpm test:debug "NewsFeeds"
# or
pnpm test:debug "Key Message Insights"
```

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm test` | Run all tests in headless mode (default, fast) |
| `pnpm test:debug` | Run all tests with visible browser |
| `pnpm test:debug:slow` | Run tests with 500ms delay between actions |
| `pnpm test:debug:devtools` | Run tests with Chrome DevTools open |
| `pnpm test:single "Test Name"` | Run specific test (headless by default) |

## Environment Variables

You can customize debug behavior with environment variables:

```bash
# Run with custom slow motion speed (milliseconds)
SLOW_MO=1000 pnpm test:debug

# Run with DevTools auto-opened
DEVTOOLS=true pnpm test:debug

# Pause on test failure for inspection
PAUSE_ON_FAILURE=true pnpm test:debug

# Pause on test success for inspection
PAUSE_ON_SUCCESS=true pnpm test:debug

# Highlight elements before interaction
HIGHLIGHT=true pnpm test:debug

# Record video of test execution
TRACE=true pnpm test:debug

# Custom timeout for debug mode (default 2 minutes)
DEBUG_TIMEOUT=180000 pnpm test:debug
```

## Combining Options

You can combine multiple debug options:

```bash
# Super slow with DevTools
SLOW_MO=1000 DEVTOOLS=true pnpm test:debug

# Debug specific test with highlighting
HIGHLIGHT=true pnpm test:debug "Login Debug Example"

# Debug with pause on failure
PAUSE_ON_FAILURE=true pnpm test:debug
```

## Debug Features

### 1. **Visible Browser Window**
- See exactly what's happening during test execution
- Browser starts maximized for better visibility

### 2. **Slow Motion**
- Default: 100ms delay between actions
- Customizable with `SLOW_MO` environment variable
- Makes it easier to follow test actions

### 3. **Element Highlighting**
- When `HIGHLIGHT=true`, elements are highlighted in red before interaction
- Helps identify which elements are being clicked/filled

### 4. **Debug Screenshots**
- Automatically saved to `test-artifacts/debug-screenshots/`
- Taken at key points during test execution
- Named with test name and timestamp

### 5. **Video Recording**
- When enabled, records test execution
- Saved to `test-artifacts/videos/`
- Useful for reviewing test failures

### 6. **DevTools Integration**
- Open Chrome DevTools automatically
- Inspect network requests, console logs, elements
- Set breakpoints in browser code

### 7. **Pause on Failure**
- When `PAUSE_ON_FAILURE=true`, browser pauses on test failure
- Allows manual inspection of failed state
- Press Enter in terminal to continue

## Debug Artifacts

When tests run in debug mode, additional artifacts are created:

```
test-artifacts/
├── debug-screenshots/    # Screenshots during debug execution
├── videos/              # Video recordings (if enabled)
├── screenshots/         # Failure screenshots
├── logs/               # Error logs and HTML captures
└── reports/            # JSON test reports
```

## Tips for Effective Debugging

1. **Start with slow motion**: Use `pnpm test:debug:slow` to clearly see each action

2. **Use highlighting**: Set `HIGHLIGHT=true` to see which elements are being interacted with

3. **Pause on failure**: Set `PAUSE_ON_FAILURE=true` to inspect the browser state when a test fails

4. **Check DevTools Console**: Use `DEVTOOLS=true` to see browser console errors and network requests

5. **Record videos**: Enable video recording for tests that pass locally but fail in CI

## Example Debug Session

```bash
# 1. Run test with all debug features
SLOW_MO=500 HIGHLIGHT=true PAUSE_ON_FAILURE=true DEVTOOLS=true pnpm test:debug "NewsFeeds"

# 2. Browser opens with DevTools
# 3. Watch test execute slowly with highlighted elements
# 4. If test fails, browser pauses for inspection
# 5. Check console, network tab, elements panel
# 6. Press Enter in terminal to close browser
```

## Troubleshooting

### Browser doesn't appear
- Make sure you're using `pnpm test:debug` not `pnpm test`
- Check if `HEADED_MODE=true` is set

### Tests run too fast to see
- Increase `SLOW_MO` value: `SLOW_MO=1000 pnpm test:debug`

### Can't see which elements are being clicked
- Enable highlighting: `HIGHLIGHT=true pnpm test:debug`

### Need to inspect failed state
- Use pause on failure: `PAUSE_ON_FAILURE=true pnpm test:debug`

### Browser closes too quickly after test
- Use pause on success: `PAUSE_ON_SUCCESS=true pnpm test:debug`