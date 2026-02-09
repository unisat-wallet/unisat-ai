/**
 * Landing Page
 */

import Link from "next/link";
import Image from "next/image";
import { Package, Shield, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="UniSat" width={32} height={32} unoptimized />
            <span className="text-xl font-bold">UniSat AI</span>
          </div>
          <nav className="flex items-center gap-6">
            <Link href="/chat" className="text-sm font-medium hover:text-bitcoin-orange transition-colors">
              Launch App
            </Link>
            <a
              href="https://docs.unisat.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-muted-foreground hover:text-bitcoin-orange transition-colors"
            >
              Docs
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-bitcoin-orange/10 border border-bitcoin-orange/20 text-bitcoin-orange text-sm font-medium">
            <TrendingUp className="w-4 h-4" />
            <span>Powered by Real-Time Packagechain Data</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight">
            Your AI-Powered
            <span className="block text-bitcoin-orange">Bitcoin Assistant</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Ask anything about Bitcoin, BRC20 tokens, Runes protocol, or Ordinals inscriptions.
            Get instant answers backed by real-time blockchain data from UniSat.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/chat">
              <Button size="lg" className="w-full sm:w-auto">
                Start Chatting
              </Button>
            </Link>
            <a
              href="https://github.com/unisat-wallet/unisat-ai"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                View on GitHub
              </Button>
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div className="max-w-5xl mx-auto mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={Package}
            title="Real-Time Package Data"
            description="Get the latest Bitcoin block information, transaction details, and network statistics instantly."
          />
          <FeatureCard
            icon={TrendingUp}
            title="BRC20 & Runes"
            description="Query token information, balances, holders, and market data for BRC20 and Runes tokens."
          />
          <FeatureCard
            icon={Shield}
            title="Ordinals Inscriptions"
            description="Explore inscription details, ownership, and metadata for Bitcoin Ordinals."
          />
        </div>

        {/* Example Queries */}
        <div className="max-w-3xl mx-auto mt-24">
          <h2 className="text-2xl font-bold text-center mb-8">
            Ask Me Anything
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ExampleQuery text="What's the latest Bitcoin block?" />
            <ExampleQuery text="What are the current network fees?" />
            <ExampleQuery text="Tell me about ORDI token" />
            <ExampleQuery text="Show me the balance of bc1q..." />
            <ExampleQuery text="What are Runes on Bitcoin?" />
            <ExampleQuery text="Get info on inscription 12345" />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-24">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>
            Powered by{" "}
            <a
              href="https://unisat.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-bitcoin-orange hover:underline"
            >
              UniSat
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="w-10 h-10 rounded-lg bg-bitcoin-orange/10 flex items-center justify-center mb-2">
          <Icon className="w-5 h-5 text-bitcoin-orange" />
        </div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}

function ExampleQuery({ text }: { text: string }) {
  return (
    <div className="p-4 rounded-lg border bg-card hover:border-bitcoin-orange/50 transition-colors cursor-pointer">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
