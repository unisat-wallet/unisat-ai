# MCP Services

MCP (Model Context Protocol) services allow AI assistants like Claude to directly interact with UniSat's blockchain data.

## What is MCP?

MCP is an open protocol for connecting AI assistants to external data sources and tools. Learn more at [modelcontextprotocol.io](https://modelcontextprotocol.io/).

## Available Services

| Service | Description | Tools |
|---------|-------------|-------|
| **Core** | Blockchain core data | get_block_info, get_tx_info, get_address_balance, get_utxos, get_fee_estimate |
| **BRC20** | BRC20 protocol | get_token_info, get_balance, get_holders, get_transfer_history |
| **Runes** | Runes protocol | get_token_info, get_balance, get_holders |
| **Marketplace** | Market trading | list_token, buy_token, cancel_listing |

## Configuration

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "unisat-core": {
      "command": "node",
      "args": ["/path/to/unisat-ai/packages/mcp-services/core/dist/server.js"],
      "env": {
        "UNISAT_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Usage

Once configured, you can ask Claude:

- "What's the current block height?"
- "Show me the balance of bc1q..."
- "What are the current network fees?"
- "Get BRC20 info for ORDI"

## Development

See [MCP Service Development Guide](./mcp-development.md) for creating custom services.
