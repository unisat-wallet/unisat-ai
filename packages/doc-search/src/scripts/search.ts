/**
 * Search Script
 * Run: pnpm search "your query"
 */

import path from "path";
import { createVectorStore } from "../vector-store.js";

async function main() {
  const query = process.argv[2];
  const limit = parseInt(process.argv[3] || "5", 10);
  const dbPath = path.join(process.cwd(), "data", "docs.lance");

  if (!query) {
    console.error("Usage: pnpm search <query> [limit]");
    process.exit(1);
  }

  console.log("=== UniSat Doc Search ===");
  console.log(`Query: "${query}"`);
  console.log(`Limit: ${limit}`);
  console.log("");

  const store = createVectorStore(dbPath);
  await store.init();
  await store.openTable();

  console.log("Searching...\n");
  const results = await store.search(query, limit);

  if (results.length === 0) {
    console.log("No results found.");
    return;
  }

  console.log(`Found ${results.length} results:\n`);

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    console.log(`--- Result ${i + 1} (score: ${r.score.toFixed(4)}) ---`);
    console.log(`Title: ${r.title}`);
    console.log(`Path: ${r.path}`);
    console.log(`Category: ${r.category}`);
    console.log(`Content preview: ${r.content.substring(0, 200)}...`);
    console.log("");
  }
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
