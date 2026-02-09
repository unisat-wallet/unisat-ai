/**
 * MessageBubble Component
 * Displays a single chat message with markdown rendering
 */

"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { User, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage, ToolCall } from "@/types";
import { TOOL_DISPLAY_NAMES } from "@/lib/constants";

interface MessageBubbleProps {
  message: ChatMessage;
  showAvatar?: boolean;
}

export function MessageBubble({ message, showAvatar = true }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 animate-fade-in",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && showAvatar && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-bitcoin-orange flex items-center justify-center">
          <Bot className="w-5 h-5 text-white" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 overflow-hidden",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted rounded-bl-sm"
        )}
      >
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <div className="mb-3 space-y-2">
            {message.toolCalls.map((tool) => (
              <ToolDisplay key={tool.id} tool={tool} />
            ))}
          </div>
        )}

        <div
          className={cn(
            "markdown-content prose-sm break-words",
            isUser ? "prose-invert" : "dark:prose-invert"
          )}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              a: ({ ...props }) => (
                <a {...props} target="_blank" rel="noopener noreferrer" />
              ),
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {message.metadata?.sources && message.metadata.sources.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border/50 text-xs text-muted-foreground">
            Data via UniSat API
            {message.metadata.sources.map((source, i) => (
              <span key={i}>
                {source.blockHeight && ` • Block ${source.blockHeight}`}
              </span>
            ))}
          </div>
        )}
      </div>

      {isUser && showAvatar && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
          <User className="w-5 h-5 text-secondary-foreground" />
        </div>
      )}
    </div>
  );
}

interface ToolDisplayProps {
  tool: ToolCall;
}

function ToolDisplay({ tool }: ToolDisplayProps) {
  const displayName = TOOL_DISPLAY_NAMES[tool.name] || tool.name;

  return (
    <div
      className={cn(
        "flex items-center gap-2 text-xs px-2 py-1.5 rounded-md",
        tool.status === "completed"
          ? "bg-green-500/10 text-green-600 dark:text-green-400"
          : tool.status === "failed"
          ? "bg-red-500/10 text-red-600 dark:text-red-400"
          : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
      )}
    >
      <span className="font-medium">{displayName}</span>
      <span className="text-muted-foreground">•</span>
      <span className="capitalize text-muted-foreground">{tool.status}</span>
      {tool.error && (
        <>
          <span className="text-muted-foreground">•</span>
          <span className="text-red-600 dark:text-red-400">{tool.error}</span>
        </>
      )}
    </div>
  );
}
