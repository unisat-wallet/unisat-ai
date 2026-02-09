/**
 * useChat Hook
 * React hook for chat functionality
 */

"use client";

import { useState, useCallback, useRef } from "react";
import type {
  ChatMessage,
  ChatStreamEvent,
  ToolCall,
  InteractionStep,
} from "@/types";
import {
  generateSessionId as createSessionId,
  SESSION_STORAGE_KEY,
} from "@/lib/constants";

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
  const [interactionSteps, setInteractionSteps] = useState<InteractionStep[]>(
    [],
  );
  const sessionIdRef = useRef<string>(
    sessionId || getSessionId() || createSessionId(),
  );
  // Ref to prevent duplicate "done" event processing in React Strict Mode
  const processingDoneRef = useRef(false);

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
  const addAssistantMessage = useCallback(
    (content: string, toolCalls?: ToolCall[]) => {
      console.log(
        "[useChat] addAssistantMessage called, content length:",
        content?.length,
      );
      const message: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content,
        timestamp: Date.now(),
        toolCalls,
      };
      setMessages((prev) => {
        console.log(
          "[useChat] Adding message, prev length:",
          prev.length,
          "new length:",
          prev.length + 1,
        );
        return [...prev, message];
      });
      return message;
    },
    [],
  );

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
  const handleStreamEvent = useCallback(
    (event: ChatStreamEvent) => {
      switch (event.type) {
        case "text":
          setCurrentResponse((prev) => prev + (event.content ?? ""));
          break;

        case "step":
          const step = (event as any).step as InteractionStep;
          if (step) {
            setInteractionSteps((prev) => [...prev, step]);
          }
          break;

        case "tool_call":
          if (event.toolCall) {
            setActiveToolCalls((prev) => [...prev, event.toolCall!]);
            setAllToolCalls((prev) => [...prev, event.toolCall!]);
          }
          break;

        case "tool_result":
          if (event.toolCall) {
            setActiveToolCalls((prev) =>
              prev.map((tc) =>
                tc.id === event.toolCall?.id ? event.toolCall! : tc,
              ),
            );
            setAllToolCalls((prev) =>
              prev.map((tc) =>
                tc.id === event.toolCall?.id ? event.toolCall! : tc,
              ),
            );
          }
          break;

        case "done":
          // Prevent duplicate processing in React Strict Mode
          if (processingDoneRef.current) {
            console.log("[useChat] Skipping duplicate 'done' event processing");
            return;
          }
          processingDoneRef.current = true;

          // Clear safety timeout
          const safetyTimeout = (window as any).__chatSafetyTimeout;
          if (safetyTimeout) {
            console.log("[useChat] Clearing safety timeout");
            clearTimeout(safetyTimeout);
            (window as any).__chatSafetyTimeout = null;
          }

          // Add the message directly without nested setState callbacks
          if (event.message) {
            console.log(
              "[useChat] Adding assistant message from event.message",
            );
            addAssistantMessage(
              event.message.content,
              event.message.toolCalls,
            );
          } else {
            // Use refs or direct state access if needed
            console.log("[useChat] No event.message, using currentResponse");
          }

          // Reset states directly
          setCurrentResponse("");
          setActiveToolCalls([]);
          setIsStreaming(false);
          setIsLoading(false);

          console.log(
            "[useChat] State reset: isLoading=false, isStreaming=false",
          );
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
    },
    [addAssistantMessage],
  );

  // Send message
  const sendMessage = useCallback(
    (
      content: string,
      sendFn?: (sessionId: string, message: string) => void,
    ) => {
      console.log("[useChat] === sendMessage ===");
      console.log("[useChat] Content:", content);
      console.log("[useChat] SessionId:", sessionIdRef.current);

      if (!content.trim()) {
        console.log("[useChat] Empty message, not sending");
        return;
      }

      // Reset all state for new message
      setIsLoading(true);
      setIsStreaming(true);
      setCurrentResponse("");
      setActiveToolCalls([]);
      setAllToolCalls([]);
      setInteractionSteps([]);
      processingDoneRef.current = false; // Reset the done event guard

      console.log("[useChat] State reset for new message");

      // Add user message
      addUserMessage(content);

      // Send via WebSocket if provided
      if (sendFn) {
        console.log("[useChat] Calling sendFn...");
        sendFn(sessionIdRef.current, content);
      }

      // Safety timeout: if no response after 60 seconds, reset state
      const safetyTimeout = setTimeout(() => {
        console.log("[useChat] === SAFETY TIMEOUT TRIGGERED ===");
        setIsLoading(false);
        setIsStreaming(false);
      }, 60000);

      // Store timeout ref so we can clear it if we get a response
      (window as any).__chatSafetyTimeout = safetyTimeout;
      console.log("[useChat] === sendMessage END ===");
    },
    [addUserMessage],
  );

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
