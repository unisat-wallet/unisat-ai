/**
 * Ordinals Inscriptions Tools
 * Inscription details, address inscriptions
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

export const inscriptionsTools: ToolDefinition[] = [
  {
    name: "get_inscription_info",
    description:
      "Get detailed information about a specific Ordinals inscription by its inscription ID or number.",
    category: "inscriptions" as ToolCategory,
    inputSchema: {
      type: "object",
      properties: {
        inscriptionId: {
          type: "string",
          description:
            "Inscription ID (64-character hex string) or inscription number (e.g., 1234)",
        },
      },
      required: ["inscriptionId"],
    },
  },
  {
    name: "get_inscriptions_by_address",
    description:
      "Get all Ordinals inscriptions held by a specific address. Returns paginated list of inscriptions.",
    category: "inscriptions" as ToolCategory,
    inputSchema: {
      type: "object",
      properties: {
        address: {
          type: "string",
          description: "Bitcoin address to get inscriptions for",
        },
        start: {
          type: "number",
          description: "Starting offset (default: 0)",
        },
        limit: {
          type: "number",
          description:
            "Maximum number of inscriptions to return (default: 20, max: 100)",
        },
      },
      required: ["address"],
    },
  },
];

// ===== Tool Handlers =====

interface GetInscriptionInfoArgs {
  inscriptionId: string;
}

interface GetInscriptionsByAddressArgs {
  address: string;
  start?: number;
  limit?: number;
}

export const inscriptionsHandlers: Record<string, ToolHandler> = {
  get_inscription_info: async (
    args: GetInscriptionInfoArgs,
    context: ToolContext,
  ) => {
    const {
      data: { code, msg, data },
    } = await context.client.v1.getInscriptionInfo(args.inscriptionId);
    if (code !== 0) {
      throw new Error(msg || "Failed to get inscription info");
    }
    return data;
  },

  get_inscriptions_by_address: async (
    args: GetInscriptionsByAddressArgs,
    context: ToolContext,
  ) => {
    const {
      data: { code, msg, data },
    } = await context.client.v1.getInscriptionDataByAddress(args.address, {
      cursor: args.start ?? 0,
      size: args.limit ?? 20,
    });
    if (code !== 0) {
      throw new Error(msg || "Failed to get inscriptions by address");
    }
    return data;
  },
};
