"use client";

import { useState, useEffect } from "react";

export interface NetworkState {
  isOnline: boolean;
  wasOffline: boolean;
  dismissReconnectBanner: () => void;
}

export function useNetworkStatus(): NetworkState {
  // Start with navigator.onLine if available, fallback to true
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    if (typeof window !== "undefined" && typeof window.navigator !== "undefined") {
      return window.navigator.onLine;
    }
    return true;
  });

  const [wasOffline, setWasOffline] = useState<boolean>(false);

  useEffect(() => {
    let reconnectTimer: NodeJS.Timeout | null = null;

    const handleOnline = () => {
      setIsOnline(true);
      setWasOffline(true);
      // Auto-hide reconnect banner after 4 seconds without any polling/refetch
      if (reconnectTimer) clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(() => {
        setWasOffline(false);
      }, 4000);
    };

    const handleOffline = () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      setIsOnline(false);
      setWasOffline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const dismissReconnectBanner = () => {
    setWasOffline(false);
  };

  return {
    isOnline,
    wasOffline,
    dismissReconnectBanner,
  };
}
