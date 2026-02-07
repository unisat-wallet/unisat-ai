/**
 * SuggestedQueries Component
 * Shows suggested query buttons for new users
 */

"use client";

import { SUGGESTED_QUERIES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  BarChart3,
  Wallet,
  Activity,
  Users,
  Zap,
  HelpCircle,
} from "lucide-react";

// Icon mapping
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  TrendingUp,
  BarChart: BarChart3,
  Wallet,
  Activity,
  Users,
  Zap,
  HelpCircle,
};

interface SuggestedQueriesProps {
  onSelect: (query: string) => void;
  className?: string;
}

export function SuggestedQueries({ onSelect, className }: SuggestedQueriesProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3",
        className
      )}
    >
      {SUGGESTED_QUERIES.map((suggestion) => {
        const Icon = ICON_MAP[suggestion.icon] || HelpCircle;

        return (
          <button
            key={suggestion.label}
            onClick={() => onSelect(suggestion.query)}
            className="flex flex-col gap-2 p-4 rounded-xl border bg-card hover:bg-accent hover:border-bitcoin-orange/50 transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-bitcoin-orange/10 flex items-center justify-center group-hover:bg-bitcoin-orange/20 transition-colors">
                <Icon className="w-5 h-5 text-bitcoin-orange" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm block">{suggestion.label}</span>
                <span className="text-xs text-muted-foreground">{suggestion.description}</span>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
