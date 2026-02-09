/**
 * useWebSocket Hook
 * React hook for WebSocket connection
 */

"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { WebSocketClient, getWebSocketClient } from "@/lib/websocket-client";
import type { WSMessage, ConnectionState } from "@/types";

export function useWebSocket(url?: string) {
  const [client, setClient] = useState<WebSocketClient | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>({
    status: "connecting",
  });
  const handlersRef = useRef<Map<string, (message: WSMessage) => void>>(new Map());

  // Initialize client
  useEffect(() => {
    if (!url) return;

    const wsClient = getWebSocketClient(url);
    setClient(wsClient);

    // Subscribe to connection state changes
    const unsubscribe = wsClient.onConnectionChange((state) => {
      setConnectionState(state);
    });

    // Set up single message handler that routes to type-specific handlers
    wsClient.setMessageHandler((message) => {
      const handler = handlersRef.current.get(message.type);
      console.log("[useWebSocket] Message received:", message.type, "handler exists:", !!handler, "handlers count:", handlersRef.current.size);
      if (handler) {
        handler(message);
      }
    });

    // Connect
    wsClient.connect();

    return () => {
      unsubscribe();
      // Don't clear message handler on cleanup - it's a singleton
    };
  }, [url]);

  // Register message handler
  const onMessage = useCallback(
    (type: string, handler: (message: WSMessage) => void) => {
      // Store handler in ref (overwrites previous handler for same type)
      console.log("[useWebSocket] onMessage registering handler for type:", type);
      handlersRef.current.set(type, handler);

      return () => {
        // Only delete if it's the same handler
        console.log("[useWebSocket] onMessage unregistering handler for type:", type);
        if (handlersRef.current.get(type) === handler) {
          handlersRef.current.delete(type);
        }
      };
    },
    []
  );

  // Send message
  const send = useCallback(
    (type: string, data: unknown) => {
      return client?.send(type as any, data) ?? false;
    },
    [client]
  );

  // Manual reconnect
  const reconnect = useCallback(() => {
    client?.disconnect();
    setTimeout(() => client?.connect(), 100);
  }, [client]);

  // Manual disconnect
  const disconnect = useCallback(() => {
    client?.disconnect();
  }, [client]);

  return {
    client,
    connectionState,
    onMessage,
    send,
    reconnect,
    disconnect,
    isConnected: connectionState.status === "connected",
  };
}
