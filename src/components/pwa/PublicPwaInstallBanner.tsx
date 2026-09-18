"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Download, X, Share, PlusSquare, Smartphone, Check } from "lucide-react";
import { detectPlatform } from "@/lib/platform";

const DISMISS_KEY = "cf_pwa_public_dismissed_v1";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function PublicPwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIos, setIsIos] = useState<boolean>(false);
  const [isIosPlatform, setIsIosPlatform] = useState<boolean>(false);
  const [showIosModal, setShowIosModal] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(true); // start true until mounted & checked
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);

    // 1. Check standalone
    const checkStandalone = () => {
      const isStandaloneMedia =
        typeof window.matchMedia === "function"
          ? window.matchMedia("(display-mode: standalone)").matches
          : false;
      const isNavStandalone =
        "standalone" in window.navigator &&
        Boolean((window.navigator as unknown as { standalone?: boolean }).standalone);
      return isStandaloneMedia || isNavStandalone;
    };

    const standalone = checkStandalone();
    setIsStandalone(standalone);
    if (standalone) return;

    // 2. Check dismiss in sessionStorage (session-scoped dismiss per spec requirement)
    try {
      const dismissed = sessionStorage.getItem(DISMISS_KEY);
      if (dismissed === "true") {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }
    } catch {
      setIsDismissed(false);
    }

    // 3. Detect iOS Safari (no beforeinstallprompt)
    const ua = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(ua);
    const isSafari = /safari/.test(ua) && !/chrome|crios|fxios|edgios|android/.test(ua);
    setIsIos(isIosDevice && isSafari);

    // Platform detection: iPhone/iPod via detectPlatform and html.cf-platform-ios
    const platform = detectPlatform(window.navigator.userAgent, window.navigator.maxTouchPoints || 0);
    const hasIosHtmlClass =
      typeof document !== "undefined" &&
      document.documentElement.classList.contains("cf-platform-ios");
    setIsIosPlatform(platform.isIos || hasIosHtmlClass);

    // Check if user came from Admin Settings with ?install=public
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("install") === "public") {
        // Clear param without reload
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete("install");
        window.history.replaceState({}, "", newUrl.toString());
        setIsDismissed(false);
        try {
          sessionStorage.removeItem(DISMISS_KEY);
        } catch {
          // ignore
        }
        if (isIosDevice && isSafari) {
          setShowIosModal(true);
        }
      }
    }

    // 4. beforeinstallprompt listener
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

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, "true");
    } catch {
      // ignore
    }
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosModal(true);
      return;
    }

    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === "accepted") {
          setIsStandalone(true);
        }
        setDeferredPrompt(null);
      } catch {
        // Fallback gracefully
      }
    }
  };

  if (!mounted || isStandalone || isDismissed) {
    return null;
  }

  // Only show if:
  // - Android / Chromium has beforeinstallprompt
  // - OR iOS Safari (which doesn't have beforeinstallprompt)
  const canShowBanner = Boolean(deferredPrompt || isIos);

  if (!canShowBanner) {
    return null;
  }

  return (
    <>
      {/* Top Banner */}
      <aside
        data-testid="public-pwa-banner"
        aria-label="CloutFlow App Installation"
        className="w-full bg-[#0E1322]/95 border-b border-[#1E2640] backdrop-blur-md px-4 py-2.5 z-40 sticky top-0 transition-all text-white shadow-md"
        style={{
          paddingTop: "calc(0.625rem + env(safe-area-inset-top, 0px))",
        }}
      >
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white border border-white/10 flex items-center justify-center shrink-0 shadow-inner overflow-hidden p-1">
              <Image
                src="/icon-192.png"
                alt="CloutFlow App"
                width={32}
                height={32}
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white tracking-wide truncate">
                CloutFlow App
              </div>
              <div className="text-[11px] text-[#8E9BB5] truncate">
                {isIosPlatform ? (
                  <>
                    <span className="cf-pwa-subtitle-default">Grow faster with CloutFlow</span>
                    <span className="cf-pwa-subtitle-ios-large">Faster access to CloutFlow</span>
                  </>
                ) : (
                  "Get faster access to your profiles, plans and purchases."
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleInstallClick}
              data-testid="public-pwa-install-btn"
              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-[#8748F7] hover:bg-[#7837E8] active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              data-testid="public-pwa-dismiss-btn"
              className="px-2.5 py-1.5 rounded-lg text-xs text-[#8E9BB5] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              Not now
            </button>
          </div>
        </div>
      </aside>

      {/* iOS Add to Home Screen Instruction Modal */}
      {showIosModal && (
        <div
          data-testid="ios-install-modal"
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowIosModal(false)}
        >
          <div
            className="w-full max-w-sm bg-[#121829] border border-[#242F4D] rounded-2xl p-5 shadow-2xl space-y-4 text-white animate-in fade-in slide-in-from-bottom-4 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#8748F7]/20 border border-[#8748F7]/30 flex items-center justify-center text-[#A776FF]">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Install CloutFlow</h3>
                  <p className="text-xs text-[#8E9BB5]">Customer-facing App</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIosModal(false)}
                className="text-[#8E9BB5] hover:text-white p-1"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <ol className="space-y-2.5 text-xs text-[#CCD5E5] bg-[#0A0E1A] p-3.5 rounded-xl border border-white/5">
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#8748F7]/30 text-[#C4A3FF] flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                  1
                </span>
                <span>
                  Tap the <strong className="text-white">Share</strong> button in Safari{" "}
                  <Share className="w-3.5 h-3.5 inline-block mx-0.5 text-[#8748F7]" />.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#8748F7]/30 text-[#C4A3FF] flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                  2
                </span>
                <span>
                  Scroll down and tap <strong className="text-white">&quot;Add to Home Screen&quot;</strong>{" "}
                  <PlusSquare className="w-3.5 h-3.5 inline-block mx-0.5 text-[#8748F7]" />.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#8748F7]/30 text-[#C4A3FF] flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                  3
                </span>
                <span>
                  Enable <strong className="text-white">&quot;Open as Web App&quot;</strong> if shown.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#8748F7]/30 text-[#C4A3FF] flex items-center justify-center shrink-0 font-bold text-[11px] mt-0.5">
                  4
                </span>
                <span>
                  Tap <strong className="text-white">Add</strong> in the top right corner.
                </span>
              </li>
            </ol>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowIosModal(false)}
                data-testid="ios-install-got-it"
                className="flex-1 py-2.5 rounded-lg text-xs font-semibold text-white bg-[#8748F7] hover:bg-[#7837E8] active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Check className="w-4 h-4" />
                <span>Got it</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowIosModal(false);
                  handleDismiss();
                }}
                data-testid="ios-install-not-now"
                className="px-4 py-2.5 rounded-lg text-xs font-medium text-[#8E9BB5] hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
              >
                Not now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
