/**
 * Doc Search - Main exports
 */

export { embed, embedBatch, getEmbeddingDimension } from "./embeddings.js";
export {
  loadDocuments,
  chunkDocuments,
  type Document,
  type DocumentChunk,
} from "./loader.js";
export {
  VectorStore,
  createVectorStore,
  type SearchResult,
  type VectorStoreConfig,
} from "./vector-store.js";
export {
  searchDocs,
  getDocCategories,
  formatSearchResults,
  handleSearchDocs,
  handleGetDocCategories,
  searchDocsToolDefinition,
  getDocCategoriesToolDefinition,
} from "./mcp-tools.js";
