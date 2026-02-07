/**
 * Alkanes Protocol Tools
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

export const alkanesTools: ToolDefinition[] = [
  {
    name: "get_alkanes_token_info",
    description:
      "Get Alkanes token information including token name, symbol, total supply, divisibility, and deployment details.",
    category: "alkanes" as ToolCategory,
    inputSchema: {
      type: "object",
      properties: {
        alkaneId: {
          type: "string",
          description: "Alkane ID (e.g., 1:123456)",
        },
      },
      required: ["alkaneId"],
    },
  },
  {
    name: "get_alkanes_balance",
    description:
      "Get Alkanes token balance for a specific address. Shows available and pending balances.",
    category: "alkanes" as ToolCategory,
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Bitcoin address to check balance for",
        },
        alkaneId: {
          type: "string",
          description: "Alkane ID (e.g., 1:123456)",
        },
      },
      required: ["alkaneId", "address"],
    },
  },
  {
    name: "get_alkanes_holders",
    description:
      "Get top Alkanes token holders ranked by balance. Useful for understanding token distribution.",
    category: "alkanes" as ToolCategory,
    inputSchema: {
      type: "object",
      properties: {
        alkaneId: {
          type: "string",
          description: "Alkane ID (e.g., 1:123456)",
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
      required: ["alkaneId"],
    },
  },
  {
    name: "get_alkanes_status",
    description:
      "Get Alkanes global status including current block height, timestamp, and deployment status.",
    category: "alkanes" as ToolCategory,
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];

// ===== Tool Handlers =====

interface GetAlkanesTokenInfoArgs {
  alkaneId: string;
}

interface GetAlkanesBalanceArgs {
  alkaneId: string;
  address: string;
}

interface GetAlkanesHoldersArgs {
  alkaneId: string;
  start?: number;
  limit?: number;
}

interface GetAlkanesStatusArgs {}

export const alkanesHandlers: Record<string, ToolHandler> = {
  get_alkanes_token_info: async (
    args: GetAlkanesTokenInfoArgs,
    context: ToolContext,
  ) => {
    const {
      data: { code, msg, data },
    } = await context.client.v1.getAlkanesInfo(args.alkaneId);
    if (code !== 0) {
      throw new Error(msg || "Failed to get Alkanes token info");
    }
    return data;
  },

  get_alkanes_balance: async (
    args: GetAlkanesBalanceArgs,
    context: ToolContext,
  ) => {
    const {
      data: { code, msg, data },
    } = await context.client.v1.getAlkanesUtxoBalance(args.address, args.alkaneId);
    if (code !== 0) {
      throw new Error(msg || "Failed to get Alkanes balance");
    }
    return data;
  },

  get_alkanes_holders: async (
    args: GetAlkanesHoldersArgs,
    context: ToolContext,
  ) => {
    const {
      data: { code, msg, data },
    } = await context.client.v1.getAlkanesHolders(args.alkaneId, {
      start: args.start ?? 0,
      limit: args.limit ?? 100,
    });
    if (code !== 0) {
      throw new Error(msg || "Failed to get Alkanes holders");
    }
    return data;
  },

  get_alkanes_status: async (
    _args: GetAlkanesStatusArgs,
    context: ToolContext,
  ) => {
    const {
      data: { code, msg, data },
    } = await context.client.v1.getAlkanesStatus();
    if (code !== 0) {
      throw new Error(msg || "Failed to get Alkanes status");
    }
    return data;
  },
};
