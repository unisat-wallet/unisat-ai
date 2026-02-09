/**
 * UniSat MCP Server - Streamable HTTP Transport
 *
 * HTTP server with Streamable HTTP transport for MCP protocol
 * Compatible with google.adk MCPToolset (StreamableHTTPConnectionParams)
 *
 * Run locally: node dist/http/index.js
 * Default port: 8000 (for cloud deployment)
 */

import express, { Request, Response } from "express";
import { randomUUID } from "crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { createClient } from "@unisat/open-api";
import { allTools, getHandler, ToolContext } from "@unisat/open-api-mcp";

// Configuration
const PORT = parseInt(process.env.MCP_PORT || "8000", 10);
const API_KEY = process.env.UNISAT_API_KEY;

if (!API_KEY) {
  console.error("Error: UNISAT_API_KEY environment variable is required");
  process.exit(1);
}

// Initialize UniSat client
const client = createClient({ apiKey: API_KEY });
const toolContext: ToolContext = { client };

// Convert tool definitions to MCP format
const mcpTools = allTools.map((tool) => ({
  name: tool.name,
  description: tool.description,
  inputSchema: {
    type: tool.inputSchema.type as "object",
    properties: tool.inputSchema.properties,
    required: tool.inputSchema.required,
  },
}));

// Session management for stateful connections
const sessions = new Map<string, { server: McpServer; transport: StreamableHTTPServerTransport }>();

/**
 * Create a new MCP server instance
 */
function createMCPServer(): McpServer {
  const server = new McpServer({
    name: "unisat-mcp-server",
    version: "1.0.0",
  });

  // Register tools
  for (const tool of mcpTools) {
    server.tool(tool.name, tool.description, tool.inputSchema, async (args) => {
      try {
        const handler = getHandler(tool.name);
        if (!handler) {
          throw new Error(`Unknown tool: ${tool.name}`);
        }

        const result = await handler(args || {}, toolContext);

        return {
          content: [
            {
              type: "text" as const,
              text: typeof result === "string" ? result : JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text" as const,
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  return server;
}

// Create Express app
const app = express();
app.use(express.json());

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "unisat-mcp-server", transport: "streamable-http" });
});

// MCP endpoint - handles all methods for Streamable HTTP
app.all("/mcp", async (req: Request, res: Response) => {
  console.log(`[MCP] ${req.method} request received`);

  // Handle GET for SSE stream initialization (not used in pure streamable HTTP but good for compatibility)
  if (req.method === "GET") {
    console.log("[MCP] GET request - SSE not supported in streamable HTTP mode");
    res.status(405).json({ error: "Method not allowed. Use POST for MCP requests." });
    return;
  }

  // Handle DELETE for session termination
  if (req.method === "DELETE") {
    const sessionId = req.headers["mcp-session-id"] as string;
    if (sessionId && sessions.has(sessionId)) {
      const session = sessions.get(sessionId)!;
      await session.transport.close();
      sessions.delete(sessionId);
      console.log(`[MCP] Session ${sessionId} terminated`);
      res.status(200).json({ status: "terminated" });
    } else {
      res.status(404).json({ error: "Session not found" });
    }
    return;
  }

  // Handle POST for MCP messages
  if (req.method === "POST") {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    const isInit = isInitializeRequest(req.body);

    console.log(`[MCP] POST - sessionId: ${sessionId}, isInit: ${isInit}`);
    console.log(`[MCP] Request body:`, JSON.stringify(req.body).substring(0, 200));

    // For initialization requests, create a new session
    if (isInit) {
      const newSessionId = randomUUID();
      const server = createMCPServer();
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => newSessionId,
        onsessioninitialized: (id) => {
          console.log(`[MCP] Session initialized: ${id}`);
        },
      });

      // Store session
      sessions.set(newSessionId, { server, transport });

      // Connect server to transport
      await server.connect(transport);

      // Handle the request
      await transport.handleRequest(req, res, req.body);
      return;
    }

    // For existing sessions, route to the right transport
    if (sessionId && sessions.has(sessionId)) {
      const session = sessions.get(sessionId)!;
      await session.transport.handleRequest(req, res, req.body);
      return;
    }

    // No session ID and not init - error
    console.log("[MCP] Bad request - no session ID for non-init request");
    res.status(400).json({
      jsonrpc: "2.0",
      error: {
        code: -32600,
        message: "Bad Request: No valid session. Send an initialize request first.",
      },
      id: req.body?.id || null,
    });
    return;
  }

  // Other methods not supported
  res.status(405).json({ error: "Method not allowed" });
});

// Start HTTP server
const httpServer = app.listen(PORT, "0.0.0.0", () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║   UniSat MCP Server (Streamable HTTP Transport)           ║
╠═══════════════════════════════════════════════════════════╣
║   URL:     http://0.0.0.0:${PORT}/mcp                        ║
║   Tools:   ${String(mcpTools.length).padEnd(2)} available                                 ║
║                                                           ║
║   Compatible with:                                        ║
║   - google.adk MCPToolset (StreamableHTTPConnectionParams)║
║   - Claude Desktop / CLI                                  ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
const shutdown = async () => {
  console.log("Shutting down server...");

  // Close all sessions
  for (const [id, session] of sessions) {
    console.log(`Closing session ${id}`);
    await session.transport.close();
  }
  sessions.clear();

  httpServer.close();
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
