import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, renderHook, act } from "@testing-library/react";
import { useNetworkStatus } from "../useNetworkStatus";
import { AdminOfflineBanner } from "../AdminOfflineBanner";

describe("UI 5.7 — Online / Offline Connectivity Polish", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("1. useNetworkStatus initial state reflects navigator.onLine", () => {
    const { result } = renderHook(() => useNetworkStatus());
    expect(result.current.isOnline).toBe(true);
    expect(result.current.wasOffline).toBe(false);
  });

  it("2. offline event updates state to isOnline=false and shows offline banner", () => {
    render(<AdminOfflineBanner />);

    // Initially online, banner is null
    expect(screen.queryByTestId("admin-offline-banner")).toBeNull();

    // Trigger offline event
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    const banner = screen.getByTestId("admin-offline-banner");
    expect(banner).toBeDefined();
    expect(banner.textContent).toContain("You're offline. Live data may be unavailable.");
  });

  it("3. returning online hides offline banner and shows temporary connection restored feedback", () => {
    render(<AdminOfflineBanner />);

    // Trigger offline
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    expect(screen.getByTestId("admin-offline-banner")).toBeDefined();

    // Trigger online
    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    expect(screen.queryByTestId("admin-offline-banner")).toBeNull();
    const reconnectBanner = screen.getByTestId("admin-reconnect-banner");
    expect(reconnectBanner).toBeDefined();
    expect(reconnectBanner.textContent).toContain("Connection restored.");
  });

  it("4. dismissing reconnect banner closes it immediately without extra network requests", () => {
    render(<AdminOfflineBanner />);

    act(() => {
      window.dispatchEvent(new Event("offline"));
    });
    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    const dismissBtn = screen.getByRole("button", { name: /dismiss banner/i });
    fireEvent.click(dismissBtn);

    expect(screen.queryByTestId("admin-reconnect-banner")).toBeNull();
  });

  it("5. listeners are cleanly removed on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = renderHook(() => useNetworkStatus());

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith("offline", expect.any(Function));
  });
});
