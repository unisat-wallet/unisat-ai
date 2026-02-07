/**
 * Chat Layout
 */

"use client";

import { BlockTicker } from "@/components/realtime/BlockTicker";
import { FeeDisplay } from "@/components/realtime/FeeDisplay";
import { ConnectionStatus } from "@/components/realtime/ConnectionStatus";
import Link from "next/link";
import { Zap, Home } from "lucide-react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3002";

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <Home className="w-4 h-4" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-bitcoin-orange flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold">UniSat AI</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <BlockTicker wsUrl={WS_URL} />
            <FeeDisplay wsUrl={WS_URL} />
            <ConnectionStatus wsUrl={WS_URL} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
