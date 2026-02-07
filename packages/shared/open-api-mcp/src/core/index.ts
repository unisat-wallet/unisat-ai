/**
 * Core Blockchain Tools
 * Blocks, transactions, balance, UTXO, fees
 *
 * Using v1 API where available
 */

import {
  ToolDefinition,
  ToolCategory,
  ToolHandler,
  ToolContext,
} from "../types/index.js";

// ===== Tool Definitions =====

export const coreTools: ToolDefinition[] = [
  {
    name: "get_block_info",
    description:
      "Get Bitcoin block information by block height or hash. If neither is provided, returns the latest block.",
    category: "core" as ToolCategory,
    inputSchema: {
      type: "object",
      properties: {
        height: {
          type: "number",
          description:
            "Block height (e.g., 800000). Use height or hash, not both.",
        },
        hash: {
          type: "string",
          description:
            "Block hash (e.g., 00000000000000000001a0b102a3c4d...). Use hash or height, not both.",
        },
      },
    },
  },
  {
    name: "get_tx_info",
    description:
      "Get Bitcoin transaction details by transaction ID (txid). Returns transaction inputs, outputs, fees, and confirmation status.",
    category: "core" as ToolCategory,
    inputSchema: {
      type: "object",
      properties: {
        txid: {
          type: "string",
          description: "Transaction ID (e.g., 3b7ac1b2...)",
        },
      },
      required: ["txid"],
    },
  },
  {
    name: "get_address_balance",
    description:
      "Get Bitcoin address balance including total, available (confirmed), and pending (unconfirmed) amounts.",
    category: "core" as ToolCategory,
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
    name: "get_tx_inputs",
    description:
      "Get detailed information about transaction inputs. Shows the source addresses and amounts for each input.",
    category: "core" as ToolCategory,
    inputSchema: {
      type: "object",
      properties: {
        txid: {
          type: "string",
          description: "Transaction ID (e.g., 3b7ac1b2...)",
        },
      },
      required: ["txid"],
    },
  },
  {
    name: "get_tx_outputs",
    description:
      "Get detailed information about transaction outputs. Shows destination addresses, amounts, and output types for each output.",
    category: "core" as ToolCategory,
    inputSchema: {
      type: "object",
      properties: {
        txid: {
          type: "string",
          description: "Transaction ID (e.g., 3b7ac1b2...)",
        },
      },
      required: ["txid"],
    },
  },
  {
    name: "analyze_tx",
    description:
      "Comprehensive transaction analysis. Combines transaction details, inputs, outputs, fee calculation, and identifies the transaction type (regular, BRC20, Runes, Alkanes, Inscription, etc.).",
    category: "core" as ToolCategory,
    inputSchema: {
      type: "object",
      properties: {
        txid: {
          type: "string",
          description: "Transaction ID (e.g., 3b7ac1b2...)",
        },
      },
      required: ["txid"],
    },
  },
];

// ===== Tool Handlers =====

interface GetBlockArgs {
  height?: number;
  hash?: string;
}

interface GetTxArgs {
  txid: string;
}

interface GetAddressBalanceArgs {
  address: string;
}

interface AnalyzeTxArgs {
  txid: string;
}

