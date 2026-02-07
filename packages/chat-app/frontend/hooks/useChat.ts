/**
 * useChat Hook
 * React hook for chat functionality
 */

"use client";

import { useState, useCallback, useRef } from "react";
import type { ChatMessage, ChatStreamEvent, ToolCall, InteractionStep } from "@/types";
import { generateSessionId as createSessionId, SESSION_STORAGE_KEY } from "@/lib/constants";

// Local helper to avoid naming conflict
function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SESSION_STORAGE_KEY);
}

function saveSessionId(id: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_STORAGE_KEY, id);
}

export function useChat(sessionId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<string>("");
  const [activeToolCalls, setActiveToolCalls] = useState<ToolCall[]>([]);
  // Track ALL tool calls history for the Tool Panel
  const [allToolCalls, setAllToolCalls] = useState<ToolCall[]>([]);
  // Track interaction steps for the Tool Panel
  const [interactionSteps, setInteractionSteps] = useState<InteractionStep[]>([]);
  const sessionIdRef = useRef<string>(
    sessionId || getSessionId() || createSessionId()
  );

  // Initialize session ID
  if (typeof window !== "undefined" && !sessionId) {
    const saved = getSessionId();
    if (saved) {
      sessionIdRef.current = saved;
    } else {
      const newId = createSessionId();
      saveSessionId(newId);
      sessionIdRef.current = newId;
    }
  }

  // Add user message
  const addUserMessage = useCallback((content: string) => {
    const message: ChatMessage = {
      id: `user_${Date.now()}`,
      role: "user",
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, message]);
    return message;
  }, []);

  // Add assistant message
  const addAssistantMessage = useCallback((content: string, toolCalls?: ToolCall[]) => {
    const message: ChatMessage = {
      id: `assistant_${Date.now()}`,
      role: "assistant",
      content,
      timestamp: Date.now(),
      toolCalls,
    };
    setMessages((prev) => [...prev, message]);
    return message;
  }, []);

  // Update last assistant message (for streaming)
  const updateLastMessage = useCallback((updates: Partial<ChatMessage>) => {
    setMessages((prev) => {
      const newMessages = [...prev];
      const lastMessage = newMessages[newMessages.length - 1];
      if (lastMessage && lastMessage.role === "assistant") {
        newMessages[newMessages.length - 1] = {
          ...lastMessage,
          ...updates,
        };
      }
      return newMessages;
    });
  }, []);

  // Handle streaming response
  const handleStreamEvent = useCallback((event: ChatStreamEvent) => {
    console.log("[useChat] === handleStreamEvent ===");
    console.log("[useChat] Event type:", event.type);
    console.log("[useChat] Current isLoading:", isLoading);
    console.log("[useChat] Current isStreaming:", isStreaming);
    console.log("[useChat] Current currentResponse length:", currentResponse.length);
    console.log("[useChat] Current activeToolCalls:", activeToolCalls.length);

    switch (event.type) {
      case "text":
        console.log("[useChat] Processing 'text' event, content length:", event.content?.length);
        setCurrentResponse((prev) => prev + (event.content ?? ""));
        break;

      case "step":
        console.log("[useChat] Processing 'step' event:", (event as any).step);
        const step = (event as any).step as InteractionStep;
        if (step) {
          setInteractionSteps((prev) => [...prev, step]);
        }
        break;

      case "tool_call":
        console.log("[useChat] Processing 'tool_call' event:", event.toolCall);
        setActiveToolCalls((prev) => [...prev, event.toolCall!]);
        // Also add to all tool calls history
        setAllToolCalls((prev) => [...prev, event.toolCall!]);
        break;

      case "tool_result":
        console.log("[useChat] Processing 'tool_result' event:", event.toolCall);
        setActiveToolCalls((prev) =>
          prev.map((tc) =>
            tc.id === event.toolCall?.id ? event.toolCall! : tc
          )
        );
        // Also update in all tool calls history
        setAllToolCalls((prev) =>
          prev.map((tc) =>
            tc.id === event.toolCall?.id ? event.toolCall! : tc
          )
        );
        break;

      case "done":
        console.log("[useChat] === Processing 'done' event ===");
        console.log("[useChat] Event message:", event.message);
        console.log("[useChat] Current response length:", currentResponse.length);
        console.log("[useChat] Active tool calls:", activeToolCalls);

        // Clear safety timeout
        const safetyTimeout = (window as any).__chatSafetyTimeout;
        if (safetyTimeout) {
          console.log("[useChat] Clearing safety timeout");
          clearTimeout(safetyTimeout);
          (window as any).__chatSafetyTimeout = null;
        }

        // Finalize the message
        if (event.message) {
          console.log("[useChat] Adding assistant message from event.message");
          addAssistantMessage(
            event.message.content,
            event.message.toolCalls
          );
        } else if (currentResponse) {
          console.log("[useChat] Adding assistant message from currentResponse");
          addAssistantMessage(currentResponse, activeToolCalls);
        } else {
          console.log("[useChat] WARNING: No message content to add!");
        }

        setCurrentResponse("");
        setActiveToolCalls([]);
        setIsStreaming(false);
        setIsLoading(false);

        console.log("[useChat] State reset: isLoading=false, isStreaming=false");
        console.log("[useChat] === 'done' event processed ===");
        break;

      case "error":
        console.log("[useChat] === Processing 'error' event ===");
        console.log("[useChat] Error content:", event.content);

        // Clear safety timeout
        const errorTimeout = (window as any).__chatSafetyTimeout;
        if (errorTimeout) {
          console.log("[useChat] Clearing safety timeout due to error");
          clearTimeout(errorTimeout);
          (window as any).__chatSafetyTimeout = null;
        }

        addAssistantMessage(event.content ?? "An error occurred");
        setCurrentResponse("");
        setActiveToolCalls([]);
        setIsStreaming(false);
        setIsLoading(false);
        break;

      default:
        console.log("[useChat] UNKNOWN event type:", (event as any).type);
    }

    console.log("[useChat] === handleStreamEvent END ===");
  }, [currentResponse, activeToolCalls, addAssistantMessage, isLoading, isStreaming]);

  // Send message
  const sendMessage = useCallback((content: string, sendFn?: (sessionId: string, message: string) => void) => {
    console.log("[useChat] === sendMessage ===");
    console.log("[useChat] Content:", content);
    console.log("[useChat] Content trimmed length:", content.trim().length);
    console.log("[useChat] sendFn:", sendFn ? "provided" : "not provided");
    console.log("[useChat] SessionId:", sessionIdRef.current);
    console.log("[useChat] Before - isLoading:", isLoading, "isStreaming:", isStreaming);

    if (!content.trim()) {
      console.log("[useChat] Empty message, not sending");
      return;
    }

    setIsLoading(true);
    setIsStreaming(true);
    setCurrentResponse("");
    setActiveToolCalls([]);
    setInteractionSteps([]);

    console.log("[useChat] After - isLoading: true, isStreaming: true");

    // Add user message
    addUserMessage(content);

    // Send via WebSocket if provided
    if (sendFn) {
      console.log("[useChat] Calling sendFn...");
      sendFn(sessionIdRef.current, content);
    } else {
      console.log("[useChat] No sendFn provided");
    }

    // Safety timeout: if no response after 60 seconds, reset state
    const safetyTimeout = setTimeout(() => {
      console.log("[useChat] === SAFETY TIMEOUT TRIGGERED ===");
      console.log("[useChat] No response received within 60 seconds");
      console.log("[useChat] Forcing state reset");
      setIsLoading(false);
      setIsStreaming(false);
      console.log("[useChat] === SAFETY TIMEOUT COMPLETE ===");
    }, 60000);

    // Store timeout ref so we can clear it if we get a response
    (window as any).__chatSafetyTimeout = safetyTimeout;
    console.log("[useChat] Safety timeout set for 60 seconds");
    console.log("[useChat] === sendMessage END ===");
  }, [addUserMessage, isLoading, isStreaming]);

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setCurrentResponse("");
    setActiveToolCalls([]);
    setAllToolCalls([]);
    setInteractionSteps([]);
  }, []);

  // Reset session
  const resetSession = useCallback(() => {
    const newId = createSessionId();
    saveSessionId(newId);
    sessionIdRef.current = newId;
    clearMessages();
  }, [clearMessages]);

  return {
    messages,
    isLoading,
    isStreaming,
    currentResponse,
    activeToolCalls,
    allToolCalls,
    interactionSteps,
    sessionId: sessionIdRef.current,
    addUserMessage,
    addAssistantMessage,
    updateLastMessage,
    handleStreamEvent,
    sendMessage,
    clearMessages,
    resetSession,
  };
}
