/**
 * ChatContainer Component
 * Main chat interface with messages, input, and tool panel
 */

"use client";

import * as React from "react";
import { useChat } from "@/hooks/useChat";
import { useWebSocket } from "@/hooks/useWebSocket";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { SuggestedQueries } from "./SuggestedQueries";
import { ToolPanel } from "./ToolPanel";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { ChatStreamEvent } from "@/types";
import { PanelRightClose, PanelRight } from "lucide-react";

interface ChatContainerProps {
  wsUrl?: string;
  sessionId?: string;
}

export function ChatContainer({ wsUrl, sessionId }: ChatContainerProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [showToolPanel, setShowToolPanel] = React.useState(true);
  const { send, isConnected, onMessage } = useWebSocket(wsUrl);
  const {
    messages,
    isLoading,
    isStreaming,
    currentResponse,
    activeToolCalls,
    allToolCalls,
    interactionSteps,
    sendMessage,
    handleStreamEvent,
  } = useChat(sessionId);

  // Subscribe to chat messages from WebSocket
  React.useEffect(() => {
    if (!onMessage) return;

    // Handle incoming chat events
    const unsubscribe = onMessage("chat", (wsMessage) => {
      const chatEvent: ChatStreamEvent = wsMessage.data as ChatStreamEvent;
      handleStreamEvent(chatEvent);
    });

    return () => {
      unsubscribe();
    };
  }, [onMessage, handleStreamEvent]);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentResponse, activeToolCalls]);

  // Auto-show tool panel when tools are called
  React.useEffect(() => {
    if (activeToolCalls.length > 0 && !showToolPanel) {
      setShowToolPanel(true);
    }
  }, [activeToolCalls.length, showToolPanel]);

  const handleSend = (content: string) => {
    if (isConnected) {
      send("chat", {
        sessionId,
        message: content,
      });
    }
    sendMessage(content);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-full">
      {/* Main Chat Area */}
      <div className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ${showToolPanel ? 'pr-0' : ''}`}>
        {/* Header with Tool Panel Toggle */}
        <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">UniSat AI</h1>
            {isConnected ? (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                Connected
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-yellow-600">
                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                Connecting...
              </span>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowToolPanel(!showToolPanel)}
            className="flex items-center gap-2"
          >
            {showToolPanel ? (
              <>
                <PanelRightClose className="w-4 h-4" />
                <span className="hidden sm:inline">Hide Tools</span>
              </>
            ) : (
              <>
                <PanelRight className="w-4 h-4" />
                <span className="hidden sm:inline">Show Tools</span>
                {allToolCalls.length > 0 && (
                  <span className="bg-bitcoin-orange text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem]">
                    {allToolCalls.length}
                  </span>
                )}
              </>
            )}
          </Button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          {!hasMessages ? (
            <div className="h-full flex flex-col items-center justify-center p-8">
              <div className="max-w-2xl w-full space-y-8">
                <div className="text-center space-y-4">
                  <h1 className="text-3xl font-bold">
                    UniSat AI Assistant
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    Ask anything about Bitcoin, BRC20 tokens, Runes, or Ordinals inscriptions.
                    I have access to real-time blockchain data.
                  </p>
                </div>

                <SuggestedQueries
                  onSelect={(query) => handleSend(query)}
                />
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}

              {/* Current streaming response */}
              {isStreaming && currentResponse && (
                <div className="flex gap-3 justify-start animate-fade-in">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bitcoin-orange flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                  <Card className="max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="markdown-content prose-sm dark:prose-invert">
                      {currentResponse}
                    </div>
                    {activeToolCalls.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {activeToolCalls.map((tool) => (
                          <div
                            key={tool.id}
                            className="flex items-center gap-2 text-xs px-2 py-1.5 rounded-md bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                          >
                            <span className="font-medium">{tool.name}</span>
                            <span className="text-muted-foreground">•</span>
                            <span className="capitalize">{tool.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {isLoading && !currentResponse && (
                <TypingIndicator />
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t bg-background p-4">
          <div className="max-w-3xl mx-auto">
            <ChatInput
              onSend={handleSend}
              disabled={isLoading || !isConnected}
              placeholder={
                !isConnected
                  ? "Connecting..."
                  : "Ask about Bitcoin, BRC20, Runes, or Ordinals..."
              }
            />
          </div>
        </div>
      </div>

      {/* Tool Panel Sidebar */}
      {showToolPanel && (
        <div className="w-80 lg:w-96 flex-shrink-0 border-l bg-muted/30 hidden md:block">
          <ToolPanel
            toolCalls={allToolCalls}
            interactionSteps={interactionSteps}
            isStreaming={isStreaming}
          />
        </div>
      )}
    </div>
  );
}
