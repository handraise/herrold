const EmailNotificationService = require('./email');
const WebhookNotificationService = require('./webhook');
const NotificationFormatters = require('./formatters');

class NotificationService {
  constructor() {
    this.emailService = new EmailNotificationService();
    this.webhookService = new WebhookNotificationService();
  }

  async send(results, config, jobId) {
    const notifications = [];
    const errors = [];

    // Process email notification
    if (config.email) {
      try {
        const emailResult = await this.emailService.sendTestResults(
          config.email,
          results,
          jobId
        );
        notifications.push({
          type: 'email',
          recipient: config.email,
          status: 'sent',
          details: emailResult
        });
      } catch (error) {
        console.error('Email notification failed:', error);
        errors.push({
          type: 'email',
          recipient: config.email,
          error: error.message
        });
      }
    }

    // Process webhook notification
    if (config.webhook) {
      try {
        // Extract webhook URL from various formats
        let webhookUrl = null;
        
        if (typeof config.webhook === 'string') {
          // String format: direct URL
          webhookUrl = config.webhook;
        } else if (typeof config.webhook === 'object') {
          // Object format: { enabled: true, url: "..." }
          if (config.webhook.enabled) {
            webhookUrl = config.webhook.url || process.env.WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
          }
        } else if (config.webhook === true) {
          // Boolean true: use environment variable
          webhookUrl = process.env.WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
        }
        
        if (webhookUrl) {
          const webhookResult = await this.webhookService.sendTestResults(
            webhookUrl,
            results,
            jobId
          );
          notifications.push({
            type: 'webhook',
            recipient: webhookUrl,
            status: 'sent',
            details: webhookResult
          });
        }
      } catch (error) {
        console.error('Webhook notification failed:', error);
        errors.push({
          type: 'webhook',
          recipient: typeof config.webhook === 'object' ? config.webhook.url : config.webhook,
          error: error.message
        });
      }
    }

    // Log to console as well
    this.logResults(results, jobId);

    return {
      success: errors.length === 0,
      notifications,
      errors,
      summary: NotificationFormatters.calculateSummary(results)
    };
  }

  logResults(results, jobId) {
    const summary = NotificationFormatters.calculateSummary(results);
    
    console.log('\n' + '='.repeat(60));
    console.log(`TEST SUITE RESULTS - Job ID: ${jobId}`);
    console.log('='.repeat(60));
    console.log(NotificationFormatters.generateShortSummary(summary));
    console.log('-'.repeat(60));
    console.log(NotificationFormatters.formatResultsTable(results));
    
    const failedTests = NotificationFormatters.filterFailedTests(results);
    if (failedTests.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('FAILED TESTS DETAILS:');
      console.log('-'.repeat(60));
      failedTests.forEach(test => {
        console.log(`\n❌ ${test.name}`);
        if (test.error) {
          console.log(`   Error: ${test.error}`);
        }
      });
    }
    
    console.log('\n' + '='.repeat(60) + '\n');
  }

  // Validate notification configuration
  static validateConfig(config) {
    const errors = [];

    if (!config.notifications) {
      errors.push('No notification configuration provided');
      return { valid: false, errors };
    }

    const { email, webhook } = config.notifications;

    if (!email && !webhook) {
      errors.push('At least one notification method (email or webhook) must be specified');
    }

    // Validate email if provided
    if (email) {
      if (typeof email === 'object' && email.enabled) {
        // Object format: { enabled: true, to: [...] }
        if (email.to && !Array.isArray(email.to)) {
          errors.push('Email "to" field must be an array');
        } else if (email.to) {
          email.to.forEach(addr => {
            if (!this.isValidEmail(addr)) {
              errors.push(`Invalid email address: ${addr}`);
            }
          });
        }
      } else if (typeof email === 'string') {
        // String format (single email)
        if (!this.isValidEmail(email)) {
          errors.push('Invalid email address format');
        }
      }
    }

    // Validate webhook if provided
    if (webhook) {
      let webhookUrl = null;
      
      if (typeof webhook === 'string') {
        // String format: just the URL
        webhookUrl = webhook;
      } else if (typeof webhook === 'object') {
        // Object format: { enabled: true, url: "..." }
        if (webhook.enabled && webhook.url) {
          webhookUrl = webhook.url;
        } else if (webhook.enabled && !webhook.url) {
          // Will use environment variable
          webhookUrl = process.env.WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
          if (!webhookUrl) {
            errors.push('Webhook URL not provided and not found in environment variables');
          }
        }
      } else if (webhook === true) {
        // Boolean true: use environment variable
        webhookUrl = process.env.WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
        if (!webhookUrl) {
          errors.push('Webhook URL not found in environment variables (WEBHOOK_URL or SLACK_WEBHOOK_URL)');
        }
      }
      
      if (webhookUrl && !this.isValidUrl(webhookUrl)) {
        errors.push('Invalid webhook URL format');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  static isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = NotificationService;