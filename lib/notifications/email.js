const nodemailer = require('nodemailer');

class EmailNotificationService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('Email notification service not configured. Missing SMTP environment variables.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  async sendTestResults(email, results, jobId) {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    const summary = this.calculateSummary(results);
    const html = this.generateHtmlEmail(results, summary, jobId);
    const subject = `Test Suite Results: ${summary.passed}/${summary.total} Passed ${summary.passed === summary.total ? '✅' : '❌'}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM || 'Herrold Test Runner <noreply@herrold.com>',
      to: email,
      subject: subject,
      html: html,
      text: this.generateTextEmail(results, summary, jobId)
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Failed to send email:', error);
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

  generateHtmlEmail(results, summary, jobId) {
    const statusEmoji = (status) => status === 'passed' ? '✅' : '❌';
    const statusColor = (status) => status === 'passed' ? '#10b981' : '#ef4444';

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .header h1 { margin: 0; }
          .summary { background: #f9fafb; padding: 20px; border-left: 4px solid ${summary.passed === summary.total ? '#10b981' : '#ef4444'}; }
          .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 15px; }
          .summary-item { background: white; padding: 10px; border-radius: 5px; }
          .summary-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
          .summary-value { font-size: 24px; font-weight: bold; color: #1f2937; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; }
          td { padding: 12px; border-bottom: 1px solid #e5e7eb; }
          tr:hover { background: #f9fafb; }
          .status-badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 600; }
          .status-passed { background: #d1fae5; color: #065f46; }
          .status-failed { background: #fee2e2; color: #991b1b; }
          .error-box { background: #fef2f2; border: 1px solid #fecaca; padding: 10px; border-radius: 5px; margin-top: 5px; font-family: monospace; font-size: 12px; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🧪 Test Suite Results</h1>
            <p style="margin: 5px 0; opacity: 0.9;">Job ID: ${jobId}</p>
          </div>
          
          <div class="summary">
            <h2 style="margin-top: 0;">Summary</h2>
            <div class="summary-grid">
              <div class="summary-item">
                <div class="summary-label">Total Tests</div>
                <div class="summary-value">${summary.total}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Passed</div>
                <div class="summary-value" style="color: #10b981;">${summary.passed}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Failed</div>
                <div class="summary-value" style="color: #ef4444;">${summary.failed}</div>
              </div>
              <div class="summary-item">
                <div class="summary-label">Duration</div>
                <div class="summary-value">${(summary.totalDuration / 1000).toFixed(2)}s</div>
              </div>
            </div>
          </div>
          
          <h2 style="margin-top: 30px;">Test Results</h2>
          <table>
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              ${results.map(test => `
                <tr>
                  <td><strong>${test.name}</strong></td>
                  <td>
                    <span class="status-badge status-${test.status}">
                      ${statusEmoji(test.status)} ${test.status.toUpperCase()}
                    </span>
                  </td>
                  <td>${test.duration ? `${test.duration}ms` : '-'}</td>
                  <td>
                    ${test.error ? `<div class="error-box">${this.escapeHtml(test.error)}</div>` : ''}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Generated by Herrold Test Runner at ${new Date(summary.timestamp).toLocaleString()}</p>
            <p>Environment: ${process.env.NODE_ENV || 'development'}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  generateTextEmail(results, summary, jobId) {
    const statusText = (status) => status === 'passed' ? '[PASS]' : '[FAIL]';
    
    return `
TEST SUITE RESULTS
==================
Job ID: ${jobId}
Timestamp: ${summary.timestamp}

SUMMARY
-------
Total Tests: ${summary.total}
Passed: ${summary.passed}
Failed: ${summary.failed}
Duration: ${(summary.totalDuration / 1000).toFixed(2)}s

RESULTS
-------
${results.map(test => `
${statusText(test.status)} ${test.name}
  Duration: ${test.duration ? `${test.duration}ms` : 'N/A'}
  ${test.error ? `Error: ${test.error}` : ''}
`).join('\n')}

--
Generated by Herrold Test Runner
    `.trim();
  }

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

module.exports = EmailNotificationService;