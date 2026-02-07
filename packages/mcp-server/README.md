# @unisat/mcp-server

UniSat MCP Server - Model Context Protocol server for UniSat blockchain data.

## What is MCP?

[MCP (Model Context Protocol)](https://modelcontextprotocol.io/) is an open protocol that allows AI assistants (like Claude) to contextually interact with external tools and data sources.

## Features

- **16+ Integrated Tools**: Query Bitcoin blocks, transactions, addresses, BRC20 tokens, Runes, Ordinals inscriptions, and marketplace data
- **One-Command Setup**: Install via npm and run instantly
- **Claude Code Compatible**: Works seamlessly with Claude Code and Claude Desktop
- **Type-Safe**: Built with TypeScript

## Installation

### Option 1: Use with npx (Recommended - No Installation)

```bash
npx @unisat/mcp-server
```

### Option 2: Install Globally

```bash
npm install -g @unisat/mcp-server
unisat-mcp
```

### Option 3: Install as Project Dependency

```bash
npm install @unisat/mcp-server
```

## Configuration

### Get API Key

1. Visit [https://developer.unisat.io](https://developer.unisat.io)
2. Sign up and get your API key

### Claude Code Configuration

Add to your Claude Code settings (`Settings` → `MCP Servers`):

```json
{
  "mcpServers": {
    "unisat": {
      "command": "npx",
      "args": ["@unisat/mcp-server"],
      "env": {
        "UNISAT_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

### Claude Desktop Configuration

Add to your Claude Desktop config file:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "unisat": {
      "command": "npx",
      "args": ["@unisat/mcp-server"],
      "env": {
        "UNISAT_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

## Available Tools

| Tool                       | Description                         |
| -------------------------- | ----------------------------------- |
| `get_current_block_info` | Get current Bitcoin blockchain info |
| `get_block`              | Get block by height or hash         |
| `get_tx_info`            | Get transaction details             |
| `get_address_balance`    | Get address balance                 |
| `get_utxos`              | Get UTXOs for an address            |
| `get_fee_estimate`       | Get network fees                    |
| `get_brc20_token_info`   | Get BRC20 token info                |
| `get_brc20_balance`      | Get BRC20 balance                   |
| `get_brc20_holders`      | Get BRC20 holders                   |
| `get_runes_token_info`   | Get Runes token info                |
| `get_runes_balance`      | Get Runes balance                   |
| `get_inscription`        | Get Ordinal inscription             |
| `get_brc20_market_stats` | Get market statistics               |
| `get_brc20_order_list`   | Get order book                      |

## Usage Examples

```
@unisat What's the current Bitcoin block height?
@unisat Get top 5 holders of ORDI token
@unisat Check balance of bc1q...
@unisat Get current network fees
```

## Links

- [UniSat Developer Docs](https://developer.unisat.io)
- [MCP Protocol](https://modelcontextprotocol.io/)
- [GitHub](https://github.com/unisat-wallet/unisat-ai)

## License

MIT
