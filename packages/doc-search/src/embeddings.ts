/**
 * Embeddings Service
 * Supports multiple embedding providers
 */

import OpenAI from "openai";
import { writeFile, readFile } from "fs/promises";
import path from "path";

let openai: OpenAI | null = null;

// Embedding dimension varies by provider
const EMBEDDING_DIMENSION = 1536;

// Vocabulary file path
const VOCAB_FILE = path.join(process.cwd(), "data", "vocabulary.json");

// Global vocabulary for TF-IDF
let globalVocabulary: Map<string, number> | null = null;

/**
 * Get embedding provider from environment
 */
function getProvider(): "openai" | "tfidf" {
  return (process.env.EMBEDDING_PROVIDER as any) || "openai";
}

/**
 * Initialize the OpenAI client (lazy loaded)
 */
function getOpenAI(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required");
    }
    openai = new OpenAI({
      apiKey,
      baseURL: process.env.OPENAI_BASE_URL,
    });
  }
  return openai;
}

/**
 * Save vocabulary to file
 */
async function saveVocabulary(vocab: Map<string, number>): Promise<void> {
  const data = Object.fromEntries(vocab);
  await writeFile(VOCAB_FILE, JSON.stringify(data), "utf-8");
}

/**
 * Load vocabulary from file
 */
async function loadVocabulary(): Promise<Map<string, number> | null> {
  try {
    const data = await readFile(VOCAB_FILE, "utf-8");
    const obj = JSON.parse(data);
    return new Map(Object.entries(obj).map(([k, v]) => [k, Number(v)]));
  } catch {
    return null;
  }
}

/**
 * Simple TF-IDF based embedding (fallback)
 */
function tfidfEmbed(text: string, vocabulary: Map<string, number>): number[] {
  const words = text.toLowerCase().split(/\W+/).filter(Boolean);
  const wordCount = new Map<string, number>();

  for (const word of words) {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  }

  const vector = new Array(EMBEDDING_DIMENSION).fill(0);
  for (const [word, count] of wordCount) {
    let idx = vocabulary.get(word);
    if (idx === undefined) {
      idx = Math.abs(hashCode(word)) % EMBEDDING_DIMENSION;
    }
    vector[idx] += count / words.length;
  }

  // Normalize
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude > 0) {
    for (let i = 0; i < vector.length; i++) {
      vector[i] /= magnitude;
    }
  }

  return vector;
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return hash;
}

function buildVocabulary(texts: string[]): Map<string, number> {
  const wordFreq = new Map<string, number>();

  for (const text of texts) {
    const words = new Set(text.toLowerCase().split(/\W+/).filter(Boolean));
    for (const word of words) {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    }
  }

  const sorted = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, EMBEDDING_DIMENSION);

  const vocabulary = new Map<string, number>();
  sorted.forEach(([word], idx) => vocabulary.set(word, idx));

  return vocabulary;
}

/**
 * Generate embedding for a single text
 */
export async function embed(text: string): Promise<number[]> {
  const provider = getProvider();

  if (provider === "tfidf") {
    if (!globalVocabulary) {
      globalVocabulary = await loadVocabulary();
      if (!globalVocabulary) {
        globalVocabulary = new Map();
      }
    }
    return tfidfEmbed(text, globalVocabulary);
  }

  const client = getOpenAI();
  const model = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
  const response = await client.embeddings.create({
    model,
    input: text,
  });
  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts (batched)
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const provider = getProvider();

  if (provider === "tfidf") {
    console.log("Using TF-IDF embeddings (offline mode)");
    globalVocabulary = buildVocabulary(texts);
    await saveVocabulary(globalVocabulary);
    return texts.map((text) => tfidfEmbed(text, globalVocabulary!));
  }

  const client = getOpenAI();
  const model = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
  const results: number[][] = [];

  const batchSize = 100;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);

    const response = await client.embeddings.create({
      model,
      input: batch,
    });

    for (const data of response.data) {
      results.push(data.embedding);
    }

    if (texts.length > batchSize) {
      console.log(
        `Embedded \${Math.min(i + batchSize, texts.length)}/\${texts.length}`
      );
    }
  }

  return results;
}

/**
 * Get embedding dimension
 */
export function getEmbeddingDimension(): number {
  return EMBEDDING_DIMENSION;
}
