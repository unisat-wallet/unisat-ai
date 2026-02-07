/**
 * Anthropic Client
 * Wraps Anthropic API for chat with streaming support
 */

import Anthropic from "@anthropic-ai/sdk";
import { config } from "../config/index.js";
import type { ChatMessage } from "../types/index.js";
import { anthropicTools } from "../mcp/tool-adapter.js";

export interface AnthropicMessage {
  role: "user" | "assistant";
  content: Array<
    | { type: "text"; text: string }
    | {
        type: "tool_use";
        id: string;
        name: string;
        input: Record<string, unknown>;
      }
    | {
        type: "tool_result";
        tool_use_id: string;
        content?: string;
        is_error?: boolean;
      }
  >;
}

export interface StreamChunk {
  type: "text" | "tool_use" | "tool_use_start" | "done";
  content?: string;
  toolUse?: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  };
}

export class AnthropicClient {
  private readonly client: Anthropic;
  private readonly model: string;
  private readonly maxTokens: number;

  constructor() {
    if (!config.anthropicApiKey) {
      throw new Error("Anthropic API key is required when using anthropic provider");
    }

    const clientConfig: {
      apiKey: string;
      baseURL?: string;
    } = {
      apiKey: config.anthropicApiKey,
    };

    // Add custom base URL if provided (for proxies/alternative endpoints)
    if (config.anthropicBaseURL) {
      clientConfig.baseURL = config.anthropicBaseURL;
    }

    console.log("Anthropic Client Config:", clientConfig);
    this.client = new Anthropic(clientConfig);
    this.model = config.anthropicModel ?? "claude-3-5-sonnet-20241022";
    this.maxTokens = config.anthropicMaxTokens ?? 4096;
  }

  /**
   * Convert chat messages to Anthropic format
   */
  private toAnthropicMessages(messages: ChatMessage[]): AnthropicMessage[] {
    const anthropicMessages: AnthropicMessage[] = [];

    console.log(`[AnthropicClient] === toAnthropicMessages ===`);
    console.log(`[AnthropicClient] Input messages: ${messages.length}`);

    for (const msg of messages) {
      if (msg.role === "system") {
        console.log(`[AnthropicClient] Skipping system message`);
        continue; // System messages handled separately
      }

      const content: AnthropicMessage["content"] = [];

      console.log(`[AnthropicClient] Processing ${msg.role} message (id: ${msg.id})`);
      console.log(`[AnthropicClient] Message content length: ${msg.content?.length || 0}`);
      console.log(`[AnthropicClient] Has toolCalls: ${!!msg.toolCalls} (${msg.toolCalls?.length || 0})`);
      console.log(`[AnthropicClient] Has toolResults: ${!!msg.toolResults} (${msg.toolResults?.length || 0})`);

      // Add text content (only if not empty or if there are no tool results)
      if (msg.content && msg.content.trim()) {
        content.push({ type: "text", text: msg.content });
        console.log(`[AnthropicClient] Added text content (length: ${msg.content.length})`);
      } else if (!msg.toolResults) {
        // If no content and no tool results, add minimal text to avoid API errors
        content.push({ type: "text", text: msg.content || "" });
        console.log(`[AnthropicClient] Added empty text content (no tool results)`);
      } else {
        console.log(`[AnthropicClient] Skipping empty text content (has tool results)`);
      }

      // Add tool uses from assistant messages
      if (msg.toolCalls) {
        for (const toolCall of msg.toolCalls) {
          if (toolCall.status === "completed") {
            content.push({
              type: "tool_use",
              id: toolCall.id,
              name: toolCall.name,
              input: toolCall.arguments,
            });
            console.log(`[AnthropicClient] Added tool_use: ${toolCall.name}`);
          }
        }
      }

      // Add tool results from user messages
      if (msg.toolResults) {
        for (const result of msg.toolResults) {
          const resultContent = result.error ?? JSON.stringify(result.result);
          content.push({
            type: "tool_result",
            tool_use_id: result.toolCallId,
            content: resultContent,
            is_error: !!result.error,
          });
          console.log(`[AnthropicClient] Added tool_result for ${result.toolCallId}, error: ${!!result.error}`);
        }
      }

      anthropicMessages.push({
        role: msg.role,
        content,
      });

      console.log(`[AnthropicClient] Final content items: ${content.length}`);
    }

    console.log(`[AnthropicClient] Output Anthropic messages: ${anthropicMessages.length}`);
    console.log(`[AnthropicClient] === toAnthropicMessages END ===`);

    return anthropicMessages;
  }

  /**
   * Get system message from chat history
   */
  private getSystemMessage(messages: ChatMessage[]): string | undefined {
    const systemMsg = messages.find((m) => m.role === "system");
    return systemMsg?.content;
  }

