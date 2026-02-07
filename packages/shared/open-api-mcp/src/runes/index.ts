/**
 * Runes Protocol Tools
 * Token info, balance, holders
 *
 * Using v1 API directly
 */

import {
  ToolDefinition,
  ToolCategory,
  ToolHandler,
  ToolContext,
} from "../types/index.js";

// ===== Tool Definitions =====

export const runesTools: ToolDefinition[] = [
  {
    name: "get_runes_token_info",
    description:
      "Get Runes token information including rune name, symbol, total supply, divisibility, and deployment details.",
    category: "runes" as ToolCategory,
    inputSchema: {
      type: "object",
      properties: {
        runeName: {
          type: "string",
          description: "Rune name (e.g., BITCOIN•PEPE)",
        },
      },
      required: ["runeName"],
    },
  },
  {
    name: "get_runes_balance",
    description:
      "Get Runes token balance for a specific address. Shows available and pending balances.",
    category: "runes" as ToolCategory,
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Bitcoin address to check balance for",
        },
        runeName: {
          type: "string",
          description: "Rune name (e.g., BITCOIN•PEPE)",
        },
      },
      required: ["runeName", "address"],
    },
  },
  {
    name: "get_runes_holders",
    description:
      "Get top Runes token holders ranked by balance. Useful for understanding token distribution.",
    category: "runes" as ToolCategory,
    inputSchema: {
      type: "object",
      properties: {
        runeName: {
          type: "string",
          description: "Rune name (e.g., BITCOIN•PEPE)",
        },
        start: {
          type: "number",
          description: "Starting rank for holders list (default: 0)",
        },
        limit: {
          type: "number",
          description: "Maximum number of holders to return (default: 100)",
        },
      },
      required: ["runeName"],
    },
  },
];

// ===== Tool Handlers =====

interface GetRunesTokenInfoArgs {
  runeName: string;
}

interface GetRunesBalanceArgs {
  runeName: string;
  address: string;
}

interface GetRunesHoldersArgs {
  runeName: string;
  start?: number;
  limit?: number;
}

export const runesHandlers: Record<string, ToolHandler> = {
  get_runes_token_info: async (
    args: GetRunesTokenInfoArgs,
    context: ToolContext,
  ) => {
    const {
      data: { code, msg, data },
    } = await context.client.v1.getRuneInfo(args.runeName);
    if (code !== 0) {
      throw new Error(msg || "Failed to get Runes token info");
    }
    return data;
  },

  get_runes_balance: async (
    args: GetRunesBalanceArgs,
    context: ToolContext,
  ) => {
    const {
      data: { code, msg, data },
    } = await context.client.v1.getRunesBalance(args.address, args.runeName);
    if (code !== 0) {
      throw new Error(msg || "Failed to get Runes balance");
    }
    return data;
  },

  get_runes_holders: async (
    args: GetRunesHoldersArgs,
    context: ToolContext,
  ) => {
    const {
      data: { code, msg, data },
    } = await context.client.v1.getRuneHolders(args.runeName, {
      start: args.start ?? 0,
      limit: args.limit ?? 100,
    });
    if (code !== 0) {
      throw new Error(msg || "Failed to get Runes holders");
    }
    return data;
  },
};
