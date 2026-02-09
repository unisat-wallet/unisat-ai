# UniSat AI

> AI-powered toolkit for UniSat blockchain data integration

UniSat AI provides a complete set of tools and examples to help AI developers quickly integrate UniSat blockchain data and services.

## Project Structure

```
unisat-ai/
├── packages/
│   ├── chat-app/          # Chat application (Next.js + WebSocket)
│   ├── mcp-server/        # Unified MCP server (Streamable HTTP)
│   ├── doc-search/        # Documentation vector search (LanceDB)
│   ├── agent-kit/         # Agent development toolkit
│   └── skills/            # Claude Code skill integration
└── docs/                  # Documentation and tutorials
```

## Quick Start

### Chat App

```bash
# Start backend
cd packages/chat-app/backend
pnpm install
pnpm dev

# Start frontend (in another terminal)
cd packages/chat-app/frontend
pnpm install
pnpm dev
```

### MCP Server

Configure in Claude Desktop or other MCP clients:

```json
{
  "mcpServers": {
    "unisat": {
      "command": "node",
      "args": ["./packages/mcp-server/dist/index.js"],
      "env": {
        "UNISAT_API_KEY": "your-api-key"
      }
    }
  }
}
```

### Doc Search

```bash
cd packages/doc-search
pnpm install

# Index documentation (TF-IDF, offline)
EMBEDDING_PROVIDER=tfidf pnpm index

# Search
EMBEDDING_PROVIDER=tfidf pnpm search "how to connect wallet"
```

### Agent Examples

```bash
cd packages/agent-kit/beginner/bitcoin-query
pip install -r requirements.txt
python agent.py
```

## Documentation

- [Getting Started](docs/getting-started.md)
- [MCP Services](docs/mcp-services.md)
- [Agent Development Guide](docs/agent-development.md)
- [API Reference](docs/api-reference.md)

## Features

### Completed
- Project structure setup
- Chat App basic framework
- WebSocket real-time communication
- Unified MCP server (Streamable HTTP transport)
- `@unisat/open-api` official SDK integration
- AI tool calling support (OpenAI/AgentKit)
- Real-time block height display
- Fee monitoring display
- Documentation vector search (LanceDB + TF-IDF/OpenAI embeddings)
- i18n multi-language support
- Docker Compose & CI/CD pipeline

### In Progress
- Chat App enhancements
  - Basic conversation functionality
  - Tool calling integration
  - History persistence
  - Multi-model switching UI

### Planned

#### Agent Kit (packages/agent-kit/)
- Complete example projects
  - Basic Hello World
  - BRC20 Query Assistant
  - Runes Trading Assistant
  - Multi-step task orchestration
  - Agent templates
  - Testing framework

#### Chat App (packages/chat-app/)
- User session management
- Chat history persistence
- Multi-model support switching UI
- BRC20 Token tracking
- Rich display components

#### Documentation (docs/)
- Quick start guide
- MCP service documentation
- Agent development guide
- API reference
- Deployment guide

## License

MIT

---

_Powered by [UniSat](https://unisat.io)_
