"use client";

import React from "react";
import { WifiOff, Wifi, X } from "lucide-react";
import { useNetworkStatus } from "./useNetworkStatus";

export function AdminOfflineBanner() {
  const { isOnline, wasOffline, dismissReconnectBanner } = useNetworkStatus();

  if (isOnline && !wasOffline) {
    return null;
  }

  // Offline alert banner
  if (!isOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        data-testid="admin-offline-banner"
        className="relative z-20 w-full bg-amber-500/15 border-b border-amber-500/30 text-amber-700 dark:text-amber-400 px-4 py-2 text-xs font-medium flex items-center justify-between shadow-xs transition-all animate-in slide-in-from-top duration-200"
      >
        <div className="flex items-center gap-2 min-w-0">
          <WifiOff className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 animate-pulse" />
          <span className="truncate">
            You&apos;re offline. Live data may be unavailable.
          </span>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 shrink-0 ml-2">
          Offline
        </span>
      </div>
    );
  }

  // Temporary connection restored feedback banner
  return (
    <div
      role="status"
      aria-live="polite"
      data-testid="admin-reconnect-banner"
      className="relative z-20 w-full bg-[#16B77A]/15 border-b border-[#16B77A]/30 text-[#16B77A] px-4 py-2 text-xs font-medium flex items-center justify-between shadow-xs transition-all animate-in slide-in-from-top duration-200"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Wifi className="w-4 h-4 shrink-0 text-[#16B77A]" />
        <span className="truncate font-semibold">
          Connection restored.
        </span>
      </div>
      <button
        type="button"
        onClick={dismissReconnectBanner}
        aria-label="Dismiss banner"
        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-[#16B77A]/20 transition-colors cursor-pointer text-[#16B77A]"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
