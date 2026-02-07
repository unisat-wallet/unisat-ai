/**
 * Shared Tool Definitions
 * Common types for UniSat tool integration across MCP Server and Chat App
 */

import { UniSatClient } from "@unisat/open-api";

/**
 * Generic tool definition that can be adapted to different formats
 */
export interface ToolDefinition {
  name: string;
  description: string;
  category: ToolCategory;
  inputSchema: ToolSchema;
}

/**
 * Tool categories
 */
export type ToolCategory =
  | "core"
  | "brc20"
  | "runes"
  | "inscriptions"
  | "marketplace";

/**
 * JSON Schema for tool inputs/outputs
 */
export interface ToolSchema {
  type: "object";
  properties: Record<string, PropertySchema>;
  required?: string[];
}

/**
 * Property schema definition
 */
export interface PropertySchema {
  type: string;
  description?: string;
  enum?: string[];
}

/**
 * Tool execution context
 */
export interface ToolContext {
  client: UniSatClient;
}

/**
 * Tool execution result
 */
export type ToolResult = unknown;

/**
 * Tool handler function
 */
export type ToolHandler<T = any> = (
  args: T,
  context: ToolContext,
) => Promise<ToolResult>;

/**
 * Tool registry entry
 */
export interface ToolRegistryEntry {
  definition: ToolDefinition;
  handler: ToolHandler;
}
