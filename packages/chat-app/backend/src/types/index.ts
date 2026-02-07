/**
 * Shared Types for Backend
 */

// ===== WebSocket =====
export interface WSMessage {
  type: WSMessageType;
  data: unknown;
  timestamp: number;
  eventData?: unknown;
}

export type WSMessageType =
  | "chat:response"
  | "chat:error"
  | "chat:tool_call"
  | "chat:step"
  | "realtime:block"
  | "realtime:fee"
  | "realtime:brc20"
  | "connection:status"
  | "connection:ping"
  | "connection:pong";

export interface WSClient {
  id: string;
  socket: import("ws").WebSocket;
  isAlive: boolean;
  lastPing: number;
}

// ===== Chat =====
export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  model?: string;
  tokensUsed?: number;
  sources?: DataSource[];
  latency?: number;
}

export interface DataSource {
  type: "block" | "fee" | "brc20" | "runes" | "inscription";
  blockHeight?: number;
  timestamp?: number;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  status: "pending" | "completed" | "failed";
  result?: unknown;
  error?: string;
}

export interface ToolResult {
  toolCallId: string;
  result: unknown;
  error?: string;
}

export type InteractionStepType =
  | "user_message"
  | "ai_thinking"
  | "ai_planning"
  | "tool_calling"
  | "tool_executing"
  | "tool_completed"
  | "processing_results"
  | "ai_responding"
  | "response_complete"
  | "error";

export interface InteractionStep {
  id: string;
  type: InteractionStepType;
  timestamp: number;
  title: string;
  description?: string;
  details?: Record<string, unknown>;
  toolCall?: ToolCall;
}

export interface ChatRequest {
  sessionId: string;
  message: string;
  history?: ChatMessage[];
  stream?: boolean;
}

export interface ChatResponse {
  id: string;
  sessionId: string;
  message: ChatMessage;
  done: boolean;
}

// ===== Blockchain Data =====
export interface BlockData {
  height: number;
  hash: string;
  timestamp: number;
  txCount?: number;
  size?: number;
}

export interface FeeData {
  fastest: number;
  halfHour: number;
  hour: number;
  economy: number;
  minimum: number;
  timestamp: number;
}

export interface BRC20TokenData {
  ticker: string;
  price?: number;
  marketCap?: number;
  volume24h?: number;
  holders?: number;
  timestamp: number;
}

// ===== Cache =====
export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// ===== Polling =====
export interface PollerConfig {
  interval: number;
  enabled: boolean;
}

// ===== Error =====
export class ChatError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = "ChatError";
  }
}

export class RateLimitError extends Error {
  constructor(
    message: string = "Rate limit exceeded",
    public readonly retryAfter?: number,
  ) {
    super(message);
    this.name = "RateLimitError";
  }
}
