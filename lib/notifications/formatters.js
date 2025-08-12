class NotificationFormatters {
  static calculateSummary(results) {
    const total = results.length;
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const totalDuration = results.reduce((sum, r) => sum + (r.duration || 0), 0);

    return {
      total,
      passed,
      failed,
      totalDuration,
      successRate: total > 0 ? ((passed / total) * 100).toFixed(1) : 0,
      timestamp: new Date().toISOString(),
      isSuccess: failed === 0
    };
  }

  static formatDuration(milliseconds) {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    } else if (milliseconds < 60000) {
      return `${(milliseconds / 1000).toFixed(2)}s`;
    } else {
      const minutes = Math.floor(milliseconds / 60000);
      const seconds = ((milliseconds % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
    }
  }

  static getStatusEmoji(status) {
    const emojis = {
      passed: '✅',
      failed: '❌',
      running: '⏳',
      skipped: '⏭️'
    };
    return emojis[status] || '❓';
  }

  static getStatusColor(status) {
    const colors = {
      passed: '#10b981',
      failed: '#ef4444',
      running: '#3b82f6',
      skipped: '#6b7280'
    };
    return colors[status] || '#6b7280';
  }

  static formatTestResult(test) {
    return {
      name: test.name,
      status: test.status,
      statusEmoji: this.getStatusEmoji(test.status),
      statusColor: this.getStatusColor(test.status),
      duration: test.duration ? this.formatDuration(test.duration) : 'N/A',
      error: test.error || null,
      description: test.description || null
    };
  }

  static formatResultsTable(results) {
    const formatted = results.map(test => this.formatTestResult(test));
    const maxNameLength = Math.max(...formatted.map(t => t.name.length));
    
    const table = [];
    table.push('┌' + '─'.repeat(maxNameLength + 2) + '┬────────┬──────────┐');
    table.push('│ Test Name' + ' '.repeat(maxNameLength - 8) + '│ Status │ Duration │');
    table.push('├' + '─'.repeat(maxNameLength + 2) + '┼────────┼──────────┤');
    
    formatted.forEach(test => {
      const namePadding = ' '.repeat(maxNameLength - test.name.length);
      const statusText = test.statusEmoji + ' ' + test.status.toUpperCase();
      const statusPadding = ' '.repeat(8 - statusText.length);
      const durationPadding = ' '.repeat(10 - test.duration.length);
      
      table.push(`│ ${test.name}${namePadding} │${statusText}${statusPadding}│${test.duration}${durationPadding}│`);
    });
    
    table.push('└' + '─'.repeat(maxNameLength + 2) + '┴────────┴──────────┘');
    
    return table.join('\n');
  }

  static generateShortSummary(summary) {
    const emoji = summary.isSuccess ? '✅' : '❌';
    return `${emoji} Test Results: ${summary.passed}/${summary.total} passed (${summary.successRate}%) in ${this.formatDuration(summary.totalDuration)}`;
  }

  static filterFailedTests(results) {
    return results.filter(r => r.status === 'failed');
  }

  static groupTestsByStatus(results) {
    return {
      passed: results.filter(r => r.status === 'passed'),
      failed: results.filter(r => r.status === 'failed'),
      other: results.filter(r => !['passed', 'failed'].includes(r.status))
    };
  }
}

module.exports = NotificationFormatters;