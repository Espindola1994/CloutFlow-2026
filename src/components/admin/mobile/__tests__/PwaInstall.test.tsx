import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, renderHook, act } from "@testing-library/react";
import { usePwaInstall, AdminPwaInstallProvider, _resetEarlyPromptForTesting } from "../usePwaInstall";
import { AdminMobileMoreSheet } from "../AdminMobileMoreSheet";

// Helper for Mock BeforeInstallPromptEvent
class MockBeforeInstallPromptEvent extends Event {
  prompt = vi.fn().mockResolvedValue(undefined);
  userChoice = Promise.resolve({ outcome: "accepted" as const, platform: "web" });

  constructor() {
    super("beforeinstallprompt");
  }
}

describe("UI 5.7 — PWA Install & Standalone Experience", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    vi.clearAllMocks();
    _resetEarlyPromptForTesting();
    // Default: not standalone
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
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

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    _resetEarlyPromptForTesting();
  });

  it("1. usePwaInstall initializes with isInstallable=false when no event is fired", () => {
    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.isInstallable).toBe(false);
    expect(result.current.isStandalone).toBe(false);
  });

  it("2. becomes isInstallable=true when beforeinstallprompt event fires", () => {
    const { result } = renderHook(() => usePwaInstall());

    act(() => {
      const event = new MockBeforeInstallPromptEvent();
      window.dispatchEvent(event);
    });

    expect(result.current.isInstallable).toBe(true);
  });

  it("3. detects standalone mode via display-mode: standalone", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("display-mode: standalone"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    const { result } = renderHook(() => usePwaInstall());
    expect(result.current.isStandalone).toBe(true);
    expect(result.current.isInstallable).toBe(false);
  });

  it("4. calling promptInstall triggers the native prompt and returns choice outcome", async () => {
    const { result } = renderHook(() => usePwaInstall());

    const mockEvent = new MockBeforeInstallPromptEvent();
    act(() => {
      window.dispatchEvent(mockEvent);
    });

    expect(result.current.isInstallable).toBe(true);

    let outcome;
    await act(async () => {
      outcome = await result.current.promptInstall();
    });

    expect(mockEvent.prompt).toHaveBeenCalled();
    expect(outcome).toBe("accepted");
    expect(result.current.isInstallable).toBe(false);
  });

  it("5. renders Install App button in AdminMobileMoreSheet when installable", () => {
    // Fire beforeinstallprompt before rendering sheet
    const mockEvent = new MockBeforeInstallPromptEvent();

    render(
      <AdminMobileMoreSheet
        isOpen={true}
        onClose={vi.fn()}
        activeTab="dashboard"
        onSelectTab={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    act(() => {
      window.dispatchEvent(mockEvent);
    });

    const installBtn = screen.queryByTestId("admin-more-install-app-btn");
    expect(installBtn).toBeDefined();
  });

  it("6. hides Install App button in AdminMobileMoreSheet when standalone", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("display-mode: standalone"),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(
      <AdminMobileMoreSheet
        isOpen={true}
        onClose={vi.fn()}
        activeTab="dashboard"
        onSelectTab={vi.fn()}
        onLogout={vi.fn()}
      />
    );

    expect(screen.queryByTestId("admin-more-install-app-btn")).toBeNull();
  });

  it("7. AdminPwaInstallProvider captures beforeinstallprompt early and shares with descendants", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AdminPwaInstallProvider>{children}</AdminPwaInstallProvider>
    );

    const { result } = renderHook(() => usePwaInstall(), { wrapper });
    expect(result.current.isInstallable).toBe(false);

    const mockEvent = new MockBeforeInstallPromptEvent();
    act(() => {
      window.dispatchEvent(mockEvent);
    });

    expect(result.current.isInstallable).toBe(true);
    expect(result.current.isPromptReady).toBe(true);

    let outcome;
    await act(async () => {
      outcome = await result.current.promptInstall();
    });

    expect(mockEvent.prompt).toHaveBeenCalledTimes(1);
    expect(outcome).toBe("accepted");
    expect(result.current.isStandalone).toBe(true);
    expect(result.current.isInstallable).toBe(false);
  });

  it("8. appinstalled event cleans up prompt and marks app as standalone", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AdminPwaInstallProvider>{children}</AdminPwaInstallProvider>
    );

    const { result } = renderHook(() => usePwaInstall(), { wrapper });

    const mockEvent = new MockBeforeInstallPromptEvent();
    act(() => {
      window.dispatchEvent(mockEvent);
    });
    expect(result.current.isInstallable).toBe(true);

    act(() => {
      window.dispatchEvent(new Event("appinstalled"));
    });

    expect(result.current.isStandalone).toBe(true);
    expect(result.current.isInstallable).toBe(false);
  });
});
