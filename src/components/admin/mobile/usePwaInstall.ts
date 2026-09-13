"use client";

import { useState, useEffect } from "react";

export interface PwaInstallState {
  isInstallable: boolean;
  isStandalone: boolean;
  isIos: boolean;
  promptInstall: () => Promise<"accepted" | "dismissed" | null>;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function usePwaInstall(): PwaInstallState {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);

  useEffect(() => {
    // 1. Check if app is running standalone (installed mode)
    const checkStandalone = () => {
      const isStandaloneMedia = typeof window.matchMedia === "function" ? window.matchMedia("(display-mode: standalone)").matches : false;
      // iOS Safari navigator.standalone flag
      const isNavigatorStandalone = "standalone" in window.navigator && Boolean((window.navigator as unknown as { standalone?: boolean }).standalone);
      return isStandaloneMedia || isNavigatorStandalone;
    };

    setIsStandalone(checkStandalone());

    // 2. Check if iOS device (Safari on iOS doesn't support beforeinstallprompt)
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    setIsIos(isIosDevice);

    // 3. Listen to beforeinstallprompt event (Chromium, Edge, Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<"accepted" | "dismissed" | null> => {
    if (!deferredPrompt) {
      return null;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (choiceResult.outcome === "accepted") {
        setIsStandalone(true);
      }
      return choiceResult.outcome;
    } catch {
      return null;
    }
  };

  return {
    isInstallable: !isStandalone && deferredPrompt !== null,
    isStandalone,
    isIos: !isStandalone && isIos,
    promptInstall,
  };
}
