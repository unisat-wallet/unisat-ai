/**
 * OpenAI Client (using LangChain)
 * Supports OpenAI-compatible APIs (including DashScope/Qwen, GLM)
 */

import { ChatOpenAI } from "@langchain/openai";
import { config } from "../config/index.js";
import type { ChatMessage } from "../types/index.js";
import { anthropicTools } from "../mcp/tool-adapter.js";
import OpenAI from "openai";

export interface StreamChunk {
  type: "text" | "tool_use" | "tool_use_start" | "done";
  content?: string;
  toolUse?: {
    id: string;
    name: string;
    input: Record<string, unknown>;
  };
}

export class OpenAIClient {
  private readonly llm: ChatOpenAI;
  private readonly client: OpenAI; // Native OpenAI client for tool calls
  public readonly model: string;
  public readonly maxTokens: number;

  constructor() {
    if (!config.openaiApiKey) {
      throw new Error("OpenAI API key is required when using openai provider");
    }

    const llmConfig: {
      openAIApiKey: string;
      modelName: string;
      maxTokens?: number;
      temperature?: number;
      configuration?: {
        baseURL?: string;
      };
    } = {
      openAIApiKey: config.openaiApiKey,
      modelName: config.openaiModel!,
      maxTokens: config.openaiMaxTokens,
      temperature: 0.7,
    };

    // Add custom base URL if provided
    if (config.openaiBaseURL) {
      llmConfig.configuration = {
        baseURL: config.openaiBaseURL,
      };
    }

    this.llm = new ChatOpenAI(llmConfig);

    // Also create native OpenAI client for proper tool call handling
    this.client = new OpenAI({
      apiKey: config.openaiApiKey,
      baseURL: config.openaiBaseURL,
    });

    this.model = config.openaiModel!;
    this.maxTokens = config.openaiMaxTokens!;
  }

  /**
   * Convert chat messages to LangChain message format
   */
  private toLangChainMessages(messages: ChatMessage[]): BaseMessage[] {
    const lcMessages: BaseMessage[] = [];

    console.log("[OpenAIClient] toLangChainMessages, input messages:", messages.length);

    for (const msg of messages) {
      if (msg.role === "system") {
        lcMessages.push(new SystemMessage(msg.content));
        continue;
      }

      if (msg.role === "user") {
        let content = msg.content;

        // Add tool results as part of the message content (for OpenAI)
        if (msg.toolResults && msg.toolResults.length > 0) {
          const toolResultsText = msg.toolResults
            .map((tr) => {
              if (tr.error) {
                return `Tool ${tr.toolCallId} failed: ${tr.error}`;
              }
              return `Tool ${tr.toolCallId} returned: ${JSON.stringify(tr.result)}`;
            })
            .join("\n\n");
          content = `${content}\n\n${toolResultsText}`;
        }

        lcMessages.push(new HumanMessage(content));
      } else if (msg.role === "assistant") {
        // Check if this assistant message has tool calls
        if (msg.toolCalls && msg.toolCalls.length > 0) {
          // Create AIMessage with tool calls - pass as AIMessageFields object
          const toolCalls = msg.toolCalls.map(tc => ({
            id: tc.id,
            name: tc.name,
            args: tc.arguments,
          }));
          lcMessages.push(new AIMessage({
            content: msg.content,
            tool_calls: toolCalls,
          }));
          console.log("[OpenAIClient] Added AIMessage with tool calls:", toolCalls);
        } else {
          lcMessages.push(new AIMessage(msg.content));
        }
      }
    }

    console.log("[OpenAIClient] Converted to", lcMessages.length, "LangChain messages");
    return lcMessages;
  }

