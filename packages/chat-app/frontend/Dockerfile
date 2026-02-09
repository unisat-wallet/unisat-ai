# Chat App Frontend Dockerfile
FROM node:20-slim AS base

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace config files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.json ./

# Copy package.json for dependency resolution
COPY packages/chat-app/frontend/package.json ./packages/chat-app/frontend/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/chat-app/frontend/ ./packages/chat-app/frontend/

# Build arguments for API URLs (used during build)
ARG NEXT_PUBLIC_WS_URL=ws://localhost:3002
ARG NEXT_PUBLIC_API_URL=http://localhost:3001

ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build frontend
RUN pnpm --filter @unisat-ai/chat-app-frontend build

# Production stage
FROM node:20-slim AS production

RUN npm install -g pnpm

WORKDIR /app

# Copy built artifacts
COPY --from=base /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=base /app/packages/chat-app/frontend/package.json ./packages/chat-app/frontend/
COPY --from=base /app/packages/chat-app/frontend/.next ./packages/chat-app/frontend/.next
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages/chat-app/frontend/node_modules ./packages/chat-app/frontend/node_modules

# Copy public folder if it exists (optional)
COPY --from=base /app/packages/chat-app/frontend/next.config.js ./packages/chat-app/frontend/

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

WORKDIR /app/packages/chat-app/frontend

# Start command
CMD ["pnpm", "start"]
