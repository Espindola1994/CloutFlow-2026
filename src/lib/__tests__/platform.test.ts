import { describe, it, expect } from "vitest";
import { detectPlatform, IOS_PLATFORM_CLASS, IPADOS_PLATFORM_CLASS } from "../platform";

describe("detectPlatform", () => {
  it("should classify iPhone Safari as cf-platform-ios", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1";
    const res = detectPlatform(ua, 5);
    expect(res.isIos).toBe(true);
    expect(res.isIpadOs).toBe(false);
    expect(res.platformClass).toBe(IOS_PLATFORM_CLASS);
  });

  it("should classify iPhone Chrome (CriOS) as cf-platform-ios", () => {
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
    const res = detectPlatform(ua, 5);
    expect(res.isIos).toBe(true);
    expect(res.isIpadOs).toBe(false);
    expect(res.platformClass).toBe(IOS_PLATFORM_CLASS);
  });

  it("should classify other browsers on iPhone (Firefox FxiOS) as cf-platform-ios", () => {
    const ua =
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/125.0 Mobile/15E148 Safari/605.1.15";
    const res = detectPlatform(ua, 5);
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
});