  /**
   * Convert Anthropic tools to OpenAI format
   */
  private convertToolsToOpenAI() {
    return anthropicTools.map((tool) => ({
      type: "function" as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.input_schema,
      },
    }));
  }

  /**
   * Create a streaming chat completion
   * For tool calling support, we first make a non-streaming call to check for tool calls
   */
  async *streamChat(
    messages: ChatMessage[],
    onToolUse?: (toolId: string, name: string, input: Record<string, unknown>) => void
  ): AsyncGenerator<StreamChunk> {
    console.log("[OpenAIClient] Starting streamChat with", messages.length, "messages");

    // Check if this is GLM model
    const isGLM = this.model.toLowerCase().includes("glm");
    console.log("[OpenAIClient] Model:", this.model, "isGLM:", isGLM);

    // Convert messages to OpenAI format
    const apiMessages: Array<{
      role: "system" | "user" | "assistant" | "tool";
      content?: string;
      tool_calls?: any[];
      tool_call_id?: string;
    }> = [];

    for (const msg of messages) {
      console.log("[OpenAIClient] Processing message:", msg.role, "content length:", msg.content?.length, "toolResults:", msg.toolResults?.length, "toolCalls:", msg.toolCalls?.length);

      if (msg.role === "system") {
        if (msg.content) {
          apiMessages.push({ role: "system", content: msg.content });
        }
      } else if (msg.role === "user") {
        let userContent = msg.content || "";

        // For GLM with tool results, also include the user's original request in the prompt
        if (isGLM && msg.toolResults && msg.toolResults.length > 0) {
          // GLM: Use standard OpenAI "tool" message format instead of embedding in user content
          // First add the user content (original question + prompt for response)
          if (userContent.trim()) {
            apiMessages.push({ role: "user", content: userContent });
          }

          // Then add tool results as separate "tool" messages
          for (const tr of msg.toolResults) {
            if (tr.error) {
              apiMessages.push({
                role: "tool",
                content: `Error: ${tr.error}`,
                tool_call_id: tr.toolCallId,
              });
            } else {
              apiMessages.push({
                role: "tool",
                content: JSON.stringify(tr.result),
                tool_call_id: tr.toolCallId,
              });
            }
          }
        } else {
          // Regular user message (no tool results)
          if (userContent.trim()) {
            apiMessages.push({ role: "user", content: userContent });
          } else {
            console.log("[OpenAIClient] Skipping empty user message");
          }
        }
      } else if (msg.role === "assistant") {
        // GLM: assistant messages MUST have non-empty content when tool_calls are present
        let assistantContent = msg.content || "";

        // If we have tool calls but no content, add a placeholder for GLM
        if (isGLM && !assistantContent.trim() && msg.toolCalls && msg.toolCalls.length > 0) {
          assistantContent = "I'll help you with that.";
        }

        // If still no content and no tool calls, skip this message
        if (!assistantContent.trim() && (!msg.toolCalls || msg.toolCalls.length === 0)) {
          console.log("[OpenAIClient] Skipping empty assistant message without tool calls");
          continue;
        }

        const apiMsg: { role: "assistant"; content: string; tool_calls?: any[] } = {
          role: "assistant",
          content: assistantContent,
        };

        if (msg.toolCalls && msg.toolCalls.length > 0) {
          apiMsg.tool_calls = msg.toolCalls.map(tc => ({
            id: tc.id,
            type: "function" as const,
            function: {
              name: tc.name,
              arguments: JSON.stringify(tc.arguments),
            },
          }));
        }

        apiMessages.push(apiMsg);
      }
    }

    console.log("[OpenAIClient] API messages count:", apiMessages.length);
    for (let i = 0; i < apiMessages.length; i++) {
      const msg = apiMessages[i];
      console.log(`[OpenAIClient] Message ${i}: role=${msg.role}, content_length=${msg.content?.length || 0}, has_tool_calls=${!!msg.tool_calls}, tool_call_id=${msg.tool_call_id || 'none'}`);
    }

    const tools = this.convertToolsToOpenAI();
    console.log("[OpenAIClient] Tools:", JSON.stringify(tools).slice(0, 500));

    try {
      // Build request parameters
      const requestBody: any = {
        model: this.model,
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: this.maxTokens,
      };

      // Add tools parameter
      if (tools && tools.length > 0) {
        requestBody.tools = tools;
      }

      console.log("[OpenAIClient] Request:", {
        model: requestBody.model,
        messages_count: requestBody.messages.length,
        has_tools: !!requestBody.tools,
      });

      // First, make a non-streaming call to check for tool calls
      const response = await this.client.chat.completions.create(requestBody);

      console.log("[OpenAIClient] Response:", {
        finish_reason: response.choices[0]?.finish_reason,
        content: response.choices[0]?.message?.content?.slice(0, 200),
        tool_calls: response.choices[0]?.message?.tool_calls,
      });

      const message = response.choices[0]?.message;
      const content = message?.content || "";
      const toolCalls = message?.tool_calls;

      // Stream the content if present
      if (content) {
        // Simulate streaming by yielding chunks
        const words = content.split(/(?=\s)/); // Split while keeping delimiters
        for (const word of words) {
          yield {
            type: "text" as const,
            content: word,
          };
          // Small delay to simulate streaming
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      // Handle tool calls
      if (toolCalls && toolCalls.length > 0) {
        console.log("[OpenAIClient] Processing", toolCalls.length, "tool calls");
        for (const tc of toolCalls) {
          if (tc.type === "function" && tc.function) {
            const toolCall = {
              id: tc.id,
              name: tc.function.name,
              input: typeof tc.function.arguments === "string"
                ? JSON.parse(tc.function.arguments)
                : tc.function.arguments,
            };
            console.log("[OpenAIClient] Yielding tool_use:", toolCall);
            yield {
              type: "tool_use" as const,
              toolUse: toolCall,
            };
          }
        }
      }

      console.log("[OpenAIClient] Yielding done");
      yield { type: "done" as const };
    } catch (error) {
      console.error("[OpenAIClient] Error:", error);
      if (error instanceof Error) {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
      throw new Error("Unknown OpenAI API error");
    }
  }

  /**
   * Create a non-streaming chat completion
   */
  async chat(messages: ChatMessage[]): Promise<{
    content: string;
    toolUses?: Array<{ id: string; name: string; input: Record<string, unknown> }>;
  }> {
    const lcMessages = this.toLangChainMessages(messages);

    try {
      const response = await this.llm.invoke(lcMessages, {
        tools: this.convertToolsToOpenAI(),
      });

      const content = response.content.toString();

      return {
        content,
        toolUses: undefined,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`OpenAI API error: ${error.message}`);
      }
      throw new Error("Unknown OpenAI API error");
    }
  }

  /**
   * Get available tools in OpenAI format
   */
  getTools() {
    return this.convertToolsToOpenAI();
  }
}

// Re-export LangChain types
import { BaseMessage, HumanMessage, SystemMessage, AIMessage } from "@langchain/core/messages";
