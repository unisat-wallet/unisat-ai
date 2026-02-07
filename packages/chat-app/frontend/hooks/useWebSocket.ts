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
  const messageHandlersRef = useRef<Map<string, Set<(message: WSMessage) => void>>>(
    new Map()
  );
  const clientUnsubscribesRef = useRef<Map<string, () => void>>(new Map());

  // Initialize client
  useEffect(() => {
    if (!url) return;

    const wsClient = getWebSocketClient(url);
    setClient(wsClient);

    // Subscribe to connection state changes
    const unsubscribe = wsClient.onConnectionChange((state) => {
      setConnectionState(state);
    });

    // Connect
    wsClient.connect();

    return () => {
      unsubscribe();
    };
  }, [url]);

  // Re-subscribe all handlers when client changes
  useEffect(() => {
    if (!client) return;

    console.log("[useWebSocket] Client changed, re-subscribing all handlers");
    console.log("[useWebSocket] Handler types:", Array.from(messageHandlersRef.current.keys()));

    // Clear previous subscriptions
    for (const unsubscribe of clientUnsubscribesRef.current.values()) {
      unsubscribe();
    }
    clientUnsubscribesRef.current.clear();

    // Re-subscribe all handlers
    for (const [type, handlers] of messageHandlersRef.current) {
      console.log(`[useWebSocket] Re-subscribing ${handlers.size} handlers for type: ${type}`);
      for (const handler of handlers) {
        const unsubscribe = client.onMessage((message) => {
          if (message.type === type) {
            handler(message);
          }
        });
        clientUnsubscribesRef.current.set(`${type}_${handler.name}`, unsubscribe);
      }
    }
  }, [client]);

  // Register message handler
  const onMessage = useCallback(
    (type: string, handler: (message: WSMessage) => void) => {
      console.log(`[useWebSocket] Registering handler for type: ${type}`);
      console.log(`[useWebSocket] Client exists: ${!!client}`);

      const handlers = messageHandlersRef.current.get(type) ?? new Set();
      handlers.add(handler);
      messageHandlersRef.current.set(type, handlers);

      // Also subscribe to client messages if client exists
      if (client) {
        const unsubscribe = client.onMessage((message) => {
          if (message.type === type) {
            handler(message);
          }
        });
        clientUnsubscribesRef.current.set(`${type}_${handler.name}`, unsubscribe);

        return () => {
          console.log(`[useWebSocket] Unregistering handler for type: ${type}`);
          handlers.delete(handler);
          const storedUnsub = clientUnsubscribesRef.current.get(`${type}_${handler.name}`);
          if (storedUnsub) {
            storedUnsub();
            clientUnsubscribesRef.current.delete(`${type}_${handler.name}`);
          }
        };
      }

      return () => {
        console.log(`[useWebSocket] Unregistering handler for type: ${type} (no client yet)`);
        handlers.delete(handler);
      };
    },
    [client]
  );

  // Send message
  const send = useCallback(
    (type: string, data: unknown) => {
      console.log("[useWebSocket] === send ===");
      console.log("[useWebSocket] Type:", type);
      console.log("[useWebSocket] Data:", data);
      console.log("[useWebSocket] Client:", client ? "exists" : "null");

      const result = client?.send(type as any, data) ?? false;
      console.log("[useWebSocket] Send result:", result);
      console.log("[useWebSocket] === send END ===");

      return result;
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
