/**
 * Index Documents Script
 * Run: pnpm index <docs-directory>
 */

import path from "path";
import { mkdir } from "fs/promises";
import { loadDocuments, chunkDocuments } from "../loader.js";
import { createVectorStore } from "../vector-store.js";

const DEFAULT_DOCS_DIR =
  "/Users/cybersinsloth/workplace/organizations/unisat/open-api-gateway-docs";

async function main() {
  const docsDir = process.argv[2] || DEFAULT_DOCS_DIR;
  const dbPath =
    process.argv[3] || path.join(process.cwd(), "data", "docs.lance");

  console.log("=== UniSat Doc Indexer ===");
  console.log(`Docs directory: ${docsDir}`);
  console.log(`Database path: ${dbPath}`);
  console.log("");

  // Ensure data directory exists
  await mkdir(path.dirname(dbPath), { recursive: true });

  // Load documents
  console.log("Loading documents...");
  const documents = await loadDocuments(docsDir);

  if (documents.length === 0) {
    console.error("No documents found!");
    process.exit(1);
  }

  // Chunk documents
  console.log("\nChunking documents...");
  const chunks = chunkDocuments(documents);

  // Create vector store and index
  console.log("\nCreating vector index...");
  const store = createVectorStore(dbPath);
  await store.init();
  await store.indexDocuments(chunks);

  console.log("\n=== Indexing Complete ===");
  console.log(`Documents: ${documents.length}`);
  console.log(`Chunks: ${chunks.length}`);
  console.log(`Database: ${dbPath}`);
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
