import { describe, it, expect } from "vitest";
import {
  detectPlatform,
  syncPlatformClass,
  IOS_PLATFORM_CLASS,
  IPADOS_PLATFORM_CLASS,
  PLATFORM_BOOTSTRAP_SCRIPT,
} from "../platform";

describe("detectPlatform", () => {
  it("should classify iPhone Safari as cf-platform-ios", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1";
    const res = detectPlatform(ua, 5);
    expect(res.isIos).toBe(true);
    expect(res.isIpadOs).toBe(false);
    expect(res.platformClass).toBe(IOS_PLATFORM_CLASS);
  });

  it("should classify iPhone Safari with touch=0 (Device Mode) as cf-platform-ios", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1";
    const res = detectPlatform(ua, 0);
    expect(res.isIos).toBe(true);
    expect(res.isIpadOs).toBe(false);
    expect(res.platformClass).toBe(IOS_PLATFORM_CLASS);
  });

  it("REGRESSION: should classify iPhone 16 Pro Max in DevTools (touch=0, viewport 440) as cf-platform-ios", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";
    const res = detectPlatform(ua, 0);
    expect(res.isIos).toBe(true);
    expect(res.isIpadOs).toBe(false);
    expect(res.platformClass).toBe(IOS_PLATFORM_CLASS);
  });

  it("should classify iPhone Chrome (CriOS) with touch=0 as cf-platform-ios", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.6367.88 Mobile/15E148 Safari/604.1";
    const res = detectPlatform(ua, 0);
    expect(res.isIos).toBe(true);
    expect(res.isIpadOs).toBe(false);
    expect(res.platformClass).toBe(IOS_PLATFORM_CLASS);
  });

  it("should classify iPhone Chrome (CriOS) with touch=5 as cf-platform-ios", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.6367.88 Mobile/15E148 Safari/604.1";
    const res = detectPlatform(ua, 5);
    expect(res.isIos).toBe(true);
    expect(res.isIpadOs).toBe(false);
    expect(res.platformClass).toBe(IOS_PLATFORM_CLASS);
  });

  it("should classify iPhone PWA standalone / WebKit Webview as cf-platform-ios", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
    const res = detectPlatform(ua, 0);
    expect(res.isIos).toBe(true);
    expect(res.isIpadOs).toBe(false);
    expect(res.platformClass).toBe(IOS_PLATFORM_CLASS);
  });

  it("should classify other browsers on iPhone (Firefox FxiOS) with touch=0 as cf-platform-ios", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/125.0 Mobile/15E148 Safari/605.1.15";
    const res = detectPlatform(ua, 0);
    expect(res.isIos).toBe(true);
    expect(res.isIpadOs).toBe(false);
    expect(res.platformClass).toBe(IOS_PLATFORM_CLASS);
  });

  it("should classify iPhone with Mobile and Safari as cf-platform-ios", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
    const res = detectPlatform(ua, 0);
    expect(res.isIos).toBe(true);
    expect(res.isIpadOs).toBe(false);
    expect(res.platformClass).toBe(IOS_PLATFORM_CLASS);
  });

  it("should NOT classify Android Chrome (Poco X7 Pro) as cf-platform-ios", () => {
    const ua =
      "Mozilla/5.0 (Linux; Android 14; 2311DRK48G Build/UP1A.231005.007) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.113 Mobile Safari/537.36";
    const res = detectPlatform(ua, 5);
    expect(res.isIos).toBe(false);
    expect(res.isIpadOs).toBe(false);
    expect(res.platformClass).toBeNull();
  });

  it("should NOT classify Android UA spoof containing Mobile as cf-platform-ios", () => {
    const ua = "Mozilla/5.0 (Linux; U; Android 13; en-US; Mobile) AppleWebKit/537.36";
    const res = detectPlatform(ua, 5);
    expect(res.isIos).toBe(false);
    expect(res.isIpadOs).toBe(false);
    expect(res.platformClass).toBeNull();
  });

  it("should NOT classify Windows Chrome as cf-platform-ios", () => {
    const ua =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
    const res = detectPlatform(ua, 0);
    expect(res.isIos).toBe(false);
    expect(res.isIpadOs).toBe(false);
    expect(res.platformClass).toBeNull();
  });

  it("should NOT classify macOS Desktop Safari as cf-platform-ios", () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";
    const res = detectPlatform(ua, 0);
    expect(res.isIos).toBe(false);
    expect(res.isIpadOs).toBe(false);
    expect(res.platformClass).toBeNull();
  });

  it("should classify traditional iPad Safari as cf-platform-ipados, NOT cf-platform-ios", () => {
    const ua =
      "Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1";
    const res = detectPlatform(ua, 5);
    expect(res.isIos).toBe(false);
    expect(res.isIpadOs).toBe(true);
    expect(res.platformClass).toBe(IPADOS_PLATFORM_CLASS);
  });

  it("should classify traditional iPad Safari with touch=0 as cf-platform-ipados, NOT cf-platform-ios", () => {
    const ua =
      "Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1";
    const res = detectPlatform(ua, 0);
    expect(res.isIos).toBe(false);
    expect(res.isIpadOs).toBe(true);
    expect(res.platformClass).toBe(IPADOS_PLATFORM_CLASS);
  });

  it("should classify modern iPadOS (Macintosh UA with touch) as cf-platform-ipados, NOT cf-platform-ios", () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15";
    // maxTouchPoints > 1 simulates iPadOS desktop-class browser
    const res = detectPlatform(ua, 5);
    expect(res.isIos).toBe(false);
    expect(res.isIpadOs).toBe(true);
    expect(res.platformClass).toBe(IPADOS_PLATFORM_CLASS);
  });

  it("should handle undefined or empty userAgent gracefully", () => {
    expect(detectPlatform(undefined, 0)).toEqual({
      isIos: false,
      isIpadOs: false,
      platformClass: null,
    });
    expect(detectPlatform("", 0)).toEqual({
      isIos: false,
      isIpadOs: false,
      platformClass: null,
    });
  });

  it("syncPlatformClass should clean up conflicting classes and apply exactly one without wiping other classes", () => {
    const set = new Set<string>(["dark", "cf-platform-ipados", "inter_module"]);
    const mockEl = {
      classList: {
        remove: (...classes: string[]) => {
          classes.forEach((c) => set.delete(c));
        },
        add: (...classes: string[]) => {
          classes.forEach((c) => set.add(c));
        },
        contains: (c: string) => set.has(c),
      },
    } as any;

    // Apply iPhone detection
    syncPlatformClass(mockEl, { isIos: true, isIpadOs: false, platformClass: IOS_PLATFORM_CLASS });
    expect(mockEl.classList.contains(IOS_PLATFORM_CLASS)).toBe(true);
    expect(mockEl.classList.contains(IPADOS_PLATFORM_CLASS)).toBe(false);
    expect(mockEl.classList.contains("dark")).toBe(true);
    expect(mockEl.classList.contains("inter_module")).toBe(true);

    // Now switch to Android / non-iOS
    syncPlatformClass(mockEl, { isIos: false, isIpadOs: false, platformClass: null });
    expect(mockEl.classList.contains(IOS_PLATFORM_CLASS)).toBe(false);
    expect(mockEl.classList.contains(IPADOS_PLATFORM_CLASS)).toBe(false);
    expect(mockEl.classList.contains("dark")).toBe(true);
    expect(mockEl.classList.contains("inter_module")).toBe(true);
  });
});
