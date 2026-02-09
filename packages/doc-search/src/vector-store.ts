/**
 * Vector Store
 * LanceDB-based vector storage for document search
 */

import * as lancedb from "@lancedb/lancedb";
import path from "path";
import { writeFile, readFile } from "fs/promises";
import { embed, embedBatch, getEmbeddingDimension } from "./embeddings.js";
import type { DocumentChunk } from "./loader.js";

export interface SearchResult {
  id: string;
  docId: string;
  title: string;
  content: string;
  path: string;
  category: string;
  score: number;
}

export interface VectorStoreConfig {
  dbPath: string;
  tableName?: string;
}

export class VectorStore {
  private db: lancedb.Connection | null = null;
  private table: lancedb.Table | null = null;
  private config: VectorStoreConfig;

  constructor(config: VectorStoreConfig) {
    this.config = {
      tableName: "documents",
      ...config,
    };
  }

  /**
   * Initialize the database connection
   */
  async init(): Promise<void> {
    this.db = await lancedb.connect(this.config.dbPath);
    console.log(`Connected to LanceDB at ${this.config.dbPath}`);
  }

  /**
   * Create or overwrite the table with new documents
   */
  async indexDocuments(chunks: DocumentChunk[]): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized. Call init() first.");
    }

    console.log(`Generating embeddings for ${chunks.length} chunks...`);
    const contents = chunks.map((c) => c.content);
    const embeddings = await embedBatch(contents);

    // Prepare data for LanceDB
    const data = chunks.map((chunk, i) => ({
      id: chunk.id,
      docId: chunk.docId,
      title: chunk.title,
      content: chunk.content,
      path: chunk.path,
      category: chunk.category,
      chunkIndex: chunk.chunkIndex,
      vector: embeddings[i],
    }));

    console.log("Creating vector table...");

    // Drop existing table if it exists
    try {
      await this.db.dropTable(this.config.tableName!);
    } catch {
      // Table doesn't exist, ignore
    }

    // Create new table
    this.table = await this.db.createTable(this.config.tableName!, data);
    console.log(`Indexed ${chunks.length} chunks into table '${this.config.tableName}'`);
  }

  /**
   * Open existing table
   */
  async openTable(): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized. Call init() first.");
    }
    this.table = await this.db.openTable(this.config.tableName!);
  }

  /**
   * Search for similar documents
   */
  async search(query: string, limit: number = 5): Promise<SearchResult[]> {
    if (!this.table) {
      throw new Error("Table not opened. Call openTable() first.");
    }

    const queryVector = await embed(query);

    const results = await this.table
      .vectorSearch(queryVector)
      .limit(limit)
      .toArray();

    return results.map((r: any) => ({
      id: r.id,
      docId: r.docId,
      title: r.title,
      content: r.content,
      path: r.path,
      category: r.category,
      score: 1 - (r._distance || 0), // Convert distance to similarity score
    }));
  }

  /**
   * Search with category filter
   */
  async searchWithFilter(
    query: string,
    category?: string,
    limit: number = 5
  ): Promise<SearchResult[]> {
    if (!this.table) {
      throw new Error("Table not opened. Call openTable() first.");
    }

    const queryVector = await embed(query);

    let search = this.table.vectorSearch(queryVector).limit(limit);

    if (category) {
      search = search.where(`category = '${category}'`);
    }

    const results = await search.toArray();

    return results.map((r: any) => ({
      id: r.id,
      docId: r.docId,
      title: r.title,
      content: r.content,
      path: r.path,
      category: r.category,
      score: 1 - (r._distance || 0),
    }));
  }

  /**
   * Get all unique categories
   */
  async getCategories(): Promise<string[]> {
    if (!this.table) {
      throw new Error("Table not opened. Call openTable() first.");
    }

    const results = await this.table.query().select(["category"]).toArray();
    const categories = new Set(results.map((r: any) => r.category));
    return Array.from(categories);
  }

  /**
   * Close the database connection
   */
  async close(): Promise<void> {
    // LanceDB doesn't require explicit close
    this.db = null;
    this.table = null;
  }
}

/**
 * Create a default vector store instance
 */
export function createVectorStore(dbPath?: string): VectorStore {
  const defaultPath = path.join(process.cwd(), "data", "docs.lance");
  return new VectorStore({ dbPath: dbPath || defaultPath });
}