export const coreHandlers: Record<string, ToolHandler> = {
  get_block_info: async (args: GetBlockArgs, context: ToolContext) => {
    const { height, hash } = args;

    if (height) {
      const {
        data: { code, msg, data },
      } = await context.client.v1.getBlockByHeight(height);
      if (code !== 0) {
        throw new Error(msg || "Failed to get block");
      }
      return data;
    }
    if (hash) {
      const {
        data: { code, msg, data },
      } = await context.client.v1.getBlockById(hash);
      if (code !== 0) {
        throw new Error(msg || "Failed to get block");
      }
      return data;
    }
    // If neither provided, get latest block info
    const {
      data: { code, msg, data },
    } = await context.client.v1.getBlockchainInfo();
    if (code !== 0) {
      throw new Error(msg || "Failed to get blockchain info");
    }
    return data;
  },

  get_tx_info: async (args: GetTxArgs, context: ToolContext) => {
    const {
      data: { code, msg, data },
    } = await context.client.v1.getTxById(args.txid);
    if (code !== 0) {
      throw new Error(msg || "Failed to get transaction");
    }
    return data;
  },

  get_address_balance: async (
    args: GetAddressBalanceArgs,
    context: ToolContext,
  ) => {
    const {
      data: { code, msg, data },
    } = await context.client.v1.getAvailableBalanceByAddress(args.address);
    if (code !== 0) {
      throw new Error(msg || "Failed to get address balance");
    }
    return data;
  },

  get_tx_inputs: async (args: GetTxArgs, context: ToolContext) => {
    const response = await context.client.v1.getInputsByTxId(args.txid, {
      cursor: 0,
      size: 100,
    });
    if (response.data.code !== 0) {
      throw new Error(response.data.msg || "Failed to get transaction inputs");
    }
    // Response data may be an array or a single object
    return response.data.data || [];
  },

  get_tx_outputs: async (args: GetTxArgs, context: ToolContext) => {
    const response = await context.client.v1.getOutputsByTxId(args.txid, {
      cursor: 0,
      size: 100,
    });
    if (response.data.code !== 0) {
      throw new Error(response.data.msg || "Failed to get transaction outputs");
    }
    // Response data may be an array or a single object
    return response.data.data || [];
  },

  analyze_tx: async (args: AnalyzeTxArgs, context: ToolContext) => {
    // Get basic transaction info
    const txResponse = await context.client.v1.getTxById(args.txid);
    if (txResponse.data.code !== 0 || !txResponse.data.data) {
      throw new Error(txResponse.data.msg || "Failed to get transaction");
    }
    const txData = txResponse.data.data;

    // Get inputs and outputs in parallel
    const [inputsResponse, outputsResponse] = await Promise.all([
      context.client.v1.getInputsByTxId(args.txid, { cursor: 0, size: 100 }),
      context.client.v1.getOutputsByTxId(args.txid, { cursor: 0, size: 100 }),
    ]);

    // Safely extract inputs and outputs, handling various response formats
    const inputsData = inputsResponse.data.code === 0
      ? (inputsResponse.data.data as any)
      : null;
    const outputsData = outputsResponse.data.code === 0
      ? (outputsResponse.data.data as any)
      : null;

    // Handle both array and single object responses
    const inputs = Array.isArray(inputsData)
      ? inputsData
      : inputsData
        ? [inputsData]
        : [];
    const outputs = Array.isArray(outputsData)
      ? outputsData
      : outputsData
        ? [outputsData]
        : [];

    // Calculate total input and output values
    const totalInput = inputs.reduce(
      (sum: number, inp: any) => sum + (inp.satoshi || 0),
      0,
    );
    const totalOutput = outputs.reduce(
      (sum: number, out: any) => sum + (out.satoshi || 0),
      0,
    );
    const fee = totalInput - totalOutput;
    const size = txData.size || 0;
    const feeRate = size > 0 ? Math.floor(fee / size) : 0;

    // Detect transaction type based on outputs and inscriptions
    const txTypes: string[] = [];

    // Check for inscriptions
    const hasInscription = outputs.some(
      (out: any) => out.inscriptions && out.inscriptions.length > 0,
    );
    if (hasInscription) {
      txTypes.push("Inscription");
    }

    // Check for BRC20 (looking for inscription with BRC20 content)
    const brc20Output = outputs.find((out: any) =>
      out.inscriptions?.some((insc: any) =>
        insc.content?.includes("text/plain") &&
        insc.body?.includes('"p":"brc-20"'),
      ),
    );
    if (brc20Output) {
      txTypes.push("BRC20");
    }

    // Check for Runes (Runes have specific output structure)
    const hasRunes = outputs.some((out: any) =>
      out.runes && out.runes.length > 0,
    );
    if (hasRunes) {
      txTypes.push("Runes");
    }

    // Check for Alkanes
    const hasAlkanes = outputs.some((out: any) =>
      out.alkanes && out.alkanes.length > 0,
    );
    if (hasAlkanes) {
      txTypes.push("Alkanes");
    }

    // Default to regular BTC transaction if no special types detected
    if (txTypes.length === 0) {
      txTypes.push("Regular BTC");
    }

    return {
      txid: args.txid,
      summary: {
        txType: txTypes.join(" + "),
        fee: fee.toString(),
        feeRate: `${feeRate} sat/vB`,
        size: size,
        confirmations: txData.confirmations || 0,
        blockHeight: txData.height,
        timestamp: txData.timestamp,
      },
      inputs: {
        count: txData.nIn || inputs.length,
        totalValue: totalInput.toString(),
        details: inputs,
      },
      outputs: {
        count: txData.nOut || outputs.length,
        totalValue: totalOutput.toString(),
        details: outputs,
      },
    };
  },
};
