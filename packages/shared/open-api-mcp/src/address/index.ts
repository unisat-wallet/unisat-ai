/**
 * Address Profile Tools
 * Comprehensive address information including balances, token holdings, and activity
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

export const addressTools: ToolDefinition[] = [
  {
    name: "get_address_summary",
    description:
      "Get comprehensive address overview including BTC balance, token counts, and transaction history. Returns a summary of all assets and recent activity for the address.",
    category: "address" as ToolCategory,
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description:
            "Bitcoin address (legacy 1..., segwit bc1q..., or taproot bc1p...)",
        },
      },
      required: ["address"],
    },
  },
  {
    name: "get_address_brc20_list",
    description:
      "Get all BRC20 tokens held by an address with their balances. Returns a list of BRC20 tokens with available and transferable amounts.",
    category: "address" as ToolCategory,
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Bitcoin address",
        },
        start: {
          type: "number",
          description: "Starting offset (default: 0)",
        },
        limit: {
          type: "number",
          description: "Maximum number of tokens to return (default: 100)",
        },
      },
      required: ["address"],
    },
  },
  {
    name: "get_address_runes_list",
    description:
      "Get all Runes tokens held by an address with their balances. Returns a list of Runes tokens with available amounts.",
    category: "address" as ToolCategory,
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Bitcoin address",
        },
        start: {
          type: "number",
          description: "Starting offset (default: 0)",
        },
        limit: {
          type: "number",
          description: "Maximum number of tokens to return (default: 100)",
        },
      },
      required: ["address"],
    },
  },
  {
    name: "get_address_alkanes_list",
    description:
      "Get all Alkanes tokens held by an address with their balances. Returns a list of Alkanes tokens with available amounts.",
    category: "address" as ToolCategory,
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Bitcoin address",
        },
        start: {
          type: "number",
          description: "Starting offset (default: 0)",
        },
        limit: {
          type: "number",
          description: "Maximum number of tokens to return (default: 100)",
        },
      },
      required: ["address"],
    },
  },
];

// ===== Tool Handlers =====

interface GetAddressSummaryArgs {
  address: string;
}

interface GetAddressBrc20ListArgs {
  address: string;
  start?: number;
  limit?: number;
}

interface GetAddressRunesListArgs {
  address: string;
  start?: number;
  limit?: number;
}

interface GetAddressAlkanesListArgs {
  address: string;
  start?: number;
  limit?: number;
}

/**
 * Helper to handle v1 API response with code check
 * API response structure: { data: { code?: number, msg?: string, data?: T } }
 */
async function handleV1Response<T>(response: any): Promise<T> {
  const responseData = response.data;
  if (responseData && responseData.code === 0 && responseData.data !== undefined) {
    return responseData.data;
  }
  throw new Error(responseData?.msg || "API request failed");
}

export const addressHandlers: Record<string, ToolHandler> = {
  get_address_summary: async (
    args: GetAddressSummaryArgs,
    context: ToolContext,
  ) => {
    // Initialize all values with defaults
    let availableBalance = "0";
    let totalBalance = "0";
    let brc20Count = 0;
    let runesCount = 0;
    let inscriptionCount = 0;
    let utxoCount = 0;
    let txCount = 0;
    let lastTxTimestamp: number | undefined;
    let recentTxs: any[] = [];

    // Get BTC balance - wrap in try-catch for resilience
    try {
      const btcBalanceResponse = await context.client.v1.getAvailableBalanceByAddress(
        args.address,
      );
      const btcBalanceData = btcBalanceResponse.data?.data;
      availableBalance = btcBalanceData?.availableBalance?.toString() || "0";
      totalBalance = btcBalanceData?.totalBalance?.toString() || "0";
    } catch (error) {
      // Use default values if API call fails
      console.error(`Failed to get BTC balance: ${error}`);
    }

    // Get BRC20 summary for token count
    try {
      const brc20Response = await context.client.v1.getBrc20SummaryByAddress(
        args.address,
        { start: 0, limit: 100 },
      );
      if (brc20Response.data?.data?.detail) {
        brc20Count = brc20Response.data.data.detail.length;
      }
    } catch {
      // Ignore if no BRC20 data or error
    }

    // Get Runes balance list for token count
    try {
      const runesResponse = await context.client.v1.getRunesBalanceList(args.address, {
        start: 0,
        limit: 1,
      });
      runesCount = runesResponse.data?.data?.total || 0;
    } catch {
      // Ignore if no Runes data or error
    }

    // Get inscription count
    try {
      const inscriptionResponse = await context.client.v1.getInscriptionDataByAddress(
        args.address,
        { cursor: 0, size: 1 },
      );
      inscriptionCount = inscriptionResponse.data?.data?.total || 0;
    } catch {
      // Ignore if no inscription data or error
    }

    // UTXO count (spendable)
    try {
      const utxoResponse = await context.client.v1.getUtxoDataByAddress(args.address, {
        cursor: 0,
        size: 1,
      });
      utxoCount = utxoResponse.data?.data?.total || 0;
    } catch {
      // Ignore if no UTXO data or error
    }

    // Get transaction history
    try {
      const txHistoryResponse = await context.client.v1.getTxHistoryByAddress(
        args.address,
        { cursor: 0, size: 5 },
      );
      const txHistoryData = txHistoryResponse.data?.data;
      if (txHistoryData) {
        txCount = txHistoryData.total || 0;
        recentTxs = txHistoryData.detail || [];
        // Get the most recent transaction timestamp
        if (recentTxs.length > 0 && recentTxs[0].timestamp) {
          lastTxTimestamp = recentTxs[0].timestamp;
        }
      }
    } catch {
      // Ignore if no transaction history or error
    }

    return {
      address: args.address,
      btc: {
        availableBalance,
        totalBalance,
      },
      utxoCount,
      tokenCounts: {
        brc20: brc20Count,
        runes: runesCount,
        inscriptions: inscriptionCount,
      },
      transactions: {
        totalCount: txCount,
        lastTxTimestamp,
        recentTransactions: recentTxs,
      },
      timestamp: Date.now(),
    };
  },

  get_address_brc20_list: async (
    args: GetAddressBrc20ListArgs,
    context: ToolContext,
  ) => {
    const response = await context.client.v1.getBrc20SummaryByAddress(
      args.address,
      { start: args.start ?? 0, limit: args.limit ?? 100 },
    );
    return handleV1Response(response);
  },

  get_address_runes_list: async (
    args: GetAddressRunesListArgs,
    context: ToolContext,
  ) => {
    const response = await context.client.v1.getRunesBalanceList(args.address, {
      start: args.start ?? 0,
      limit: args.limit ?? 100,
    });
    return handleV1Response(response);
  },

  get_address_alkanes_list: async (
    args: GetAddressAlkanesListArgs,
    context: ToolContext,
  ) => {
    // Alkanes uses getRunesBalanceList to get balance data
    const response = await context.client.v1.getRunesBalanceList(args.address, {
      start: args.start ?? 0,
      limit: args.limit ?? 100,
    });

    // Get alkanes status for total count
    const alkanesStatusResponse = await context.client.v1.getAlkanesStatus();
    const alkanesStatusData = alkanesStatusResponse.data?.data;

    // Get balance data from runes response
    const balanceData = response.data?.data?.detail || [];

    return {
      total: alkanesStatusData?.alkanes || 0,
      detail: balanceData,
    };
  },
};
