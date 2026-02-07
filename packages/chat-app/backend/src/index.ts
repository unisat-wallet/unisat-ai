/**
 * Backend Server Entry Point
 * Starts Express HTTP server and WebSocket server
 */

import express, { type Express } from "express";
import { createServer } from "http";
import { WebSocketHandler } from "./websocket/handler.js";
import { RateLimiter, createRateLimitMiddleware } from "./middleware/rate-limit.js";
import { corsMiddleware } from "./middleware/cors.js";
import { config } from "./config/index.js";
import { blockCache, feeCache, brc20Cache } from "./cache/memory-cache.js";

// Create Express app
const app: Express = express();

// Middleware
app.use(corsMiddleware);
app.use(express.json());

// Create rate limiter
const rateLimiter = new RateLimiter(
  config.rateLimitWindowMs,
  config.rateLimitMax
);

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: Date.now(),
    uptime: process.uptime(),
    version: "0.0.1",
  });
});

// Get cached real-time data
app.get("/api/realtime/block", (req, res) => {
  try {
    rateLimiter.check(req.ip ?? "unknown");
    const block = blockCache.get("latest") as unknown;
    if (block) {
      res.json(block);
    } else {
      res.status(404).json({ error: "Block data not available" });
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(429).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

app.get("/api/realtime/fee", (req, res) => {
  try {
    rateLimiter.check(req.ip ?? "unknown");
    const fee = feeCache.get("current") as unknown;
    if (fee) {
      res.json(fee);
    } else {
      res.status(404).json({ error: "Fee data not available" });
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(429).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

app.get("/api/realtime/brc20/:ticker", (req, res) => {
  try {
    rateLimiter.check(req.ip ?? "unknown");
    const ticker = req.params.ticker.toLowerCase();
    const tokenData = brc20Cache.get(`ticker:${ticker}`) as unknown;
    if (tokenData) {
      res.json(tokenData);
    } else {
      res.status(404).json({ error: "Token data not available" });
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(429).json({ error: error.message });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

// Get cache stats
app.get("/api/stats", (_req, res) => {
  res.json({
    block: blockCache.getStats(),
    fee: feeCache.getStats(),
    brc20: brc20Cache.getStats(),
  });
});

// Start HTTP server
const httpServer = createServer(app);
const PORT = config.port;

httpServer.listen(PORT, () => {
  console.log(`HTTP server listening on port ${PORT}`);
});

// Start WebSocket server
const wsHandler = new WebSocketHandler();

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  wsHandler.close();
  httpServer.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully...");
  wsHandler.close();
  httpServer.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});

// Export for testing
export { app, wsHandler };
