/**
 * Chat Page
 */

"use client";

import { ChatContainer } from "@/components/chat/ChatContainer";
import { useChat } from "@/hooks/useChat";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:3002";

export default function ChatPage() {
  const { sessionId } = useChat();

  return (
    <div className="h-full">
      <ChatContainer wsUrl={WS_URL} sessionId={sessionId} />
    </div>
  );
}
