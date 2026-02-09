/**
 * WebSocket Client
 * Manages WebSocket connection with auto-reconnect
 */

import type {
  WSMessage,
  WSMessageType,
  ConnectionState,
} from "@/types";
import { RECONNECT_DELAYS } from "./constants";

export type WSMessageHandler = (message: WSMessage) => void;
export type WSConnectionHandler = (state: ConnectionState) => void;

export class WebSocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private messageHandler: WSMessageHandler | null = null;
  private connectionHandlers: Set<WSConnectionHandler> = new Set();
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingTimer: NodeJS.Timeout | null = null;
  private manualClose = false;
  private state: ConnectionState = { status: "connecting" };

  constructor(url: string) {
    this.url = url;
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.manualClose = false;
    this.updateState({ status: "connecting" });

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log("WebSocket connected");
        this.reconnectAttempts = 0;
        this.updateState({ status: "connected", lastConnected: Date.now() });
        this.startPing();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as WSMessage;
          console.log("[WS-Client] Received message:", message.type, "handler exists:", !!this.messageHandler);
          // Only call the single message handler
          if (this.messageHandler) {
            this.messageHandler(message);
          }
        } catch (error) {
          console.error("[WebSocketClient] Failed to parse WebSocket message:", error);
        }
      };

      this.ws.onclose = (event) => {
        console.log("WebSocket disconnected:", event.code, event.reason);
        this.stopPing();

        if (!this.manualClose) {
          this.scheduleReconnect();
        } else {
          this.updateState({ status: "disconnected" });
        }
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.updateState({
          status: "disconnected",
          error: "Connection error",
        });
      };
    } catch (error) {
      console.error("Failed to create WebSocket:", error);
      this.scheduleReconnect();
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.manualClose = true;
    this.stopPing();
    this.clearReconnectTimer();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.updateState({ status: "disconnected" });
  }

  /**
   * Send message to server
   */
  send(type: WSMessageType, data: unknown): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("[WebSocketClient] WebSocket not connected, cannot send message");
      return false;
    }

    try {
      const message = {
        type,
        data,
        timestamp: Date.now(),
      };
      this.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      console.error("[WebSocketClient] Failed to send WebSocket message:", error);
      return false;
    }
  }

  /**
   * Set the single message handler (replaces previous handler)
   */
  setMessageHandler(handler: WSMessageHandler | null): void {
    console.log("[WS-Client] setMessageHandler called, previous handler:", !!this.messageHandler, "new handler:", !!handler);
    this.messageHandler = handler;
  }

  /**
   * Subscribe to connection state changes
   */
  onConnectionChange(handler: WSConnectionHandler): () => void {
    this.connectionHandlers.add(handler);
    // Immediately call with current state
    handler(this.state);
    return () => this.connectionHandlers.delete(handler);
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    this.clearReconnectTimer();

    const delay =
      RECONNECT_DELAYS[
        Math.min(this.reconnectAttempts, RECONNECT_DELAYS.length - 1)
      ];

    this.updateState({
      status: "reconnecting",
      error: undefined,
    });

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  /**
   * Clear reconnect timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Start ping/pong for connection health
   */
  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => {
      this.send("ping" as any, {});
    }, 30000);
  }

  /**
   * Stop ping/pong
   */
  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  /**
   * Update and notify connection state
   */
  private updateState(newState: Partial<ConnectionState>): void {
    this.state = { ...this.state, ...newState };
    this.notifyConnectionHandlers(this.state);
  }

  /**
   * Notify all connection handlers
   */
  private notifyConnectionHandlers(state: ConnectionState): void {
    for (const handler of this.connectionHandlers) {
      try {
        handler(state);
      } catch (error) {
        console.error("Error in connection handler:", error);
      }
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN && this.state.status === "connected";
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return { ...this.state };
  }
}

/**
 * Create a singleton WebSocket client
 */
let wsClient: WebSocketClient | null = null;

export function getWebSocketClient(url?: string): WebSocketClient {
  if (!wsClient && url) {
    wsClient = new WebSocketClient(url);
  }
  return wsClient!;
}

export function resetWebSocketClient(): void {
  if (wsClient) {
    wsClient.disconnect();
    wsClient = null;
  }
}
