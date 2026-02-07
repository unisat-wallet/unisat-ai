/**
 * ChatInput Component
 * Message input with send button
 */

"use client";

import * as React from "react";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { isValidBitcoinAddress } from "@/lib/utils";
import { MAX_MESSAGE_LENGTH } from "@/lib/constants";

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export function ChatInput({
  onSend,
  disabled = false,
  placeholder = "Ask about Bitcoin, BRC20, Runes, or Ordinals...",
  className,
}: ChatInputProps) {
  const [input, setInput] = React.useState("");
  const [isComposing, setIsComposing] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const trimmed = input.trim();
    console.log("[ChatInput] === handleSubmit ===");
    console.log("[ChatInput] Input:", trimmed);
    console.log("[ChatInput] Input length:", trimmed.length);
    console.log("[ChatInput] Disabled:", disabled);
    console.log("[ChatInput] Can send:", !disabled && trimmed.length > 0 && trimmed.length <= MAX_MESSAGE_LENGTH);

    if (trimmed && !disabled && trimmed.length <= MAX_MESSAGE_LENGTH) {
      console.log("[ChatInput] Calling onSend with message:", trimmed);
      onSend(trimmed);
      setInput("");
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } else {
      console.log("[ChatInput] Message not sent, conditions not met");
    }
    console.log("[ChatInput] === handleSubmit END ===");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_MESSAGE_LENGTH) {
      setInput(value);
      // Auto-resize textarea
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
      }
    }
  };

  // Detect Bitcoin addresses and show validation
  const hasAddress = React.useMemo(() => {
    const match = input.match(/bc1[0-9a-zA-Z]+/g);
    return match && match.some((addr) => !isValidBitcoinAddress(addr));
  }, [input]);

  const canSend = input.trim().length > 0 && !hasAddress && !disabled;

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "flex items-end gap-2 p-4 rounded-2xl border bg-background transition-colors focus-within:border-bitcoin-orange focus-within:ring-2 focus-within:ring-bitcoin-orange/20"
        )}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 resize-none bg-transparent outline-none placeholder:text-muted-foreground max-h-[200px] py-2"
          )}
        />

        <div className="flex items-center gap-2">
          {hasAddress && (
            <span className="text-xs text-red-500 hidden sm:block">
              Invalid Bitcoin address
            </span>
          )}
          <span
            className={cn(
              "text-xs text-muted-foreground hidden sm:block",
              input.length > MAX_MESSAGE_LENGTH * 0.8 && "text-yellow-500"
            )}
          >
            {input.length}/{MAX_MESSAGE_LENGTH}
          </span>
          <Button
            size="icon"
            onClick={handleSubmit}
            disabled={!canSend}
            className="flex-shrink-0"
          >
            {disabled ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Quick suggestions */}
      {input.length === 0 && !disabled && (
        <div className="flex flex-wrap gap-2 mt-3">
          <QuickSuggestion onClick={() => setInput("What's the latest block?")} label="Latest block" />
          <QuickSuggestion onClick={() => setInput("What are the current fees?")} label="Current fees" />
          <QuickSuggestion onClick={() => setInput("Tell me about ORDI token")} label="ORDI info" />
        </div>
      )}
    </div>
  );
}

interface QuickSuggestionProps {
  label: string;
  onClick: () => void;
}

function QuickSuggestion({ label, onClick }: QuickSuggestionProps) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-sm bg-muted hover:bg-muted-foreground/10 rounded-full transition-colors"
    >
      {label}
    </button>
  );
}
