/**
 * ToolPanel Component
 * Displays real-time tool calls and their execution results
 */

"use client";

import * as React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { ToolCall, InteractionStep, InteractionStepType } from "@/types";
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Wrench,
  Clock,
  Zap,
  Brain,
  Search,
  CheckCircle,
  MessageSquare,
  Sparkles,
  AlertCircle,
} from "lucide-react";

interface ToolPanelProps {
  toolCalls: ToolCall[];
  interactionSteps: InteractionStep[];
  isStreaming: boolean;
}

// Tool metadata for display
const TOOL_META: Record<string, { displayName: string; icon: string; description: string }> = {
  get_current_block_info: {
    displayName: "Get Block Info",
    icon: "📦",
    description: "Fetching latest Bitcoin block data",
  },
  get_block_info: {
    displayName: "Get Block Info",
    icon: "📦",
    description: "Fetching Bitcoin block data",
  },
  get_tx_info: {
    displayName: "Get Transaction",
    icon: "📄",
    description: "Looking up transaction details",
  },
  get_address_balance: {
    displayName: "Get Balance",
    icon: "💰",
    description: "Checking address balance",
  },
  get_utxos: {
    displayName: "Get UTXOs",
    icon: "🔗",
    description: "Fetching unspent outputs",
  },
  get_recommended_fee: {
    displayName: "Get Fee Estimate",
    icon: "⛽",
    description: "Fetching current network fees",
  },
  get_fee_estimate: {
    displayName: "Get Fee Estimate",
    icon: "⛽",
    description: "Fetching current network fees",
  },
  get_brc20_token_info: {
    displayName: "BRC20 Token Info",
    icon: "🪙",
    description: "Fetching BRC20 token metadata",
  },
  get_brc20_balance: {
    displayName: "BRC20 Balance",
    icon: "📊",
    description: "Checking BRC20 token balance",
  },
  get_address_brc20_balance: {
    displayName: "BRC20 Balance",
    icon: "📊",
    description: "Checking BRC20 token balance",
  },
  get_brc20_holders: {
    displayName: "BRC20 Holders",
    icon: "👥",
    description: "Fetching top token holders",
  },
  get_brc20_transfer_history: {
    displayName: "BRC20 History",
    icon: "📜",
    description: "Fetching transfer history",
  },
  get_runes_token_info: {
    displayName: "Runes Token Info",
    icon: "🔮",
    description: "Fetching Runes token data",
  },
  get_runes_balance: {
    displayName: "Runes Balance",
    icon: "💎",
    description: "Checking Runes balance",
  },
  get_runes_holders: {
    displayName: "Runes Holders",
    icon: "👥",
    description: "Fetching Runes holders",
  },
  get_inscription: {
    displayName: "Get Inscription",
    icon: "🖼️",
    description: "Fetching inscription details",
  },
  get_inscription_info: {
    displayName: "Get Inscription",
    icon: "🖼️",
    description: "Fetching inscription details",
  },
  get_inscriptions_by_address: {
    displayName: "Address Inscriptions",
    icon: "🎨",
    description: "Fetching inscriptions for address",
  },
  get_brc20_market_stats: {
    displayName: "Market Stats",
    icon: "📈",
    description: "Fetching BRC20 market data",
  },
  get_brc20_order_list: {
    displayName: "Order List",
    icon: "📋",
    description: "Fetching BRC20 orders",
  },
};

function getToolMeta(toolName: string) {
  return TOOL_META[toolName] || {
    displayName: toolName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    icon: "🔧",
    description: "Executing tool",
  };
}

function formatArgs(args: Record<string, unknown>): string {
  const entries = Object.entries(args);
  if (entries.length === 0) return "No parameters";
  return entries
    .map(([key, value]) => `${key}: ${JSON.stringify(value)}`)
    .join(", ");
}

function formatResult(result: unknown): string {
  if (result === undefined || result === null) return "No result";
  if (typeof result === "string") return result;
  try {
    return JSON.stringify(result, null, 2);
  } catch {
    return String(result);
  }
}

interface ToolCallItemProps {
  tool: ToolCall;
  index: number;
  isLatest: boolean;
}

