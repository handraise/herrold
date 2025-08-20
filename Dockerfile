# Use official Playwright image as base - includes all browser dependencies
FROM mcr.microsoft.com/playwright:v1.54.2-jammy

# Set working directory
WORKDIR /app

# Install Node.js 18 (Playwright image comes with Node but we ensure version)
RUN apt-get update && \
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Install pnpm globally and install dependencies
RUN npm install -g pnpm && \
    pnpm install --frozen-lockfile || npm ci

# Install Playwright browsers with dependencies
RUN npx playwright install chromium --with-deps

# Copy application code
COPY . .

# Create directory for test artifacts
RUN mkdir -p test-artifacts/screenshots test-artifacts/logs test-artifacts/html

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3005

# Expose the application port
EXPOSE 3005

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3005/api/tests', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Run the application
CMD ["node", "server.js"]