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
 * iPad is explicitly separated:
 * - iPhone and iPod handhelds -> isIos = true, platformClass = "cf-platform-ios"
 * - iPad / iPadOS -> isIpadOs = true, platformClass = "cf-platform-ipados" (NEVER cf-platform-ios)
 * - Android, Windows, macOS, Linux -> isIos = false, platformClass = null
 */
export function detectPlatform(userAgent?: string, maxTouchPoints: number = 0): PlatformInfo {
  if (!userAgent || typeof userAgent !== "string") {
    return { isIos: false, isIpadOs: false, platformClass: null };
  }

  const ua = userAgent;

  // 1. Check iPad first to ensure it is never classified as iPhone
  // Standard iPad UA: contains /iPad/
  // Modern iPadOS (iOS 13+): identifies as Macintosh with multi-touch
  const isExplicitIpad = /iPad/i.test(ua);
  const isMacintoshDesktopTouch = /Macintosh/i.test(ua) && maxTouchPoints > 1;
  if (isExplicitIpad || isMacintoshDesktopTouch) {
    return {
      isIos: false,
      isIpadOs: true,
      platformClass: IPADOS_PLATFORM_CLASS,
    };
  }

  // 2. Android check: Android devices must never be classified as iOS
  if (/Android/i.test(ua)) {
    return {
      isIos: false,
      isIpadOs: false,
      platformClass: null,
    };
  }

  // 3. iPhone / iPod check:
  // Matches iPhone Safari, Chrome for iOS (CriOS), Firefox for iOS (FxiOS),
  // Edge for iOS (EdgiOS), Opera for iOS (OPT), and WebViews/standalone PWAs.
  const isIPhoneOrIPod = /iPhone|iPod/i.test(ua);

  if (isIPhoneOrIPod) {
    return {
      isIos: true,
      isIpadOs: false,
      platformClass: IOS_PLATFORM_CLASS,
    };
  }

  return {
    isIos: false,
    isIpadOs: false,
    platformClass: null,
  };
}
