/**
 * ProviderSelector Component
 * Allows switching between AI providers
 */

"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Bot, Cpu, Sparkles } from "lucide-react";

export type AIProvider = "anthropic" | "openai" | "agentkit";

interface ProviderSelectorProps {
  value: AIProvider;
  onChange: (provider: AIProvider) => void;
  disabled?: boolean;
}

const providers: { id: AIProvider; name: string; icon: React.ReactNode; description: string }[] = [
  {
    id: "anthropic",
    name: "Claude",
    icon: <Sparkles className="w-4 h-4" />,
    description: "Anthropic Claude",
  },
  {
    id: "openai",
    name: "OpenAI",
    icon: <Bot className="w-4 h-4" />,
    description: "OpenAI GPT",
  },
  {
    id: "agentkit",
    name: "AgentKit",
    icon: <Cpu className="w-4 h-4" />,
    description: "UniSat Agent",
  },
];

export function ProviderSelector({ value, onChange, disabled }: ProviderSelectorProps) {
  return (
    <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
      {providers.map((provider) => (
        <Button
          key={provider.id}
          variant={value === provider.id ? "default" : "ghost"}
          size="sm"
          onClick={() => onChange(provider.id)}
          disabled={disabled}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs transition-all ${
            value === provider.id
              ? "bg-bitcoin-orange text-white shadow-sm"
              : "hover:bg-muted-foreground/10"
          }`}
          title={provider.description}
        >
          {provider.icon}
          <span className="hidden sm:inline">{provider.name}</span>
        </Button>
      ))}
    </div>
  );
}
