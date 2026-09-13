import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DashboardOverview } from "../DashboardOverview";
import { AdminThemeProvider } from "../../theme/AdminThemeProvider";
import { AdminShell } from "../../AdminShell";

// Mock next/navigation
const pushMock = vi.fn();
let mockSearchParams = new URLSearchParams();
let mockPathname = "/admin/dashboard";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => mockPathname,
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Sample real data payload mimicking /api/admin/dashboard
const mockStatsSuccess = {
  success: true,
  data: {
    grossSales: 1250.50,
    netRevenue: 1100.00,
    refunds: 100.00,
    chargebacks: 50.50,
    perfectPayFees: 112.25,
    providerCosts: 450.00,
    netProfit: 537.75,
    netMarginPercent: "48.9",
    totalRevenue: 1250.50,
    totalOrders: 32,
    paidOrders: 28,
    refundedOrders: 3,
    chargebackOrders: 1,
    conversionRate: "4.2%",
    averageOrderValue: "39.08",
    refundRate: "8.0",
    chargebackRate: "4.0",
    platformBreakdown: {
      instagram: { count: 18, revenue: 750.00, percentage: 68.2 },
      tiktok: { count: 8, revenue: 250.00, percentage: 22.7 },
      twitter: { count: 4, revenue: 100.00, percentage: 9.1 },
      youtube: { count: 0, revenue: 0, percentage: 0 },
    },
    recentOrders: [
      {
        id: "ord_test_1234567890",
        publicId: "ORD12345",
        platform: "instagram",
        target: "alexgrowth",
        username: "alexgrowth",
        product: "Instagram Followers • 5,000 High Quality",
        email: "alex@example.com",
        service: "followers",
        plan: "5,000 High Quality",
        grossAmount: 49.00,
        amount: 49.00,
        perfectPayFee: 5.36,
        providerCost: 12.50,
        netProfit: 31.14,
        status: "paid",
        fulfillmentStatus: "COMPLETED",
        date: "2026-09-13 15:30",
        gateway: "perfectpay",
        providerStatus: "COMPLETED",
      },
      {
        id: "ord_test_0987654321",
        publicId: "ORD67890",
        platform: "tiktok",
        target: "creatortrend",
        username: "creatortrend",
        product: "TikTok Likes • 1,000 Real Likes",
        email: "trend@example.com",
        service: "likes",
        plan: "1,000 Real Likes",
        grossAmount: 19.99,
        amount: 19.99,
        perfectPayFee: 2.78,
        providerCost: 4.20,
        netProfit: 13.01,
        status: "processing",
        fulfillmentStatus: "IN_PROGRESS",
        date: "2026-09-13 15:45",
        gateway: "perfectpay",
        providerStatus: "IN_PROGRESS",
      },
    ],
  },
};

describe("UI 5.2 — Admin Mobile Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/admin/dashboard")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStatsSuccess),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });
    });
  });

  function renderWithTheme(ui: React.ReactElement) {
    return render(<AdminThemeProvider>{ui}</AdminThemeProvider>);
  }

  it("1. renders real dashboard KPI metrics correctly", async () => {
    renderWithTheme(<DashboardOverview onNavigateToOrders={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("$1250.50")).toBeDefined();
      expect(screen.getByText("$1100.00")).toBeDefined();
      expect(screen.getAllByText("$537.75").length).toBeGreaterThan(0);
      expect(screen.getAllByText("48.9%").length).toBeGreaterThan(0);
    });
  });

  it("2. renders top operational summary for mobile/tablet", async () => {
    renderWithTheme(<DashboardOverview onNavigateToOrders={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Operations Live")).toBeDefined();
      expect(screen.getAllByText("$39.08").length).toBeGreaterThan(0); // AOV
      expect(screen.getByText("28")).toBeDefined(); // Paid count
      expect(screen.getByText("32")).toBeDefined(); // Total count
    });
  });

  it("3. renders mobile recent orders cards with correct platform and status semantics", async () => {
    renderWithTheme(<DashboardOverview onNavigateToOrders={vi.fn()} />);

    await waitFor(() => {
      // Order ID rendered
      expect(screen.getAllByText("#ORD12345").length).toBeGreaterThan(0);
      expect(screen.getAllByText("@alexgrowth • 5,000 High Quality").length).toBeGreaterThan(0);

      // Status badges
      expect(screen.getAllByText("paid").length).toBeGreaterThan(0);
      expect(screen.getAllByText("processing").length).toBeGreaterThan(0);
    });
  });

  it("4. supports quick navigation actions without mutating state", async () => {
    const handleOrders = vi.fn();
    const handleTab = vi.fn();

    renderWithTheme(
      <DashboardOverview 
        onNavigateToOrders={handleOrders} 
        onNavigateToTab={handleTab} 
      />
    );

    await waitFor(() => {
      expect(screen.getByText("Quick Navigation")).toBeDefined();
    });

    const ordersBtn = screen.getByRole("button", { name: /orders & margins/i });
    fireEvent.click(ordersBtn);
    expect(handleOrders).toHaveBeenCalledTimes(1);

    const analyticsBtn = screen.getByRole("button", { name: /analytics/i });
    fireEvent.click(analyticsBtn);
    expect(handleTab).toHaveBeenCalledWith("analytics");
  });

  it("5. renders desktop table view and mobile view simultaneously with respective responsive utility classes", async () => {
    const { container } = renderWithTheme(<DashboardOverview onNavigateToOrders={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getAllByText("#ORD12345").length).toBe(2); // 1 in desktop table, 1 in mobile view
    });

    // Verify desktop table container has hidden md:block
    const desktopTableWrapper = container.querySelector(".hidden.md\\:block");
    expect(desktopTableWrapper).toBeDefined();

    // Verify mobile cards container has md:hidden
    const mobileCardsWrapper = container.querySelector(".md\\:hidden.space-y-2\\.5");
    expect(mobileCardsWrapper).toBeDefined();
  });

  it("6. shows empty state gracefully when there are no recent orders", async () => {
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              ...mockStatsSuccess.data,
              paidOrders: 0,
              totalOrders: 0,
              recentOrders: [],
            },
          }),
      })
    );

    renderWithTheme(<DashboardOverview onNavigateToOrders={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("No orders registered yet")).toBeDefined();
      expect(screen.getByText("No chart data available for this timeframe")).toBeDefined();
    });
  });

  it("7. shows error state and allows retry on network failure", async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error("Network Error"));

    renderWithTheme(<DashboardOverview onNavigateToOrders={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText("Unable to connect to dashboard API")).toBeDefined();
      expect(screen.getByRole("button", { name: /retry/i })).toBeDefined();
    });

    // When retry clicked, should re-fetch
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockStatsSuccess),
    });

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));

    await waitFor(() => {
      expect(screen.queryByText("Unable to connect to dashboard API")).toBeNull();
      expect(screen.getByText("$1250.50")).toBeDefined();
    });
  });

  it("8. preserves UI 5.1 AdminShell navigation and integrates seamlessly", async () => {
    renderWithTheme(<AdminShell />);

    // Mobile header is present
    expect(screen.getByTestId("admin-mobile-header")).toBeDefined();
    expect(screen.getByTestId("admin-mobile-header-title").textContent).toBe("Dashboard");

    // Bottom navigation is present
    expect(screen.getByTestId("admin-bottom-nav-dashboard")).toBeDefined();
    expect(screen.getByTestId("admin-bottom-nav-orders")).toBeDefined();

    // Dashboard content loaded inside shell
    await waitFor(() => {
      expect(screen.getByText("$1250.50")).toBeDefined();
    });
  });
});
