/**
 * ThinkingProcess Component
 * Shows AI thinking/processing steps in the chat area
 */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { InteractionStep, InteractionStepType } from "@/types";
import {
  Brain,
  Sparkles,
  Zap,
  Loader2,
  CheckCircle,
  Search,
  MessageSquare,
} from "lucide-react";

interface ThinkingProcessProps {
  steps: InteractionStep[];
  className?: string;
}

// Get icon and color for each step type
function getStepDisplay(type: InteractionStepType, isActive: boolean) {
  const configs: Record<InteractionStepType, { icon: React.ReactNode; color: string }> = {
    user_message: {
      icon: <MessageSquare className="w-3.5 h-3.5" />,
      color: "text-blue-500",
    },
    ai_thinking: {
      icon: isActive ? <Brain className="w-3.5 h-3.5 animate-pulse" /> : <Brain className="w-3.5 h-3.5" />,
      color: "text-purple-500",
    },
    ai_planning: {
      icon: isActive ? <Sparkles className="w-3.5 h-3.5 animate-pulse" /> : <Sparkles className="w-3.5 h-3.5" />,
      color: "text-indigo-500",
    },
    tool_calling: {
      icon: <Zap className="w-3.5 h-3.5" />,
      color: "text-yellow-500",
    },
    tool_executing: {
      icon: isActive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />,
      color: "text-orange-500",
    },
    tool_completed: {
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      color: "text-green-500",
    },
    processing_results: {
      icon: isActive ? <Search className="w-3.5 h-3.5 animate-pulse" /> : <Search className="w-3.5 h-3.5" />,
      color: "text-cyan-500",
    },
    ai_responding: {
      icon: isActive ? <MessageSquare className="w-3.5 h-3.5 animate-pulse" /> : <MessageSquare className="w-3.5 h-3.5" />,
      color: "text-blue-500",
    },
    response_complete: {
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      color: "text-green-500",
    },
    error: {
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      color: "text-red-500",
    },
  };
  return configs[type];
}

export function ThinkingProcess({ steps, className }: ThinkingProcessProps) {
  // Filter out user_message steps and get the latest few steps
  const relevantSteps = steps
    .filter((s) => s.type !== "user_message" && s.type !== "response_complete")
    .slice(-5); // Show last 5 steps

  if (relevantSteps.length === 0) {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
        <div className="flex gap-1">
          <Dot delay={0} />
          <Dot delay={150} />
          <Dot delay={300} />
        </div>
        <span className="text-sm">AI is thinking...</span>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {relevantSteps.map((step, index) => {
        const isLast = index === relevantSteps.length - 1;
        const display = getStepDisplay(step.type, isLast);

        return (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-2 text-sm transition-opacity duration-300",
              isLast ? "opacity-100" : "opacity-60"
            )}
          >
            <span className={display.color}>{display.icon}</span>
            <span className={cn("text-muted-foreground", isLast && "text-foreground font-medium")}>
              {step.title}
            </span>
          </div>
        );
      })}
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
