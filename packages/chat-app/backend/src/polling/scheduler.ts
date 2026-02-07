/**
 * Polling Scheduler
 * Manages scheduled polling for real-time data
 */

import { config } from "../config/index.js";
import { blockCache, feeCache, brc20Cache } from "../cache/memory-cache.js";
import type { BlockData, FeeData, BRC20TokenData } from "../types/index.js";
import { UniSatClient } from "@unisat/open-api";

export interface SchedulerCallbacks {
  onBlock?: (data: BlockData) => void;
  onFee?: (data: FeeData) => void;
  onBRC20?: (ticker: string, data: BRC20TokenData) => void;
}

export class PollingScheduler {
  private readonly unisat: UniSatClient;
  private readonly callbacks: SchedulerCallbacks;
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private lastBlockHeight = 0;
  private isRunning = false;

  constructor(callbacks: SchedulerCallbacks) {
    this.callbacks = callbacks;
    this.unisat = new UniSatClient({
      apiKey: config.unisatApiKey,
      baseURL: config.unisatBaseURL,
    });
  }

  /**
   * Start all polling tasks
   */
  start(): void {
    if (this.isRunning) {
      console.log("[PollingScheduler] Already running, ignoring start() call");
      return;
    }

    this.isRunning = true;
    console.log("[PollingScheduler] Starting scheduler...");
    console.log("[PollingScheduler] Callbacks configured:", {
      onBlock: !!this.callbacks.onBlock,
      onFee: !!this.callbacks.onFee,
      onBRC20: !!this.callbacks.onBRC20,
    });
    console.log("[PollingScheduler] Poll intervals:", {
      block: config.blockPollInterval,
      fee: config.feePollInterval,
      brc20: config.brc20PollInterval,
    });

    // Start block polling
    this.timers.set(
      "block",
      setInterval(() => this.pollBlock(), config.blockPollInterval),
    );

    // Start fee polling
    this.timers.set(
      "fee",
      setInterval(() => this.pollFee(), config.feePollInterval),
    );

    // Initial poll
    console.log("[PollingScheduler] Starting initial polls...");
    this.pollBlock().catch((err) =>
      console.error("[PollingScheduler] Initial block poll failed:", err),
    );
    this.pollFee().catch((err) =>
      console.error("[PollingScheduler] Initial fee poll failed:", err),
    );
  }

  /**
   * Stop all polling tasks
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    for (const [name, timer] of this.timers) {
      clearInterval(timer);
    }
    this.timers.clear();
  }

  /**
   * Poll for latest block
   */
  private async pollBlock(): Promise<void> {
    try {
      console.log("[PollingScheduler] === pollBlock START ===");

      // Get latest block (we use current tip - 1 to ensure finality)
      const res = await this.unisat.v1.getBlockchainInfo();
      console.log("[PollingScheduler] Raw response:", JSON.stringify(res.data));

      if (res.data.code !== 0) {
        console.log(
          "[PollingScheduler] API returned non-zero code:",
          res.data.code,
          res.data.msg,
        );
        return;
      }

      const apiData = res.data.data;
      console.log("[PollingScheduler] API data:", apiData);
      console.log(
        "[PollingScheduler] blocks:",
        apiData?.blocks,
        "bestBlockHash:",
        apiData?.bestBlockHash,
        "medianTime:",
        apiData?.medianTime,
      );

      if (!apiData || typeof apiData.blocks !== "number") {
        console.log("[PollingScheduler] Invalid or missing blocks data");
        return;
      }

      const height = apiData.blocks - 1;
      const hash = apiData.bestBlockHash ?? "";
      const time = apiData.medianTime ?? Date.now() / 1000;

      console.log(
        "[PollingScheduler] Processed block - height:",
        height,
        "lastBlockHeight:",
        this.lastBlockHeight,
      );

      // Only notify if new block
      if (height > this.lastBlockHeight) {
        this.lastBlockHeight = height;

        const blockData: BlockData = {
          height,
          hash: hash,
          timestamp: time * 1000, // Convert to milliseconds
        };

        console.log(
          "[PollingScheduler] New block detected, notifying callback:",
          blockData,
        );

        // Cache it
        blockCache.set("latest", blockData);

        // Notify callback
        if (this.callbacks.onBlock) {
          console.log("[PollingScheduler] Calling onBlock callback");
          this.callbacks.onBlock(blockData);
        } else {
          console.log("[PollingScheduler] WARNING: onBlock callback not set!");
        }
      } else {
        console.log(
          "[PollingScheduler] No new block, current height:",
          height,
          "last height:",
          this.lastBlockHeight,
        );
      }
    } catch (error) {
      console.error("[PollingScheduler] Block polling error:", error);
    }
    console.log("[PollingScheduler] === pollBlock END ===");
  }

  /**
   * Poll for fee estimates
   */
  private async pollFee(): Promise<void> {
    try {
      const {
        data: { code, msg, data: fees },
      } = await this.unisat.v1.getRecommendedFees();
      console.log("Polled fee info:", fees);

      const feeData: FeeData = {
        fastest: fees!.fastestFee!,
        halfHour: fees!.halfHourFee!,
        hour: fees!.hourFee!,
        economy: fees!.economyFee!,
        minimum: fees!.minimumFee!,
        timestamp: Date.now(),
      };

      // Cache it
      feeCache.set("current", feeData);

      // Notify callback
      if (this.callbacks.onFee) {
        this.callbacks.onFee(feeData);
      }
    } catch (error) {
      console.error("Fee polling error:", error);
    }
  }

  /**
   * Get cached block data
   */
  getBlock(): BlockData | undefined {
    return blockCache.get("latest") as BlockData | undefined;
  }

  /**
   * Get cached fee data
   */
  getFee(): FeeData | undefined {
    return feeCache.get("current") as FeeData | undefined;
  }

  /**
   * Get cached BRC20 data
   */
  getBRC20(ticker: string): BRC20TokenData | undefined {
    return brc20Cache.get(`ticker:${ticker.toLowerCase()}`) as
      | BRC20TokenData
      | undefined;
  }

  /**
   * Check if scheduler is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}
