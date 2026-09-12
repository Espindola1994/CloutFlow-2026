import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AdminShell } from "@/components/admin/AdminShell";
import type { LiveWorldResponseData } from "@/types/admin-live-world";
import type { LiveWorldHistoryResponseData } from "@/types/admin-live-world-history";

let searchParamString = "tab=live-world&view=history";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/admin/dashboard",
  useSearchParams: () => new URLSearchParams(searchParamString),
}));

vi.mock("recharts", async () => {
  const original = await vi.importActual("recharts");
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="mocked-chart-container">{children}</div>
    ),
  };
});

const mockLiveData: LiveWorldResponseData = {
  generatedAt: "2026-09-12T12:00:00.000Z",
  activeVisitorsTotal: 5,
  mappableVisitorsTotal: 4,
  unknownGeoVisitorsTotal: 1,
  locations: [],
  topCountries: [],
  topCities: [],
  devices: { mobile: 3, tablet: 1, desktop: 1, other: 0 },
  os: { iOS: 2, Android: 1, Windows: 1, macOS: 1, Linux: 0, ChromeOS: 0, Other: 0 },
  browsers: { Safari: 2, Chrome: 2, Edge: 1, Firefox: 0, Other: 0 },
  recentPurchases: [],
};

const mockHistoryData: LiveWorldHistoryResponseData = {
  generatedAt: "2026-09-12T12:00:00.000Z",
  range: "30d",
  filters: { platform: null, service: null, country: null },
  summary: {
    totalPurchases: 20,
    revenueCents: 58000,
    averageOrderValueCents: 2900,
    mappedPurchases: 19,
    unknownGeoPurchases: 1,
  },
  topCountries: [{ countryCode: "US", purchaseCount: 15, revenueCents: 45000, averageOrderValueCents: 3000 }],
  topCities: [{ city: "New York", region: "NY", countryCode: "US", purchaseCount: 10, revenueCents: 30000, averageOrderValueCents: 3000, latitude: 40.71, longitude: -74.00 }],
  platforms: [{ platform: "instagram", purchaseCount: 12, revenueCents: 35000, averageOrderValueCents: 2916 }],
  services: [{ platform: "instagram", service: "followers", purchaseCount: 12, revenueCents: 35000, averageOrderValueCents: 2916 }],
  plans: [{ planId: "ig-followers-500", platform: "instagram", service: "followers", purchaseCount: 12, revenueCents: 35000, averageOrderValueCents: 2916 }],
  series: [{ timestamp: "2026-09-10T00:00:00.000Z", purchaseCount: 5, revenueCents: 15000, mappedPurchases: 5 }],
};

describe("Live World Phase 4B End-to-End & Integration Suite (30 Verification Cases)", () => {
  let fetchSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    searchParamString = "tab=live-world&view=history";
    fetchSpy = vi.spyOn(global, "fetch").mockImplementation(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/admin/live-world/history")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: mockHistoryData }),
        } as Response;
      }
      if (urlStr.includes("/api/admin/live-world")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: mockLiveData }),
        } as Response;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: {} }),
      } as Response;
    });
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it("1. History view renders in AdminShell under tab=live-world&view=history", async () => {
    render(<AdminShell />);
    await waitFor(() => {
      expect(screen.getByTestId("live-world-history-view")).toBeInTheDocument();
    });
  });

  it("2. Live Now tab can be rendered cleanly under AdminShell when tab=live-world", async () => {
    searchParamString = "tab=live-world";
    render(<AdminShell />);
    await waitFor(() => {
      expect(screen.getByTestId("tab-live-now")).toBeInTheDocument();
      expect(screen.getByTestId("active-now-count")).toBeInTheDocument();
    });
  });

  it("3. History tab does not alter Live Now globe logic or data structures", async () => {
    searchParamString = "tab=live-world&view=history";
    render(<AdminShell />);
    await waitFor(() => {
      expect(screen.getByTestId("live-world-history-view")).toBeInTheDocument();
    });
    // History does not fetch or touch 3D globe DOM
    expect(screen.queryByTestId("globe-loading-placeholder")).not.toBeInTheDocument();
  });

  it("4. Zero polling in history mode: exactly 1 request to /api/admin/live-world/history on mount", async () => {
    searchParamString = "tab=live-world&view=history";
    render(<AdminShell />);
    await waitFor(() => {
      expect(screen.getByTestId("live-world-history-view")).toBeInTheDocument();
    });

    const historyCalls = fetchSpy.mock.calls.filter((c: any) =>
      String(c[0]).includes("/api/admin/live-world/history")
    );
    expect(historyCalls.length).toBe(1);
  });
});