  /**
   * Create a streaming chat completion
   */
  async *streamChat(
    messages: ChatMessage[],
    onToolUse?: (
      toolId: string,
      name: string,
      input: Record<string, unknown>,
    ) => void,
  ): AsyncGenerator<StreamChunk> {
    const anthropicMessages = this.toAnthropicMessages(messages);
    const systemMessage = this.getSystemMessage(messages);

    console.log(`[AnthropicClient] === streamChat START ===`);
    console.log(`[AnthropicClient] Model: ${this.model}`);
    console.log(`[AnthropicClient] Max tokens: ${this.maxTokens}`);
    console.log(`[AnthropicClient] System message length: ${systemMessage?.length || 0}`);
    console.log(`[AnthropicClient] Number of messages: ${anthropicMessages.length}`);
    console.log(`[AnthropicClient] Messages:`, JSON.stringify(anthropicMessages, null, 2).substring(0, 800));

    // Check for empty messages
    if (anthropicMessages.length === 0) {
      console.error(`[AnthropicClient] ERROR: No messages to send!`);
      yield { type: "done" };
      return;
    }

    try {
      const stream = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemMessage,
        messages: anthropicMessages,
        tools: anthropicTools,
        stream: true,
      });

      console.log(`[AnthropicClient] API call initiated, waiting for stream...`);

      let currentToolUse:
        | { id: string; name: string; input: Record<string, unknown> }
        | undefined;
      let currentInput = "";
      let eventCount = 0;
      let textYielded = false;

      for await (const event of stream) {
        eventCount++;
        console.log(`[AnthropicClient] Event ${eventCount}:`, event.type);

        switch (event.type) {
          case "content_block_delta":
            if (event.delta.type === "text_delta") {
              textYielded = true;
              console.log(`[AnthropicClient] Text delta: "${event.delta.text?.substring(0, 50)}..."`);
              yield {
                type: "text",
                content: event.delta.text,
              };
            }
            break;

          case "content_block_start":
            console.log(`[AnthropicClient] Content block start:`, event.content_block.type);
            if (event.content_block.type === "tool_use") {
              currentToolUse = {
                id: event.content_block.id,
                name: event.content_block.name,
                input: {},
              };
              currentInput = "";
              console.log(`[AnthropicClient] Tool use started: ${event.content_block.name}`);
              yield {
                type: "tool_use_start",
                toolUse: currentToolUse,
              };
            }
            break;

          case "content_block_delta":
            if (event.delta.type === "input_json_delta" && currentToolUse) {
              // Access partial JSON from delta
              const delta = event.delta as { partial_json?: string };
              currentInput += delta.partial_json ?? "";
              try {
                currentToolUse.input = JSON.parse(currentInput);
              } catch {
                // Partial JSON, keep accumulating
              }
            }
            break;

          case "content_block_stop":
            if (currentToolUse) {
              console.log(`[AnthropicClient] Tool use stopped: ${currentToolUse.name}`);
              // Notify callback for tool execution
              if (onToolUse) {
                onToolUse(
                  currentToolUse.id,
                  currentToolUse.name,
                  currentToolUse.input,
                );
              }
              yield {
                type: "tool_use",
                toolUse: currentToolUse,
              };
              currentToolUse = undefined;
              currentInput = "";
            }
            break;

          case "message_stop":
            console.log(`[AnthropicClient] === Message stop received ===`);
            yield { type: "done" };
            break;

          default:
            console.log(`[AnthropicClient] Unhandled event type:`, event.type);
        }
      }

      console.log(`[AnthropicClient] === Stream ended (total events: ${eventCount}) ===`);
      console.log(`[AnthropicClient] Text yielded: ${textYielded}`);

      // Safety check: if message_stop wasn't received but stream ended, yield done
      const lastEvent = eventCount > 0 ? true : false;
      if (!textYielded && !currentToolUse) {
        console.log(`[AnthropicClient] WARNING: No text yielded and no tool use, yielding done`);
        yield { type: "done" };
      }
    } catch (error) {
      console.error(`[AnthropicClient] === ERROR in streamChat ===`);
      console.error(`[AnthropicClient] Error:`, error);
      console.error(`[AnthropicClient] Error message:`, error instanceof Error ? error.message : String(error));
      console.error(`[AnthropicClient] Stack trace:`, error instanceof Error ? error.stack : 'No stack trace');

      if (error instanceof Error) {
        throw new Error(`Anthropic API error: ${error.message}`);
      }
      throw new Error("Unknown Anthropic API error");
    }

    console.log(`[AnthropicClient] === streamChat END ===`);
  }

  /**
   * Create a non-streaming chat completion
   */
  async chat(messages: ChatMessage[]): Promise<{
    content: string;
    toolUses?: Array<{
      id: string;
      name: string;
      input: Record<string, unknown>;
    }>;
  }> {
    const anthropicMessages = this.toAnthropicMessages(messages);
    const systemMessage = this.getSystemMessage(messages);

    try {
      const response = await this.client.messages.create({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemMessage,
        messages: anthropicMessages,
        tools: anthropicTools,
      });

      const content: string[] = [];
      const toolUses: Array<{
        id: string;
        name: string;
        input: Record<string, unknown>;
      }> = [];

      for (const block of response.content) {
        if (block.type === "text") {
          content.push(block.text);
        } else if (block.type === "tool_use") {
          toolUses.push({
            id: block.id,
            name: block.name,
            input: block.input as Record<string, unknown>,
          });
        }
      }

      return {
        content: content.join("\n"),
        toolUses: toolUses.length > 0 ? toolUses : undefined,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Anthropic API error: ${error.message}`);
      }
      throw new Error("Unknown Anthropic API error");
    }
  }

  /**
   * Get available tools
   */
  getTools(): typeof anthropicTools {
    return anthropicTools;
  }
}
