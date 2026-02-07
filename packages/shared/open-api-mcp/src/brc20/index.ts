/**
 * BRC20 Token Tools
 * Token info, balance, holders, history
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

export const brc20Tools: ToolDefinition[] = [
  {
    name: "get_brc20_token_info",
    description:
      "Get BRC20 token information including ticker name, max supply, minted supply, holder count, inscription number, and deployment details.",
    category: "brc20" as ToolCategory,
    inputSchema: {
      type: "object",
      properties: {
        ticker: {
          type: "string",
          description:
            "BRC20 token ticker symbol (e.g., ORDI, SATS, RATS, PIZZA). Case insensitive.",
        },
      },
      required: ["ticker"],
    },
  },
  {
    name: "get_brc20_balance",
    description:
      "Get BRC20 token balance for a specific address. Returns available balance, transferable balance, and overall holdings.",
    category: "brc20" as ToolCategory,
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Bitcoin address to check balance for",
        },
        ticker: {
          type: "string",
          description: "BRC20 token ticker symbol (e.g., ordi)",
        },
      },
      required: ["ticker", "address"],
    },
  },
  {
    name: "get_brc20_holders",
    description:
      "Get top BRC20 token holders ranked by balance. Useful for understanding token distribution and concentration.",
    category: "brc20" as ToolCategory,
    inputSchema: {
      type: "object",
      properties: {
        ticker: {
          type: "string",
          description: "BRC20 token ticker symbol (e.g., ordi)",
        },
        start: {
          type: "number",
          description:
            "Starting rank for holders list (default: 0 for top holder)",
        },
        limit: {
          type: "number",
          description:
            "Maximum number of holders to return (default: 100, max: 1000)",
        },
      },
      required: ["ticker"],
    },
  },
  {
    name: "get_brc20_history",
    description:
      "Get BRC20 token transfer history for an address. Shows mint (inscription) and transfer operations.",
    category: "brc20" as ToolCategory,
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Bitcoin address to get history for",
        },
        ticker: {
          type: "string",
          description: "Filter by token ticker (optional)",
        },
        start: {
          type: "number",
          description: "Starting offset (default: 0)",
        },
        limit: {
          type: "number",
          description:
            "Maximum number of records to return (default: 20, max: 100)",
        },
      },
      required: ["address"],
    },
  },
];

// ===== Tool Handlers =====

interface GetBrc20TokenInfoArgs {
  ticker: string;
}

interface GetBrc20BalanceArgs {
  ticker: string;
  address: string;
}

interface GetBrc20HoldersArgs {
  ticker: string;
  start?: number;
  limit?: number;
}

interface GetBrc20HistoryArgs {
  address: string;
  ticker?: string;
  type?: string;
  start?: number;
  limit?: number;
}

export const brc20Handlers: Record<string, ToolHandler> = {
  get_brc20_token_info: async (
    args: GetBrc20TokenInfoArgs,
    context: ToolContext,
  ) => {
    const {
      data: { code, msg, data },
    } = await context.client.v1.getBrc20InfoByTicker(args.ticker);
    if (code !== 0) {
      throw new Error(msg || "Failed to get BRC20 token info");
    }
    return data;
  },

  get_brc20_balance: async (
    args: GetBrc20BalanceArgs,
    context: ToolContext,
  ) => {
    const {
      data: { code, msg, data },
    } = await context.client.v1.getBrc20InfoByAddressAndTicker(
      args.address,
      args.ticker,
    );
    if (code !== 0) {
      throw new Error(msg || "Failed to get BRC20 balance");
    }
    return data;
  },

  get_brc20_holders: async (
    args: GetBrc20HoldersArgs,
    context: ToolContext,
  ) => {
    const {
      data: { code, msg, data },
    } = await context.client.v1.getBrc20HoldersByTicker(args.ticker, {
      start: args.start ?? 0,
      limit: args.limit ?? 100,
    });
    if (code !== 0) {
      throw new Error(msg || "Failed to get BRC20 holders");
    }
    return data;
  },

  get_brc20_history: async (
    args: GetBrc20HistoryArgs,
    context: ToolContext,
  ) => {
    if (args.ticker) {
      const {
        data: { code, msg, data },
      } = await context.client.v1.getBrc20HistoryByAddressAndTicker(
        args.address,
        args.ticker,
        {
          type: args.type as any,
          start: args.start ?? 0,
          limit: args.limit ?? 20,
        },
      );
      if (code !== 0) {
        throw new Error(
          msg || "Failed to get BRC20 history by address and ticker",
        );
      }
      return data;
    }
    const {
      data: { code, msg, data },
    } = await context.client.v1.getBrc20HistoryByAddress(args.address, {
      start: args.start ?? 0,
      limit: args.limit ?? 20,
    });
    if (code !== 0) {
      throw new Error(msg || "Failed to get BRC20 history by address");
    }
    return data;
  },
};
