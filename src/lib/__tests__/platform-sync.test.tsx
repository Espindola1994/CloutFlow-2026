import { describe, it, expect, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, act } from "@testing-library/react";
import { PlatformClassSync } from "../../components/platform/PlatformClassSync";
import { IOS_PLATFORM_CLASS, IPADOS_PLATFORM_CLASS } from "../platform";

describe("PlatformClassSync & Hydration / Theme persistence", () => {
  const originalNavigator = window.navigator;

  afterEach(() => {
    Object.defineProperty(window, "navigator", {
      value: originalNavigator,
      configurable: true,
      writable: true,
    });
    document.documentElement.className = "";
  });

  it("Phase 8 & 9: Persists cf-platform-ios across initial render, hydration, and theme switches (dark/light/dark)", () => {
    // Setup iPhone 18_5 UA
    const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";
    Object.defineProperty(window, "navigator", {
      value: {
        userAgent: ua,
        platform: "Win32",
        maxTouchPoints: 1,
      },
      configurable: true,
      writable: true,
    });

    // Before hydration / bootstrap initial class:
    document.documentElement.className = "dark inter_variable";
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    // Render PlatformClassSync (simulating hydration mount)
    render(<PlatformClassSync />);

    // After mount/hydration:
    expect(document.documentElement.classList.contains(IOS_PLATFORM_CLASS)).toBe(true);
    expect(document.documentElement.classList.contains(IPADOS_PLATFORM_CLASS)).toBe(false);
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains("inter_variable")).toBe(true);

    // Switch theme to light (simulating next-themes or admin theme switch)
    act(() => {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    });
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(document.documentElement.classList.contains(IOS_PLATFORM_CLASS)).toBe(true);

    // Switch theme back to dark
    act(() => {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    });
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(document.documentElement.classList.contains(IOS_PLATFORM_CLASS)).toBe(true);
  });

  it("Phase 10: UA Real iPhone 18_5, Win32, touch=1 activates cf-platform-ios", () => {
    const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1";
    Object.defineProperty(window, "navigator", {
      value: {
        userAgent: ua,
        platform: "Win32",
        maxTouchPoints: 1,
      },
      configurable: true,
      writable: true,
    });

    document.documentElement.className = "dark inter_variable";
    render(<PlatformClassSync />);

    expect(document.documentElement.classList.contains("cf-platform-ios")).toBe(true);
    expect(document.documentElement.classList.contains("cf-platform-ipados")).toBe(false);
  });

  it("Negative check: Android does NOT receive cf-platform-ios", () => {
    const ua = "Mozilla/5.0 (Linux; Android 13; POCO F5 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";
    Object.defineProperty(window, "navigator", {
      value: {
        userAgent: ua,
        platform: "Linux armv8l",
        maxTouchPoints: 5,
      },
      configurable: true,
      writable: true,
    });

    document.documentElement.className = "dark inter_variable";
    render(<PlatformClassSync />);

    expect(document.documentElement.classList.contains("cf-platform-ios")).toBe(false);
    expect(document.documentElement.classList.contains("cf-platform-ipados")).toBe(false);
  });

  it("Negative check: iPad receives cf-platform-ipados, NOT cf-platform-ios", () => {
    const ua = "Mozilla/5.0 (iPad; CPU OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1";
    Object.defineProperty(window, "navigator", {
      value: {
        userAgent: ua,
        platform: "iPad",
        maxTouchPoints: 5,
      },
      configurable: true,
      writable: true,
    });

    document.documentElement.className = "dark inter_variable";
    render(<PlatformClassSync />);

    expect(document.documentElement.classList.contains("cf-platform-ios")).toBe(false);
    expect(document.documentElement.classList.contains("cf-platform-ipados")).toBe(true);
  });

  it("Negative check: Desktop Windows does NOT receive cf-platform-ios", () => {
    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
    Object.defineProperty(window, "navigator", {
      value: {
        userAgent: ua,
        platform: "Win32",
        maxTouchPoints: 0,
      },
      configurable: true,
      writable: true,
    });

    document.documentElement.className = "dark inter_variable";
    render(<PlatformClassSync />);

    expect(document.documentElement.classList.contains("cf-platform-ios")).toBe(false);
    expect(document.documentElement.classList.contains("cf-platform-ipados")).toBe(false);
  });
});
