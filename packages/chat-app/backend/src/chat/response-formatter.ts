/**
 * Response Formatter
 * Formats responses for frontend consumption
 */

import type { ChatMessage, ToolCall, DataSource } from "../types/index.js";

export interface FormattedResponse {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  toolCalls?: FormattedToolCall[];
  metadata?: {
    model?: string;
    sources?: DataSource[];
    latency?: number;
  };
}

export interface FormattedToolCall {
  id: string;
  name: string;
  displayName: string;
  status: "pending" | "completed" | "failed";
  result?: unknown;
  error?: string;
}

export class ResponseFormatter {
  /**
   * Format a chat message for WebSocket transmission
   */
  formatMessage(message: ChatMessage): FormattedResponse {
    return {
      id: message.id,
      role: message.role as "user" | "assistant",
      content: message.content,
      timestamp: message.timestamp,
      toolCalls: message.toolCalls?.map(this.formatToolCall),
      metadata: message.metadata,
    };
  }

  /**
   * Format a tool call for display
   */
  formatToolCall(tool: ToolCall): FormattedToolCall {
    return {
      id: tool.id,
      name: tool.name,
      displayName: this.getToolDisplayName(tool.name),
      status: tool.status,
      result: tool.result,
      error: tool.error,
    };
  }

  /**
   * Get human-readable display name for a tool
   */
  private getToolDisplayName(toolName: string): string {
    const displayNames: Record<string, string> = {
      get_block_info: "Get Block Info",
      get_tx_info: "Get Transaction Info",
      get_address_balance: "Get Balance",
      get_utxos: "Get UTXOs",
      get_fee_estimate: "Get Fee Estimates",
      get_brc20_token_info: "Get BRC20 Token Info",
      get_brc20_balance: "Get BRC20 Balance",
      get_brc20_holders: "Get BRC20 Holders",
      get_brc20_transfer_history: "Get BRC20 History",
      get_runes_token_info: "Get Runes Token Info",
      get_runes_balance: "Get Runes Balance",
      get_runes_holders: "Get Runes Holders",
      get_inscription: "Get Inscription",
      get_inscriptions_by_address: "Get Inscriptions",
      get_brc20_market_stats: "Get Market Stats",
      get_brc20_order_list: "Get Order Book",
    };

    return displayNames[toolName] ?? toolName;
  }

  /**
   * Format data as a table for markdown output
   */
  formatTable(headers: string[], rows: string[][]): string {
    const columnWidths = headers.map((h, i) => {
      const maxWidth = Math.max(
        h.length,
        ...rows.map((r) => (r[i] ?? "").toString().length)
      );
      return maxWidth;
    });

    const formatRow = (cells: string[]) => {
      return "| " + cells.map((cell, i) => cell.padEnd(columnWidths[i])).join(" | ") + " |";
    };

    const separator = "|" + columnWidths.map((w) => "-".repeat(w + 2)).join("|") + "|";

    const lines = [
      formatRow(headers),
      separator,
      ...rows.map((row) => formatRow(row)),
    ];

    return lines.join("\n");
  }

  /**
   * Format balance data for display
   */
  formatBalance(data: {
    satoshi: number;
    confirmed?: number;
    unconfirmed?: number;
    btcAddress?: string;
  }): string {
    const btc = (satoshi: number) => (satoshi / 100_000_000).toFixed(8);

    let output = `**Balance for \`${data.btcAddress ?? "unknown"}\`**\n\n`;

    if (data.confirmed !== undefined) {
      output += `- Confirmed: **${btc(data.confirmed)} BTC**\n`;
    }
    if (data.unconfirmed !== undefined && data.unconfirmed > 0) {
      output += `- Pending: **${btc(data.unconfirmed)} BTC**\n`;
    }
    if (data.satoshi !== undefined) {
      output += `- Total: **${btc(data.satoshi)} BTC**\n`;
    }

    return output;
  }

  /**
   * Format fee data for display
   */
  formatFees(data: {
    list?: Array<{ feeRate: number; blockNumber?: number }>;
  }): string {
    if (!data.list || data.list.length === 0) {
      return "No fee data available.";
    }

    const fees = data.list;
    const fastest = fees[0]?.feeRate ?? 0;
    const halfHour = fees.find((f) => f.blockNumber === 3)?.feeRate ?? fees[1]?.feeRate ?? 0;
    const hour = fees.find((f) => f.blockNumber === 6)?.feeRate ?? fees[2]?.feeRate ?? 0;

    return `**Current Bitcoin Network Fees**\n\n`
      + `| Speed | Fee Rate | Est. Time |\n`
      + `|-------|----------|-----------|\n`
      + `| Fastest | ${fastest} sat/vB | ~10 min |\n`
      + `| 30 min | ${halfHour} sat/vB | ~30 min |\n`
      + `| 1 hour | ${hour} sat/vB | ~1 hour |\n`;
  }

  /**
   * Format BRC20 token info for display
   */
  formatBRC20Info(data: {
    ticker?: string;
    max?: string;
    minted?: string;
    holders?: number;
    txCount?: number;
  }): string {
    let output = `**BRC20 Token: \`${data.ticker ?? "Unknown"}\`**\n\n`;

    if (data.max !== undefined) {
      const max = parseInt(data.max, 10) / 10 ** 18;
      const minted = data.minted ? parseInt(data.minted, 10) / 10 ** 18 : 0;
      const progress = data.max ? ((minted / max) * 100).toFixed(1) : "0";

      output += `- Max Supply: **${max.toLocaleString()}**\n`;
      output += `- Minted: **${minted.toLocaleString()}** (${progress}%)\n`;
    }
    if (data.holders !== undefined) {
      output += `- Holders: **${data.holders.toLocaleString()}**\n`;
    }
    if (data.txCount !== undefined) {
      output += `- Transactions: **${data.txCount.toLocaleString()}**\n`;
    }

    return output;
  }

  /**
   * Create an error message
   */
  formatError(error: Error | string): string {
    const message = typeof error === "string" ? error : error.message;
    return `**Error:** ${message}`;
  }

  /**
   * Create a thinking message (when AI is processing)
   */
  formatThinking(toolName?: string): string {
    if (toolName) {
      return `Using ${this.getToolDisplayName(toolName)}...`;
    }
    return "Thinking...";
  }

  /**
   * Create a source citation
   */
  formatSource(source: DataSource): string {
    const parts = ["Data via UniSat API"];
    if (source.blockHeight) {
      parts.push(`Block ${source.blockHeight}`);
    }
    if (source.timestamp) {
      const date = new Date(source.timestamp);
      parts.push(date.toLocaleTimeString());
    }
    return parts.join(" • ");
  }
}
