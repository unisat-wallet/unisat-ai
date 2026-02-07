# @unisat/skill

UniSat Skill for Claude Code - Query Bitcoin blockchain data with natural language.

## Quick Install

### Option 1: One-line install (Recommended)

```bash
curl -sSL https://raw.githubusercontent.com/unisat-wallet/unisat-ai/main/packages/skills/unisat/install-skill.sh | bash
```

### Option 2: Manual Install

1. Get your API key from [https://developer.unisat.io](https://developer.unisat.io)

2. Clone or download this repository, then add to Claude Code Settings:

```json
{
  "skills": {
    "unisat": "/path/to/unisat-ai/packages/skills/unisat"
  }
}
```

3. Set `UNISAT_API_KEY` environment variable in Claude Code Settings

## Usage

After installation, use in Claude Code:

```
@unisat What's the current Bitcoin block height?
@unisat Check ORDI top 10 holders
@unisat Get current network fees
@unisat SATOS token info
```

## Features

- **16+ Tools**: Blocks, Transactions, Addresses, BRC20, Runes, Ordinals, Marketplace
- **Natural Language**: Query blockchain data in plain language
- **Real-time Data**: Always get the latest blockchain information

## Links

- [UniSat Developer Docs](https://developer.unisat.io)
- [MCP Server](https://github.com/unisat-wallet/unisat-ai/tree/main/packages/mcp-server)
- [Main Repository](https://github.com/unisat-wallet/unisat-ai)

## License

MIT