function ToolCallItem({ tool, index, isLatest }: ToolCallItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(isLatest);
  const meta = getToolMeta(tool.name);

  React.useEffect(() => {
    if (isLatest) setIsExpanded(true);
  }, [isLatest]);

  const statusColors = {
    pending: "bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30",
    completed: "bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30",
    failed: "bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30",
  };

  const StatusIcon = {
    pending: Loader2,
    completed: CheckCircle2,
    failed: XCircle,
  }[tool.status];

  return (
    <div
      className={`border rounded-lg overflow-hidden transition-all duration-200 ${
        isLatest && tool.status === "pending"
          ? "border-bitcoin-orange/50 bg-bitcoin-orange/5"
          : "border-border"
      }`}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
      >
        <span className="text-lg">{meta.icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">
              {meta.displayName}
            </span>
            <Badge
              variant="outline"
              className={`text-xs ${statusColors[tool.status]}`}
            >
              <StatusIcon
                className={`w-3 h-3 mr-1 ${
                  tool.status === "pending" ? "animate-spin" : ""
                }`}
              />
              {tool.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {meta.description}
          </p>
        </div>
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t bg-muted/30 p-3 space-y-3">
          {/* Arguments */}
          <div>
            <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
              <Zap className="w-3 h-3" />
              Parameters
            </div>
            <pre className="text-xs bg-background rounded p-2 overflow-x-auto">
              {formatArgs(tool.arguments)}
            </pre>
          </div>

          {/* Result */}
          {tool.status !== "pending" && (
            <div>
              <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground mb-1">
                {tool.status === "completed" ? (
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                ) : (
                  <XCircle className="w-3 h-3 text-red-500" />
                )}
                {tool.status === "completed" ? "Result" : "Error"}
              </div>
              <pre className="text-xs bg-background rounded p-2 overflow-x-auto max-h-48">
                {tool.error || formatResult(tool.result)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Step icon and color mappings
const STEP_CONFIG: Record<InteractionStepType, { icon: React.ReactNode; color: string; label: string }> = {
  user_message: {
    icon: <MessageSquare className="w-4 h-4" />,
    color: "text-blue-500",
    label: "Your Message",
  },
  ai_thinking: {
    icon: <Brain className="w-4 h-4 text-purple-500" />,
    color: "text-purple-500",
    label: "Thinking",
  },
  ai_planning: {
    icon: <Sparkles className="w-4 h-4 text-indigo-500" />,
    color: "text-indigo-500",
    label: "Planning",
  },
  tool_calling: {
    icon: <Zap className="w-4 h-4 text-yellow-500" />,
    color: "text-yellow-500",
    label: "Calling",
  },
  tool_executing: {
    icon: <Loader2 className="w-4 h-4 text-orange-500 animate-spin" />,
    color: "text-orange-500",
    label: "Executing",
  },
  tool_completed: {
    icon: <CheckCircle className="w-4 h-4 text-green-500" />,
    color: "text-green-500",
    label: "Completed",
  },
  processing_results: {
    icon: <Search className="w-4 h-4 text-cyan-500" />,
    color: "text-cyan-500",
    label: "Analyzing",
  },
  ai_responding: {
    icon: <MessageSquare className="w-4 h-4 text-blue-500" />,
    color: "text-blue-500",
    label: "Responding",
  },
  response_complete: {
    icon: <CheckCircle2 className="w-4 h-4 text-green-500" />,
    color: "text-green-500",
    label: "Complete",
  },
  error: {
    icon: <AlertCircle className="w-4 h-4 text-red-500" />,
    color: "text-red-500",
    label: "Error",
  },
};

interface TimelineItemProps {
  item: { type: "step" | "tool"; data: InteractionStep | ToolCall; timestamp: number };
  index: number;
  isLatest: boolean;
}

function TimelineItem({ item, index, isLatest }: TimelineItemProps) {
  const [isExpanded, setIsExpanded] = React.useState(isLatest);

  React.useEffect(() => {
    if (isLatest) setIsExpanded(true);
  }, [isLatest]);

  if (item.type === "tool") {
    const tool = item.data as ToolCall;
    return <ToolCallItem tool={tool} index={index} isLatest={isLatest} />;
  }

  const step = item.data as InteractionStep;
  const config = STEP_CONFIG[step.type];

  return (
    <div className="flex items-start gap-3 py-2 animate-fade-in">
      <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center ${config.color}`}>
        {config.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm">{step.title}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${config.color} bg-opacity-10`}>
            {config.label}
          </span>
        </div>
        {step.description && (
          <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
        )}
        {step.toolCall && (
          <div className="mt-2">
            <div className="text-xs font-medium text-muted-foreground mb-1">
              Tool: {step.toolCall.name}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function ToolPanel({ toolCalls, interactionSteps, isStreaming }: ToolPanelProps) {
  const panelRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new steps arrive
  React.useEffect(() => {
    if (panelRef.current) {
      panelRef.current.scrollTop = panelRef.current.scrollHeight;
    }
  }, [interactionSteps, toolCalls]);

  // Combine steps and tool calls for display
  const timelineItems = React.useMemo(() => {
    const items: Array<{ type: "step" | "tool"; data: InteractionStep | ToolCall; timestamp: number }> = [];

    // Add interaction steps
    for (const step of interactionSteps) {
      items.push({ type: "step", data: step, timestamp: step.timestamp });
    }

    // Add tool calls (not already represented in steps)
    for (const tool of toolCalls) {
      // Check if this tool call already has a step
      const hasStep = interactionSteps.some(
        (s) => s.toolCall?.id === tool.id
      );
      if (!hasStep) {
        items.push({ type: "tool", data: tool, timestamp: Date.now() });
      }
    }

    return items.sort((a, b) => a.timestamp - b.timestamp);
  }, [interactionSteps, toolCalls]);

  const pendingCount = toolCalls.filter((t) => t.status === "pending").length;
  const completedCount = toolCalls.filter((t) => t.status === "completed").length;

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b p-4">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-bitcoin-orange" />
          <h2 className="font-semibold">AI Process</h2>
          {isStreaming && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Step-by-step view of AI thinking and actions
        </p>

        {/* Stats */}
        {timelineItems.length > 0 && (
          <div className="flex gap-4 mt-3 text-xs">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-500" />
              <span className="text-muted-foreground">Steps:</span>
              <span className="font-medium">{timelineItems.length}</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-500" />
              <span className="text-muted-foreground">Done:</span>
              <span className="font-medium">{completedCount}</span>
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div
        ref={panelRef}
        className="flex-1 overflow-y-auto p-4 scrollbar-thin"
      >
        {timelineItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Wrench className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              AI interaction steps will appear here when you send a message.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Try asking about a specific address, token, or transaction.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {timelineItems.map((item, index) => (
              <TimelineItem
                key={item.type === "step" ? (item.data as InteractionStep).id : (item.data as ToolCall).id}
                item={item}
                index={index}
                isLatest={index === timelineItems.length - 1}
              />
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
