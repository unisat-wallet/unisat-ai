/**
 * UniSat MCP Server - HTTP/SSE Transport
 *
 * HTTP server with SSE transport for MCP protocol
 * Run locally: node dist/http/index.js
 * Default port: 3000
 *
 * Usage with Claude CLI:
 *   claude mcp add --transport http unisat http://localhost:3000/mcp
 */

import express from "express";
import { Server as HttpServer } from "http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@unisat/open-api";
import { allTools, getHandler, ToolContext } from "@unisat/open-api-mcp";

// Configuration
const PORT = process.env.MCP_PORT || 3000;
const API_KEY = process.env.UNISAT_API_KEY;

if (!API_KEY) {
  console.error("Error: UNISAT_API_KEY environment variable is required");
  process.exit(1);
}

// Initialize UniSat client (raw SDK)
const client = createClient({ apiKey: API_KEY });

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

// Create Express app
const app = express();

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "unisat-mcp-server" });
});

// MCP endpoint with SSE
app.get("/mcp", async (req, res) => {
  console.log("New MCP connection established");

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Create SSE transport
  const transport = new SSEServerTransport("/message", res);

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

  // Handle list tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: mcpTools };
  });

  // Handle tool calls
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

  // Handle client disconnect
  req.on("close", async () => {
    console.log("MCP connection closed");
    await server.close();
  });

  // Connect server to transport
  await server.connect(transport);
  console.log("MCP Server connected via SSE");
});

// Message endpoint for POST requests from client
app.post("/message", express.json(), async (req, res) => {
  // This handles messages sent via POST from the SSE client
  res.json({ status: "ok" });
});

// Start HTTP server
const httpServer = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║   UniSat MCP Server (HTTP/SSE Transport)             ║
╠═══════════════════════════════════════════════════════╣
║   URL:     http://localhost:${PORT}/mcp               ║
║   Tools:   ${mcpTools.length} available                                ║
║                                                          ║
║   Add to Claude:                                         ║
║   claude mcp add --transport http unisat                 ║
║     http://localhost:${PORT}/mcp                         ║
╚═══════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Shutting down server...");
  httpServer.close();
});

process.on("SIGINT", () => {
  console.log("\nShutting down server...");
  httpServer.close();
  process.exit(0);
});
