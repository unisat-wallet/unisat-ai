/**
 * Chat Service
 * Orchestrates chat interactions with AI providers and UniSat tools
 */

import { AnthropicClient } from "./anthropic-client.js";
import { OpenAIClient } from "./openai-client.js";
import { ToolAdapter } from "../mcp/tool-adapter.js";
import { ContextBuilder } from "./context-builder.js";
import { ResponseFormatter } from "./response-formatter.js";
import { config } from "../config/index.js";
import type { ChatMessage, ToolCall, ToolResult } from "../types/index.js";

export interface ChatServiceOptions {
  sessionId: string;
  history?: ChatMessage[];
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

/**
 * Common interface for AI clients
 */
interface AIClient {
  streamChat(
    messages: ChatMessage[],
    onToolUse?: (
      toolId: string,
      name: string,
      input: Record<string, unknown>,
    ) => void,
  ): AsyncGenerator<{
    type: "text" | "tool_use" | "tool_use_start" | "done";
    content?: string;
    toolUse?: {
      id: string;
      name: string;
      input: Record<string, unknown>;
    };
  }>;
}

export class ChatService {
  private readonly aiClient: AIClient;
  private readonly toolAdapter: ToolAdapter;
  private readonly contextBuilder: ContextBuilder;
  private readonly formatter: ResponseFormatter;
  private readonly sessions = new Map<string, ChatMessage[]>();

  constructor() {
    // Initialize the appropriate AI client based on config
    if (config.aiProvider === "openai") {
      console.log("Using OpenAI provider");
      this.aiClient = new OpenAIClient() as AIClient;
    } else {
      console.log("Using Anthropic provider");
      this.aiClient = new AnthropicClient() as AIClient;
    }

    this.toolAdapter = new ToolAdapter(config.unisatApiKey);
    this.contextBuilder = new ContextBuilder();
    this.formatter = new ResponseFormatter();
  }

