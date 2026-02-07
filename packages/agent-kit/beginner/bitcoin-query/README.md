# Bitcoin Query Agent

A simple Bitcoin blockchain query agent demonstrating how to build basic applications using AgentKit + MCP tools.

## Features

- Query current Bitcoin block height
- Query network recommended fees
- Query address balance and UTXOs
- Query transaction details
- Query BRC20 token information
- Query Runes token information
- Query Ordinal inscription information

## Quick Start

### 1. Install Dependencies

```bash
cd packages/agent-kit/beginner/bitcoin-query
pip install -r requirements.txt
```

### 2. Start UniSat MCP Server

```bash
# Run directly with npx
npx @unisat/mcp-server

# Or install globally and run
npm install -g @unisat/mcp-server
unisat-mcp
```

### 3. Configure Environment Variables

```bash
export UNISAT_MCP_URL="http://localhost:3000/mcp"
export UNISAT_API_KEY="your-api-key"
```

### 4. Run Agent

```bash
python agent.py
```

Server will start at `http://localhost:8000`.

### 5. Test Agent

```bash
python client.py
```

## Usage Examples

```
User: What's the current Bitcoin block height?
Agent: According to the query result, the current Bitcoin block height is 842,156.

User: Check current network fees
Agent: Current network recommended fees:
- Low priority: 1 sat/vB
- Medium priority: 3 sat/vB
- High priority: 5 sat/vB
```

## Project Structure

```
bitcoin-query/
├── agent.py          # Agent definition and entry point
├── client.py         # Test client
├── Dockerfile        # Container image for AgentKit Runtime
├── requirements.txt  # Python dependencies
├── pyproject.toml    # Project configuration
└── README.md         # Project documentation
```

## Technical Highlights

- **Basic Agent**: Uses VeADK's `Agent` class
- **MCP Tool Integration**: Connects to UniSat MCP Server via `MCPToolset`
- **Short-term Memory**: Uses `ShortTermMemory` to maintain conversation context

## Docker Build

Build and run with Docker for AgentKit Runtime deployment:

```bash
# Build image (requires BytePlus private PyPI access)
docker build -t unisat-bitcoin-query-agent \
  --build-arg PIP_INDEX_URL=https://your-byteplus-pypi-url \
  .

# Run container
docker run -p 8000:8000 \
  -e UNISAT_MCP_URL=http://your-mcp-server:3000/mcp \
  unisat-bitcoin-query-agent
```

> Note: `agentkit`, `veadk`, `google-adk` are BytePlus private packages. You need access to BytePlus private PyPI to build the image.

## BytePlus AgentKit Runtime Deployment

1. Build the Docker image
2. Push to your container registry
3. Deploy to AgentKit Runtime with the image URL

```bash
# Tag and push to registry
docker tag unisat-bitcoin-query-agent your-registry/unisat-bitcoin-query-agent:latest
docker push your-registry/unisat-bitcoin-query-agent:latest
```

## License

MIT
