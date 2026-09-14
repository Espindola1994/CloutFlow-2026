"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export interface PwaInstallState {
  isInstallable: boolean;
  isStandalone: boolean;
  isIos: boolean;
  isPromptReady: boolean;
  promptInstall: () => Promise<"accepted" | "dismissed" | null>;
}

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

// Module-level early capture to catch beforeinstallprompt even before React renders/hydrates
let earlyCapturedPrompt: BeforeInstallPromptEvent | null = null;
const earlyListeners = new Set<(e: BeforeInstallPromptEvent | null) => void>();

export function _resetEarlyPromptForTesting() {
  earlyCapturedPrompt = null;
  earlyListeners.clear();
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    earlyCapturedPrompt = e as BeforeInstallPromptEvent;
    earlyListeners.forEach((listener) => listener(earlyCapturedPrompt));
  });

  window.addEventListener("appinstalled", () => {
    earlyCapturedPrompt = null;
    earlyListeners.forEach((listener) => listener(null));
  });
}

const AdminPwaInstallContext = createContext<PwaInstallState | null>(null);

export function AdminPwaInstallProvider({ children }: { children: React.ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => earlyCapturedPrompt
  );
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check if app is running standalone (installed mode)
    const checkStandalone = () => {
      const isStandaloneMedia =
        typeof window.matchMedia === "function"
          ? window.matchMedia("(display-mode: standalone)").matches
          : false;
      const isNavigatorStandalone =
        "standalone" in window.navigator &&
        Boolean((window.navigator as unknown as { standalone?: boolean }).standalone);
      return isStandaloneMedia || isNavigatorStandalone;
    };

    const standaloneActive = checkStandalone();
    setIsStandalone(standaloneActive);

    // 2. Check if iOS device (Safari on iOS doesn't support beforeinstallprompt)
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIos(isIosDevice);

    // 3. Sync with module-level early listener
    const syncWithEarly = (prompt: BeforeInstallPromptEvent | null) => {
      setDeferredPrompt(prompt);
    };
    earlyListeners.add(syncWithEarly);

    // If early event was already stored, ensure state matches
    if (earlyCapturedPrompt) {
      setDeferredPrompt(earlyCapturedPrompt);
    }

    // 4. Listen to beforeinstallprompt event (Chromium, Edge, Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      earlyCapturedPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      earlyCapturedPrompt = null;
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      earlyListeners.delete(syncWithEarly);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<"accepted" | "dismissed" | null> => {
    const promptToUse = deferredPrompt || earlyCapturedPrompt;
    if (!promptToUse) {
      return null;
    }

    try {
      await promptToUse.prompt();
      const choiceResult = await promptToUse.userChoice;
      earlyCapturedPrompt = null;
      setDeferredPrompt(null);
      if (choiceResult.outcome === "accepted") {
        setIsStandalone(true);
      }
      return choiceResult.outcome;
    } catch {
      return null;
    }
  }, [deferredPrompt]);

  const isPromptReady = deferredPrompt !== null || earlyCapturedPrompt !== null;

  const value: PwaInstallState = {
    isInstallable: !isStandalone && isPromptReady,
    isStandalone,
    isIos: !isStandalone && isIos,
    isPromptReady: !isStandalone && isPromptReady,
    promptInstall,
  };

  return (
    <AdminPwaInstallContext.Provider value={value}>
      {children}
    </AdminPwaInstallContext.Provider>
  );
}

/**
 * Hook to consume the Admin PWA installation state and trigger install prompt.
 * Falls back safely to local listener if rendered outside AdminPwaInstallProvider.
 */
export function usePwaInstall(): PwaInstallState {
  const context = useContext(AdminPwaInstallContext);
  if (context) {
    return context;
  }

  // Fallback for isolated component tests or standalone usage outside Provider
  const [localPrompt, setLocalPrompt] = useState<BeforeInstallPromptEvent | null>(
    () => earlyCapturedPrompt
  );
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);

  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMedia =
        typeof window.matchMedia === "function"
          ? window.matchMedia("(display-mode: standalone)").matches
          : false;
      const isNavigatorStandalone =
        "standalone" in window.navigator &&
        Boolean((window.navigator as unknown as { standalone?: boolean }).standalone);
      return isStandaloneMedia || isNavigatorStandalone;
    };

    setIsStandalone(checkStandalone());

    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIos(isIosDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      earlyCapturedPrompt = promptEvent;
      setLocalPrompt(promptEvent);
    };

    const handleAppInstalled = () => {
      earlyCapturedPrompt = null;
      setLocalPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<"accepted" | "dismissed" | null> => {
    const promptToUse = localPrompt || earlyCapturedPrompt;
    if (!promptToUse) {
      return null;
    }

    try {
      await promptToUse.prompt();
      const choiceResult = await promptToUse.userChoice;
      earlyCapturedPrompt = null;
      setLocalPrompt(null);
      if (choiceResult.outcome === "accepted") {
        setIsStandalone(true);
      }
      return choiceResult.outcome;
    } catch {
      return null;
    }
  }, [localPrompt]);

  const isPromptReady = localPrompt !== null || earlyCapturedPrompt !== null;

  return {
    isInstallable: !isStandalone && isPromptReady,
    isStandalone,
    isIos: !isStandalone && isIos,
    isPromptReady: !isStandalone && isPromptReady,
    promptInstall,
  };
}
