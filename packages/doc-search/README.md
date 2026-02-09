# @unisat/doc-search

Local vector search for UniSat documentation using LanceDB and TF-IDF/OpenAI embeddings.

## Features

- **Local Processing**: TF-IDF embeddings work offline, no external API needed
- **OpenAI Support**: Optional OpenAI embeddings for better semantic search
- **LanceDB**: File-based vector database, no server required
- **Semantic Search**: Find relevant docs using natural language queries
- **Chat App Integration**: Ready-to-use tools for AI integration

## Quick Start

### 1. Install dependencies

```bash
cd packages/doc-search
pnpm install
```

### 2. Index your documentation

```bash
# Index with TF-IDF (offline, no API needed)
EMBEDDING_PROVIDER=tfidf pnpm index

# Or with OpenAI embeddings (better quality, requires API key)
EMBEDDING_PROVIDER=openai OPENAI_API_KEY=sk-xxx pnpm index

# Specify custom docs directory
EMBEDDING_PROVIDER=tfidf pnpm index /path/to/your/docs
```

### 3. Search

```bash
# CLI search
EMBEDDING_PROVIDER=tfidf pnpm search "how to connect wallet"
EMBEDDING_PROVIDER=tfidf pnpm search "BRC20 API endpoints" 10
```

## Chat App Integration

The doc-search tools are automatically integrated into the Chat App. When users ask questions about:
- UniSat API integration
- Wallet connection guides
- SDK usage and examples
- Development tutorials

The AI will search the documentation to provide accurate answers.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `EMBEDDING_PROVIDER` | `openai` or `tfidf` | `tfidf` |
| `DOC_SEARCH_DB_PATH` | Path to LanceDB database | `./data/docs.lance` |
| `OPENAI_API_KEY` | Required for OpenAI embeddings | - |
| `OPENAI_BASE_URL` | Custom OpenAI API URL | - |

## How It Works

1. **Load**: Markdown files are loaded and parsed
2. **Chunk**: Documents are split into smaller chunks (~1000 chars)
3. **Embed**: Each chunk is converted to a vector (TF-IDF or OpenAI)
4. **Store**: Vectors are stored in LanceDB
5. **Search**: Queries are embedded and compared using cosine similarity

## MCP Tools

This package exports two tools for AI integration:

### search_docs

Search documentation with semantic search.

```typescript
{
  name: "search_docs",
  description: "Search UniSat documentation...",
  inputSchema: {
    query: string,      // Search query
    limit?: number,     // Max results (default: 5)
    category?: string   // Filter by category
  }
}
```

### get_doc_categories

List available documentation categories.

```typescript
{
  name: "get_doc_categories",
  description: "Get available documentation categories..."
}
```
