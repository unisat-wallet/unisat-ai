/**
 * App Constants
 */

export const SUGGESTED_QUERIES = [
  {
    label: "Analyze ORDI Token",
    query: "Analyze the ORDI token - show me the price, holder distribution, and tell me if it's a good time to buy",
    icon: "TrendingUp",
    description: "Full token analysis",
  },
  {
    label: "Compare BRC20 Tokens",
    query: "Compare ORDI, SATS, and RATS tokens - show me holder counts, market activity, and which one has the best fundamentals",
    icon: "BarChart",
    description: "Multi-token comparison",
  },
  {
    label: "Check Wallet",
    query: "Analyze this wallet: bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh - show BTC balance, any BRC20 tokens, and recent activity",
    icon: "Wallet",
    description: "Wallet diagnostics",
  },
  {
    label: "Network Status",
    query: "What's the current state of the Bitcoin network? Show me block height, recommended fees, and mempool status",
    icon: "Activity",
    description: "Real-time network data",
  },
  {
    label: "Top ORDI Holders",
    query: "Show me the top 10 ORDI holders and analyze the whale concentration - is the token distribution healthy?",
    icon: "Users",
    description: "Holder analysis",
  },
  {
    label: "Fee Optimization",
    query: "What's the optimal fee right now? Should I wait for lower fees or is it urgent enough to pay premium?",
    icon: "Zap",
    description: "Smart fee advice",
  },
] as const;

export const TOOL_DISPLAY_NAMES: Record<string, string> = {
  get_block_info: "Get Block Info",
  get_tx_info: "Get Transaction Info",
  get_address_balance: "Get Balance",
  get_utxos: "Get UTXOs",
  get_fee_estimate: "Get Fee Estimates",
  get_brc20_token_info: "Get BRC20 Token Info",
  get_brc20_balance: "Get BRC20 Balance",
  get_brc20_holders: "Get BRC20 Holders",
  get_brc20_transfer_history: "Get BRC20 History",
  get_runes_token_info: "Get Runes Token Info",
  get_runes_balance: "Get Runes Balance",
  get_runes_holders: "Get Runes Holders",
  get_inscription: "Get Inscription",
  get_inscriptions_by_address: "Get Inscriptions",
  get_brc20_market_stats: "Get Market Stats",
  get_brc20_order_list: "Get Order Book",
};

export const RECONNECT_DELAYS = [1000, 2000, 5000, 10000, 30000];

export const MAX_MESSAGE_LENGTH = 5000;

export const SESSION_STORAGE_KEY = "unisat_chat_session_id";

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
