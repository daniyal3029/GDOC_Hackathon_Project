# Stage 1: Build Stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install all dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application (TypeScript to JavaScript)
RUN npm run build

# Stage 2: Runtime Stage
FROM node:20-alpine AS runtime

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Set environment
ENV NODE_ENV=production
WORKDIR /app

# Create a non-root user for security
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs

# Copy only the necessary files from builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Ensure the app can write to its data and log directories
RUN mkdir -p data/lancedb logs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose the application port
EXPOSE 3000

# Health check using Node.js to ping the health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { if (res.statusCode === 200) process.exit(0); else process.exit(1); })"

# Use dumb-init to run the application
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "dist/server.js"]
