#!/bin/bash
# Start UniSat MCP Server (HTTP mode)

# Load .env if exists
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Check API key
if [ -z "$UNISAT_API_KEY" ]; then
  echo "Error: UNISAT_API_KEY is required"
  echo "Set it with: export UNISAT_API_KEY=your-key"
  exit 1
fi

# Set port (default 3000)
export MCP_PORT=${MCP_PORT:-3000}

echo "Starting UniSat MCP Server on port $MCP_PORT..."
node dist/http/index.js
