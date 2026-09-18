"use client";

import { useEffect } from "react";
import { detectPlatform, IOS_PLATFORM_CLASS, IPADOS_PLATFORM_CLASS } from "@/lib/platform";

/**
 * PlatformClassSync - Client component safety net for platform class persistence.
 *
 * Runs immediately after mount and during client-side hydration/lifecycle.
 * Ensures `cf-platform-ios` or `cf-platform-ipados` persists on `document.documentElement`
 * across Next.js / React 19 hydration cycles, theme switches, and dynamic client transitions,
 * without wiping or altering existing classes such as `dark` or font variables (`inter.variable`).
 *
 * Strictly uses `classList.toggle()` exclusively for platform classes.
 */
export function PlatformClassSync() {
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const platform = detectPlatform(
      window.navigator.userAgent,
      window.navigator.maxTouchPoints || 0
    );

    document.documentElement.classList.toggle(
      IOS_PLATFORM_CLASS,
      platform.isIos
    );
    document.documentElement.classList.toggle(
      IPADOS_PLATFORM_CLASS,
      platform.isIpadOs
    );
  }, []);

  return null;
}
