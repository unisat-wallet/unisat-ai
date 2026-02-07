/**
 * useBlockchainData Hook
 * React hook for real-time blockchain data
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useWebSocket } from "./useWebSocket";
import type { BlockData, FeeData, BRC20TokenData } from "@/types";

export function useBlockchainData(wsUrl?: string) {
  const { onMessage } = useWebSocket(wsUrl);
  const [block, setBlock] = useState<BlockData | null>(null);
  const [fee, setFee] = useState<FeeData | null>(null);
  const [brc20Tokens, setBrc20Tokens] = useState<Map<string, BRC20TokenData>>(
    new Map()
  );

  // Subscribe to block updates
  useEffect(() => {
    const unsubscribe = onMessage("realtime_block", (message) => {
      setBlock(message.data as BlockData);
    });

    return unsubscribe;
  }, [onMessage]);

  // Subscribe to fee updates
  useEffect(() => {
    const unsubscribe = onMessage("realtime_fee", (message) => {
      setFee(message.data as FeeData);
    });

    return unsubscribe;
  }, [onMessage]);

  // Subscribe to BRC20 updates
  useEffect(() => {
    const unsubscribe = onMessage("realtime_brc20", (message) => {
      const data = message.data as BRC20TokenData & { ticker: string };
      setBrc20Tokens((prev) => {
        const next = new Map(prev);
        next.set(data.ticker.toLowerCase(), data);
        return next;
      });
    });

    return unsubscribe;
  }, [onMessage]);

  // Get specific BRC20 token
  const getToken = useCallback(
    (ticker: string): BRC20TokenData | undefined => {
      return brc20Tokens.get(ticker.toLowerCase());
    },
    [brc20Tokens]
  );

  // Request BRC20 data for a specific ticker
  const requestTokenData = useCallback(
    (ticker: string) => {
      // This would send a subscribe message to the server
      // For now, the server polls popular tokens automatically
      return getToken(ticker);
    },
    [getToken]
  );

  return {
    block,
    fee,
    brc20Tokens,
    getToken,
    requestTokenData,
  };
}
