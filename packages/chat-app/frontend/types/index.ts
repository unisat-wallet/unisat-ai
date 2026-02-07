/**
 * Frontend Types
 */

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
  displayName?: string;
  arguments: Record<string, unknown>;
  status: "pending" | "completed" | "failed";
  result?: unknown;
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

export interface ToolResult {
  toolCallId: string;
  result: unknown;
  error?: string;
}

export interface ChatStreamEvent {
  type: "text" | "tool_call" | "tool_result" | "done" | "error" | "step";
  content?: string;
  toolCall?: ToolCall;
  message?: ChatMessage;
  step?: InteractionStep;
}

// ===== WebSocket =====
export interface WSMessage<T extends WSMessageType = WSMessageType> {
  type: T;
  data: WSMessageData[T];
  timestamp: number;
}

export type WSMessageType =
  | "chat"
  | "error"
  | "pong"
  | "realtime_block"
  | "realtime_fee"
  | "realtime_brc20"
  | "connection_status";

export interface WSMessageData {
  chat: {
    sessionId: string;
    type: "text" | "tool_call" | "tool_result" | "done" | "error" | "step";
    content?: string;
    toolCall?: ToolCall;
    message?: ChatMessage;
    step?: InteractionStep;
  };
  error: {
    message: string;
    code?: string;
  };
  pong: {};
  realtime_block: BlockData;
  realtime_fee: FeeData;
  realtime_brc20: BRC20TokenData & { ticker: string };
  connection_status: {
    status: "connected" | "disconnected" | "reconnecting";
  };
}

// ===== Real-time Data =====
export interface BlockData {
  height: number;
  hash: string;
  timestamp: number;
  txCount: number;
  size: number;
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

// ===== UI State =====
export interface ConnectionState {
  status: "connecting" | "connected" | "disconnected" | "reconnecting";
  lastConnected?: number;
  error?: string;
}

export interface SuggestedQuery {
  label: string;
  query: string;
  icon?: string;
}
