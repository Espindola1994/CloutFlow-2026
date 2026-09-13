import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act, fireEvent } from "@testing-library/react";
import { LiveWorldModule } from "@/components/admin/live-world/LiveWorldModule";
import LiveWorldGlobe from "@/components/admin/live-world/LiveWorldGlobe";
import { AdminShell } from "@/components/admin/AdminShell";
import type { LiveWorldResponseData } from "@/types/admin-live-world";
import type { LiveWorldHistoryResponseData } from "@/types/admin-live-world-history";

let currentSearch = "tab=live-world";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/admin/dashboard",
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

const mockGlobeInstance = {
  width: vi.fn().mockReturnThis(),
  height: vi.fn().mockReturnThis(),
  backgroundColor: vi.fn().mockReturnThis(),
  showAtmosphere: vi.fn().mockReturnThis(),
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
  arcsData: vi.fn().mockReturnThis(),
  labelsData: vi.fn().mockReturnThis(),
  onPointClick: vi.fn().mockReturnThis(),
  globeMaterial: vi.fn().mockReturnValue({
    color: { set: vi.fn() },
    specular: { set: vi.fn() },
    emissive: { set: vi.fn() },
    shininess: 7,
    bumpScale: 0.055,
    emissiveIntensity: 1.75,
    userData: {},
    isMeshPhongMaterial: true,
  }),
  controls: vi.fn().mockReturnValue({
    enableZoom: false,
    enableRotate: false,
    autoRotate: true,
    autoRotateSpeed: 0.34,
    enableDamping: true,
    dampingFactor: 0.05,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }),
  scene: vi.fn().mockReturnValue(null),
  renderer: vi.fn().mockReturnValue({
    setClearColor: vi.fn(),
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
  generatedAt: "2026-09-13T12:00:00.000Z",
  activeVisitorsTotal: 42,
  mappableVisitorsTotal: 38,
  unknownGeoVisitorsTotal: 4,
  locations: [
    {
      countryCode: "US",
      region: "CA",
      city: "Los Angeles",
      latitude: 34.05,
      longitude: -118.24,
      activeCount: 22,
      devices: { mobile: 14, tablet: 2, desktop: 6, other: 0 },
      os: { iOS: 10, Android: 4, Windows: 2, macOS: 4, Linux: 0, ChromeOS: 0, Other: 0 },
      browsers: { Safari: 10, Chrome: 8, Edge: 2, Firefox: 2, Other: 0 },
    },
    {
      countryCode: "BR",
      region: "SP",
      city: "São Paulo",
      latitude: -23.55,
      longitude: -46.63,
      activeCount: 16,
      devices: { mobile: 12, tablet: 1, desktop: 3, other: 0 },
      os: { iOS: 6, Android: 6, Windows: 2, macOS: 1, Linux: 0, ChromeOS: 0, Other: 0 },
      browsers: { Safari: 6, Chrome: 9, Edge: 0, Firefox: 1, Other: 0 },
    },
  ],
  topCountries: [
    { countryCode: "US", activeCount: 22 },
    { countryCode: "BR", activeCount: 16 },
  ],
  topCities: [
    { city: "Los Angeles", countryCode: "US", activeCount: 22 },
    { city: "São Paulo", countryCode: "BR", activeCount: 16 },
  ],
  devices: { mobile: 26, tablet: 3, desktop: 9, other: 4 },
  os: { iOS: 16, Android: 10, Windows: 4, macOS: 5, Linux: 0, ChromeOS: 0, Other: 7 },
  browsers: { Safari: 16, Chrome: 17, Edge: 2, Firefox: 3, Other: 4 },
  recentPurchases: [
    {
      orderId: "ord_live_1",
      countryCode: "US",
      region: "CA",
      city: "Los Angeles",
      latitude: 34.05,
      longitude: -118.24,
      mappable: true,
      deviceType: "mobile",
      os: "iOS",
      browser: "Safari",
      platform: "instagram",
      service: "followers",
      planId: "ig_followers_5k",
      amountCents: 4990,
      approvedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    },
  ],
};

const sampleHistoryData: LiveWorldHistoryResponseData = {
  generatedAt: "2026-09-13T12:00:00.000Z",
  range: "30d",
  filters: {
    platform: null,
    service: null,
    country: null,
  },
  summary: {
    revenueCents: 245000,
    totalPurchases: 45,
    mappedPurchases: 40,
    unknownGeoPurchases: 5,
    averageOrderValueCents: 5444,
  },
  topCountries: [
    { countryCode: "US", revenueCents: 180000, purchaseCount: 30, averageOrderValueCents: 6000 },
    { countryCode: "BR", revenueCents: 65000, purchaseCount: 15, averageOrderValueCents: 4333 },
  ],
  topCities: [
    {
      city: "Los Angeles",
      region: "CA",
      countryCode: "US",
      latitude: 34.05,
      longitude: -118.24,
      revenueCents: 180000,
      purchaseCount: 30,
      averageOrderValueCents: 6000,
    },
  ],
  platforms: [],
  services: [],
  plans: [],
  series: [],
};

describe("UI 5.6 — Admin Mobile Live World Test Suite", () => {
  let fetchCalls: string[] = [];

  beforeEach(() => {
    vi.clearAllMocks();
    fetchCalls = [];
    currentSearch = "tab=live-world";

    global.fetch = vi.fn().mockImplementation((url: string) => {
      fetchCalls.push(url);
      if (url.includes("/api/admin/live-world/history")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: sampleHistoryData }),
        });
      }
      if (url.includes("/api/admin/live-world")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true, data: sampleLiveData }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} }),
      });
    }) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("1. Live World uses existing dataset without inventing fake data or routes", async () => {
    render(<LiveWorldModule />);

    await waitFor(() => {
      expect(screen.getByTestId("active-now-count")).toHaveTextContent("42");
    });

    expect(screen.getByTestId("metric-active-total")).toHaveTextContent("42");
    expect(screen.getByTestId("metric-mappable")).toHaveTextContent("2");
    expect(screen.getByTestId("metric-purchases-count")).toHaveTextContent("1");
  });

  it("2. Globe component continues to be single and non-duplicated in DOM", async () => {
    render(<LiveWorldModule />);

    await waitFor(() => {
      expect(screen.getByTestId("active-now-count")).toHaveTextContent("42");
    });

    const controlButtons = screen.getAllByTestId("globe-control-toggle");
    expect(controlButtons).toHaveLength(1);
  });

  it("3. Mobile layout renderiza with responsive framing and no overflow", async () => {
    const { container } = render(<LiveWorldModule />);

    await waitFor(() => {
      expect(screen.getByTestId("active-now-count")).toHaveTextContent("42");
    });

    const rootWrapper = container.firstElementChild;
    expect(rootWrapper?.className).toContain("overflow-x-hidden");
    expect(rootWrapper?.className).toContain("max-w-full");
  });

  it("4. KPI row maintains exact values on mobile grid", async () => {
    render(<LiveWorldModule />);

    await waitFor(() => {
      expect(screen.getByTestId("active-now-count")).toHaveTextContent("42");
    });

    expect(screen.getByTestId("metric-mobile")).toHaveTextContent("26");
    expect(screen.getByTestId("metric-tablet")).toHaveTextContent("3");
    expect(screen.getByTestId("metric-desktop")).toHaveTextContent("9");
  });

  it("5. Mode tabs (Live Activity, Revenue Map, Purchase Map) continue functioning", async () => {
    render(<LiveWorldModule />);

    await waitFor(() => {
      expect(screen.getByTestId("active-now-count")).toHaveTextContent("42");
    });

    const revButton = screen.getByTestId("globe-mode-revenue");
    fireEvent.click(revButton);

    await waitFor(() => {
      expect(screen.getByTestId("top-geo-summary")).toBeInTheDocument();
    });

    const purchButton = screen.getByTestId("globe-mode-purchase");
    fireEvent.click(purchButton);

    await waitFor(() => {
      expect(screen.getByTestId("top-geo-summary")).toBeInTheDocument();
    });

    const liveButton = screen.getByTestId("globe-mode-live");
    fireEvent.click(liveButton);

    await waitFor(() => {
      expect(screen.getByTestId("metric-active-total")).toBeInTheDocument();
    });
  });

  it("6. Time selector and historical filters continue functioning properly", async () => {
    render(<LiveWorldModule />);

    await waitFor(() => {
      expect(screen.getByTestId("active-now-count")).toHaveTextContent("42");
    });

    fireEvent.click(screen.getByTestId("globe-mode-revenue"));

    await waitFor(() => {
      expect(screen.getByTestId("map-filter-range")).toBeInTheDocument();
    });

    const rangeSelect = screen.getByTestId("map-filter-range");
    fireEvent.change(rangeSelect, { target: { value: "7d" } });

    await waitFor(() => {
      expect(fetchCalls.some((c) => c.includes("range=7d"))).toBe(true);
    });
  });

  it("7. Control Globe button renders with accessible min touch target >= 44px", async () => {
    render(<LiveWorldModule />);

    const controlBtn = screen.getByTestId("globe-control-toggle");
    expect(controlBtn).toBeInTheDocument();
    expect(controlBtn.className).toContain("min-h-[44px]");
    expect(controlBtn).toHaveAttribute("aria-pressed", "false");
  });

  it("8. interactionMode OFF maintains passive page scrolling behavior", async () => {
    render(<LiveWorldModule />);

    const controlBtn = screen.getByTestId("globe-control-toggle");
    expect(controlBtn).toHaveAttribute("aria-pressed", "false");
    expect(controlBtn).toHaveTextContent("Control Globe");
    expect(controlBtn).toHaveTextContent("OFF");
  });

  it("9. interactionMode ON activates globe control mode", async () => {
    render(<LiveWorldModule />);

    const controlBtn = screen.getByTestId("globe-control-toggle");
    fireEvent.click(controlBtn);

    expect(controlBtn).toHaveAttribute("aria-pressed", "true");
    expect(controlBtn).toHaveTextContent("Exit Globe Control");
    expect(controlBtn).toHaveTextContent("ESC");
  });

  it("10. ESC key deactivates control mode without permanent body lock", async () => {
    render(<LiveWorldModule />);

    const controlBtn = screen.getByTestId("globe-control-toggle");
    fireEvent.click(controlBtn);
    expect(controlBtn).toHaveAttribute("aria-pressed", "true");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(controlBtn).toHaveAttribute("aria-pressed", "false");
    expect(document.body.style.position).not.toBe("fixed");
  });

  it("11. No new APIs are called (only existing endpoints are invoked)", async () => {
    render(<LiveWorldModule />);

    await waitFor(() => {
      expect(screen.getByTestId("active-now-count")).toHaveTextContent("42");
    });

    const allowedPrefixes = ["/api/admin/live-world", "/api/admin/live-world/history"];
    fetchCalls.forEach((url) => {
      const isAllowed = allowedPrefixes.some((p) => url.startsWith(p));
      expect(isAllowed).toBe(true);
    });
  });

  it("12. No new polling is created (zero polling in historical mode)", async () => {
    render(<LiveWorldModule />);

    await waitFor(() => {
      expect(screen.getByTestId("active-now-count")).toHaveTextContent("42");
    });

    fireEvent.click(screen.getByTestId("globe-mode-revenue"));

    await waitFor(() => {
      expect(screen.getByTestId("top-geo-summary")).toBeInTheDocument();
    });

    const historyCalls = fetchCalls.filter((c) => c.includes("/api/admin/live-world/history"));
    expect(historyCalls.length).toBe(1);
  });

  it("13. Live and historical sub-view behavior remains intact", async () => {
    render(<LiveWorldModule />);

    const liveTab = screen.getByTestId("tab-live-now");
    const histTab = screen.getByTestId("tab-history");

    expect(liveTab).toBeInTheDocument();
    expect(histTab).toBeInTheDocument();
  });

  it("14. Visitor and purchase data does not change or get altered", async () => {
    render(<LiveWorldModule />);

    await waitFor(() => {
      expect(screen.getByTestId("top-cities-list")).toBeInTheDocument();
    });

    const topCities = screen.getByTestId("top-cities-list");
    expect(topCities).toHaveTextContent("Los Angeles");
    expect(topCities).toHaveTextContent("São Paulo");
  });

  it("15. Desktop layout continues present and fully functional", async () => {
    render(<LiveWorldModule />);

    await waitFor(() => {
      expect(screen.getByTestId("active-now-count")).toHaveTextContent("42");
    });

    expect(screen.getByText("CLOUTFLOW")).toBeInTheDocument();
    expect(screen.getByText("GLOBAL PULSE")).toBeInTheDocument();
    expect(screen.getByTestId("globe-legend")).toBeInTheDocument();
  });

  it("16. UI 5.1–5.5 suffers no regressions when integrated with AdminShell", async () => {
    currentSearch = "tab=live-world";
    render(<AdminShell />);

    await waitFor(() => {
      expect(screen.getByTestId("admin-mobile-header-title")).toHaveTextContent("Live World");
    });

    expect(screen.getByTestId("admin-mobile-header")).toBeInTheDocument();
    expect(screen.getByTestId("admin-bottom-navigation")).toBeInTheDocument();
  });
});
