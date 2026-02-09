/**
 * ProviderSelector Component
 * Allows switching between AI providers with distinct visual styles
 */

"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Bot, Cpu } from "lucide-react";
import { useI18n, type TranslationKey } from "@/lib/i18n";

export type AIProvider = "openai" | "agentkit";

interface ProviderSelectorProps {
  value: AIProvider;
  onChange: (provider: AIProvider) => void;
  disabled?: boolean;
}

const providers: {
  id: AIProvider;
  name: string;
  icon: React.ReactNode;
  descKey: TranslationKey;
  activeClass: string;
}[] = [
  {
    id: "openai",
    name: "OpenAI",
    icon: <Bot className="w-4 h-4" />,
    descKey: "openaiDesc",
    activeClass: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm",
  },
  {
    id: "agentkit",
    name: "AgentKit",
    icon: <Cpu className="w-4 h-4" />,
    descKey: "agentkitDesc",
    activeClass: "bg-bitcoin-orange hover:bg-orange-600 text-white shadow-sm",
  },
];

export function ProviderSelector({ value, onChange, disabled }: ProviderSelectorProps) {
  const { t } = useI18n();

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
              ? provider.activeClass
              : "hover:bg-muted-foreground/10"
          }`}
          title={t(provider.descKey)}
        >
          {provider.icon}
          <span className="hidden sm:inline">{provider.name}</span>
        </Button>
      ))}
    </div>
  );
}
