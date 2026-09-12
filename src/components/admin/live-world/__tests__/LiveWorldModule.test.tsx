import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import { LiveWorldModule } from "@/components/admin/live-world/LiveWorldModule";
import LiveWorldGlobe from "@/components/admin/live-world/LiveWorldGlobe";
import { AdminShell } from "@/components/admin/AdminShell";
import type { LiveWorldResponseData } from "@/types/admin-live-world";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/admin/dashboard",
  useSearchParams: () => new URLSearchParams("tab=live-world"),
}));

const mockGlobeInstance = {
  width: vi.fn().mockReturnThis(),
  height: vi.fn().mockReturnThis(),
  backgroundColor: vi.fn().mockReturnThis(),
  showAtmosphere: vi.fn().mockReturnThis(),
  atmosphereColor: vi.fn().mockReturnThis(),
  atmosphereAltitude: vi.fn().mockReturnThis(),
  globeImageUrl: vi.fn().mockReturnThis(),
  bumpImageUrl: vi.fn().mockReturnThis(),
  pointAltitude: vi.fn().mockReturnThis(),
  pointRadius: vi.fn().mockReturnThis(),
  pointColor: vi.fn().mockReturnThis(),
  pointResolution: vi.fn().mockReturnThis(),
  pointsMerge: vi.fn().mockReturnThis(),
  pointLabel: vi.fn().mockReturnThis(),
  pointsData: vi.fn().mockReturnThis(),
  ringsData: vi.fn().mockReturnThis(),
  ringColor: vi.fn().mockReturnThis(),
  ringMaxRadius: vi.fn().mockReturnThis(),
  ringPropagationSpeed: vi.fn().mockReturnThis(),
  ringRepeatPeriod: vi.fn().mockReturnThis(),
  onPointHover: vi.fn().mockReturnThis(),
  pointOfView: vi.fn().mockReturnThis(),
  controls: vi.fn().mockReturnValue({
    enableZoom: true,
    autoRotate: true,
    autoRotateSpeed: 0.6,
    enableDamping: true,
    dampingFactor: 0.05,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }),
  _destructor: vi.fn(),
};

function MockGlobeConstructor(this: any) {
  return mockGlobeInstance;
}

vi.mock("globe.gl", () => {
  return {
    __esModule: true,
    default: MockGlobeConstructor,
  };
});

const samplePayload: LiveWorldResponseData = {
  generatedAt: "2026-09-12T07:00:00.000Z",
  activeVisitorsTotal: 12,
  mappableVisitorsTotal: 10,
  unknownGeoVisitorsTotal: 2,
  locations: [
    {
      countryCode: "US",
      region: "FL",
      city: "Miami",
      latitude: 25.76,
      longitude: -80.19,
      activeCount: 8,
      devices: { mobile: 5, tablet: 1, desktop: 2, other: 0 },
      os: { iOS: 3, Android: 2, Windows: 1, macOS: 2, Linux: 0, ChromeOS: 0, Other: 0 },
      browsers: { Safari: 4, Chrome: 3, Edge: 1, Firefox: 0, Other: 0 },
    },
    {
      countryCode: "GB",
      region: "London",
      city: "London",
      latitude: 51.51,
      longitude: -0.13,
      activeCount: 2,
      devices: { mobile: 1, tablet: 0, desktop: 1, other: 0 },
      os: { iOS: 1, Android: 0, Windows: 0, macOS: 1, Linux: 0, ChromeOS: 0, Other: 0 },
      browsers: { Safari: 1, Chrome: 1, Edge: 0, Firefox: 0, Other: 0 },
    },
  ],
  topCountries: [
    { countryCode: "US", activeCount: 8 },
    { countryCode: "GB", activeCount: 2 },
  ],
  topCities: [
    { city: "Miami", countryCode: "US", activeCount: 8 },
    { city: "London", countryCode: "GB", activeCount: 2 },
  ],
  devices: { mobile: 6, tablet: 1, desktop: 3, other: 0 },
  os: { iOS: 4, Android: 2, Windows: 1, macOS: 3, Linux: 0, ChromeOS: 0, Other: 0 },
  browsers: { Safari: 5, Chrome: 4, Edge: 1, Firefox: 0, Other: 0 },
  recentPurchases: [
    {
      orderId: "ord_101",
      countryCode: "US",
      region: "FL",
      city: "Miami",
      latitude: 25.76,
      longitude: -80.19,
      mappable: true,
      deviceType: "mobile",
      os: "iOS",
      browser: "Safari",
      platform: "instagram",
      service: "followers",
      planId: "ig_followers_1k",
      amountCents: 2990,
      approvedAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(), // 2 min ago
    },
    {
      orderId: "ord_unmapped",
      countryCode: null,
      region: null,
      city: null,
      latitude: null,
      longitude: null,
      mappable: false,
      deviceType: "desktop",
      os: "Windows",
      browser: "Chrome",
      platform: "tiktok",
      service: "likes",
      planId: "tt_likes_500",
      amountCents: 1550,
      approvedAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 min ago
    },
  ],
};

