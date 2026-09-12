import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { LiveWorldModule } from "@/components/admin/live-world/LiveWorldModule";
import { LiveWorldHistoryView } from "@/components/admin/live-world/LiveWorldHistoryView";
import type { LiveWorldHistoryResponseData } from "@/types/admin-live-world-history";

// Mock next/navigation
const mockPush = vi.fn();
let currentSearch = "tab=live-world&view=history";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => "/admin/dashboard",
  useSearchParams: () => new URLSearchParams(currentSearch),
}));

// Mock recharts ResponsiveContainer to render plain container in jsdom
vi.mock("recharts", async () => {
  const original = await vi.importActual("recharts");
  return {
    ...original,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container" style={{ width: 800, height: 320 }}>
        {children}
      </div>
    ),
  };
});

const sampleHistoryPayload: LiveWorldHistoryResponseData = {
  generatedAt: "2026-09-12T12:00:00.000Z",
  range: "30d",
  filters: {
    platform: null,
    service: null,
    country: null,
  },
  summary: {
    totalPurchases: 45,
    revenueCents: 124550, // $1,245.50
    averageOrderValueCents: 2767, // $27.67
    mappedPurchases: 42,
    unknownGeoPurchases: 3,
  },
  topCountries: [
    { countryCode: "US", purchaseCount: 25, revenueCents: 85000, averageOrderValueCents: 3400 },
    { countryCode: "BR", purchaseCount: 15, revenueCents: 30000, averageOrderValueCents: 2000 },
    { countryCode: "GB", purchaseCount: 5, revenueCents: 9550, averageOrderValueCents: 1910 },
  ],
  topCities: [
    {
      city: "Miami",
      region: "FL",
      countryCode: "US",
      purchaseCount: 18,
      revenueCents: 62000,
      averageOrderValueCents: 3444,
      latitude: 25.76,
      longitude: -80.19,
    },
    {
      city: "Sao Paulo",
      region: "SP",
      countryCode: "BR",
      purchaseCount: 10,
      revenueCents: 20000,
      averageOrderValueCents: 2000,
      latitude: -23.55,
      longitude: -46.63,
    },
  ],
  platforms: [
    { platform: "instagram", purchaseCount: 25, revenueCents: 75000, averageOrderValueCents: 3000 },
    { platform: "tiktok", purchaseCount: 12, revenueCents: 32000, averageOrderValueCents: 2666 },
    { platform: "twitter", purchaseCount: 8, revenueCents: 17550, averageOrderValueCents: 2193 },
  ],
  services: [
    { platform: "instagram", service: "followers", purchaseCount: 15, revenueCents: 50000, averageOrderValueCents: 3333 },
    { platform: "instagram", service: "likes", purchaseCount: 10, revenueCents: 25000, averageOrderValueCents: 2500 },
    { platform: "tiktok", service: "views", purchaseCount: 12, revenueCents: 32000, averageOrderValueCents: 2666 },
  ],
  plans: [
    { planId: "ig-followers-1k", platform: "instagram", service: "followers", purchaseCount: 15, revenueCents: 50000, averageOrderValueCents: 3333 },
    { planId: "ig-likes-500", platform: "instagram", service: "likes", purchaseCount: 10, revenueCents: 25000, averageOrderValueCents: 2500 },
    { planId: "tt-views-10k", platform: "tiktok", service: "views", purchaseCount: 12, revenueCents: 32000, averageOrderValueCents: 2666 },
  ],
  series: [
    { timestamp: "2026-09-01T00:00:00.000Z", purchaseCount: 10, revenueCents: 30000, mappedPurchases: 10 },
    { timestamp: "2026-09-02T00:00:00.000Z", purchaseCount: 15, revenueCents: 45000, mappedPurchases: 14 },
    { timestamp: "2026-09-03T00:00:00.000Z", purchaseCount: 20, revenueCents: 49550, mappedPurchases: 18 },
  ],
};

const emptyPayload: LiveWorldHistoryResponseData = {
  generatedAt: "2026-09-12T12:00:00.000Z",
  range: "30d",
  filters: { platform: null, service: null, country: null },
  summary: {
    totalPurchases: 0,
    revenueCents: 0,
    averageOrderValueCents: 0,
    mappedPurchases: 0,
    unknownGeoPurchases: 0,
  },
  topCountries: [],
  topCities: [],
  platforms: [],
  services: [],
  plans: [],
  series: [],
};

