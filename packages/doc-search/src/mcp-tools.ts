/**
 * Document Search MCP Tools
 * Provides AI with documentation search capabilities
 */

import path from "path";
import {
  VectorStore,
  createVectorStore,
  type SearchResult,
} from "./vector-store.js";

let vectorStore: VectorStore | null = null;
let isInitialized = false;

/**
 * Initialize the vector store (lazy)
 */
async function getVectorStore(): Promise<VectorStore> {
  if (!vectorStore || !isInitialized) {
    const dbPath =
      process.env.DOC_SEARCH_DB_PATH ||
      path.join(process.cwd(), "data", "docs.lance");

    vectorStore = createVectorStore(dbPath);
    await vectorStore.init();
    await vectorStore.openTable();
    isInitialized = true;
  }
  return vectorStore;
}

/**
 * Tool: Search documentation
 */
export async function searchDocs(
  query: string,
  limit: number = 5,
  category?: string
): Promise<SearchResult[]> {
  const store = await getVectorStore();
  return category
    ? store.searchWithFilter(query, category, limit)
    : store.search(query, limit);
}

/**
 * Tool: Get documentation categories
 */
export async function getDocCategories(): Promise<string[]> {
  const store = await getVectorStore();
  return store.getCategories();
}

/**
 * Format search results for AI consumption
 */
export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return "No relevant documentation found for this query.";
  }

  let output = `Found ${results.length} relevant documentation sections:\n\n`;

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    output += `### ${i + 1}. ${r.title} (${r.category})\n`;
    output += `**Source:** ${r.path}\n`;
    output += `**Relevance:** ${(r.score * 100).toFixed(1)}%\n\n`;
    output += `${r.content}\n\n`;
    output += `---\n\n`;
  }

  return output;
}

/**
 * MCP Tool Definition for search_docs
 */
export const searchDocsToolDefinition = {
  name: "search_docs",
  description:
    "Search UniSat documentation for information about APIs, SDKs, wallet integration, BRC20, Runes, Inscriptions, and more. Use this tool when users ask questions about UniSat development, API usage, or integration guides.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description:
          "The search query - describe what you're looking for in natural language",
      },
      limit: {
        type: "number",
        description:
          "Maximum number of results to return (default: 5, max: 10)",
      },
      category: {
        type: "string",
        description:
          "Optional: filter by documentation category (e.g., 'wallet-api', 'open-api')",
      },
    },
    required: ["query"],
  },
};

/**
 * MCP Tool Definition for get_doc_categories
 */
export const getDocCategoriesToolDefinition = {
  name: "get_doc_categories",
  description:
    "Get a list of available documentation categories. Use this to understand what documentation is available before searching.",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

/**
 * Handler for search_docs tool
 */
export async function handleSearchDocs(args: {
  query: string;
  limit?: number;
  category?: string;
}): Promise<string> {
  const limit = Math.min(args.limit || 5, 10);
  const results = await searchDocs(args.query, limit, args.category);
  return formatSearchResults(results);
}

/**
 * Handler for get_doc_categories tool
 */
export async function handleGetDocCategories(): Promise<string> {
  const categories = await getDocCategories();
  return `Available documentation categories:\n${categories.map((c) => `- ${c}`).join("\n")}`;
}
