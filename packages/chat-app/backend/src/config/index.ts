/**
 * Backend Configuration
 */

export interface Config {
  // Server
  port: number;
  wsPort: number;

  // API Keys
  unisatApiKey: string;

  // AI Provider
  aiProvider: "openai" | "agentkit";

  // Anthropic
  anthropicApiKey?: string;
  anthropicBaseURL?: string;
  anthropicModel?: string;
  anthropicMaxTokens?: number;

  // OpenAI
  openaiApiKey?: string;
  openaiBaseURL?: string;
  openaiModel?: string;
  openaiMaxTokens?: number;

  // AgentKit
  agentKitBaseURL?: string;
  agentKitApiKey?: string;

  // UniSat API
  unisatBaseURL: string;
  unisatTimeout: number;

  // Polling intervals (ms)
  blockPollInterval: number;
  feePollInterval: number;
  brc20PollInterval: number;

  // Cache
  cacheTTL: number;

  // Rate Limiting
  rateLimitWindowMs: number;
  rateLimitMax: number;

  // Doc Search
  docSearchDbPath: string;
  embeddingProvider: "openai" | "tfidf";
}

function getEnvVar(name: string, fallback?: string): string {
  const value = process.env[name];
  if (!value && fallback === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value ?? fallback ?? "";
}

export const config: Config = {
  // Server
  port: parseInt(getEnvVar("PORT", "3001"), 10),
  wsPort: parseInt(getEnvVar("WS_PORT", "3002"), 10),

  // API Keys
  unisatApiKey: getEnvVar("UNISAT_API_KEY"),

  // AI Provider (default: openai)
  aiProvider: (process.env.AI_PROVIDER as "openai" | "agentkit") || "openai",

  // Anthropic
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  anthropicBaseURL: process.env.ANTHROPIC_BASE_URL,
  anthropicModel: getEnvVar("ANTHROPIC_MODEL", "claude-3-5-sonnet-20241022"),
  anthropicMaxTokens: parseInt(getEnvVar("ANTHROPIC_MAX_TOKENS", "4096"), 10),

  // OpenAI
  openaiApiKey: process.env.OPENAI_API_KEY,
  openaiBaseURL: process.env.OPENAI_BASE_URL,
  openaiModel: getEnvVar("OPENAI_MODEL", "qwen-coder-plus"),
  openaiMaxTokens: parseInt(getEnvVar("OPENAI_MAX_TOKENS", "4096"), 10),

  // AgentKit
  agentKitBaseURL: process.env.AGENTKIT_BASE_URL,
  agentKitApiKey: process.env.AGENTKIT_API_KEY,

  // UniSat API
  unisatBaseURL: getEnvVar("UNISAT_BASE_URL", "https://open-api.unisat.io"),
  unisatTimeout: parseInt(getEnvVar("UNISAT_TIMEOUT", "30000"), 10),

  // Polling intervals
  blockPollInterval: parseInt(getEnvVar("BLOCK_POLL_INTERVAL", "60000"), 10), // 1 minute (reduced from 10 min)
  feePollInterval: parseInt(getEnvVar("FEE_POLL_INTERVAL", "30000"), 10), // 30 seconds
  brc20PollInterval: parseInt(getEnvVar("BRC20_POLL_INTERVAL", "120000"), 10), // 2 minutes

  // Cache
  cacheTTL: parseInt(getEnvVar("CACHE_TTL", "300000"), 10), // 5 minutes

  // Rate Limiting
  rateLimitWindowMs: parseInt(getEnvVar("RATE_LIMIT_WINDOW_MS", "60000"), 10), // 1 minute
  rateLimitMax: parseInt(getEnvVar("RATE_LIMIT_MAX", "30"), 10),

  // Doc Search
  docSearchDbPath: getEnvVar("DOC_SEARCH_DB_PATH", "../doc-search/data/docs.lance"),
  embeddingProvider: (process.env.EMBEDDING_PROVIDER as "openai" | "tfidf") || "tfidf",
};

// Validate required config
function validateConfig(): void {
  // UniSat API key is always required
  if (!config.unisatApiKey || config.unisatApiKey.trim() === "") {
    throw new Error("Missing required configuration: unisatApiKey (UNISAT_API_KEY)");
  }

  // Validate AI provider configuration
  if (config.aiProvider === "openai") {
    if (!config.openaiApiKey || config.openaiApiKey.trim() === "") {
      throw new Error("Missing required configuration for OpenAI: openaiApiKey (OPENAI_API_KEY)");
    }
  } else if (config.aiProvider === "agentkit") {
    if (!config.agentKitBaseURL || config.agentKitBaseURL.trim() === "") {
      throw new Error("Missing required configuration for AgentKit: agentKitBaseURL (AGENTKIT_BASE_URL)");
    }
    if (!config.agentKitApiKey || config.agentKitApiKey.trim() === "") {
      throw new Error("Missing required configuration for AgentKit: agentKitApiKey (AGENTKIT_API_KEY)");
    }
  }
}

validateConfig();
