/**
 * SuggestedQueries Component
 * Shows suggested query buttons for new users
 */

"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import {
  Blocks,
  Coins,
  Receipt,
  TrendingUp,
  Wallet,
  FileSearch,
} from "lucide-react";

interface SuggestedQueriesProps {
  onSelect: (query: string) => void;
  className?: string;
}

export function SuggestedQueries({ onSelect, className }: SuggestedQueriesProps) {
  const { t } = useI18n();

  const suggestions = [
    { key: "query1" as const, icon: Blocks },
    { key: "query2" as const, icon: Coins },
    { key: "query3" as const, icon: Receipt },
    { key: "query4" as const, icon: TrendingUp },
    { key: "query5" as const, icon: Wallet },
    { key: "query6" as const, icon: FileSearch },
  ];

  return (
    <div className={cn("space-y-4", className)}>
      <h3 className="text-sm font-medium text-muted-foreground text-center">
        {t("suggestedTitle")}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {suggestions.map((suggestion) => {
          const Icon = suggestion.icon;
          const query = t(suggestion.key);

          return (
            <button
              key={suggestion.key}
              onClick={() => onSelect(query)}
              className="flex items-center gap-3 p-3 rounded-xl border bg-card hover:bg-accent hover:border-bitcoin-orange/50 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-lg bg-bitcoin-orange/10 flex items-center justify-center group-hover:bg-bitcoin-orange/20 transition-colors flex-shrink-0">
                <Icon className="w-4 h-4 text-bitcoin-orange" />
              </div>
              <span className="text-sm">{query}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
