# Agent Development Guide

Learn how to build AI agents that interact with UniSat services.

## Agent Types

### Basic Agent

The simplest agent type with instructions and tools:

```typescript
import { Agent } from "@unisat-ai/sdk";

const agent = new Agent({
  name: "my-agent",
  instruction: "You are a helpful assistant for Bitcoin blockchain queries.",
  tools: [
    {
      name: "get_balance",
      description: "Get Bitcoin address balance",
      execute: async (args) => {
        // Implementation
      }
    }
  ]
});
```

### Sequential Agent

Execute sub-agents in a fixed sequence:

```typescript
import { SequentialAgent } from "@unisat-ai/sdk";

const agent = new SequentialAgent({
  name: "trading-flow",
  instruction: "Execute trading steps in sequence",
  subAgents: [marketAnalyzer, riskChecker, orderExecutor]
});
```

### Parallel Agent

Execute sub-agents concurrently:

```typescript
import { ParallelAgent } from "@unisat-ai/sdk";

const agent = new ParallelAgent({
  name: "multi-token-tracker",
  instruction: "Track multiple tokens simultaneously",
  subAgents: [btcTracker, ethTracker, solTracker]
});
```

## Project Structure

```
my-agent/
├── agent.ts              # Entry point
├── project.yaml          # Metadata
├── prompts/              # System prompts
├── tools/                # Custom tools
├── sub_agents/           # Sub-agents
└── utils/                # Helpers
```

## Best Practices

1. **Validate Input**: Always validate user input (addresses, txids, etc.)
2. **Error Handling**: Provide helpful error messages
3. **Rate Limiting**: Respect API rate limits
4. **Logging**: Use structured logging for debugging

## Examples

See the [examples](../packages/agent-kit/examples/) directory for complete working examples.
