# Build Stage
FROM node:24-slim AS builder

WORKDIR /app

# Copy package files
COPY src/package*.json ./
RUN npm install --frozen-lockfile

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

# Render uses the PORT env var by default, but bots usually don't need it
# unless using webhooks. We'll stick to polling for simplicity.
CMD ["npm", "start"]
