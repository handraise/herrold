const { chromium } = require('@playwright/test');

module.exports = {
  name: 'Handraise Load And Login',
  description: 'Tests loading Handraise staging and performing login',
  test: async () => {
    const url = process.env.HANDRAISE_URL;
    const username = process.env.HANDRAISE_USERNAME;
    const password = process.env.HANDRAISE_PASSWORD;

    if (!url) {
      throw new Error('HANDRAISE_URL must be set in .env file');
    }
    if (!username || !password) {
      throw new Error('HANDRAISE_USERNAME and HANDRAISE_PASSWORD must be set in .env file');
    }

    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(url);
    await page.waitForLoadState('networkidle');

    // Look for common login form elements
    const usernameField = await page.locator('input[type="email"], input[name="email"], input[name="username"], input[id="email"], input[id="username"]').first();
    const passwordField = await page.locator('input[type="password"], input[name="password"], input[id="password"]').first();

    if (await usernameField.isVisible() && await passwordField.isVisible()) {
      await usernameField.fill(username);
      await passwordField.fill(password);

      // Look for login/submit button
      const loginButton = await page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In"), input[type="submit"]').first();
      if (await loginButton.isVisible()) {
        await loginButton.click();
        await page.waitForLoadState('networkidle');
      }
    } else {
      throw new Error('Login form not found on the page');
    }

    await browser.close();
  }
};