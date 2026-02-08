/**
 * AgentKit Client
 * Client for BytePlus AgentKit Runtime
 */

import { config } from "../config/index.js";

export interface AgentKitMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AgentKitResponse {
  session_id: string;
  message: string;
  tool_calls?: Array<{
    name: string;
    arguments: Record<string, unknown>;
    result?: unknown;
  }>;
}

export class AgentKitClient {
  private readonly baseURL: string;
  private readonly apiKey: string;

  constructor() {
    if (!config.agentKitBaseURL) {
      throw new Error("AgentKit base URL is required");
    }
    if (!config.agentKitApiKey) {
      throw new Error("AgentKit API key is required");
    }

    this.baseURL = config.agentKitBaseURL;
    this.apiKey = config.agentKitApiKey;
  }

  /**
   * Stream chat with AgentKit Runtime using SSE
   */
  async *streamChat(
    messages: AgentKitMessage[],
    sessionId: string,
  ): AsyncGenerator<{
    type: "text" | "tool_use" | "done";
    content?: string;
    toolUse?: {
      id: string;
      name: string;
      input: Record<string, unknown>;
    };
  }> {
    const lastUserMessage = messages.filter((m) => m.role === "user").pop();
    if (!lastUserMessage) {
      throw new Error("No user message found");
    }

    console.log(`[AgentKitClient] Sending message to AgentKit Runtime`);
    console.log(`[AgentKitClient] URL: ${this.baseURL}`);
    console.log(`[AgentKitClient] Session: ${sessionId}`);
    console.log(`[AgentKitClient] Message: ${lastUserMessage.content}`);

    const response = await fetch(`${this.baseURL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        session_id: sessionId,
        messages: [
          {
            role: "user",
            content: lastUserMessage.content,
          },
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[AgentKitClient] Error response: ${errorText}`);
      throw new Error(`AgentKit API error: ${response.status} ${errorText}`);
    }

    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();

            if (data === "[DONE]") {
              yield { type: "done" };
              return;
            }

            try {
              const parsed = JSON.parse(data);

              // Handle different event types from AgentKit
              if (parsed.choices?.[0]?.delta?.content) {
                yield {
                  type: "text",
                  content: parsed.choices[0].delta.content,
                };
              } else if (parsed.choices?.[0]?.delta?.tool_calls) {
                for (const toolCall of parsed.choices[0].delta.tool_calls) {
                  yield {
                    type: "tool_use",
                    toolUse: {
                      id: toolCall.id || `tool_${Date.now()}`,
                      name: toolCall.function?.name || "unknown",
                      input: toolCall.function?.arguments
                        ? JSON.parse(toolCall.function.arguments)
                        : {},
                    },
                  };
                }
              } else if (parsed.event === "tool_call") {
                yield {
                  type: "tool_use",
                  toolUse: {
                    id: parsed.data?.id || `tool_${Date.now()}`,
                    name: parsed.data?.name || "unknown",
                    input: parsed.data?.arguments || {},
                  },
                };
              } else if (parsed.event === "message" && parsed.data?.content) {
                yield {
                  type: "text",
                  content: parsed.data.content,
                };
              }
            } catch (e) {
              // Skip invalid JSON lines
              console.log(`[AgentKitClient] Skipping non-JSON line: ${data}`);
            }
          }
        }
      }

      yield { type: "done" };
    } finally {
      reader.releaseLock();
    }
  }
}
