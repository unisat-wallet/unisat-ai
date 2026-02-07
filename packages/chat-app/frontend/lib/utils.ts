/**
 * Utility functions
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format BTC amount
 */
export function formatBTC(satoshi: number): string {
  return (satoshi / 100_000_000).toFixed(8);
}

/**
 * Format large number with suffixes
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + "B";
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + "K";
  }
  return num.toString();
}

/**
 * Format timestamp
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) {
    return "just now";
  }
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }
  return date.toLocaleDateString();
}

/**
 * Truncate address
 */
export function truncateAddress(address: string, length: number = 6): string {
  if (address.length <= length * 2) {
    return address;
  }
  return `${address.slice(0, length)}...${address.slice(-length)}`;
}

/**
 * Truncate transaction ID
 */
export function truncateTxid(txid: string, length: number = 8): string {
  if (txid.length <= length * 2) {
    return txid;
  }
  return `${txid.slice(0, length)}...${txid.slice(-length)}`;
}

/**
 * Validate Bitcoin address
 */
export function isValidBitcoinAddress(address: string): boolean {
  // Basic validation for common address formats
  const patterns = [
    /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/, // Legacy
    /^bc1[a-z0-9]{11,71}$/, // Bech32/Segwit
    /^bc1p[a-z0-9]{11,71}$/, // Taproot
  ];
  return patterns.some((pattern) => pattern.test(address));
}

/**
 * Validate transaction ID
 */
export function isValidTxid(txid: string): boolean {
  return /^[a-fA-F0-9]{64}$/.test(txid);
}

/**
 * Generate session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Format fee rate
 */
export function formatFeeRate(satPerByte: number): string {
  return `${satPerByte} sat/vB`;
}

/**
 * Get fee level color
 */
export function getFeeLevelColor(feeRate: number): string {
  if (feeRate < 5) return "text-green-500";
  if (feeRate < 15) return "text-yellow-500";
  if (feeRate < 30) return "text-orange-500";
  return "text-red-500";
}

/**
 * Format currency
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  if (value < 0.01) {
    return `$${value.toFixed(6)}`;
  }
  if (value < 1) {
    return `$${value.toFixed(4)}`;
  }
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

/**
 * Copy to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sleep utility
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Max message length constant
 */
export const MAX_MESSAGE_LENGTH = 5000;
