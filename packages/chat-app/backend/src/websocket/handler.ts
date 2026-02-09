/**
 * WebSocket Handler
 * Manages WebSocket connections and message routing
 */

import { WebSocketServer, WebSocket } from "ws";
import {
  createMessage,
  parseClientMessage,
  WSMessage,
  WSMessageType,
} from "./events.js";
import type { ServerEvents } from "./events.js";
import { ChatService } from "../chat/service.js";
import { PollingScheduler } from "../polling/scheduler.js";
import type { WSClient } from "../types/index.js";
import { config } from "../config/index.js";

export class WebSocketHandler {
  private readonly wss: WebSocketServer;
  private readonly chatService: ChatService;
  private readonly scheduler: PollingScheduler;
  private readonly clients = new Map<WebSocket, WSClient>();
  private readonly subscriptions = new Map<string, Set<WebSocket>>();

  constructor(port: number = config.wsPort) {
    this.wss = new WebSocketServer({ port });
    this.chatService = new ChatService();
    this.scheduler = new PollingScheduler({
      onBlock: (data) => this.broadcast("realtime_block", data),
      onFee: (data) => this.broadcast("realtime_fee", data),
      onBRC20: (ticker, data) =>
        this.broadcast("realtime_brc20", { ...data, ticker }),
    });

    this.setupServer();
    this.startHeartbeat();
  }

  /**
   * Set up WebSocket server event handlers
   */
  private setupServer(): void {
    this.wss.on("connection", (socket, req) => {
      const clientId = this.generateClientId();
      const client: WSClient = {
        id: clientId,
        socket,
        isAlive: true,
        lastPing: Date.now(),
      };

      this.clients.set(socket, client);

      console.log(
        `Client connected: ${clientId} from ${(req.socket.address() as { address?: string }).address}`,
      );

      // Send welcome message
      this.send(
        socket,
        createMessage("connection_status", {
          status: "connected",
        }),
      );

      // Set up message handler
      socket.on("message", (data: Buffer) => this.handleMessage(socket, data));

      // Set up close handler
      socket.on("close", () => this.handleClose(socket));

      // Set up ping/pong
      socket.on("pong", () => {
        if (this.clients.has(socket)) {
          this.clients.get(socket)!.isAlive = true;
        }
      });

      // Start polling if first client
      if (this.clients.size === 1) {
        this.scheduler.start();
      }
    });

    console.log(`WebSocket server listening on port ${config.wsPort}`);
  }

  /**
   * Handle incoming message from client
   */
  private async handleMessage(socket: WebSocket, data: Buffer): Promise<void> {
    const rawMessage = data.toString();
    console.log(`[WS] === Received message from client ===`);
    console.log(`[WS] Raw message:`, rawMessage);
    console.log(`[WS] Socket readyState: ${socket.readyState}`);

    const client = this.clients.get(socket);
    if (!client) {
      console.log(`[WS] Unknown client, ignoring message`);
      return;
    }
    console.log(`[WS] Client ID:`, client.id);

    const parsed = parseClientMessage(rawMessage);
    if (!parsed) {
      console.log(`[WS] Failed to parse message`);
      console.log(`[WS] Raw message was:`, rawMessage);
      this.sendError(socket, "Invalid message format");
      return;
    }

    const { type, data: eventData } = parsed;
    console.log(`[WS] Parsed message type: ${type}`);
    console.log(`[WS] Parsed message data:`, eventData);
    console.log(`[WS] === Handling message type: ${type} ===`);

    switch (type) {
      case "chat":
        await this.handleChatMessage(
          socket,
          eventData as { sessionId: string; message: string; provider?: string },
        );
        break;

      case "ping":
        console.log(`[WS] Received ping, sending pong`);
        this.send(socket, createMessage("pong", {}));
        break;

      case "subscribe":
        console.log(`[WS] Subscribe request:`, eventData);
        this.handleSubscribe(socket, eventData as { channels: string[] });
        break;

      case "unsubscribe":
        console.log(`[WS] Unsubscribe request:`, eventData);
        this.handleUnsubscribe(socket, eventData as { channels: string[] });
        break;

      default:
        console.log(`[WS] Unknown event type: ${type}`);
        this.sendError(socket, `Unknown event type: ${type}`);
    }

    console.log(`[WS] === Message handling complete ===`);
  }

