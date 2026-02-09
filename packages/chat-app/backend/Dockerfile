# Chat App Backend Dockerfile
FROM node:20-slim AS base

# Install pnpm
RUN npm install -g pnpm

WORKDIR /app

# Copy workspace config files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY tsconfig.json ./

# Copy package.json files for dependency resolution
COPY packages/chat-app/backend/package.json ./packages/chat-app/backend/
COPY packages/shared/open-api-mcp/package.json ./packages/shared/open-api-mcp/
COPY packages/doc-search/package.json ./packages/doc-search/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/chat-app/backend/ ./packages/chat-app/backend/
COPY packages/shared/open-api-mcp/ ./packages/shared/open-api-mcp/
COPY packages/doc-search/src/ ./packages/doc-search/src/
COPY packages/doc-search/tsconfig.json ./packages/doc-search/

# Build packages in order: open-api-mcp, doc-search, then backend
RUN pnpm --filter @unisat/open-api-mcp build && \
    pnpm --filter @unisat/doc-search build && \
    pnpm --filter @unisat-ai/chat-app-backend build

# Production stage
FROM node:20-slim AS production

# Install git for cloning documentation repos
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm

WORKDIR /app

# Copy built artifacts and dependencies
COPY --from=base /app/package.json /app/pnpm-workspace.yaml /app/pnpm-lock.yaml ./
COPY --from=base /app/packages/chat-app/backend/package.json ./packages/chat-app/backend/
COPY --from=base /app/packages/chat-app/backend/dist ./packages/chat-app/backend/dist
COPY --from=base /app/packages/shared/open-api-mcp/package.json ./packages/shared/open-api-mcp/
COPY --from=base /app/packages/shared/open-api-mcp/dist ./packages/shared/open-api-mcp/dist
COPY --from=base /app/packages/doc-search/package.json ./packages/doc-search/
COPY --from=base /app/packages/doc-search/dist ./packages/doc-search/dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages/chat-app/backend/node_modules ./packages/chat-app/backend/node_modules
COPY --from=base /app/packages/shared/open-api-mcp/node_modules ./packages/shared/open-api-mcp/node_modules
COPY --from=base /app/packages/doc-search/node_modules ./packages/doc-search/node_modules

# Copy startup script
COPY packages/chat-app/backend/scripts/startup.sh ./scripts/startup.sh
RUN chmod +x ./scripts/startup.sh

# Create data directory for doc-search
RUN mkdir -p /app/packages/doc-search/data

# Expose ports
EXPOSE 3001 3002

# Environment variables (to be overridden at runtime)
ENV PORT=3001
ENV WS_PORT=3002
ENV NODE_ENV=production
ENV DOC_SEARCH_DB_PATH=/app/packages/doc-search/data/docs.lance
ENV DOC_SEARCH_DATA_PATH=/app/packages/doc-search/data
ENV EMBEDDING_PROVIDER=tfidf
# Documentation source (optional - set to enable auto-indexing)
ENV DOCS_REPO_URL=
ENV DOCS_BRANCH=main
ENV DOCS_LOCAL_PATH=/app/docs-source

# Start command - uses startup script to handle doc indexing
CMD ["./scripts/startup.sh"]
