# BRC20 Token Analyst

A professional BRC20 token analysis agent demonstrating how to build complex applications using AgentKit + MCP tools + Knowledge Base.

## Features

### Token Analysis
- **Basic Information**: Token name, supply, holder count
- **Market Data Analysis**: Floor price, trading volume, market cap
- **Holding Distribution Analysis**: Top holders, concentration ratio
- **Risk Assessment**: Liquidity, decentralization, activity scores

### Token Comparison
- Cross-comparison of multiple BRC20 tokens
- Market performance comparison
- Risk rating comparison

### Knowledge Base Enhanced
- Built-in BRC20 protocol documentation
- Investment risk guidelines
- Protocol details interpretation

## Quick Start

### 1. Install Dependencies

```bash
cd packages/agent-kit/intermediate/brc20-analyst
pip install -r requirements.txt
```

### 2. Start UniSat MCP Server

```bash
npx @unisat/mcp-server
```

### 3. Configure Environment Variables

```bash
export UNISAT_MCP_URL="http://localhost:3000/mcp"
export UNISAT_API_KEY="your-api-key"
export BRC20_KB_PATH="./knowledgebase_docs"  # Optional
```

### 4. Run Agent

```bash
python agent.py
```

### 5. Test Agent

```bash
python client.py
```

## Usage Examples

```
User: Analyze the ORDI token

Analyst: # ORDI (ordi) Token Analysis Report

## Basic Information
- **Ticker**: ordi
- **Total Supply**: 21,000,000,000
- **Minted**: 21,000,000,000 (100%)
- **Holders**: ~12,500

## Market Performance
- **Floor Price**: $12.50
- **24h Volume**: $1,250,000
- **Market Cap**: ~$262,500,000

## Holding Analysis
Top 5 holders share: 18.5%
- Holdings are relatively decentralized
- No extreme concentration risk

## Risk Assessment
- **Liquidity**: ⭐⭐⭐⭐☆
- **Decentralization**: ⭐⭐⭐⭐☆
- **Activity**: ⭐⭐⭐⭐⭐
```

## Project Structure

```
brc20-analyst/
├── agent.py                      # Agent definition
├── client.py                     # Test client
├── Dockerfile                    # Container image for AgentKit Runtime
├── prompts/
│   └── analyst_prompt.py         # Analyst prompt
├── knowledgebase_docs/           # Knowledge base documents
│   ├── brc20-protocol.md        # BRC20 protocol docs
│   └── brc20-risk-guide.md      # Risk guidelines
├── requirements.txt              # Python dependencies
├── pyproject.toml                # Project configuration
└── README.md                     # Project documentation
```

## Technical Highlights

- **MCP Tool Integration**: Connects to UniSat MCP Server via `MCPToolset`
- **Knowledge Base**: Loads BRC20 protocol documentation using `KnowledgeBase`
- **Complex Reasoning**: Multi-step analysis framework with structured output
- **Risk Assessment**: Data-driven risk scoring system

## Docker Build

Build and run with Docker for AgentKit Runtime deployment:

```bash
# Build image
docker build -t unisat-brc20-analyst-agent .

# Run container
docker run -p 8000:8000 \
  -e UNISAT_MCP_URL=http://your-mcp-server:3000/mcp \
  unisat-brc20-analyst-agent
```

## BytePlus AgentKit Runtime Deployment

1. Build the Docker image
2. Push to your container registry
3. Deploy to AgentKit Runtime with the image URL

```bash
# Tag and push to registry
docker tag unisat-brc20-analyst-agent your-registry/unisat-brc20-analyst-agent:latest
docker push your-registry/unisat-brc20-analyst-agent:latest
```

## License

MIT