  /**
   * Handle chat message
   */
  private async handleChatMessage(
    socket: WebSocket,
    data: { sessionId: string; message: string; provider?: string },
  ): Promise<void> {
    const { sessionId, message, provider } = data;
    console.log(`[WS] === handleChatMessage START ===`);
    console.log(`[WS] sessionId: ${sessionId}`);
    console.log(`[WS] message: "${message}"`);
    console.log(`[WS] provider: ${provider || "default"}`);
    console.log(`[WS] Socket readyState: ${socket.readyState}`);

    try {
      let chunkCount = 0;
      console.log(`[WS] Starting processMessage stream...`);

      // Stream response
      for await (const chunk of this.chatService.processMessage(message, {
        sessionId,
        provider: provider as "openai" | "agentkit" | undefined,
      })) {
        chunkCount++;
        console.log(`[WS] === Chunk ${chunkCount} ===`);
        console.log(`[WS] Chunk type:`, chunk.type);
        console.log(`[WS] Chunk content:`, chunk.content?.substring?.(0, 100));
        console.log(`[WS] Chunk toolCall:`, chunk.toolCall);
        console.log(`[WS] Chunk message:`, chunk.message);

        const wsMessage = createMessage("chat", {
          sessionId,
          type: chunk.type as
            | "text"
            | "tool_call"
            | "tool_result"
            | "done"
            | "error"
            | "step",
          content: chunk.content,
          toolCall: chunk.toolCall,
          message: chunk.message,
          step: chunk.step,
        });

        console.log(`[WS] Sending WS message, readyState before send: ${socket.readyState}`);

        this.send(socket, wsMessage);

        console.log(`[WS] Sent chunk ${chunkCount} successfully`);
      }

      console.log(`[WS] === Streaming completed for session ${sessionId} ===`);
      console.log(`[WS] Total chunks sent: ${chunkCount}`);

      // Safety check: if no chunks were sent, send a done event
      if (chunkCount === 0) {
        console.log(`[WS] WARNING: No chunks were sent! Sending explicit done event.`);
        this.send(socket, createMessage("chat", {
          sessionId,
          type: "done",
        }));
      }
    } catch (error) {
      console.error(`[WS] === ERROR in handleChatMessage ===`);
      console.error(`[WS] Error:`, error);
      console.error(`[WS] Error message:`, error instanceof Error ? error.message : String(error));
      console.error(`[WS] Stack trace:`, error instanceof Error ? error.stack : 'No stack trace');
      this.sendError(
        socket,
        error instanceof Error ? error.message : String(error),
      );
    }

    console.log(`[WS] === handleChatMessage END ===`);
  }

  /**
   * Handle channel subscription
   */
  private handleSubscribe(
    socket: WebSocket,
    data: { channels: string[] },
  ): void {
    for (const channel of data.channels) {
      if (!this.subscriptions.has(channel)) {
        this.subscriptions.set(channel, new Set());
      }
      this.subscriptions.get(channel)!.add(socket);
    }
  }

  /**
   * Handle channel unsubscription
   */
  private handleUnsubscribe(
    socket: WebSocket,
    data: { channels: string[] },
  ): void {
    for (const channel of data.channels) {
      const subscribers = this.subscriptions.get(channel);
      if (subscribers) {
        subscribers.delete(socket);
      }
    }
  }

  /**
   * Handle client disconnect
   */
  private handleClose(socket: WebSocket): void {
    const client = this.clients.get(socket);
    if (client) {
      console.log(`Client disconnected: ${client.id}`);

      // Remove from all subscriptions
      for (const subscribers of this.subscriptions.values()) {
        subscribers.delete(socket);
      }

      this.clients.delete(socket);

      // Stop polling if no clients
      if (this.clients.size === 0) {
        this.scheduler.stop();
      }
    }
  }

  /**
   * Broadcast message to all subscribed clients
   */
  broadcast<T extends WSMessageType>(
    type: T,
    data: ServerEvents[T],
    channel?: string,
  ): void {
    const message = createMessage(type, data);
    const messageStr = JSON.stringify(message);

    console.log(`[WS] === broadcast ===`);
    console.log(`[WS] Type: ${type}`);
    console.log(`[WS] Channel: ${channel || "none (broadcast to all)"}`);
    console.log(`[WS] Data:`, JSON.stringify(data).substring(0, 200));
    console.log(`[WS] Total clients: ${this.clients.size}`);

    if (channel) {
      // Broadcast to channel subscribers only
      const subscribers = this.subscriptions.get(channel);
      console.log(`[WS] Subscribers for channel "${channel}": ${subscribers?.size || 0}`);
      if (subscribers) {
        for (const socket of subscribers) {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(messageStr);
          }
        }
      }
    } else {
      // Broadcast to all clients
      let sentCount = 0;
      for (const [socket] of this.clients) {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(messageStr);
          sentCount++;
        }
      }
      console.log(`[WS] Sent to ${sentCount} clients`);
    }
    console.log(`[WS] === broadcast END ===`);
  }

  /**
   * Send message to specific client
   */
  private send<T extends WSMessageType>(
    socket: WebSocket,
    message: WSMessage<T>,
  ): void {
    console.log(`[WS] === send ===`);
    console.log(`[WS] Socket readyState: ${socket.readyState} (OPEN=${WebSocket.OPEN})`);
    console.log(`[WS] Message type:`, message.type);
    console.log(`[WS] Message data:`, JSON.stringify(message.data).substring(0, 200));

    if (socket.readyState === WebSocket.OPEN) {
      const messageStr = JSON.stringify(message);
      console.log(`[WS] Sending message (length: ${messageStr.length})`);
      socket.send(messageStr);
      console.log(`[WS] Message sent successfully`);
    } else {
      console.warn(`[WS] WARNING: Socket not ready for sending!`);
    }
  }

  /**
   * Send error to client
   */
  private sendError(socket: WebSocket, message: string, code?: string): void {
    this.send(socket, createMessage("error", { message, code }));
  }

  /**
   * Start heartbeat to detect dead connections
   */
  private startHeartbeat(): void {
    const interval = setInterval(() => {
      for (const [socket, client] of this.clients) {
        if (!client.isAlive) {
          socket.terminate();
          this.clients.delete(socket);
          continue;
        }

        client.isAlive = false;
        socket.ping();
      }
    }, 30000);

    // Clear interval on server close
    this.wss.on("close", () => clearInterval(interval));
  }

  /**
   * Generate unique client ID
   */
  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connected clients count
   */
  getClientCount(): number {
    return this.clients.size;
  }

  /**
   * Close the WebSocket server
   */
  close(): void {
    this.scheduler.stop();
    for (const [socket] of this.clients) {
      socket.close();
    }
    this.wss.close();
  }
}
