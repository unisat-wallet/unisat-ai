/**
 * @unisat/tools - Shared tool definitions and handlers for UniSat API
 *
 * This package provides:
 * - Tool definitions (name, description, input schema)
 * - Tool handlers (execution logic)
 * - Types for extending functionality
 *
 * Used by:
 * - @unisat/mcp-server (MCP protocol format)
 * - Chat App backend (Anthropic tool format)
 */

// Export all types
export * from "./types/index.js";

// Export core tools
export * from "./core/index.js";

// Export BRC20 tools
export * from "./brc20/index.js";

// Export Runes tools
export * from "./runes/index.js";

// Export Alkanes tools
export * from "./alkanes/index.js";

// Export Address tools
export * from "./address/index.js";

// Export Inscriptions tools
export * from "./inscriptions/index.js";

// ===== Convenience exports =====

import { coreTools, coreHandlers } from "./core/index.js";
import { brc20Tools, brc20Handlers } from "./brc20/index.js";
import { runesTools, runesHandlers } from "./runes/index.js";
import { alkanesTools, alkanesHandlers } from "./alkanes/index.js";
import { addressTools, addressHandlers } from "./address/index.js";
import {
  inscriptionsTools,
  inscriptionsHandlers,
} from "./inscriptions/index.js";

/**
 * All tool definitions
 */
export const allTools = [
  ...coreTools,
  ...brc20Tools,
  ...runesTools,
  ...alkanesTools,
  ...addressTools,
  ...inscriptionsTools,
];

/**
 * All tool handlers grouped by category
 */
export const allHandlers = {
  ...coreHandlers,
  ...brc20Handlers,
  ...runesHandlers,
  ...alkanesHandlers,
  ...addressHandlers,
  ...inscriptionsHandlers,
};

/**
 * Get handler for a specific tool
 */
export function getHandler(
  toolName: string,
): ((args: any, context: any) => Promise<any>) | undefined {
  return allHandlers[toolName];
}

/**
 * Check if a tool exists
 */
export function hasTool(toolName: string): boolean {
  return toolName in allHandlers;
}

/**
 * Get tools by category
 */
export function getToolsByCategory(category: string) {
  return allTools.filter((tool) => tool.category === category);
}
