/**
 * ChatContainer Component
 * Main chat interface with messages, input, and tool panel
 * Supports separate contexts for OpenAI and AgentKit modes
 */

"use client";

import * as React from "react";
import { useChat } from "@/hooks/useChat";
import { useWebSocket } from "@/hooks/useWebSocket";
import { MessageBubble } from "./MessageBubble";
import { ChatInput } from "./ChatInput";
import { ThinkingProcess } from "./ThinkingProcess";
import { SuggestedQueries } from "./SuggestedQueries";
import { ToolPanel } from "./ToolPanel";
import { ProviderSelector, type AIProvider } from "./ProviderSelector";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { ChatStreamEvent } from "@/types";
import { PanelRightClose, PanelRight, Bot } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import Link from "next/link";
import Image from "next/image";

interface ChatContainerProps {
  wsUrl?: string;
  sessionId?: string;
}

export function ChatContainer({ wsUrl, sessionId }: ChatContainerProps) {
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const [showToolPanel, setShowToolPanel] = React.useState(false);
  const [aiProvider, setAiProvider] = React.useState<AIProvider>("openai");
  const { send, isConnected, onMessage } = useWebSocket(wsUrl);
  const { t } = useI18n();

  // Separate chat instances for each provider
  const openaiChat = useChat(sessionId ? `${sessionId}_openai` : undefined);
  const agentkitChat = useChat(sessionId ? `${sessionId}_agentkit` : undefined);

  // Get current chat based on provider
  const currentChat = aiProvider === "openai" ? openaiChat : agentkitChat;

  // Theme colors based on provider
  const themeColors = {
    openai: {
      bg: "bg-emerald-50/30 dark:bg-emerald-950/20",
      accent: "bg-emerald-500",
      accentText: "text-emerald-600 dark:text-emerald-400",
      border: "border-emerald-200 dark:border-emerald-800",
      badge: "bg-emerald-500",
    },
    agentkit: {
      bg: "bg-orange-50/30 dark:bg-orange-950/20",
      accent: "bg-bitcoin-orange",
      accentText: "text-orange-600 dark:text-orange-400",
      border: "border-orange-200 dark:border-orange-800",
      badge: "bg-bitcoin-orange",
    },
  };

  const theme = themeColors[aiProvider];

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
  } = currentChat;

  // Use ref to always have latest handleStreamEvent
  const handleStreamEventRef = React.useRef(handleStreamEvent);
  React.useEffect(() => {
    handleStreamEventRef.current = handleStreamEvent;
  }, [handleStreamEvent]);

  // Subscribe to chat messages from WebSocket
  React.useEffect(() => {
    if (!onMessage) return;

    console.log("[ChatContainer] Subscribing to chat messages");

    // Handle incoming chat events
    const unsubscribe = onMessage("chat", (wsMessage) => {
      const chatEvent: ChatStreamEvent = wsMessage.data as ChatStreamEvent;
      console.log("[ChatContainer] Received chat event:", chatEvent.type);
      // Route to the correct chat handler based on current provider
      handleStreamEventRef.current(chatEvent);
    });

    return () => {
      console.log("[ChatContainer] Unsubscribing from chat messages");
      unsubscribe();
    };
  }, [onMessage]);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentResponse, activeToolCalls]);

  const handleSend = (content: string) => {
    if (isConnected) {
      send("chat", {
        sessionId: aiProvider === "openai"
          ? `${sessionId || 'default'}_openai`
          : `${sessionId || 'default'}_agentkit`,
        message: content,
        provider: aiProvider,
      });
    }
    sendMessage(content);
  };

  const hasMessages = messages.length > 0;

  return (
    <div className={`flex h-full transition-colors duration-300 ${theme.bg}`}>
      {/* Main Chat Area */}
      <div className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ${showToolPanel ? 'pr-0' : ''}`}>
        {/* Header with Tool Panel Toggle */}
        <div className={`flex-shrink-0 border-b bg-background/95 backdrop-blur px-4 py-2 flex items-center justify-between ${theme.border}`}>
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <Image src="/logo.png" alt="UniSat" width={28} height={28} />
              <h1 className="text-lg font-semibold">{t("title")}</h1>
            </Link>
            {isConnected ? (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                {t("connected")}
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-yellow-600">
                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
                {t("connecting")}
              </span>
            )}
            <ProviderSelector
              value={aiProvider}
              onChange={setAiProvider}
              disabled={isLoading || isStreaming}
            />
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowToolPanel(!showToolPanel)}
              className="flex items-center gap-2"
            >
              {showToolPanel ? (
                <>
                  <PanelRightClose className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("hideTools")}</span>
                </>
              ) : (
                <>
                  <PanelRight className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("showTools")}</span>
                  {allToolCalls.length > 0 && (
                    <span className={`${theme.badge} text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem]`}>
                      {allToolCalls.length}
                    </span>
                  )}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          {!hasMessages ? (
            <div className="h-full flex flex-col items-center justify-center p-8">
              <div className="max-w-2xl w-full space-y-8">
                <div className="text-center space-y-4">
                  <h1 className="text-3xl font-bold">
                    {t("welcomeTitle")}
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    {t("welcomeDesc")}
                  </p>
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${theme.bg} ${theme.border} border`}>
                    <span className={`w-2 h-2 rounded-full ${theme.accent}`} />
                    <span className={`text-sm font-medium ${theme.accentText}`}>
                      {aiProvider === "openai" ? t("openaiMode") : t("agentkitMode")}
                    </span>
                  </div>
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
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full ${theme.accent} flex items-center justify-center`}>
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                  <Card className="max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-3 overflow-hidden">
                    <div className="markdown-content prose-sm dark:prose-invert break-words">
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

              {/* AI Thinking Process - shown when loading but no response yet */}
              {(isLoading || isStreaming) && !currentResponse && (
                <div className="flex gap-3 justify-start animate-fade-in">
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full ${theme.accent} flex items-center justify-center`}>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                  <Card className="max-w-[80%] rounded-2xl rounded-bl-sm px-4 py-3">
                    <ThinkingProcess steps={interactionSteps} />
                  </Card>
                </div>
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
                  ? t("connecting")
                  : t("inputPlaceholder")
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
