#!/usr/bin/env node
/**
 * UniSat MCP Server - All-in-one MCP server for UniSat services
 *
 * This server provides access to:
 * - Blockchain core data (blocks, transactions, balance, UTXO, fees)
 * - BRC20 protocol (token info, balance, holders, history)
 * - Runes protocol (token info, balance, holders)
 * - Inscriptions (details, by address)
 * - Marketplace (BRC20 trading stats, order list)
 *
 * Usage:
 *   UNISAT_API_KEY=your-key node dist/index.js
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@unisat/open-api";
import { allTools, getHandler, ToolContext } from "@unisat/open-api-mcp";

// Get API key from environment
const apiKey = process.env.UNISAT_API_KEY;
if (!apiKey) {
  console.error("Error: UNISAT_API_KEY environment variable is required");
  console.error("Get your API key from: https://docs.unisat.io/dev");
  process.exit(1);
}

// Initialize UniSat client (raw SDK)
const client = createClient({ apiKey });

// Create tool context
const toolContext: ToolContext = { client };

// Convert tool definitions to MCP format
const mcpTools = allTools.map((tool) => ({
  name: tool.name,
  description: tool.description,
  inputSchema: {
    type: tool.inputSchema.type,
    properties: tool.inputSchema.properties,
    required: tool.inputSchema.required,
  },
}));

// Create MCP server
const server = new Server(
  {
    name: "unisat-mcp-server",
    version: "0.0.1",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: mcpTools };
});

// Handle tool call request
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    const handler = getHandler(name);
    if (!handler) {
      throw new Error(`Unknown tool: ${name}`);
    }

    const result = await handler(args || {}, toolContext);

    return {
      content: [
        {
          type: "text",
          text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("UniSat MCP Server running");
  console.error(`Available tools: ${mcpTools.length}`);
  console.error("Categories: Core, BRC20, Runes, Inscriptions, Marketplace");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
