/**
 * Internationalization (i18n) support
 * Supports English and Traditional Chinese
 */

"use client";

import * as React from "react";

export type Language = "en" | "zh-TW";

export const translations = {
  en: {
    // Header
    title: "UniSat AI",
    connected: "Connected",
    connecting: "Connecting...",
    hideTools: "Hide Tools",
    showTools: "Show Tools",

    // Provider
    openaiMode: "OpenAI Chat Mode",
    agentkitMode: "AgentKit Agent Mode",
    openaiDesc: "OpenAI GPT - General Chat",
    agentkitDesc: "UniSat Agent - Agent Mode",

    // Welcome
    welcomeTitle: "UniSat AI Assistant",
    welcomeDesc: "Ask anything about Bitcoin, BRC20 tokens, Runes, or Ordinals inscriptions. I have access to real-time blockchain data.",

    // Input
    inputPlaceholder: "Ask about Bitcoin, BRC20, Runes, or Ordinals...",

    // Suggested queries
    suggestedTitle: "Try asking",
    query1: "What is the current Bitcoin block height?",
    query2: "Tell me about ORDI token - supply, holders, and mint status",
    query3: "Analyze this transaction: 3b40f8d37c8e...",
    query4: "Show me the top 10 holders of DOG•GO•TO•THE•MOON rune",
    query5: "Get the full profile of address bc1p...",
    query6: "What inscriptions does this address hold?",

    // Tool Panel
    toolPanelTitle: "Tool Calls",
    toolPanelEmpty: "No tool calls yet",
    toolPanelDesc: "Tool calls will appear here when the AI uses blockchain data",
    stepsTitle: "Interaction Steps",

    // Steps
    stepUserMessage: "Your message",
    stepAiThinking: "AI is thinking",
    stepAiPlanning: "AI is planning",
    stepToolCalling: "Calling tool",
    stepToolExecuting: "Executing",
    stepToolCompleted: "Completed",
    stepProcessingResults: "Processing results",
    stepAiResponding: "AI is responding",
    stepResponseComplete: "Response complete",

    // Language
    language: "Language",
    english: "English",
    chinese: "繁體中文",
  },
  "zh-TW": {
    // Header
    title: "UniSat AI",
    connected: "已連接",
    connecting: "連接中...",
    hideTools: "隱藏工具",
    showTools: "顯示工具",

    // Provider
    openaiMode: "OpenAI 通用對話模式",
    agentkitMode: "AgentKit 智能體模式",
    openaiDesc: "OpenAI GPT - 通用對話",
    agentkitDesc: "UniSat Agent - 智能體模式",

    // Welcome
    welcomeTitle: "UniSat AI 助手",
    welcomeDesc: "詢問任何關於比特幣、BRC20 代幣、Runes 或 Ordinals 銘文的問題。我可以訪問即時區塊鏈數據。",

    // Input
    inputPlaceholder: "詢問比特幣、BRC20、Runes 或 Ordinals 相關問題...",

    // Suggested queries
    suggestedTitle: "試試這些問題",
    query1: "當前比特幣區塊高度是多少？",
    query2: "介紹一下 ORDI 代幣 - 發行量、持有者數量和鑄造狀態",
    query3: "分析這筆交易: 3b40f8d37c8e...",
    query4: "顯示 DOG•GO•TO•THE•MOON 符文的前10名持有者",
    query5: "獲取地址 bc1p... 的完整資料",
    query6: "這個地址持有哪些銘文？",

    // Tool Panel
    toolPanelTitle: "工具調用",
    toolPanelEmpty: "暫無工具調用",
    toolPanelDesc: "當 AI 使用區塊鏈數據時，工具調用將顯示在這裡",
    stepsTitle: "交互步驟",

    // Steps
    stepUserMessage: "您的消息",
    stepAiThinking: "AI 思考中",
    stepAiPlanning: "AI 規劃中",
    stepToolCalling: "調用工具",
    stepToolExecuting: "執行中",
    stepToolCompleted: "已完成",
    stepProcessingResults: "處理結果",
    stepAiResponding: "AI 回覆中",
    stepResponseComplete: "回覆完成",

    // Language
    language: "語言",
    english: "English",
    chinese: "繁體中文",
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = React.createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Language>("en");

  // Load saved language on mount
  React.useEffect(() => {
    const saved = localStorage.getItem("unisat-ai-lang") as Language;
    if (saved && (saved === "en" || saved === "zh-TW")) {
      setLangState(saved);
    }
  }, []);

  const setLang = React.useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem("unisat-ai-lang", newLang);
  }, []);

  const t = React.useCallback(
    (key: TranslationKey): string => {
      return translations[lang][key] || key;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = React.useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}