describe("LiveWorldHistoryView & Navigation (Phase 4B)", () => {
  let fetchSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    currentSearch = "tab=live-world&view=history";
    fetchSpy = vi.spyOn(global, "fetch").mockImplementation(async (url: any) => {
      const urlStr = String(url);
      if (urlStr.includes("/api/admin/live-world/history")) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true, data: sampleHistoryPayload }),
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
    vi.useRealTimers();
    fetchSpy.mockRestore();
  });

  it("1. History view renders in document", async () => {
    render(<LiveWorldHistoryView />);
    await waitFor(() => {
      expect(screen.getByTestId("live-world-history-view")).toBeInTheDocument();
    });
  });

  it("2. default range 30d is selected and requested", async () => {
    render(<LiveWorldHistoryView />);
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("range=30d"),
        expect.anything()
      );
    });
    const rangeSelect = screen.getByTestId("filter-range-select") as HTMLSelectElement;
    expect(rangeSelect.value).toBe("30d");
  });

  it("3. switches range to 24h and triggers new API request", async () => {
    render(<LiveWorldHistoryView />);
    await waitFor(() => {
      expect(screen.getByTestId("filter-range-select")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("filter-range-select"), {
      target: { value: "24h" },
    });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("range=24h"),
        expect.anything()
      );
    });
  });

  it("4. switches range to 7d", async () => {
    render(<LiveWorldHistoryView />);
    await waitFor(() => {
      expect(screen.getByTestId("filter-range-select")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("filter-range-select"), {
      target: { value: "7d" },
    });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("range=7d"),
        expect.anything()
      );
    });
  });

  it("5. switches range to 90d", async () => {
    render(<LiveWorldHistoryView />);
    await waitFor(() => {
      expect(screen.getByTestId("filter-range-select")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("filter-range-select"), {
      target: { value: "90d" },
    });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("range=90d"),
        expect.anything()
      );
    });
  });

  it("6. filters platform and sends valid slug", async () => {
    render(<LiveWorldHistoryView />);
    await waitFor(() => {
      expect(screen.getByTestId("filter-platform-select")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("filter-platform-select"), {
      target: { value: "instagram" },
    });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("platform=instagram"),
        expect.anything()
      );
    });
  });

  it("7. filters service and sends valid slug", async () => {
    render(<LiveWorldHistoryView />);
    await waitFor(() => {
      expect(screen.getByTestId("filter-service-select")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("filter-service-select"), {
      target: { value: "likes" },
    });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("service=likes"),
        expect.anything()
      );
    });
  });

  it("8. filters country and sends uppercase ISO code", async () => {
    render(<LiveWorldHistoryView />);
    await waitFor(() => {
      expect(screen.getByTestId("filter-country-select")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("filter-country-select"), {
      target: { value: "BR" },
    });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("country=BR"),
        expect.anything()
      );
    });
  });

  it("9. X / Twitter option displays friendly label but sends twitter to API", async () => {
    render(<LiveWorldHistoryView />);
    await waitFor(() => {
      expect(screen.getByTestId("filter-platform-select")).toBeInTheDocument();
    });

    // Check option label inside select
    const platformSelect = screen.getByTestId("filter-platform-select");
    expect(platformSelect).toHaveTextContent("X / Twitter");

    fireEvent.change(screen.getByTestId("filter-platform-select"), {
      target: { value: "twitter" },
    });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining("platform=twitter"),
        expect.anything()
      );
    });
  });

  it("10. invalid combination YouTube + Followers is disabled / blocked on UI", async () => {
    render(<LiveWorldHistoryView />);
    await waitFor(() => {
      expect(screen.getByTestId("filter-platform-select")).toBeInTheDocument();
    });

    // Select YouTube
    fireEvent.change(screen.getByTestId("filter-platform-select"), {
      target: { value: "youtube" },
    });

    const serviceSelect = screen.getByTestId("filter-service-select") as HTMLSelectElement;
    const followersOption = serviceSelect.querySelector('option[value="followers"]') as HTMLOptionElement;

    expect(followersOption.disabled).toBe(true);
  });

  it("11. API is requested upon filter change without page reload", async () => {
    render(<LiveWorldHistoryView />);
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByTestId("filter-platform-select"), {
      target: { value: "tiktok" },
    });

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });

  it("12. zero polling on history view: no periodic API polling occurs", async () => {
    render(<LiveWorldHistoryView />);
    await waitFor(() => {
      expect(screen.getByTestId("live-world-history-view")).toBeInTheDocument();
      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    // Wait a delay and ensure no additional fetch calls happen automatically
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("13. summary cards render accurate numbers from API payload", async () => {
    render(<LiveWorldHistoryView />);
    await waitFor(() => {
      expect(screen.getByTestId("summary-purchases")).toHaveTextContent("45");
      expect(screen.getByTestId("summary-revenue")).toHaveTextContent("$1,245.50");
      expect(screen.getByTestId("summary-aov")).toHaveTextContent("$27.67");
      expect(screen.getByTestId("summary-mapped")).toHaveTextContent("42");
      expect(screen.getByTestId("summary-unknown")).toHaveTextContent("3");
    });
  });

  it("14. revenue is strictly formatted in USD regardless of region", async () => {
    render(<LiveWorldHistoryView />);
    await waitFor(() => {
      expect(screen.getByTestId("summary-revenue")).toHaveTextContent("$1,245.50");
    });
  });

  it("15. AOV is converted and formatted in USD", async () => {
    render(<LiveWorldHistoryView />);
    await waitFor(() => {
      expect(screen.getByTestId("summary-aov")).toHaveTextContent("$27.67");
    });
  });

  it("16. chart component renders container with data series", async () => {
    render(<LiveWorldHistoryView />);
    await waitFor(() => {
      expect(screen.getByTestId("history-timeseries-chart")).toBeInTheDocument();
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });
  });

  it("17. Top Countries table renders correctly with purchases, revenue, and AOV", async () => {
    render(<LiveWorldHistoryView />);
    await waitFor(() => {
      const section = screen.getByTestId("top-countries-section");
      expect(section).toHaveTextContent("US");
      expect(section).toHaveTextContent("$850.00");
      expect(section).toHaveTextContent("BR");
      expect(section).toHaveTextContent("$300.00");
    });
  });

  it("18. Top Cities table renders correctly with city, region, country, revenue, and AOV", async () => {
    render(<LiveWorldHistoryView />);
    await waitFor(() => {
      const section = screen.getByTestId("top-cities-section");
      expect(section).toHaveTextContent("Miami");
      expect(section).toHaveTextContent("FL, US");
      expect(section).toHaveTextContent("$620.00");
      expect(section).toHaveTextContent("Sao Paulo");
      expect(section).toHaveTextContent("SP, BR");
    });
  });

  it("19. Platform Performance section renders properly", async () => {
    render(<LiveWorldHistoryView />);
    await waitFor(() => {
      const section = screen.getByTestId("platform-performance-section");
      expect(section).toHaveTextContent("Instagram");
      expect(section).toHaveTextContent("$750.00");
      expect(section).toHaveTextContent("X / Twitter");
      expect(section).toHaveTextContent("$175.50");
    });
  });

  it("20. Service Performance section renders correctly", async () => {
    render(<LiveWorldHistoryView />);
    await waitFor(() => {
      const section = screen.getByTestId("service-performance-section");
      expect(section).toHaveTextContent("Followers");
      expect(section).toHaveTextContent("Instagram");
      expect(section).toHaveTextContent("$500.00");
    });
  });

  it("21. Plan Performance section renders payload plans without inventing labels", async () => {
    render(<LiveWorldHistoryView />);
    await waitFor(() => {
      const section = screen.getByTestId("plan-performance-section");
      expect(section).toHaveTextContent("ig-followers-1k");
      expect(section).toHaveTextContent("$500.00");
    });
  });

  it("22. empty state displays gracefully with zero purchases and 'No purchase data for this period.'", async () => {
    fetchSpy.mockImplementationOnce(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: emptyPayload }),
    }));

    render(<LiveWorldHistoryView />);
    await waitFor(() => {
      expect(screen.getByTestId("summary-purchases")).toHaveTextContent("0");
      expect(screen.getByTestId("summary-revenue")).toHaveTextContent("$0.00");
      expect(screen.getByTestId("summary-aov")).toHaveTextContent("$0.00");
      expect(screen.getAllByText("No purchase data for this period.")[0]).toBeInTheDocument();
    });
  });

  it("23. loading state preserves layout without crash", async () => {
    let resolver: any;
    fetchSpy.mockImplementationOnce(() => new Promise((resolve) => {
      resolver = resolve;
    }));

    render(<LiveWorldHistoryView />);
    expect(screen.getByText("Loading historical series...")).toBeInTheDocument();

    act(() => {
      resolver({
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: sampleHistoryPayload }),
      });
    });

    await waitFor(() => {
      expect(screen.queryByText("Loading historical series...")).not.toBeInTheDocument();
    });
  });

  it("24. error state displays banner and retry button if API fails", async () => {
    fetchSpy.mockImplementationOnce(async () => ({
      ok: false,
      status: 500,
      json: async () => ({ success: false, error: { message: "Database timeout" } }),
    }));

    render(<LiveWorldHistoryView />);
    await waitFor(() => {
      expect(screen.getByTestId("history-error-banner")).toBeInTheDocument();
      expect(screen.getByText("Historical analytics temporarily unavailable.")).toBeInTheDocument();
      expect(screen.getByText("Retry Query")).toBeInTheDocument();
    });
  });

  it("25. zero PII is ever rendered in the output", async () => {
    render(<LiveWorldHistoryView />);
    await waitFor(() => {
      expect(screen.getByTestId("live-world-history-view")).toBeInTheDocument();
    });

    const html = document.body.innerHTML;
    expect(html).not.toMatch(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    expect(html).not.toContain("visitorId");
    expect(html).not.toContain("sessionId");
    expect(html).not.toContain("checkoutToken");
  });

  it("26. Live Now tab button and History tab button allow navigation inside LiveWorldModule", async () => {
    currentSearch = "tab=live-world&view=live";
    render(<LiveWorldModule />);

    await waitFor(() => {
      expect(screen.getByTestId("tab-live-now")).toBeInTheDocument();
      expect(screen.getByTestId("tab-history")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("tab-history"));
    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining("view=history"),
      expect.anything()
    );
  });
});
