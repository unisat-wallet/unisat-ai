/**
 * Tool Adapter
 * Converts @unisat/open-api-mcp tools to Anthropic tool calling format
 */

import { createClient } from "@unisat/open-api";
import { allTools, getHandler, ToolContext } from "@unisat/open-api-mcp";
import { config } from "../config/index.js";

// ===== Configuration =====

const API_TIMEOUT = config.unisatTimeout;
const MAX_RETRIES = 2;

// ===== Type Definitions =====

export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<
      string,
      {
        type: string;
        description?: string;
        enum?: string[];
      }
    >;
    required?: string[];
  };
}

// ===== Tool Definitions (Anthropic Format) =====

/**
 * Convert shared tools to Anthropic format (snake_case)
 */
export const anthropicTools: AnthropicTool[] = allTools.map((tool) => ({
  name: tool.name,
  description: tool.description,
  input_schema: {
    type: tool.inputSchema.type,
    properties: tool.inputSchema.properties,
    required: tool.inputSchema.required,
  },
}));

// ===== Tool Adapter =====

export class ToolAdapter {
  private readonly client: ReturnType<typeof createClient>;
  private readonly context: ToolContext;

  constructor(apiKey: string) {
    if (!apiKey || apiKey === "your-api-key") {
      throw new Error("Valid UNISAT_API_KEY is required");
    }
    this.client = createClient({
      apiKey,
      baseURL: config.unisatBaseURL,
      timeout: API_TIMEOUT,
    });
    this.context = { client: this.client };
  }

  /**
   * Get all tools in Anthropic format
   */
  getTools(): AnthropicTool[] {
    return anthropicTools;
  }

  /**
   * Execute a tool by name with retry logic
   */
  async executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
    const handler = getHandler(name);
    if (!handler) {
      throw new Error(`Unknown tool: ${name}`);
    }

    let lastError: Error | undefined;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await handler(args, this.context);
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const isRetryable =
          lastError.message.includes("ECONNRESET") ||
          lastError.message.includes("ETIMEDOUT") ||
          lastError.message.includes("ECONNREFUSED") ||
          lastError.message.includes("timeout");

        if (isRetryable && attempt < MAX_RETRIES) {
          // Exponential backoff: 1s, 2s
          const delay = 1000 * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        break;
      }
    }

    throw new Error(`Tool execution failed for ${name}: ${lastError?.message || "Unknown error"}`);
  }

  /**
   * Format tool result for display in chat
   */
  formatToolResult(toolName: string, result: unknown): string {
    const formatted = JSON.stringify(result, null, 2);
    return `Tool: ${toolName}\nResult: ${formatted}`;
  }
}

// ===== System Prompt =====

export const SYSTEM_PROMPT = `You are a Bitcoin blockchain expert assistant specializing in Bitcoin, BRC20 tokens, Runes protocol, and Ordinals inscriptions. You have access to real-time blockchain data through UniSat APIs.

## Your Capabilities

You can help users with:
- **Bitcoin Core**: Block information, transaction details, address balances, UTXOs, network fees
- **BRC20 Tokens**: Token info, balances, holder lists, transfer history, market data
- **Runes Protocol**: Token info, balances, holder data
- **Ordinals Inscriptions**: Inscription details, address inscriptions
- **Market Data**: BRC20 market stats, order books

## Important Guidelines

1. **Always use tools for current data** - Never rely on your training data for:
   - Current block height
   - Token prices or market data
   - Fee rates
   - Address balances
   - Token holder counts

2. **Be precise with addresses** - Validate Bitcoin addresses when provided. Support legacy (1...), segwit (bc1q...), and taproot (bc1p...) formats.

3. **Admit uncertainty** - If a tool fails or returns no data, clearly state this to the user. Never make up information.

4. **Cite sources** - When providing data, mention:
   - Block height for block data
   - Timestamps for time-sensitive info
   - Data source (UniSat API)

5. **Explain technical concepts** - Many users may be new to Bitcoin/BRC20. Explain terms like:
   - What a UTXO is
   - How BRC20 works
   - What Runes are
   - Fee rate terminology (sat/vB)

6. **Format responses clearly** - Use:
   - Tables for structured data
   - Bullet points for lists
   - Code blocks for addresses/txids
   - Headers for sections

## Example Responses

**Good**: "According to UniSat API data from block 834521, ORDI has 52,341 holders with a max supply of 21,000,000 tokens."

**Bad**: "ORDI has around 50k holders." (vague, no source, no timestamp)

If you don't have information about something the user asks, say so honestly and suggest what you *can* help with instead.`;
