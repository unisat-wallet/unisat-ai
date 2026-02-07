/**
 * ConnectionStatus Component
 * Displays WebSocket connection status
 */

"use client";

import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { cn } from "@/lib/utils";

interface ConnectionStatusProps {
  className?: string;
  wsUrl?: string;
}

export function ConnectionStatus({ className, wsUrl }: ConnectionStatusProps) {
  const { connectionState } = useWebSocket(wsUrl);

  const getStatusInfo = () => {
    switch (connectionState.status) {
      case "connected":
        return {
          icon: Wifi,
          text: "Connected",
          color: "text-green-500",
          bgColor: "bg-green-500/10",
        };
      case "connecting":
      case "reconnecting":
        return {
          icon: Loader2,
          text: connectionState.status === "reconnecting" ? "Reconnecting..." : "Connecting...",
          color: "text-yellow-500",
          bgColor: "bg-yellow-500/10",
        };
      case "disconnected":
        return {
          icon: WifiOff,
          text: "Disconnected",
          color: "text-red-500",
          bgColor: "bg-red-500/10",
        };
    }
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg",
        statusInfo.bgColor,
        className
      )}
    >
      <Icon
        className={cn(
          "w-4 h-4",
          statusInfo.color,
          connectionState.status === "reconnecting" && "animate-spin"
        )}
      />
      <span className={cn("text-sm font-medium", statusInfo.color)}>
        {statusInfo.text}
      </span>
    </div>
  );
}
