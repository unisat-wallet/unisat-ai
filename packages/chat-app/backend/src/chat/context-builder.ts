/**
 * Context Builder
 * Builds conversation context from message history
 */

import type { ChatMessage } from "../types/index.js";
import { SYSTEM_PROMPT } from "../mcp/tool-adapter.js";

export interface ContextOptions {
  maxMessages?: number;
  maxTokens?: number;
  includeSystem?: boolean;
}

export class ContextBuilder {
  private readonly defaultMaxMessages = 20;
  private readonly defaultMaxTokens = 8000;

  /**
   * Build message context for API call
   */
  buildContext(
    userMessage: string,
    history: ChatMessage[] = [],
    options: ContextOptions = {}
  ): ChatMessage[] {
    const {
      maxMessages = this.defaultMaxMessages,
      includeSystem = true,
    } = options;

    const messages: ChatMessage[] = [];

    console.log(`[ContextBuilder] === buildContext ===`);
    console.log(`[ContextBuilder] userMessage: "${userMessage}" (length: ${userMessage.length})`);
    console.log(`[ContextBuilder] history length: ${history.length}`);
    console.log(`[ContextBuilder] maxMessages: ${maxMessages}`);
    console.log(`[ContextBuilder] includeSystem: ${includeSystem}`);

    // Add system prompt first
    if (includeSystem) {
      messages.push({
        id: "system",
        role: "system",
        content: SYSTEM_PROMPT,
        timestamp: Date.now(),
      });
    }

    // Add recent history (most recent last)
    const recentHistory = this.getRecentHistory(history, maxMessages);
    console.log(`[ContextBuilder] recentHistory length: ${recentHistory.length}`);
    messages.push(...recentHistory);

    // Add current user message (only if not empty)
    if (userMessage && userMessage.trim()) {
      messages.push({
        id: this.generateId(),
        role: "user",
        content: userMessage,
        timestamp: Date.now(),
      });
      console.log(`[ContextBuilder] Added user message to context`);
    } else {
      console.log(`[ContextBuilder] Skipped adding empty user message`);
    }

    console.log(`[ContextBuilder] Final context length: ${messages.length}`);
    console.log(`[ContextBuilder] === buildContext END ===`);

    return messages;
  }

  /**
   * Get recent messages from history
   */
  private getRecentHistory(history: ChatMessage[], maxMessages: number): ChatMessage[] {
    // Filter out system messages and get most recent
    const userAssistantMessages = history.filter(
      (m) => m.role === "user" || m.role === "assistant"
    );

    // Take last N messages
    return userAssistantMessages.slice(-maxMessages);
  }

  /**
   * Summarize old messages to reduce context
   * (Future enhancement: implement intelligent summarization)
   */
  summarizeContext(history: ChatMessage[]): string {
    if (history.length === 0) {
      return "";
    }

    // Simple summary: count messages by role
    const userCount = history.filter((m) => m.role === "user").length;
    const assistantCount = history.filter((m) => m.role === "assistant").length;

    return `[Conversation summary: ${userCount} user messages, ${assistantCount} assistant responses]`;
  }

  /**
   * Extract addresses from messages for potential enrichment
   */
  extractAddresses(message: string): string[] {
    const addressPattern = /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b|\bbc1[a-z0-9]{11,71}\b/g;
    const matches = message.match(addressPattern);
    return matches ?? [];
  }

  /**
   * Extract txids from messages
   */
  extractTxids(message: string): string[] {
    const txidPattern = /\b[a-fA-F0-9]{64}\b/g;
    const matches = message.match(txidPattern);
    return matches ?? [];
  }

  /**
   * Extract tickers from messages (BRC20/Runes)
   */
  extractTickers(message: string): string[] {
    // Look for common ticker patterns (4-4 uppercase letters)
    const tickerPattern = /\$\b([A-Z]{4,10})\b|\b([A-Z]{4,10})\s*(?:token|ticker|BRC20)\b/gi;
    const matches = new Set<string>();

    for (const match of message.matchAll(tickerPattern)) {
      const ticker = match[1] || match[2];
      if (ticker) {
        matches.add(ticker.toUpperCase());
      }
    }

    return Array.from(matches);
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Detect user intent from message
   */
  detectIntent(message: string): string[] {
    const intents: string[] = [];
    const lowerMessage = message.toLowerCase();

    // Block queries
    if (lowerMessage.includes("block") || lowerMessage.includes("block height")) {
      intents.push("block_info");
    }

    // Balance queries
    if (lowerMessage.includes("balance") || lowerMessage.includes("how much")) {
      intents.push("balance");
    }

    // Fee queries
    if (lowerMessage.includes("fee") || lowerMessage.includes("gas") || lowerMessage.includes("sat/vb")) {
      intents.push("fee_estimate");
    }

    // Token queries
    if (lowerMessage.includes("brc20") || lowerMessage.includes("token")) {
      intents.push("brc20_info");
    }

    // Inscription queries
    if (lowerMessage.includes("inscription") || lowerMessage.includes("ordinal")) {
      intents.push("inscription_info");
    }

    // Transfer/send queries
    if (lowerMessage.includes("transfer") || lowerMessage.includes("send")) {
      intents.push("transfer");
    }

    return intents;
  }
}
