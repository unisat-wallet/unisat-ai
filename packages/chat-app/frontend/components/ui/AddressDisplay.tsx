/**
 * AddressDisplay Component
 * Displays Bitcoin address with truncation and copy functionality
 */

"use client";

import * as React from "react";
import { Copy, Check } from "lucide-react";
import { cn, truncateAddress, copyToClipboard } from "@/lib/utils";

interface AddressDisplayProps {
  address: string;
  truncate?: number;
  showCopy?: boolean;
  className?: string;
}

export function AddressDisplay({
  address,
  truncate = 6,
  showCopy = true,
  className,
}: AddressDisplayProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(address);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <span className={cn("inline-flex items-center gap-1 font-mono text-sm", className)}>
      <code className="bg-muted px-1.5 py-0.5 rounded">
        {truncateAddress(address, truncate)}
      </code>
      {showCopy && (
        <button
          onClick={handleCopy}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title={copied ? "Copied!" : "Copy address"}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      )}
    </span>
  );
}
