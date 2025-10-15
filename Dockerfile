# Multi-stage build for React app + Node.js server
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY telegram-bot/package*.json ./telegram-bot/

# Install dependencies
RUN npm install --legacy-peer-deps
RUN cd telegram-bot && npm install --legacy-peer-deps

# Copy source code
COPY . .

# Build React app
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY telegram-bot/package*.json ./telegram-bot/

# Install production dependencies
RUN npm install --only=production --legacy-peer-deps
RUN cd telegram-bot && npm install --only=production --legacy-peer-deps

# Copy built React app and server code
COPY --from=build /app/build ./build
COPY admin-server.js ./
COPY telegram-bot/ ./telegram-bot/
COPY database/ ./database/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3002

# Start the server
CMD ["npm", "run", "admin"]
