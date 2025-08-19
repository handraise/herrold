const axios = require('axios');

class WebhookNotificationService {
  constructor() {
    this.defaultWebhookUrl = process.env.WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
  }

  async sendTestResults(webhookUrl, results, jobId) {
    const url = webhookUrl || this.defaultWebhookUrl;
    
    if (!url) {
      throw new Error('Webhook URL not provided');
    }

    const summary = this.calculateSummary(results);
    const payload = this.formatSlackMessage(results, summary, jobId);

    try {
      const response = await axios.post(url, payload, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log('Webhook notification sent successfully');
      return { success: true, status: response.status };
    } catch (error) {
      console.error('Failed to send webhook notification:', error.message);
      throw error;
    }
  }

  calculateSummary(results) {
    const total = results.length;
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);

    return {
      total,
      passed,
      failed,
      totalDuration,
      timestamp: new Date().toISOString()
    };
  }

  formatSlackMessage(results, summary, jobId) {
    const isSuccess = summary.failed === 0;
    const color = isSuccess ? '#36a64f' : '#ff0000';
    const emoji = isSuccess ? ':white_check_mark:' : ':x:';
    
    const failedTests = results.filter(r => r.status === 'failed');

    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${emoji} Test Suite Results`,
          emoji: true
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Total Tests:*\n${summary.total}`
          },
          {
            type: 'mrkdwn',
            text: `*Duration:*\n${(summary.totalDuration / 1000).toFixed(2)}s`
          },
          {
            type: 'mrkdwn',
            text: `*Passed:*\n${summary.passed} ✅`
          },
          {
            type: 'mrkdwn',
            text: `*Failed:*\n${summary.failed} ❌`
          }
        ]
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Job ID: \`${jobId}\` | Environment: ${process.env.NODE_ENV || 'development'} | ${new Date(summary.timestamp).toLocaleString()}`
          }
        ]
      }
    ];

    // Add failed test details if any
    if (failedTests.length > 0) {
      blocks.push({
        type: 'divider'
      });
      
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Failed Tests:*'
        }
      });

      failedTests.forEach(test => {
        blocks.push({
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `• *${test.name}*\n\`\`\`${test.error || 'Unknown error'}\`\`\``
          }
        });
      });
    }

    // Add success message if all tests passed
    if (isSuccess) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: ':tada: *All tests passed successfully!*'
        }
      });
    }

    return {
      text: `Test Suite Results: ${summary.passed}/${summary.total} Passed`,
      blocks: blocks,
      attachments: failedTests.length > 0 ? [
        {
          color: color,
          fields: failedTests.map(test => ({
            title: test.name,
            value: test.error || 'Test failed',
            short: false
          }))
        }
      ] : []
    };
  }

  // Generic webhook format (non-Slack)
  formatGenericWebhook(results, summary, jobId) {
    return {
      jobId,
      timestamp: summary.timestamp,
      environment: process.env.NODE_ENV || 'development',
      summary: {
        total: summary.total,
        passed: summary.passed,
        failed: summary.failed,
        duration: summary.totalDuration,
        success: summary.failed === 0
      },
      results: results.map(test => ({
        name: test.name,
        status: test.status,
        duration: test.duration,
        error: test.error || null
      }))
    };
  }
}

module.exports = WebhookNotificationService;