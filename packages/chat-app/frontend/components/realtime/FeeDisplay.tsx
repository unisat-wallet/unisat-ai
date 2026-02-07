/**
 * FeeDisplay Component
 * Displays current Bitcoin network fees
 */

"use client";

import { Zap } from "lucide-react";
import { useBlockchainData } from "@/hooks/useBlockchainData";
import { cn, formatFeeRate, getFeeLevelColor } from "@/lib/utils";

interface FeeDisplayProps {
  className?: string;
  wsUrl?: string;
}

export function FeeDisplay({ className, wsUrl }: FeeDisplayProps) {
  const { fee } = useBlockchainData(wsUrl);

  // Determine fee level
  const feeLevel = fee ? getFeeLevel(fee.fastest) : "Unknown";

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-1.5 rounded-lg bg-background border",
        className
      )}
    >
      <Zap className={cn("w-4 h-4", fee ? getFeeLevelColor(fee.fastest) : "text-muted-foreground")} />
      <div className="flex items-baseline gap-2">
        <span className="text-sm font-medium text-muted-foreground">Fee</span>
        {fee ? (
          <span className="text-base font-semibold tabular-nums">
            {formatFeeRate(fee.fastest)}
          </span>
        ) : (
          <span className="text-base font-semibold text-muted-foreground">
            ---
          </span>
        )}
      </div>
      {fee && (
        <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
          <span>30m: {fee.halfHour}</span>
          <span>1h: {fee.hour}</span>
        </div>
      )}
      <span
        className={cn(
          "text-xs px-1.5 py-0.5 rounded",
          feeLevel === "Low" && "bg-green-500/10 text-green-600",
          feeLevel === "Medium" && "bg-yellow-500/10 text-yellow-600",
          feeLevel === "High" && "bg-red-500/10 text-red-600",
          !fee && "bg-muted text-muted-foreground"
        )}
      >
        {feeLevel}
      </span>
    </div>
  );
}

function getFeeLevel(feeRate: number): string {
  if (feeRate < 5) return "Low";
  if (feeRate < 20) return "Medium";
  return "High";
}
