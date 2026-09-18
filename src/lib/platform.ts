/**
 * Platform detection helper for presentation-only responsive overrides.
 *
 * Exclusively identifies iPhone / iPod handheld devices for the `cf-platform-ios` class.
 * Never used for business logic, checkout, pricing, API, auth, or routing.
 */

export interface PlatformInfo {
  isIos: boolean;
  isIpadOs: boolean;
  platformClass: string | null;
}

export const IOS_PLATFORM_CLASS = "cf-platform-ios";
export const IPADOS_PLATFORM_CLASS = "cf-platform-ipados";

/**
 * Pure function to detect iOS (iPhone/iPod) vs iPadOS vs Android/Desktop
 * based on userAgent and maxTouchPoints.
 *
 * Evaluation rules:
 * 1. Android check: Android devices must NEVER be classified as iOS or iPadOS.
 * 2. iPhone / iPod check: explicitly matches iPhone or iPod. Works regardless of maxTouchPoints.
 * 3. iPad check: explicit iPad UA -> iPadOS, NEVER iPhone.
 * 4. Macintosh desktop touch: Macintosh UA + touch points > 1 -> iPadOS.
 * 5. Desktop Mac without touch -> none.
 * 6. Windows / Linux / other -> none.
 */
export function detectPlatform(userAgent?: string, maxTouchPoints: number = 0): PlatformInfo {
  if (!userAgent || typeof userAgent !== "string") {
    return { isIos: false, isIpadOs: false, platformClass: null };
  }

  const ua = userAgent;

  // 1. Android check: Android devices must NEVER be classified as iOS
  if (/Android/i.test(ua)) {
    return {
      isIos: false,
      isIpadOs: false,
      platformClass: null,
    };
  }

  // 2. iPhone / iPod check:
  // Explicitly matches iPhone or iPod handhelds regardless of maxTouchPoints
  // Matches iPhone Safari, Chrome for iOS (CriOS), Firefox for iOS (FxiOS),
  // Edge for iOS (EdgiOS), Opera for iOS (OPT), WebViews, and DevTools Device Mode.
  const isIPhoneOrIPod = /iPhone|iPod/i.test(ua);
  if (isIPhoneOrIPod) {
    return {
      isIos: true,
      isIpadOs: false,
      platformClass: IOS_PLATFORM_CLASS,
    };
  }

  // 3. iPad explicit check:
  const isExplicitIpad = /iPad/i.test(ua);

  // 4. Modern iPadOS (iOS 13+) identifies as Macintosh/MacIntel with multi-touch (>1)
  const isMacintoshDesktopTouch = /(?:Macintosh|MacIntel)/i.test(ua) && maxTouchPoints > 1;

  if (isExplicitIpad || isMacintoshDesktopTouch) {
    return {
      isIos: false,
      isIpadOs: true,
      platformClass: IPADOS_PLATFORM_CLASS,
    };
  }

  // 5. Desktop Mac sem touch, 6. Windows, and others
  return {
    isIos: false,
    isIpadOs: false,
    platformClass: null,
  };
}

/**
 * Synchronous client-side helper to apply the single-source-of-truth platform class.
 * Cleans up conflicting classes first (`cf-platform-ios`, `cf-platform-ipados`),
 * then applies exactly one class (or none), without touching other classes on documentElement.
 */
export function syncPlatformClass(docEl?: HTMLElement | null, platformInfo?: PlatformInfo): void {
  if (!docEl) return;
  const info =
    platformInfo ??
    detectPlatform(
      typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      typeof navigator !== "undefined" ? navigator.maxTouchPoints || 0 : 0
    );

  docEl.classList.remove(IOS_PLATFORM_CLASS, IPADOS_PLATFORM_CLASS);
  if (info.platformClass) {
    docEl.classList.add(info.platformClass);
  }
}

/**
 * Single source of truth bootstrap inline script.
 * Synchronously executed in <head> before first paint and before hydration.
 * Cleans up conflicting classes and applies exactly one platform class.
 */
export const PLATFORM_BOOTSTRAP_SCRIPT = `(function(){try{var ua=navigator.userAgent||'';var touch=navigator.maxTouchPoints||0;var doc=document.documentElement;if(/Android/i.test(ua)){doc.classList.remove('cf-platform-ios','cf-platform-ipados');return;}if(/iPhone|iPod/i.test(ua)){doc.classList.remove('cf-platform-ipados');doc.classList.add('cf-platform-ios');return;}var isPad=/iPad/i.test(ua)||((/(?:Macintosh|MacIntel)/i.test(ua)||navigator.platform==='MacIntel')&&touch>1);if(isPad){doc.classList.remove('cf-platform-ios');doc.classList.add('cf-platform-ipados');return;}doc.classList.remove('cf-platform-ios','cf-platform-ipados');}catch(e){}})();`;