  /**
   * Generate a unique step ID
   */
  private generateStepId(): string {
    return `step_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Create an interaction step
   */
  private createStep(
    type: InteractionStepType,
    title: string,
    description?: string,
    details?: Record<string, unknown>,
    toolCall?: ToolCall,
  ): InteractionStep {
    return {
      id: this.generateStepId(),
      type,
      timestamp: Date.now(),
      title,
      description,
      details,
      toolCall,
    };
  }

  /**
   * Get or create session history
   */
  private getSession(sessionId: string): ChatMessage[] {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, []);
    }
    return this.sessions.get(sessionId)!;
  }

  /**
   * Add message to session
   */
  private addToSession(sessionId: string, message: ChatMessage): void {
    const history = this.getSession(sessionId);
    history.push(message);

    // Keep only last 50 messages per session
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
  }

  /**
   * Process a chat message with streaming
   */
  async *processMessage(
    userMessage: string,
    options: ChatServiceOptions,
  ): AsyncGenerator<{
    type: "text" | "tool_call" | "tool_result" | "done" | "error" | "step";
    content?: string;
    toolCall?: ToolCall;
    message?: ChatMessage;
    step?: InteractionStep;
  }> {
    const startTime = Date.now();
    const history = this.getSession(options.sessionId);

    console.log(`[ChatService] === processMessage START ===`);
    console.log(`[ChatService] sessionId: ${options.sessionId}`);
    console.log(`[ChatService] userMessage: "${userMessage}"`);
    console.log(`[ChatService] history length: ${history.length}`);

    // Emit user message step
    yield {
      type: "step",
      step: this.createStep(
        "user_message",
        "Your message",
        undefined,
        { message: userMessage },
      ),
    };

    // Emit AI thinking step
    yield {
      type: "step",
      step: this.createStep(
        "ai_thinking",
        "AI is thinking",
        "Understanding your request and planning the response...",
      ),
    };

    // Build context
    const context = this.contextBuilder.buildContext(userMessage, history);
    console.log(`[ChatService] context messages count: ${context.length}`);
    console.log(
      `[ChatService] context:`,
      JSON.stringify(context, null, 2).substring(0, 500),
    );

    // Add user message to session
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content: userMessage,
      timestamp: Date.now(),
    };
    this.addToSession(options.sessionId, userMsg);

    // Stream response
    let assistantContent = "";
    let toolCalls: ToolCall[] = [];
    let chunkCount = 0;

    try {
      console.log(
        `[ChatService] Starting streamChat with ${config.aiProvider} provider...`,
      );
      console.log(
        `[ChatService] Model: ${config.aiProvider === "openai" ? config.openaiModel : config.anthropicModel}`,
      );

      for await (const chunk of this.aiClient.streamChat(context)) {
        chunkCount++;
        console.log(`[ChatService] === Chunk ${chunkCount} ===`);
        console.log(`[ChatService] Chunk type:`, chunk.type);

        if (chunk.type === "text") {
          assistantContent += chunk.content;
          console.log(
            `[ChatService] Text chunk (length: ${chunk.content?.length}):`,
            chunk.content?.substring(0, 100),
          );
          yield {
            type: "text",
            content: chunk.content,
          };
        } else if (chunk.type === "tool_use") {
          console.log(`[ChatService] Tool use chunk:`, chunk.toolUse);

          // Emit planning step for first tool use
          if (toolCalls.length === 0) {
            yield {
              type: "step",
              step: this.createStep(
                "ai_planning",
                "AI is planning",
                "Deciding which tools to use to gather information...",
              ),
            };
          }

          const toolCall: ToolCall = {
            id: chunk.toolUse!.id,
            name: chunk.toolUse!.name,
            arguments: chunk.toolUse!.input,
            status: "pending",
          };
          toolCalls.push(toolCall);

          // Emit tool calling step
          yield {
            type: "step",
            step: this.createStep(
              "tool_calling",
              `Calling tool: ${toolCall.name}`,
              undefined,
              { toolName: toolCall.name, args: toolCall.arguments },
              toolCall,
            ),
          };

          yield {
            type: "tool_call",
            toolCall,
          };

          // Emit tool executing step
          yield {
            type: "step",
            step: this.createStep(
              "tool_executing",
              `Executing: ${toolCall.name}`,
              "Fetching data from the blockchain...",
              { toolName: toolCall.name },
              toolCall,
            ),
          };

          // Execute tool
          try {
            console.log(
              `[ChatService] Executing tool: ${toolCall.name} with args:`,
              toolCall.arguments,
            );
            const result = await this.toolAdapter.executeTool(
              toolCall.name,
              toolCall.arguments,
            );
            toolCall.status = "completed";
            toolCall.result = result;
            console.log(
              `[ChatService] Tool ${toolCall.name} completed successfully`,
            );

            // Emit tool completed step
            yield {
              type: "step",
              step: this.createStep(
                "tool_completed",
                `Completed: ${toolCall.name}`,
                "Data retrieved successfully",
                { toolName: toolCall.name },
                toolCall,
              ),
            };

            yield {
              type: "tool_result",
              toolCall,
            };
          } catch (error) {
            console.error(`[ChatService] Tool ${toolCall.name} failed:`, error);
            toolCall.status = "failed";
            toolCall.error =
              error instanceof Error ? error.message : String(error);

            yield {
              type: "tool_result",
              toolCall,
            };
          }
        } else if (chunk.type === "done") {
          console.log(`[ChatService] Received 'done' chunk, breaking stream`);
          break;
        }
      }

      console.log(`[ChatService] Stream ended with ${chunkCount} chunks`);
      console.log(`[ChatService] toolCalls.length: ${toolCalls.length}`);
      console.log(
        `[ChatService] assistantContent length: ${assistantContent.length}`,
      );

      // If tools were called, continue the conversation
      if (toolCalls.length > 0) {
        console.log(`[ChatService] === Handling tool results ===`);

        // Emit processing results step
        yield {
          type: "step",
          step: this.createStep(
            "processing_results",
            "AI is analyzing results",
            `Processing data from ${toolCalls.length} tool call${toolCalls.length > 1 ? "s" : ""}...`,
          ),
        };

        const toolResults: ToolResult[] = toolCalls.map((tc) => ({
          toolCallId: tc.id,
          result: tc.result,
          error: tc.error,
        }));

        // Add assistant message with tool calls
        const assistantMsg: ChatMessage = {
          id: `assistant_${Date.now()}`,
          role: "assistant",
          content: assistantContent || this.formatter.formatThinking(),
          timestamp: Date.now(),
          toolCalls,
          metadata: {
            model:
              config.aiProvider === "openai"
                ? config.openaiModel!
                : config.anthropicModel!,
            latency: Date.now() - startTime,
          },
        };
        this.addToSession(options.sessionId, assistantMsg);

        // Add user message with tool results
        // Note: Some providers (like GLM) require non-empty content in user messages
        // Build a more explicit prompt for GLM to encourage a response
        let toolResultsContent = "Based on the tool results above, please provide a helpful response to the user. ";

        // For GLM, add more context about what to do
        if (config.aiProvider === "openai" && config.openaiModel?.toLowerCase().includes("glm")) {
          toolResultsContent = "请根据以上工具调用的结果，用中文回答用户的原始问题。请直接提供答案，不要说\"根据结果\"之类的话。";
        }

        const toolResultsMsg: ChatMessage = {
          id: `tool_results_${Date.now()}`,
          role: "user",
          content: toolResultsContent,
          timestamp: Date.now(),
          toolResults,
        };
        this.addToSession(options.sessionId, toolResultsMsg);

        // Get final response after tool execution
        console.log(`[ChatService] Building final context for tool results...`);
        const finalContext = this.contextBuilder.buildContext("", history);
        console.log(
          `[ChatService] Final context messages count: ${finalContext.length}`,
        );

        // Check if finalContext has valid messages
        const hasValidUserMessages = finalContext.some(
          (m) => m.role === "user" && m.content.trim() !== "",
        );
        if (!hasValidUserMessages) {
          console.log(
            `[ChatService] WARNING: Final context has no valid user messages!`,
          );
          console.log(
            `[ChatService] Final context:`,
            JSON.stringify(finalContext, null, 2).substring(0, 500),
          );
        }

        let finalContent = "";
        let finalChunkCount = 0;

        console.log(
          `[ChatService] Starting final streamChat for tool results...`,
        );

        // Emit AI responding step
        yield {
          type: "step",
          step: this.createStep(
            "ai_responding",
            "AI is responding",
            "Generating a response based on the retrieved data...",
          ),
        };

        for await (const chunk of this.aiClient.streamChat(finalContext)) {
          finalChunkCount++;
          console.log(
            `[ChatService] Final chunk ${finalChunkCount}, type:`,
            chunk.type,
          );

          if (chunk.type === "text") {
            finalContent += chunk.content;
            yield {
              type: "text",
              content: chunk.content,
            };
          } else if (chunk.type === "done") {
            console.log(`[ChatService] Final stream received 'done'`);
            break;
          }
        }

        console.log(
          `[ChatService] Final stream ended with ${finalChunkCount} chunks`,
        );
        console.log(
          `[ChatService] Final content length: ${finalContent.length}`,
        );

        // If final content is empty (some models like GLM may not respond), add a default message
        if (!finalContent.trim()) {
          console.log(`[ChatService] WARNING: Final content is empty, adding default message`);
          // Try to extract info from tool results for a better response
          const toolResultInfo = toolCalls.map(tc => {
            const result = tc.result;
            if (typeof result === 'object' && result !== null) {
              // Try to find meaningful data
              const dataStr = JSON.stringify(result).substring(0, 200);
              return `Tool ${tc.name} returned: ${dataStr}`;
            }
            return `Tool ${tc.name} executed successfully`;
          }).join('\n\n');

          finalContent = `I've retrieved the information you requested.\n\n${toolResultInfo}\n\nIs there anything else you'd like to know?`;

          // Yield the generated content
          yield {
            type: "text",
            content: finalContent,
          };
        }

        // Add final assistant message
        const finalMsg: ChatMessage = {
          id: `assistant_final_${Date.now()}`,
          role: "assistant",
          content: finalContent,
          timestamp: Date.now(),
          metadata: {
            model:
              config.aiProvider === "openai"
                ? config.openaiModel!
                : config.anthropicModel!,
            latency: Date.now() - startTime,
          },
        };
        this.addToSession(options.sessionId, finalMsg);

        // Emit response complete step
        yield {
          type: "step",
          step: this.createStep(
            "response_complete",
            "Response complete",
            undefined,
            { latency: Date.now() - startTime },
          ),
        };

        console.log(`[ChatService] Yielding final 'done' with message`);
        yield {
          type: "done",
          message: finalMsg,
        };
      } else {
        // No tools were called, just return the assistant message
        console.log(
          `[ChatService] No tools called, returning assistant message`,
        );

        // Emit AI responding step (no tools were used)
        yield {
          type: "step",
          step: this.createStep(
            "ai_responding",
            "AI is responding",
            "Generating a response...",
          ),
        };

        const assistantMsg: ChatMessage = {
          id: `assistant_${Date.now()}`,
          role: "assistant",
          content: assistantContent,
          timestamp: Date.now(),
          metadata: {
            model:
              config.aiProvider === "openai"
                ? config.openaiModel!
                : config.anthropicModel!,
            latency: Date.now() - startTime,
          },
        };
        this.addToSession(options.sessionId, assistantMsg);

        // Emit response complete step
        yield {
          type: "step",
          step: this.createStep(
            "response_complete",
            "Response complete",
            undefined,
            { latency: Date.now() - startTime },
          ),
        };

        console.log(`[ChatService] Yielding 'done' with assistant message`);
        yield {
          type: "done",
          message: assistantMsg,
        };
      }

      console.log(
        `[ChatService] === processMessage completed successfully ===`,
      );
    } catch (error) {
      console.error(`[ChatService] === ERROR in processMessage ===`);
      console.error(`[ChatService] Error:`, error);
      console.error(
        `[ChatService] Error message:`,
        error instanceof Error ? error.message : String(error),
      );
      console.error(
        `[ChatService] Stack trace:`,
        error instanceof Error ? error.stack : "No stack trace",
      );
      yield {
        type: "error",
        content: this.formatter.formatError(
          error instanceof Error ? error : String(error),
        ),
      };
    }

    console.log(
      `[ChatService] === processMessage END (total chunks: ${chunkCount}) ===`,
    );
  }

  /**
   * Get session history
   */
  getHistory(sessionId: string): ChatMessage[] {
    return this.getSession(sessionId);
  }

  /**
   * Clear session history
   */
  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Get all active sessions
   */
  getSessions(): string[] {
    return Array.from(this.sessions.keys());
  }
}
