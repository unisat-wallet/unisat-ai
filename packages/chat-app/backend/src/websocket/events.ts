/**
 * WebSocket Events
 * Type definitions for WebSocket messages
 */

import type { ChatMessage, ToolCall, BlockData, FeeData, BRC20TokenData, InteractionStep } from "../types/index.js";

// ===== Client → Server Events =====
export interface ClientEvents {
  chat: {
    sessionId: string;
    message: string;
    history?: ChatMessage[];
  };
  ping: {};
  subscribe: {
    channels: string[];
  };
  unsubscribe: {
    channels: string[];
  };
}

// ===== Server → Client Events =====
export interface ServerEvents {
  chat: {
    sessionId: string;
    type: "text" | "tool_call" | "tool_result" | "done" | "error" | "step";
    content?: string;
    toolCall?: ToolCall;
    message?: ChatMessage;
    step?: InteractionStep;
  };
  pong: {};
  error: {
    message: string;
    code?: string;
  };
  realtime_block: BlockData;
  realtime_fee: FeeData;
  realtime_brc20: BRC20TokenData & { ticker: string };
  connection_status: {
    status: "connected" | "disconnected" | "reconnecting";
  };
}

// All valid message types
export type WSMessageType = keyof ServerEvents;

// ===== Message Wrapper =====
export interface WSMessage<T extends WSMessageType = WSMessageType> {
  type: T;
  data: ServerEvents[T];
  timestamp: number;
}

// ===== Helpers =====
export function createMessage<T extends WSMessageType>(
  type: T,
  data: ServerEvents[T]
): WSMessage<T> {
  return {
    type,
    data,
    timestamp: Date.now(),
  };
}

export function parseClientMessage(message: string): {
  type: string;
  data: unknown;
} | null {
  try {
    const parsed = JSON.parse(message);
    if (typeof parsed.type === "string") {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
