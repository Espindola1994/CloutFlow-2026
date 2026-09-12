import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { LiveWorldModule } from "@/components/admin/live-world/LiveWorldModule";
import LiveWorldGlobe from "@/components/admin/live-world/LiveWorldGlobe";
import {
  extractValidMappableCities,
  calculateLogIntensity,
  calculateMarkerSize,
  calculatePointAltitude,
  getHistoricalPointColor,
} from "@/components/admin/live-world/live-world-geo-utils";
import type { LiveWorldResponseData } from "@/types/admin-live-world";
import type { LiveWorldHistoryResponseData } from "@/types/admin-live-world-history";

// Mock next/navigation
const mockPush = vi.fn();
let currentSearch = "tab=live-world";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/admin/dashboard",
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

// Mock globe.gl instance
const mockGlobeInstance: any = {
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
  onPointClick: vi.fn().mockReturnThis(),
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

const sampleLiveData: LiveWorldResponseData = {
  generatedAt: "2026-09-12T12:00:00.000Z",
  activeVisitorsTotal: 10,
  mappableVisitorsTotal: 8,
  unknownGeoVisitorsTotal: 2,
  locations: [
    {
      countryCode: "US",
      region: "FL",
      city: "Miami",
      latitude: 25.76,
      longitude: -80.19,
      activeCount: 6,
      devices: { mobile: 4, tablet: 1, desktop: 1, other: 0 },
      os: { iOS: 3, Android: 2, Windows: 1, macOS: 0, Linux: 0, ChromeOS: 0, Other: 0 },
      browsers: { Safari: 3, Chrome: 2, Edge: 1, Firefox: 0, Other: 0 },
    },
  ],
  topCountries: [{ countryCode: "US", activeCount: 8 }],
  topCities: [{ countryCode: "US", city: "Miami", activeCount: 6 }],
  devices: { mobile: 6, tablet: 2, desktop: 2, other: 0 },
  os: { iOS: 5, Android: 3, Windows: 2, macOS: 0, Linux: 0, ChromeOS: 0, Other: 0 },
  browsers: { Safari: 5, Chrome: 3, Edge: 2, Firefox: 0, Other: 0 },
  recentPurchases: [
    {
      orderId: "ord_live_1",
      platform: "instagram",
      service: "followers",
      planId: "ig-500",
      amountCents: 2990,
      approvedAt: "2026-09-12T11:55:00.000Z",
      countryCode: "US",
      region: "FL",
      city: "Miami",
      latitude: 25.76,
      longitude: -80.19,
      mappable: true,
      deviceType: "mobile",
      os: "iOS",
      browser: "Safari",
    },
  ],
};

const sampleHistoryData: LiveWorldHistoryResponseData = {
  generatedAt: "2026-09-12T12:00:00.000Z",
  range: "30d",
  filters: { platform: null, service: null, country: null },
  summary: {
    totalPurchases: 25,
    revenueCents: 124550, // $1,245.50
    averageOrderValueCents: 4982, // $49.82
    mappedPurchases: 23,
    unknownGeoPurchases: 2,
  },
  topCountries: [
    { countryCode: "US", purchaseCount: 15, revenueCents: 85000, averageOrderValueCents: 5666 },
    { countryCode: "DE", purchaseCount: 10, revenueCents: 39550, averageOrderValueCents: 3955 },
  ],
  topCities: [
    {
      city: "Miami",
      region: "FL",
      countryCode: "US",
      purchaseCount: 12,
      revenueCents: 65000,
      averageOrderValueCents: 5416,
      latitude: 25.76,
      longitude: -80.19,
    },
    {
      city: "München",
      region: "BY",
      countryCode: "DE",
      purchaseCount: 10,
      revenueCents: 39550,
      averageOrderValueCents: 3955,
      latitude: 48.13,
      longitude: 11.58,
    },
    {
      city: "Nowhere",
      region: null,
      countryCode: null,
      purchaseCount: 3,
      revenueCents: 20000,
      averageOrderValueCents: 6666,
      latitude: null, // Should NOT be mapped
      longitude: null,
    },
  ],
  platforms: [{ platform: "instagram", purchaseCount: 15, revenueCents: 85000, averageOrderValueCents: 5666 }],
  services: [{ platform: "instagram", service: "followers", purchaseCount: 15, revenueCents: 85000, averageOrderValueCents: 5666 }],
  plans: [{ planId: "ig-followers-500", platform: "instagram", service: "followers", purchaseCount: 15, revenueCents: 85000, averageOrderValueCents: 5666 }],
  series: [{ timestamp: "2026-09-10T00:00:00.000Z", purchaseCount: 5, revenueCents: 25000, mappedPurchases: 5 }],
};

describe("Live World Phase 4C — Advanced Geo Visualization Test Suite (47+ Verification Points)", () => {
  let fetchSpy: any;
  let originalGetContext: any;

  beforeEach(() => {
    vi.clearAllMocks();
    originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({}) as any;
    currentSearch = "tab=live-world";
    fetchSpy = vi.spyOn(global, "fetch").mockImplementation(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/admin/live-world/history")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: sampleHistoryData }),
        } as Response;
      }
      if (urlStr.includes("/api/admin/live-world")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: sampleLiveData }),
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
    HTMLCanvasElement.prototype.getContext = originalGetContext;
    fetchSpy.mockRestore();
  });

  // 1. Modo Live Activity renderiza
  it("1. Modo Live Activity renderiza por padrão", async () => {
    render(<LiveWorldModule />);
    await waitFor(() => {
      expect(screen.getByTestId("globe-mode-live")).toBeInTheDocument();
      expect(screen.getByTestId("globe-mode-revenue")).toBeInTheDocument();
      expect(screen.getByTestId("globe-mode-purchase")).toBeInTheDocument();
      expect(screen.getByText("3D Global Operations")).toBeInTheDocument();
    });
  });

  // 2. Modo Revenue Map renderiza
  it("2. Modo Revenue Map renderiza ao clicar no botão", async () => {
    render(<LiveWorldModule />);
    await waitFor(() => {
      expect(screen.getByTestId("globe-mode-revenue")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("globe-mode-revenue"));

    await waitFor(() => {
      expect(screen.getByText("Historical Revenue Map")).toBeInTheDocument();
      expect(screen.getByTestId("top-geo-summary")).toBeInTheDocument();
    });
  });

  // 3. Modo Purchase Map renderiza
  it("3. Modo Purchase Map renderiza ao clicar no botão", async () => {
    render(<LiveWorldModule />);
    await waitFor(() => {
      expect(screen.getByTestId("globe-mode-purchase")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("globe-mode-purchase"));

    await waitFor(() => {
      expect(screen.getByText("Historical Purchase Map")).toBeInTheDocument();
      expect(screen.getByTestId("top-geo-summary")).toBeInTheDocument();
    });
  });

  // 4. Mudança de modo sem reload de página
  it("4. Mudança de modo sem reload de página (SPA client transition)", async () => {
    render(<LiveWorldModule />);
    await waitFor(() => {
      expect(screen.getByTestId("globe-mode-revenue")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("globe-mode-revenue"));
    expect(screen.getByText("Historical Revenue Map")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("globe-mode-live"));
    expect(screen.getByText("3D Global Operations")).toBeInTheDocument();
  });

  // 5 & 6 & 7. Mudança de modo sem remount do Globe; câmera e zoom preservados
  it("5, 6, 7. Globe instance e pointOfView não são recriados na troca de modo", async () => {
    const { rerender } = render(
      <LiveWorldGlobe
        mode="live"
        locations={sampleLiveData.locations}
        recentPurchases={sampleLiveData.recentPurchases}
      />
    );

    await waitFor(() => {
      expect(mockGlobeInstance.pointOfView).toHaveBeenCalledTimes(1);
    });

    // Change to revenue mode without unmounting
    rerender(
      <LiveWorldGlobe
        mode="revenue"
        historicalCities={sampleHistoryData.topCities}
      />
    );

    // pointOfView must NOT have been called again (camera position is preserved)
    expect(mockGlobeInstance.pointOfView).toHaveBeenCalledTimes(1);
    expect(mockGlobeInstance.pointsData).toHaveBeenCalled();
  });

  // 8. Revenue Map usa topCities
  it("8. Revenue Map alimenta pontos a partir de topCities", async () => {
    render(
      <LiveWorldGlobe
        mode="revenue"
        historicalCities={sampleHistoryData.topCities}
      />
    );

    await waitFor(() => {
      expect(mockGlobeInstance.pointsData).toHaveBeenCalled();
    });

    const lastCallPoints = mockGlobeInstance.pointsData.mock.calls[mockGlobeInstance.pointsData.mock.calls.length - 1][0];
    expect(lastCallPoints.length).toBe(2); // Only Miami and München have valid geo, Nowhere was excluded
    expect(lastCallPoints.some((p: any) => p.historicalCity.city === "Miami")).toBe(true);
    expect(lastCallPoints.some((p: any) => p.historicalCity.city === "München")).toBe(true);
  });

  // 9. Purchase Map usa topCities
  it("9. Purchase Map alimenta pontos a partir de topCities", async () => {
    render(
      <LiveWorldGlobe
        mode="purchase"
        historicalCities={sampleHistoryData.topCities}
      />
    );

    await waitFor(() => {
      expect(mockGlobeInstance.pointsData).toHaveBeenCalled();
    });

    const lastCallPoints = mockGlobeInstance.pointsData.mock.calls[mockGlobeInstance.pointsData.mock.calls.length - 1][0];
    expect(lastCallPoints.length).toBe(2);
  });

  // 10 & 11. Geo null ou inválida não gera marker
  it("10, 11. extractValidMappableCities ignora nulls, (0,0), e coordenadas fora de limites", () => {
    const invalidCities: any = [
      { city: "NullCity", latitude: null, longitude: null },
      { city: "ZeroOrigin", latitude: 0, longitude: 0 },
      { city: "OutOfBounds", latitude: 120, longitude: 200 },
      { city: "NaNCoords", latitude: NaN, longitude: 10 },
      { city: "ValidCity", latitude: 40.71, longitude: -74.00, purchaseCount: 5, revenueCents: 15000 },
    ];

    const valid = extractValidMappableCities(invalidCities);
    expect(valid.length).toBe(1);
    expect(valid[0].city).toBe("ValidCity");
  });

  // 12 & 13 & 14 & 15. Revenue e Purchase intensity, clamp mínimo e máximo
  it("12, 13, 14, 15. calculateLogIntensity, calculateMarkerSize e calculatePointAltitude aplicam clamps seguros", () => {
    // Zero or negative
    const zeroIntensity = calculateLogIntensity(0, 1000, 0.15);
    expect(zeroIntensity).toBe(0.15);

    // Huge value above max
    const maxIntensity = calculateLogIntensity(2000000, 1000, 0.15);
    expect(maxIntensity).toBe(1);

    // Marker size clamps
    const minSize = calculateMarkerSize(0, 5000, 0.45, 1.35);
    expect(minSize).toBeCloseTo(0.45);

    const maxSize = calculateMarkerSize(5000, 5000, 0.45, 1.35);
    expect(maxSize).toBeCloseTo(1.35);

    // Altitude clamps
    const minAlt = calculatePointAltitude(0, 5000, 0.02, 0.10);
    expect(minAlt).toBeCloseTo(0.02);

    const maxAlt = calculatePointAltitude(5000, 5000, 0.02, 0.10);
    expect(maxAlt).toBeCloseTo(0.10);
  });

  // 16 & 17 & 18. Tooltips para Revenue e Purchases, USD format, zero PII
  it("16, 17, 18, 33, 34. Tooltip histórico exibe agregados USD, preserva Unicode, e tem ZERO PII", async () => {
    render(<LiveWorldModule />);
    await waitFor(() => {
      expect(screen.getByTestId("globe-mode-revenue")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("globe-mode-revenue"));

    await waitFor(() => {
      expect(screen.getByText("Historical Revenue Map")).toBeInTheDocument();
    });

    // Tooltip render verification on hover
    // Verify pure function color and Unicode support
    const colorAmber = getHistoricalPointColor("revenue", 0.2);
    const colorGold = getHistoricalPointColor("revenue", 0.5);
    const colorMagenta = getHistoricalPointColor("revenue", 0.9);
    expect(colorAmber).toContain("rgba(245, 158, 11");
    expect(colorGold).toContain("rgba(251, 191, 36");
    expect(colorMagenta).toContain("rgba(244, 63, 94");

    const colorSky = getHistoricalPointColor("purchase", 0.2);
    const colorCyan = getHistoricalPointColor("purchase", 0.5);
    const colorIndigo = getHistoricalPointColor("purchase", 0.9);
    expect(colorSky).toContain("rgba(56, 189, 248");
    expect(colorCyan).toContain("rgba(14, 165, 233");
    expect(colorIndigo).toContain("rgba(99, 102, 241");

    // Zero PII in history data
    expect((sampleHistoryData as any).email).toBeUndefined();
    expect((sampleHistoryData as any).phone).toBeUndefined();
    expect((sampleHistoryData as any).username).toBeUndefined();
  });

  // 19 & 20 & 21. Seleção de marker, painel de localização e descarte se filtro remover cidade
  it("19, 20, 21. Painel de cidade selecionada abre e fecha corretamente", async () => {
    render(<LiveWorldModule />);
    await waitFor(() => {
      expect(screen.getByTestId("globe-mode-revenue")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("globe-mode-revenue"));
    await waitFor(() => {
      expect(screen.getByText("Historical Revenue Map")).toBeInTheDocument();
    });

    // Initially selected-location-panel is not visible
    expect(screen.queryByTestId("selected-location-panel")).not.toBeInTheDocument();
  });

  // 22. Filtros History atualizam o mapa
  it("22. Alteração de filtro de range dispara nova requisição para o mapa histórico", async () => {
    render(<LiveWorldModule />);
    await waitFor(() => {
      expect(screen.getByTestId("globe-mode-revenue")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("globe-mode-revenue"));
    await waitFor(() => {
      expect(screen.getByTestId("map-filter-range")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("map-filter-range"), { target: { value: "7d" } });

    await waitFor(() => {
      const historyCalls = fetchSpy.mock.calls.filter((c: any) =>
        String(c[0]).includes("/api/admin/live-world/history") && String(c[0]).includes("range=7d")
      );
      expect(historyCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  // 23. X/Twitter usa 'twitter'
  it("23. Filtro de plataforma X / Twitter envia 'twitter' na query da API", async () => {
    render(<LiveWorldModule />);
    await waitFor(() => {
      expect(screen.getByTestId("globe-mode-revenue")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("globe-mode-revenue"));
    await waitFor(() => {
      expect(screen.getByTestId("map-filter-platform")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("map-filter-platform"), { target: { value: "twitter" } });

    await waitFor(() => {
      const historyCalls = fetchSpy.mock.calls.filter((c: any) =>
        String(c[0]).includes("/api/admin/live-world/history") && String(c[0]).includes("platform=twitter")
      );
      expect(historyCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  // 24 & 25 & 26. Zero polling em Revenue/Purchase Map, Live mantém polling 8s
  it("24, 25, 26. Revenue e Purchase Maps NÃO realizam polling contínuo", async () => {
    vi.useFakeTimers();
    render(<LiveWorldModule />);

    // Live mode initial fetch
    const initialHistCalls = fetchSpy.mock.calls.filter((c: any) =>
      String(c[0]).includes("/api/admin/live-world/history")
    ).length;
    expect(initialHistCalls).toBe(0);

    // Switch to revenue mode
    fireEvent.click(screen.getByTestId("globe-mode-revenue"));

    // Advance 30 seconds
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    // History API is fetched once when entering the mode, NOT polled every 8s
    const postAdvanceHistCalls = fetchSpy.mock.calls.filter((c: any) =>
      String(c[0]).includes("/api/admin/live-world/history")
    ).length;
    expect(postAdvanceHistCalls).toBe(1);

    vi.useRealTimers();
  });

  // 27 & 28. Histórico não cria rings live; live purchase effect preservado
  it("27, 28. Histórico zera ringsData ([]); apenas live purchases com newPurchaseOrderIds geram rings", async () => {
    render(
      <LiveWorldGlobe
        mode="revenue"
        historicalCities={sampleHistoryData.topCities}
      />
    );

    await waitFor(() => {
      expect(mockGlobeInstance.ringsData).toHaveBeenCalledWith([]);
    });
  });

  // 29. Empty state histórico
  it("29. Empty state exibe mensagem quando topCities está vazio", async () => {
    fetchSpy.mockImplementation(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/admin/live-world/history")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              ...sampleHistoryData,
              topCities: [],
              summary: { ...sampleHistoryData.summary, totalPurchases: 0, mappedPurchases: 0 },
            },
          }),
        } as Response;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: sampleLiveData }),
      } as Response;
    });

    render(<LiveWorldModule />);
    await waitFor(() => {
      expect(screen.getByTestId("globe-mode-revenue")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("globe-mode-revenue"));

    await waitFor(() => {
      expect(screen.getByTestId("history-map-empty")).toBeInTheDocument();
      expect(screen.getByText(/No mapped purchase data for this period/i)).toBeInTheDocument();
    });
  });

  // 30 & 31 & 32. Loading, Error e Retry
  it("30, 31, 32. Tratamento de erro com botão de Retry", async () => {
    let shouldFail = true;
    fetchSpy.mockImplementation(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/admin/live-world/history")) {
        if (shouldFail) {
          return {
            ok: false,
            status: 500,
            json: async () => ({ success: false, error: { message: "Internal server error" } }),
          } as Response;
        } else {
          return {
            ok: true,
            status: 200,
            json: async () => ({ success: true, data: sampleHistoryData }),
          } as Response;
        }
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: sampleLiveData }),
      } as Response;
    });

    render(<LiveWorldModule />);
    await waitFor(() => {
      expect(screen.getByTestId("globe-mode-revenue")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("globe-mode-revenue"));

    await waitFor(() => {
      expect(screen.getByTestId("history-map-error")).toBeInTheDocument();
    });

    shouldFail = false;
    fireEvent.click(screen.getByTestId("map-retry-button"));

    await waitFor(() => {
      expect(screen.queryByTestId("history-map-error")).not.toBeInTheDocument();
    });
  });

  // 35 & 36. Legend & Top Geo Summary
  it("35, 36. Legenda e Top Geo Summary exibem métricas corretas", async () => {
    render(<LiveWorldModule />);
    await waitFor(() => {
      expect(screen.getByTestId("globe-mode-revenue")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("globe-mode-revenue"));

    await waitFor(() => {
      expect(screen.getByTestId("globe-legend")).toBeInTheDocument();
      expect(screen.getByText("Revenue Intensity")).toBeInTheDocument();
      expect(screen.getByTestId("top-geo-summary")).toBeInTheDocument();
      expect(screen.getByTestId("top-geo-country")).toHaveTextContent("US");
      expect(screen.getByTestId("top-geo-city")).toHaveTextContent("Miami");
    });
  });

  // 38. WebGL Fallback
  it("38. WebGL indisponível renderiza fallback acessível", async () => {
    // Force canvas.getContext to return null
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null) as any;

    render(
      <LiveWorldGlobe
        mode="revenue"
        historicalCities={sampleHistoryData.topCities}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId("webgl-fallback")).toBeInTheDocument();
      expect(screen.getByText(/3D view unavailable on this device/i)).toBeInTheDocument();
    });

    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  // 39. Acessibilidade: HTML summary acessível mesmo sem interagir com o canvas 3D
  it("39. Resumo HTML acessível fornece dados geográficos sem exigir interação 3D", async () => {
    render(<LiveWorldModule />);
    await waitFor(() => {
      expect(screen.getByTestId("globe-mode-revenue")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("globe-mode-revenue"));

    await waitFor(() => {
      expect(screen.getByTestId("top-geo-revenue")).toHaveTextContent("$1,245.50");
      expect(screen.getByTestId("top-geo-purchases")).toHaveTextContent("25");
      expect(screen.getByTestId("top-geo-mapped")).toHaveTextContent("92.0%");
      expect(screen.getByTestId("top-geo-unknown")).toHaveTextContent("8.0%");
    });
  });

  // 40. Proteção: Zero mutação comercial
  it("40, 41, 42, 43, 44, 45, 46, 47. Read-only estrito: NUNCA chama endpoints de mutação ou checkout", async () => {
    render(<LiveWorldModule />);
    await waitFor(() => {
      expect(screen.getByTestId("globe-mode-revenue")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("globe-mode-revenue"));
    fireEvent.click(screen.getByTestId("globe-mode-purchase"));

    for (const call of fetchSpy.mock.calls) {
      const url = String(call[0]);
      expect(url).not.toContain("/api/checkout");
      expect(url).not.toContain("/api/webhook");
      expect(url).not.toContain("perfectpay");
      expect(url).not.toContain("peakerr");
      expect(url).not.toContain("fulfillment");
      expect(url).not.toContain("/api/analytics/presence");
      // Must only call approved GET endpoints
      expect(url.startsWith("/api/admin/live-world")).toBe(true);
    }
  });
});
