# @unisat/open-api-mcp

MCP tool definitions and handlers for `@unisat/open-api`.

This package provides a tool calling layer over the UniSat Open API SDK, exposing blockchain capabilities as AI tools.

## What It Does

- **Tool Definitions**: Name, description, input schema for 16+ blockchain tools
- **Tool Handlers**: Execution logic that calls `@unisat/open-api`
- **Type Definitions**: TypeScript types for extending functionality

## Used By

- `@unisat/mcp-server` - MCP protocol format for Claude Code
- `chat-app/backend` - Anthropic tool format for AI chat

## Installation

```bash
npm install @unisat/open-api-mcp
```

## Usage

```typescript
import { allTools, allHandlers, getHandler } from "@unisat/open-api-mcp";
import { UniSatClient } from "@unisat/open-api";

const client = new UniSatClient({ apiKey: process.env.UNISAT_API_KEY });

// Get a specific tool handler
const handler = getHandler("get_block_info");
if (handler) {
  const result = await handler({ height: 800000 }, { client });
  console.log(result);
}
```

## Available Tools

### Core (5 tools)
| Tool | Description |
|------|-------------|
| `get_block_info` | Get Bitcoin block info |
| `get_tx_info` | Get transaction details |
| `get_address_balance` | Get address balance |
| `get_utxos` | Get UTXOs for address |
| `get_fee_estimate` | Get network fee estimates |

### BRC20 (4 tools)
| Tool | Description |
|------|-------------|
| `get_brc20_token_info` | Get token info |
| `get_brc20_balance` | Get balance for address |
| `get_brc20_holders` | Get top holders |
| `get_brc20_history` | Get transfer history |

### Runes (3 tools)
| Tool | Description |
|------|-------------|
| `get_runes_token_info` | Get Runes token info |
| `get_runes_balance` | Get balance for address |
| `get_runes_holders` | Get top holders |

### Inscriptions (2 tools)
| Tool | Description |
|------|-------------|
| `get_inscription_info` | Get inscription details |
| `get_inscriptions_by_address` | Get inscriptions by address |

### Marketplace (2 tools)
| Tool | Description |
|------|-------------|
| `get_brc20_market_stats` | Get market statistics |
| `get_brc20_order_list` | Get order book |

## Format Adapters

This package provides format-agnostic definitions. Convert to MCP or Anthropic format:

```typescript
import { allTools } from "@unisat/open-api-mcp";

// MCP format (camelCase)
const mcpTools = allTools.map(t => ({
  name: t.name,
  description: t.description,
  inputSchema: t.inputSchema,
}));

// Anthropic format (snake_case)
const anthropicTools = allTools.map(t => ({
  name: t.name,
  description: t.description,
  input_schema: t.inputSchema,
}));
```

## License

MIT
