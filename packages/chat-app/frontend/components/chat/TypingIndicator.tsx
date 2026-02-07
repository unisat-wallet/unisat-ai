/**
 * TypingIndicator Component
 * Shows animated dots while AI is thinking
 */

"use client";

import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  className?: string;
}

export function TypingIndicator({ className }: TypingIndicatorProps) {
  return (
    <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
      <div className="flex gap-1">
        <Dot delay={0} />
        <Dot delay={150} />
        <Dot delay={300} />
      </div>
      <span className="text-sm">AI is thinking</span>
    </div>
  );
}

interface DotProps {
  delay: number;
}

function Dot({ delay }: DotProps) {
  return (
    <span
      className="w-2 h-2 bg-bitcoin-orange rounded-full animate-pulse"
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: "1s",
      }}
    />
  );
}
