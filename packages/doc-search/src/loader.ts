/**
 * Document Loader
 * Loads and parses markdown documentation files
 */

import { readFile } from "fs/promises";
import { glob } from "glob";
import matter from "gray-matter";
import path from "path";

export interface Document {
  id: string;
  title: string;
  content: string;
  path: string;
  category: string;
  metadata: Record<string, unknown>;
}

export interface DocumentChunk {
  id: string;
  docId: string;
  title: string;
  content: string;
  path: string;
  category: string;
  chunkIndex: number;
}

/**
 * Load all markdown files from a directory
 */
export async function loadDocuments(docsDir: string): Promise<Document[]> {
  const files = await glob("**/*.md", {
    cwd: docsDir,
    ignore: ["**/node_modules/**", "**/dist/**", "**/build/**"],
    absolute: false,
  });

  console.log(`Found ${files.length} markdown files`);

  const documents: Document[] = [];

  for (const file of files) {
    try {
      const fullPath = path.join(docsDir, file);
      const content = await readFile(fullPath, "utf-8");
      const { data: frontmatter, content: body } = matter(content);

      // Extract title from frontmatter or first heading
      let title = (frontmatter.title as string) || "";
      if (!title) {
        const headingMatch = body.match(/^#\s+(.+)$/m);
        title = headingMatch ? headingMatch[1] : path.basename(file, ".md");
      }

      // Determine category from path
      const pathParts = file.split(path.sep);
      const category = pathParts.length > 1 ? pathParts[0] : "general";

      documents.push({
        id: file.replace(/[\\/]/g, "_").replace(/\.md$/, ""),
        title,
        content: body.trim(),
        path: file,
        category,
        metadata: frontmatter,
      });
    } catch (error) {
      console.error(`Error loading ${file}:`, error);
    }
  }

  return documents;
}

/**
 * Split documents into chunks for better search granularity
 */
export function chunkDocuments(
  documents: Document[],
  maxChunkSize: number = 1000
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];

  for (const doc of documents) {
    // Split by sections (## headings) first
    const sections = doc.content.split(/(?=^##\s)/m);

    let chunkIndex = 0;
    for (const section of sections) {
      // If section is small enough, use as-is
      if (section.length <= maxChunkSize) {
        if (section.trim()) {
          chunks.push({
            id: `${doc.id}_chunk_${chunkIndex}`,
            docId: doc.id,
            title: doc.title,
            content: section.trim(),
            path: doc.path,
            category: doc.category,
            chunkIndex,
          });
          chunkIndex++;
        }
      } else {
        // Split large sections by paragraphs
        const paragraphs = section.split(/\n\n+/);
        let currentChunk = "";

        for (const para of paragraphs) {
          if ((currentChunk + para).length <= maxChunkSize) {
            currentChunk += (currentChunk ? "\n\n" : "") + para;
          } else {
            if (currentChunk.trim()) {
              chunks.push({
                id: `${doc.id}_chunk_${chunkIndex}`,
                docId: doc.id,
                title: doc.title,
                content: currentChunk.trim(),
                path: doc.path,
                category: doc.category,
                chunkIndex,
              });
              chunkIndex++;
            }
            currentChunk = para;
          }
        }

        // Don't forget the last chunk
        if (currentChunk.trim()) {
          chunks.push({
            id: `${doc.id}_chunk_${chunkIndex}`,
            docId: doc.id,
            title: doc.title,
            content: currentChunk.trim(),
            path: doc.path,
            category: doc.category,
            chunkIndex,
          });
          chunkIndex++;
        }
      }
    }
  }

  console.log(`Created ${chunks.length} chunks from ${documents.length} documents`);
  return chunks;
}
