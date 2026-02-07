/**
 * BlockTicker Component
 * Displays latest Bitcoin block height
 */

"use client";

import { Box } from "lucide-react";
import { useBlockchainData } from "@/hooks/useBlockchainData";
import { cn, formatNumber, formatTime } from "@/lib/utils";

interface BlockTickerProps {
  className?: string;
  wsUrl?: string;
}

export function BlockTicker({ className, wsUrl }: BlockTickerProps) {
  const { block } = useBlockchainData(wsUrl);

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bitcoin-orange/10 border border-bitcoin-orange/20",
        className
      )}
    >
      <Box className="w-4 h-4 text-bitcoin-orange" />
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-medium text-muted-foreground">Block</span>
        <span className="text-lg font-bold tabular-nums">
          {block?.height.toLocaleString() ?? "---"}
        </span>
      </div>
      {block && (
        <span className="text-xs text-muted-foreground">
          {formatTime(block.timestamp)}
        </span>
      )}
    </div>
  );
}
