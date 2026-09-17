import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PublicPwaInstallBanner } from "../PublicPwaInstallBanner";

// Mock Next.js Image
vi.mock("next/image", () => ({
  default: (props: any) => <img {...props} />,
}));

describe("PublicPwaInstallBanner — UI 5.7.1 Dual PWA", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    // Default navigator user agent to generic Chrome desktop (not iOS)
    Object.defineProperty(window.navigator, "userAgent", {
      value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      configurable: true,
    });
    // Default standalone false
    Object.defineProperty(window.navigator, "standalone", {
      value: false,
      configurable: true,
    });
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
  });

  it("1. does not render when standalone (already installed)", () => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query === "(display-mode: standalone)",
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(<PublicPwaInstallBanner />);
    expect(screen.queryByTestId("public-pwa-banner")).toBeNull();
  });

  it("2. does not render when no beforeinstallprompt and not iOS", () => {
    render(<PublicPwaInstallBanner />);
    expect(screen.queryByTestId("public-pwa-banner")).toBeNull();
  });

  it("3. renders banner when beforeinstallprompt event is fired (Android / Chrome)", () => {
    render(<PublicPwaInstallBanner />);

    // Dispatch beforeinstallprompt
    const event = new Event("beforeinstallprompt");
    Object.assign(event, {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
    });

    fireEvent(window, event);

    expect(screen.getByTestId("public-pwa-banner")).toBeDefined();
    expect(screen.getByText("CloutFlow App")).toBeDefined();
    expect(screen.getByText("Get faster access to your profiles, plans and purchases.")).toBeDefined();
    expect(screen.queryByText("Grow faster with CloutFlow")).toBeNull();
  });

  it("4. clicking Install on Android/Chrome triggers native beforeinstallprompt", async () => {
    render(<PublicPwaInstallBanner />);

    const promptMock = vi.fn().mockResolvedValue(undefined);
    const event = new Event("beforeinstallprompt");
    Object.assign(event, {
      prompt: promptMock,
      userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
    });

    fireEvent(window, event);

    const installBtn = screen.getByTestId("public-pwa-install-btn");
    fireEvent.click(installBtn);

    expect(promptMock).toHaveBeenCalledTimes(1);
  });

  it("5. clicking 'Not now' dismisses the banner and persists in sessionStorage", () => {
    render(<PublicPwaInstallBanner />);

    const event = new Event("beforeinstallprompt");
    Object.assign(event, {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: "dismissed", platform: "web" }),
    });
    fireEvent(window, event);

    expect(screen.getByTestId("public-pwa-banner")).toBeDefined();

    const notNowBtn = screen.getByTestId("public-pwa-dismiss-btn");
    fireEvent.click(notNowBtn);

    expect(screen.queryByTestId("public-pwa-banner")).toBeNull();
    expect(sessionStorage.getItem("cf_pwa_public_dismissed_v1")).toBe("true");
  });

  it("6. renders banner on iOS Safari without beforeinstallprompt with iOS-exclusive copy", () => {
    Object.defineProperty(window.navigator, "userAgent", {
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      configurable: true,
    });

    render(<PublicPwaInstallBanner />);

    expect(screen.getByTestId("public-pwa-banner")).toBeDefined();
    expect(screen.getByText("CloutFlow App")).toBeDefined();
    expect(screen.getByText("Grow faster with CloutFlow")).toBeDefined();
    expect(
      screen.queryByText("Get faster access to your profiles, plans and purchases.")
    ).toBeNull();
  });

  it("7. clicking Install on iOS Safari opens instructions modal for Add to Home Screen", () => {
    Object.defineProperty(window.navigator, "userAgent", {
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      configurable: true,
    });

    render(<PublicPwaInstallBanner />);

    const installBtn = screen.getByTestId("public-pwa-install-btn");
    fireEvent.click(installBtn);

    expect(screen.getByTestId("ios-install-modal")).toBeDefined();
    expect(screen.getByText("Install CloutFlow")).toBeDefined();
    expect(screen.getByText(/Tap the/i)).toBeDefined();
    expect(screen.getByText(/Add to Home Screen/i)).toBeDefined();
    expect(screen.getByTestId("ios-install-got-it")).toBeDefined();
  });

  it("8. clicking 'Got it' closes iOS instructions modal", () => {
    Object.defineProperty(window.navigator, "userAgent", {
      value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
      configurable: true,
    });

    render(<PublicPwaInstallBanner />);

    fireEvent.click(screen.getByTestId("public-pwa-install-btn"));
    expect(screen.getByTestId("ios-install-modal")).toBeDefined();

    fireEvent.click(screen.getByTestId("ios-install-got-it"));
    expect(screen.queryByTestId("ios-install-modal")).toBeNull();
  });

  it("9. Android User Agent renders original copy and never iOS copy", () => {
    Object.defineProperty(window.navigator, "userAgent", {
      value: "Mozilla/5.0 (Linux; Android 14; 2311DRK48G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.230 Mobile Safari/537.36",
      configurable: true,
    });

    render(<PublicPwaInstallBanner />);

    const event = new Event("beforeinstallprompt");
    Object.assign(event, {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
    });
    fireEvent(window, event);

    expect(screen.getByTestId("public-pwa-banner")).toBeDefined();
    expect(screen.getByText("CloutFlow App")).toBeDefined();
    expect(screen.getByText("Get faster access to your profiles, plans and purchases.")).toBeDefined();
    expect(screen.queryByText("Grow faster with CloutFlow")).toBeNull();
  });

  it("10. Desktop User Agent renders original copy and never iOS copy", () => {
    Object.defineProperty(window.navigator, "userAgent", {
      value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      configurable: true,
    });

    render(<PublicPwaInstallBanner />);

    const event = new Event("beforeinstallprompt");
    Object.assign(event, {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
    });
    fireEvent(window, event);

    expect(screen.getByTestId("public-pwa-banner")).toBeDefined();
    expect(screen.getByText("CloutFlow App")).toBeDefined();
    expect(screen.getByText("Get faster access to your profiles, plans and purchases.")).toBeDefined();
    expect(screen.queryByText("Grow faster with CloutFlow")).toBeNull();
  });
});
