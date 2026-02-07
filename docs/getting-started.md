# Getting Started with Unisat AI

Welcome to Unisat AI! This guide will help you get started with building AI agents that interact with UniSat's blockchain services.

## Prerequisites

- Node.js 18+ or Python 3.10+
- A UniSat API key from [Unisat Developer](https://docs.unisat.io/dev)

## Installation

```bash
# Clone the repository
git clone https://github.com/unisat-wallet/unisat-ai.git
cd unisat-ai

# Install dependencies
pnpm install

# Build packages
pnpm build
```

## Your First Agent

Let's create a simple agent that fetches Bitcoin network fees:

```typescript
import { UniSatClient } from "@unisat-ai/sdk";

const client = new UniSatClient({
  apiKey: process.env.UNISAT_API_KEY!,
});

async function main() {
  const fees = await client.getFeeEstimates();
  console.log("Current fees:", fees);
}

main();
```

## Next Steps

- [MCP Services Guide](./mcp-services.md) - Learn about MCP integration
- [Agent Development](./agent-development.md) - Build custom agents
- [API Reference](./api-reference.md) - Complete API documentation
