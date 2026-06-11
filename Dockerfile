# Build Stage
FROM node:24-slim AS builder

WORKDIR /app

# Copy package.json only (no lockfile — npm install resolves from scratch)
COPY src/package.json ./
# --ignore-scripts suppresses the husky `prepare` hook (no git repo in Docker)
# --omit=dev excludes devDependencies (vitest, eslint, prettier, husky) from the image
RUN npm install --omit=dev --ignore-scripts

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
