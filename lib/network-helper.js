/**
 * Helper functions for network request monitoring
 */
class NetworkHelper {
  /**
   * Wait for a GraphQL mutation or query to complete
   * @param {Page} page - Playwright page object
   * @param {string} operationName - Optional GraphQL operation name to wait for
   * @param {number} timeout - Timeout in milliseconds
   */
  static async waitForGraphQL(page, operationName = null, timeout = 30000) {
    return new Promise((resolve, reject) => {
      let timeoutId;
      let resolved = false;

      const handleResponse = async (response) => {
        try {
          const url = response.url();
          
          // Check if this is a GraphQL endpoint
          if (url.includes('graphql') || url.includes('api')) {
            const contentType = response.headers()['content-type'] || '';
            
            if (contentType.includes('json')) {
              // Try to get the request post data to check operation name
              const request = response.request();
              const postData = request.postData();
              
              if (postData) {
                try {
                  const body = JSON.parse(postData);
                  
                  // Check if this is the operation we're waiting for
                  // Support both operationName field and query content matching
                  const isMatch = !operationName || 
                      (body.operationName && body.operationName === operationName) ||
                      (body.operationName && body.operationName.includes(operationName)) ||
                      (body.query && body.query.includes(operationName));
                  
                  if (isMatch) {
                    // Wait for response to complete
                    const status = response.status();
                    if (status >= 200 && status < 300) {
                      console.log(`✅ GraphQL ${operationName || 'request'} completed successfully`);
                      resolved = true;
                      clearTimeout(timeoutId);
                      page.off('response', handleResponse);
                      resolve(response);
                    }
                  }
                } catch (e) {
                  // Not JSON or couldn't parse
                }
              }
            }
          }
        } catch (e) {
          // Ignore errors in processing
        }
      };

      // Set up timeout
      timeoutId = setTimeout(() => {
        if (!resolved) {
          page.off('response', handleResponse);
          reject(new Error(`Timeout waiting for GraphQL ${operationName || 'request'}`));
        }
      }, timeout);

      // Listen for responses
      page.on('response', handleResponse);

      // Also resolve if network becomes idle
      page.waitForLoadState('networkidle', { timeout: timeout / 2 })
        .then(() => {
          if (!resolved) {
            resolved = true;
            clearTimeout(timeoutId);
            page.off('response', handleResponse);
            resolve(null);
          }
        })
        .catch(() => {
          // Ignore network idle timeout
        });
    });
  }

  /**
   * Monitor and log all GraphQL requests for debugging
   */
  static setupGraphQLMonitoring(page) {
    page.on('request', request => {
      const url = request.url();
      if (url.includes('graphql') || url.includes('/api')) {
        const postData = request.postData();
        if (postData) {
          try {
            const body = JSON.parse(postData);
            const opName = body.operationName || 'Unknown';
            console.log(`🔄 GraphQL Request: ${opName}`);
            // Log if it's the feedVolumeData request we're interested in
            if (opName.includes('feedVolumeData')) {
              console.log('   📊 This is the feedVolumeData request for insights generation');
            }
          } catch (e) {
            console.log('🔄 GraphQL Request sent');
          }
        }
      }
    });

    page.on('response', response => {
      const url = response.url();
      if (url.includes('graphql') || url.includes('/api')) {
        const status = response.status();
        const request = response.request();
        const postData = request.postData();
        let opName = 'Unknown';
        
        if (postData) {
          try {
            const body = JSON.parse(postData);
            opName = body.operationName || 'Unknown';
          } catch (e) {
            // Ignore parse error
          }
        }
        
        console.log(`✅ GraphQL Response [${status}]: ${opName}`);
        
        // Special logging for feedVolumeData
        if (opName.includes('feedVolumeData')) {
          console.log('   📊 feedVolumeData response received - insights should be generated');
        }
      }
    });
  }
}

module.exports = NetworkHelper;