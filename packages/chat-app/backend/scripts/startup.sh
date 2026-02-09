#!/bin/bash
set -e

# Documentation indexing startup script
# This script clones/updates documentation from GitHub and indexes it before starting the server

DOCS_REPO_URL="${DOCS_REPO_URL:-}"
DOCS_BRANCH="${DOCS_BRANCH:-main}"
DOCS_LOCAL_PATH="${DOCS_LOCAL_PATH:-/app/docs-source}"
DOC_SEARCH_DATA_PATH="${DOC_SEARCH_DATA_PATH:-/app/packages/doc-search/data}"

echo "=========================================="
echo "UniSat Chat Backend Startup Script"
echo "=========================================="

# Function to index documentation
index_docs() {
    echo "[startup] Indexing documentation..."

    # Run indexer with TF-IDF (offline mode)
    EMBEDDING_PROVIDER=tfidf \
    DOC_SEARCH_DB_PATH="${DOC_SEARCH_DATA_PATH}/docs.lance" \
    node /app/packages/doc-search/dist/scripts/index-docs.js "$DOCS_LOCAL_PATH"

    echo "[startup] Documentation indexed successfully!"
}

# Check if we should fetch docs from GitHub
if [ -n "$DOCS_REPO_URL" ]; then
    echo "[startup] Documentation source: $DOCS_REPO_URL (branch: $DOCS_BRANCH)"

    if [ -d "$DOCS_LOCAL_PATH/.git" ]; then
        # Repository exists, pull latest changes
        echo "[startup] Updating existing documentation..."
        cd "$DOCS_LOCAL_PATH"
        git fetch origin
        git reset --hard "origin/$DOCS_BRANCH"
        cd /app
    else
        # Clone the repository
        echo "[startup] Cloning documentation repository..."
        rm -rf "$DOCS_LOCAL_PATH"
        git clone --depth 1 --branch "$DOCS_BRANCH" "$DOCS_REPO_URL" "$DOCS_LOCAL_PATH"
    fi

    # Index the documentation
    index_docs
else
    echo "[startup] No DOCS_REPO_URL specified"

    # Check if pre-indexed data exists
    if [ -d "${DOC_SEARCH_DATA_PATH}/docs.lance" ]; then
        echo "[startup] Using pre-indexed documentation data"
    else
        echo "[startup] WARNING: No documentation data found!"
        echo "[startup] Set DOCS_REPO_URL to enable automatic documentation indexing"
    fi
fi

echo "=========================================="
echo "Starting backend server..."
echo "=========================================="

# Start the Node.js server
exec node /app/packages/chat-app/backend/dist/index.js