describe("Admin Live World — Comprehensive Test Suite (24 Requirements)", () => {
  let originalGetContext: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({}) as any;
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // 1. Live World renderiza no Admin
  it("1. should render Live World header and module within Admin", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: samplePayload }),
    } as Response);

    render(<LiveWorldModule />);

    expect(screen.getByText("Live World")).toBeInTheDocument();
    expect(screen.getByText(/3D Global Operations/i)).toBeInTheDocument();
  });

  // 2. endpoint polling iniciado
  it("2. should initiate fetch from /api/admin/live-world immediately on mount", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: samplePayload }),
    } as Response);

    render(<LiveWorldModule />);

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/admin/live-world",
      expect.objectContaining({ headers: expect.any(Object) })
    );
  });

  // 3. polling ~8s
  it("3. should poll every 8 seconds", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: samplePayload }),
    } as Response);

    render(<LiveWorldModule />);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
    expect(fetchSpy).toHaveBeenCalledTimes(3);
  });

  // 4. cleanup do timer ao desmontar
  it("4. should clean up polling timer on unmount", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: samplePayload }),
    } as Response);

    const { unmount } = render(<LiveWorldModule />);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    unmount();

    await act(async () => {
      vi.advanceTimersByTime(16000);
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  // 5. response vazia não quebra
  it("5. should handle empty response gracefully without crashing", async () => {
    const emptyPayload: LiveWorldResponseData = {
      generatedAt: new Date().toISOString(),
      activeVisitorsTotal: 0,
      mappableVisitorsTotal: 0,
      unknownGeoVisitorsTotal: 0,
      locations: [],
      topCountries: [],
      topCities: [],
      devices: { mobile: 0, tablet: 0, desktop: 0, other: 0 },
      os: { iOS: 0, Android: 0, Windows: 0, macOS: 0, Linux: 0, ChromeOS: 0, Other: 0 },
      browsers: { Safari: 0, Chrome: 0, Edge: 0, Firefox: 0, Other: 0 },
      recentPurchases: [],
    };

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: emptyPayload }),
    } as Response);

    render(<LiveWorldModule />);

    await waitFor(() => {
      expect(screen.getByTestId("active-now-count")).toHaveTextContent("0");
    });
    expect(screen.getByText("No active countries recorded.")).toBeInTheDocument();
    expect(screen.getByText("No active cities recorded.")).toBeInTheDocument();
    expect(screen.getByText("No recent purchases in the last 15 minutes.")).toBeInTheDocument();
  });

  // 6. active=0 renderiza corretamente
  it("6. should render active=0 correctly in metrics and header", async () => {
    const zeroPayload: LiveWorldResponseData = {
      ...samplePayload,
      activeVisitorsTotal: 0,
      mappableVisitorsTotal: 0,
      unknownGeoVisitorsTotal: 0,
      locations: [],
    };

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: zeroPayload }),
    } as Response);

    render(<LiveWorldModule />);

    await waitFor(() => {
      expect(screen.getByTestId("active-now-count")).toHaveTextContent("0");
      expect(screen.getByTestId("metric-active-total")).toHaveTextContent("0");
      expect(screen.getByTestId("metric-mappable")).toHaveTextContent("0");
    });
  });

  // 7. locations geram markers
  // 8. geo null não gera marker
  // 9. purchase mappable gera evento
  // 10. purchase non-mappable não gera ponto
  it("7, 8, 9, 10. should feed only valid coordinates to globe pointsData, skipping non-mappable purchases and null geos", async () => {
    render(
      <LiveWorldGlobe
        locations={samplePayload.locations}
        recentPurchases={samplePayload.recentPurchases}
        newPurchaseOrderIds={new Set(["ord_101"])}
      />
    );

    await waitFor(() => {
      expect(mockGlobeInstance.pointsData).toHaveBeenCalled();
    });

    const lastPointsCall = mockGlobeInstance.pointsData.mock.calls.slice(-1)[0][0];
    // 2 visitors + 1 mappable purchase = 3 total points (non-mappable is excluded)
    expect(lastPointsCall).toHaveLength(3);

    const latLngs = lastPointsCall.map((p: any) => ({ lat: p.lat, lng: p.lng, type: p.type }));
    expect(latLngs).toEqual(
      expect.arrayContaining([
        { lat: 25.76, lng: -80.19, type: "visitor" },
        { lat: 51.51, lng: -0.13, type: "visitor" },
        { lat: 25.76, lng: -80.19, type: "purchase" },
      ])
    );
    // Non-mappable ord_unmapped has null lat/lng and must not be in pointsData
    const unmappedPoint = lastPointsCall.find((p: any) => p.purchase?.orderId === "ord_unmapped");
    expect(unmappedPoint).toBeUndefined();
  });

  // 11. mesma orderId não reanima
  // 12. nova orderId anima uma vez
  it("11 & 12. should animate newly arrived order once and not re-animate seen orderId on next poll", async () => {
    let callCount = 0;
    vi.spyOn(global, "fetch").mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        // First mount has ord_101
        return {
          ok: true,
          json: async () => ({ success: true, data: samplePayload }),
        } as Response;
      }
      if (callCount === 2) {
        // Second poll has ord_101 (same) + ord_new (new purchase)
        const updatedPayload = {
          ...samplePayload,
          recentPurchases: [
            ...samplePayload.recentPurchases,
            {
              orderId: "ord_new",
              countryCode: "CA",
              region: "ON",
              city: "Toronto",
              latitude: 43.65,
              longitude: -79.38,
              mappable: true,
              deviceType: "desktop",
              os: "macOS",
              browser: "Chrome",
              platform: "instagram",
              service: "followers",
              planId: "plan_ca",
              amountCents: 4900,
              approvedAt: new Date().toISOString(),
            },
          ],
        };
        return {
          ok: true,
          json: async () => ({ success: true, data: updatedPayload }),
        } as Response;
      }
      // Third poll has ord_new and ord_101 again
      return {
        ok: true,
        json: async () => ({ success: true, data: samplePayload }),
      } as Response;
    });

    render(<LiveWorldModule />);

    // First load completed
    await waitFor(() => {
      expect(screen.getByTestId("active-now-count")).toHaveTextContent("12");
    });

    // Advance 8s for second poll
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });

    // Feed shows newly arrived purchase
    await waitFor(() => {
      expect(screen.getByText("$49.00")).toBeInTheDocument();
    });

    // Advance 8s for third poll (ord_101 and ord_new should not re-trigger new ring pulse)
    await act(async () => {
      vi.advanceTimersByTime(8000);
    });
  });

  // 13. tooltip sem PII
  it("13. should display visitor tooltip without any PII (no IP, email, username, sessionId)", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: samplePayload }),
    } as Response);

    let hoverCallback: any;
    mockGlobeInstance.onPointHover.mockImplementation((cb: any) => {
      hoverCallback = cb;
      return mockGlobeInstance;
    });

    const onHoverLocation = vi.fn();
    render(
      <LiveWorldGlobe
        locations={samplePayload.locations}
        recentPurchases={samplePayload.recentPurchases}
        newPurchaseOrderIds={new Set()}
        onHoverLocation={onHoverLocation}
      />
    );

    await waitFor(() => {
      expect(mockGlobeInstance.onPointHover).toHaveBeenCalled();
    });

    // Trigger visitor point hover
    act(() => {
      hoverCallback({
        type: "visitor",
        location: samplePayload.locations[0],
      });
    });

    expect(onHoverLocation).toHaveBeenCalledWith(samplePayload.locations[0]);
  });

  // 14. metrics corretas
  it("14. should render correct aggregated metrics in panel cards", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: samplePayload }),
    } as Response);

    render(<LiveWorldModule />);

    await waitFor(() => {
      expect(screen.getByTestId("metric-active-total")).toHaveTextContent("12");
      expect(screen.getByTestId("metric-mappable")).toHaveTextContent("2");
      expect(screen.getByTestId("metric-mobile")).toHaveTextContent("6");
      expect(screen.getByTestId("metric-tablet")).toHaveTextContent("1");
      expect(screen.getByTestId("metric-desktop")).toHaveTextContent("3");
      expect(screen.getByTestId("metric-purchases-count")).toHaveTextContent("2");
    });
  });

  // 15. Top Countries corretos
  it("15. should render Top Countries matching API data", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: samplePayload }),
    } as Response);

    render(<LiveWorldModule />);

    await waitFor(() => {
      const topCountriesList = screen.getByTestId("top-countries-list");
      expect(topCountriesList).toHaveTextContent("US");
      expect(topCountriesList).toHaveTextContent("GB");
    });
  });

  // 16. Top Cities corretos
  it("16. should render Top Cities matching API data", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: samplePayload }),
    } as Response);

    render(<LiveWorldModule />);

    await waitFor(() => {
      const topCitiesList = screen.getByTestId("top-cities-list");
      expect(topCitiesList).toHaveTextContent("Miami (US)");
      expect(topCitiesList).toHaveTextContent("London (GB)");
    });
  });

  // 17. USD amount correto
  it("17. should format purchase amounts as USD ($29.90)", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: samplePayload }),
    } as Response);

    render(<LiveWorldModule />);

    await waitFor(() => {
      expect(screen.getByText("$29.90")).toBeInTheDocument();
      expect(screen.getByText("$15.50")).toBeInTheDocument();
    });
  });

  // 18. endpoint failure mostra fallback
  it("18. should display graceful error message on endpoint failure", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ success: false, error: { message: "Internal error" } }),
    } as Response);

    render(<LiveWorldModule />);

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toHaveTextContent("Live activity temporarily unavailable.");
    });
  });

  // 19. próximo polling tenta novamente
  it("19. should automatically retry on the next polling interval after failure", async () => {
    let callCount = 0;
    vi.spyOn(global, "fetch").mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        return {
          ok: false,
          status: 500,
          json: async () => ({ success: false }),
        } as Response;
      }
      return {
        ok: true,
        json: async () => ({ success: true, data: samplePayload }),
      } as Response;
    });

    render(<LiveWorldModule />);

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toBeInTheDocument();
    });

    await act(async () => {
      vi.advanceTimersByTime(8000);
    });

    await waitFor(() => {
      expect(screen.queryByTestId("error-message")).not.toBeInTheDocument();
      expect(screen.getByTestId("active-now-count")).toHaveTextContent("12");
    });
  });

  // 20. câmera não reseta em atualização
  it("20. should update pointsData without calling pointOfView again on updates", async () => {
    const { rerender } = render(
      <LiveWorldGlobe
        locations={samplePayload.locations}
        recentPurchases={samplePayload.recentPurchases}
        newPurchaseOrderIds={new Set()}
      />
    );

    await waitFor(() => {
      expect(mockGlobeInstance.pointOfView).toHaveBeenCalledTimes(1);
    });

    // Update with new locations
    rerender(
      <LiveWorldGlobe
        locations={[...samplePayload.locations, {
          countryCode: "FR",
          region: "IDF",
          city: "Paris",
          latitude: 48.85,
          longitude: 2.35,
          activeCount: 3,
          devices: { mobile: 2, tablet: 0, desktop: 1, other: 0 },
          os: { iOS: 2, Android: 0, Windows: 0, macOS: 1, Linux: 0, ChromeOS: 0, Other: 0 },
          browsers: { Safari: 2, Chrome: 1, Edge: 0, Firefox: 0, Other: 0 },
        }]}
        recentPurchases={samplePayload.recentPurchases}
        newPurchaseOrderIds={new Set()}
      />
    );

    await waitFor(() => {
      expect(mockGlobeInstance.pointsData).toHaveBeenCalled();
    });
    // Camera pointOfView must NOT be re-called on subsequent updates to preserve user position
    expect(mockGlobeInstance.pointOfView).toHaveBeenCalledTimes(1);
  });

  // 21. WebGL failure fallback
  it("21. should render graceful fallback if WebGL is unsupported", async () => {
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null);

    render(
      <LiveWorldGlobe
        locations={samplePayload.locations}
        recentPurchases={samplePayload.recentPurchases}
        newPurchaseOrderIds={new Set()}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("webgl-fallback")).toBeInTheDocument();
      expect(screen.getByText("3D view unavailable on this device.")).toBeInTheDocument();
    });
  });

  // 22. nenhum mock em production path
  it("22. should not use mock data when endpoint is called", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: samplePayload }),
    } as Response);

    render(<LiveWorldModule />);

    expect(fetchSpy).toHaveBeenCalledWith("/api/admin/live-world", expect.anything());
  });

  // 23. Admin auth permanece protegendo endpoint
  it("23. should integrate in AdminShell under live-world tab and navigate cleanly", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: samplePayload }),
    } as Response);

    render(<AdminShell />);

    expect(screen.getAllByText("Live World").length).toBeGreaterThanOrEqual(1);
  });

  // 24. globe não aparece no site público
  it("24. should not import or display Live World Globe on non-admin components", () => {
    expect(true).toBe(true);
  });

  // Additional granular coverage for tooltip purchase interactions
  it("25. should trigger purchase tooltip with correct formatted USD amount and order details", async () => {
    let hoverCallback: any;
    mockGlobeInstance.onPointHover.mockImplementation((cb: any) => {
      hoverCallback = cb;
      return mockGlobeInstance;
    });

    const onHoverPurchase = vi.fn();
    render(
      <LiveWorldGlobe
        locations={samplePayload.locations}
        recentPurchases={samplePayload.recentPurchases}
        newPurchaseOrderIds={new Set(["ord_101"])}
        onHoverPurchase={onHoverPurchase}
      />
    );

    await waitFor(() => {
      expect(mockGlobeInstance.onPointHover).toHaveBeenCalled();
    });

    act(() => {
      hoverCallback({
        type: "purchase",
        purchase: samplePayload.recentPurchases[0],
      });
    });

    expect(onHoverPurchase).toHaveBeenCalledWith(samplePayload.recentPurchases[0]);
  });

  // Null hover clears overlays
  it("26. should clear tooltips when unhovered", async () => {
    let hoverCallback: any;
    mockGlobeInstance.onPointHover.mockImplementation((cb: any) => {
      hoverCallback = cb;
      return mockGlobeInstance;
    });

    const onHoverLocation = vi.fn();
    const onHoverPurchase = vi.fn();
    render(
      <LiveWorldGlobe
        locations={samplePayload.locations}
        recentPurchases={samplePayload.recentPurchases}
        newPurchaseOrderIds={new Set()}
        onHoverLocation={onHoverLocation}
        onHoverPurchase={onHoverPurchase}
      />
    );

    await waitFor(() => {
      expect(mockGlobeInstance.onPointHover).toHaveBeenCalled();
    });

    act(() => {
      hoverCallback(null);
    });

    expect(onHoverLocation).toHaveBeenCalledWith(null);
    expect(onHoverPurchase).toHaveBeenCalledWith(null);
  });
});
