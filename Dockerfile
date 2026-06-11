# Build Stage
FROM node:24-slim AS builder

WORKDIR /app

# Copy package files
COPY src/package*.json ./
# --ignore-scripts skips the husky `prepare` hook that fails outside a git repo
# --omit=dev excludes devDependencies (vitest, eslint, etc.) from production image
RUN npm ci --omit=dev --ignore-scripts

# Copy source code
COPY src/ .

# Final Stage
FROM node:24-slim

WORKDIR /app

# Copy built node_modules and source
COPY --from=builder /app /app

# Create data directory just in case (though we'll use Supabase)
RUN mkdir -p /app/data

ENV NODE_ENV=production
ENV TZ=Asia/Dhaka

# Expose the port for Render health checks
EXPOSE 5000

# Render uses the PORT env var by default. We'll start a simple HTTP 
# server alongside the bot to satisfy health checks while using polling.
CMD ["npm", "start"]
