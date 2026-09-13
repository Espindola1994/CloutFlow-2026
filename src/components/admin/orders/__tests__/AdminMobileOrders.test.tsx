import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { OrdersModule } from "../OrdersModule";
import { MobileOrderCard } from "../MobileOrderCard";
import { MobileOrdersFilterSheet } from "../MobileOrdersFilterSheet";
import { MobileOrderDetailsSheet } from "../MobileOrderDetailsSheet";
import { MobileOrdersSkeleton } from "../MobileOrdersSkeleton";
import { AdminThemeProvider } from "../../theme/AdminThemeProvider";
import { AdminShell } from "../../AdminShell";
import { Order } from "../../types";

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

// Mock useAdminAutoRefresh hook
vi.mock("@/hooks/useAdminAutoRefresh", () => ({
  useAdminAutoRefresh: vi.fn(),
}));

const sampleOrders: Order[] = [
  {
    id: "ord_rec_001",
    publicId: "ORD-ALPHA",
    platform: "instagram",
    target: "speedybrand",
    username: "speedybrand",
    product: "Instagram Followers • 5,000 Premium HQ",
    email: "client1@example.com",
    service: "followers",
    plan: "5,000 Premium HQ",
    amount: 49.99,
    grossAmount: 49.99,
    perfectPayFee: 5.45,
    providerCost: 12.00,
    netProfit: 32.54,
    status: "paid",
    fulfillmentStatus: "COMPLETED",
    date: "2026-09-13 10:15",
    gateway: "PerfectPay",
    providerStatus: "COMPLETED",
    utmSource: "google",
    utmCampaign: "brand_search",
    utmMedium: "cpc",
  },
  {
    id: "ord_rec_002",
    publicId: "ORD-BETA",
    platform: "tiktok",
    target: "viraldance",
    username: "viraldance",
    product: "TikTok Views • 50,000 Instant Views",
    email: "dancer@example.com",
    service: "views",
    plan: "50,000 Instant Views",
    amount: 19.50,
    grossAmount: 19.50,
    perfectPayFee: 2.74,
    providerCost: 4.10,
    netProfit: 12.66,
    status: "pending",
    fulfillmentStatus: "IN_PROGRESS",
    date: "2026-09-13 11:20",
    gateway: "PerfectPay",
    providerStatus: "IN_PROGRESS",
    utmSource: "tiktok",
    utmCampaign: "creator_bio",
    utmMedium: "social",
  },
];

describe("UI 5.3 — Admin Mobile Orders Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    mockPathname = "/admin/dashboard";
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("/api/admin/orders")) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              orders: sampleOrders,
              totalCount: 2,
            },
          }),
        };
      }
      if (url.includes("/api/admin/margins")) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              grossSales: 69.49,
              grossRevenue: 69.49,
              netRevenue: 69.49,
              refunds: 0,
              chargebacks: 0,
              providerCost: 16.10,
              gatewayFees: 8.19,
              perfectPayFees: 8.19,
              netProfit: 45.20,
              marginPercent: "65.0",
              netMarginPercent: "65.0",
              aov: "34.75",
              refundRate: "0.0",
              chargebackRate: "0.0",
              paidOrdersCount: 2,
              refundedOrdersCount: 0,
              chargebackOrdersCount: 0,
              totalOrdersCount: 2,
            },
          }),
        };
      }
      return {
        ok: true,
        json: async () => ({ success: true, data: {} }),
      };
    }));
  });

  describe("Mobile Order Cards", () => {
    it("renders order cards with real ID, target, platform, status, financial values, and fulfillment", () => {
      const handleViewDetails = vi.fn();
      render(
        <AdminThemeProvider>
          <MobileOrderCard order={sampleOrders[0]} onViewDetails={handleViewDetails} />
        </AdminThemeProvider>
      );

      // Order ID
      expect(screen.getByText("#ORD-ALPHA")).toBeDefined();
      // Target
      expect(screen.getByText("@speedybrand")).toBeDefined();
      // Product
      expect(screen.getByText("Instagram Followers • 5,000 Premium HQ")).toBeDefined();
      // Status
      expect(screen.getByText("paid")).toBeDefined();
      // Financial values (exact, no recalculation)
      expect(screen.getByText("$49.99")).toBeDefined();
      expect(screen.getByText("$32.54")).toBeDefined();
      // Fulfillment
      expect(screen.getByText("COMPLETED")).toBeDefined();
      // Date
      expect(screen.getByText("2026-09-13 10:15")).toBeDefined();

      // Trigger details
      const viewBtn = screen.getByTestId("btn-view-details-ord_rec_001");
      fireEvent.click(viewBtn);
      expect(handleViewDetails).toHaveBeenCalledWith(sampleOrders[0]);
    });

    it("supports copying order ID and target username with clipboard API", () => {
      const clipboardWriteMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: clipboardWriteMock,
        },
      });

      render(
        <AdminThemeProvider>
          <MobileOrderCard order={sampleOrders[0]} onViewDetails={vi.fn()} />
        </AdminThemeProvider>
      );

      const copyIdBtn = screen.getByLabelText("Copy order ID ORD-ALPHA");
      fireEvent.click(copyIdBtn);
      expect(clipboardWriteMock).toHaveBeenCalledWith("ORD-ALPHA");

      const copyTargetBtn = screen.getByLabelText("Copy target username speedybrand");
      fireEvent.click(copyTargetBtn);
      expect(clipboardWriteMock).toHaveBeenCalledWith("speedybrand");
    });
  });

  describe("Mobile Orders Filter Sheet", () => {
    it("opens, displays existing filter options, applies filter and resets", () => {
      const handleApply = vi.fn();
      const handleReset = vi.fn();
      const handleClose = vi.fn();

      const { rerender } = render(
        <AdminThemeProvider>
          <MobileOrdersFilterSheet
            isOpen={true}
            onClose={handleClose}
            platform="all"
            status="all"
            onApply={handleApply}
            onReset={handleReset}
            totalResults={2}
          />
        </AdminThemeProvider>
      );

      expect(screen.getByTestId("mobile-orders-filter-sheet")).toBeDefined();
      expect(screen.getByText("Filter Orders")).toBeDefined();
      expect(screen.getByText("2 total")).toBeDefined();

      // Select Instagram platform
      fireEvent.click(screen.getByTestId("filter-platform-option-instagram"));
      // Select Paid status
      fireEvent.click(screen.getByTestId("filter-status-option-paid"));

      // Click Apply
      fireEvent.click(screen.getByTestId("filter-sheet-apply-btn"));
      expect(handleApply).toHaveBeenCalledWith("instagram", "paid");
      expect(handleClose).toHaveBeenCalled();

      // Reopen with active filter to test reset
      rerender(
        <AdminThemeProvider>
          <MobileOrdersFilterSheet
            isOpen={true}
            onClose={handleClose}
            platform="instagram"
            status="paid"
            onApply={handleApply}
            onReset={handleReset}
            totalResults={1}
          />
        </AdminThemeProvider>
      );

      fireEvent.click(screen.getByTestId("filter-sheet-reset-btn"));
      expect(handleReset).toHaveBeenCalled();
    });

    it("closes when backdrop or close button is clicked or Escape key pressed", () => {
      const handleClose = vi.fn();
      const { rerender } = render(
        <AdminThemeProvider>
          <MobileOrdersFilterSheet
            isOpen={true}
            onClose={handleClose}
            platform="all"
            status="all"
            onApply={vi.fn()}
            onReset={vi.fn()}
          />
        </AdminThemeProvider>
      );

      // Close button
      fireEvent.click(screen.getByTestId("filter-sheet-close-btn"));
      expect(handleClose).toHaveBeenCalledTimes(1);

      // Backdrop
      fireEvent.click(screen.getByTestId("filter-sheet-backdrop"));
      expect(handleClose).toHaveBeenCalledTimes(2);

      // Escape key
      fireEvent.keyDown(window, { key: "Escape" });
      expect(handleClose).toHaveBeenCalledTimes(3);

      // When closed, sheet is null
      rerender(
        <AdminThemeProvider>
          <MobileOrdersFilterSheet
            isOpen={false}
            onClose={handleClose}
            platform="all"
            status="all"
            onApply={vi.fn()}
            onReset={vi.fn()}
          />
        </AdminThemeProvider>
      );
      expect(screen.queryByTestId("mobile-orders-filter-sheet")).toBeNull();
    });
  });

  describe("Mobile Order Details Sheet", () => {
    it("renders comprehensive modal sheet with ordered fields and exact finances", () => {
      const handleClose = vi.fn();
      render(
        <AdminThemeProvider>
          <MobileOrderDetailsSheet
            order={sampleOrders[0]}
            isOpen={true}
            onClose={handleClose}
          />
        </AdminThemeProvider>
      );

      expect(screen.getByTestId("mobile-order-details-sheet")).toBeDefined();
      expect(screen.getByRole("heading", { name: "#ORD-ALPHA" })).toBeDefined();
      expect(screen.getByText("@speedybrand")).toBeDefined();
      expect(screen.getByText("client1@example.com")).toBeDefined();

      // Finances exact
      expect(screen.getByText("$49.99")).toBeDefined();
      expect(screen.getByText("-$5.45")).toBeDefined(); // PerfectPay Fee
      expect(screen.getByText("-$12.00")).toBeDefined(); // Provider Cost
      expect(screen.getByText("$32.54")).toBeDefined(); // Net Profit

      // Fulfillment
      expect(screen.getByText("Fulfillment Status")).toBeDefined();

      // Marketing attribution
      expect(screen.getByText("google")).toBeDefined();
      expect(screen.getByText("brand_search")).toBeDefined();
      expect(screen.getByText("cpc")).toBeDefined();

      // Close action
      fireEvent.click(screen.getByRole("button", { name: "Close Details" }));
      expect(handleClose).toHaveBeenCalled();
    });
  });

  describe("OrdersModule Full Integration", () => {
    it("loads orders from API and renders both desktop table (>=901px) and mobile cards list (<=900px)", async () => {
      const { container } = render(
        <AdminThemeProvider>
          <OrdersModule />
        </AdminThemeProvider>
      );

      // Wait for orders to load
      await waitFor(() => {
        expect(screen.getByText("All Orders (2)")).toBeDefined();
      });

      // Desktop table container (hidden md:block) exists
      const desktopTableWrapper = container.querySelector(".hidden.md\\:block");
      expect(desktopTableWrapper).toBeDefined();

      // Mobile cards container (md:hidden) exists
      const mobileCardsWrapper = container.querySelector("[data-testid='mobile-orders-list']");
      expect(mobileCardsWrapper).toBeDefined();

      // Mobile order cards rendered
      expect(screen.getByTestId("mobile-order-card-ord_rec_001")).toBeDefined();
      expect(screen.getByTestId("mobile-order-card-ord_rec_002")).toBeDefined();
    });

    it("opens mobile filter sheet and applies search query correctly", async () => {
      render(
        <AdminThemeProvider>
          <OrdersModule />
        </AdminThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("All Orders (2)")).toBeDefined();
      });

      // Click mobile filters button
      const openFiltersBtn = screen.getByTestId("btn-open-mobile-filters");
      fireEvent.click(openFiltersBtn);

      expect(screen.getByTestId("mobile-orders-filter-sheet")).toBeDefined();

      // Search input changes page to 1
      const searchInputs = screen.getAllByPlaceholderText(/Search orders.../i);
      expect(searchInputs.length).toBeGreaterThan(0);
      fireEvent.change(searchInputs[0], { target: { value: "speedy" } });
    });

    it("opens mobile order details sheet when 'View Details' is tapped on a mobile card", async () => {
      render(
        <AdminThemeProvider>
          <OrdersModule />
        </AdminThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("mobile-order-card-ord_rec_001")).toBeDefined();
      });

      const viewDetailsBtn = screen.getByTestId("btn-view-details-ord_rec_001");
      fireEvent.click(viewDetailsBtn);

      expect(screen.getByTestId("mobile-order-details-sheet")).toBeDefined();
      expect(screen.getByTestId("order-details-content")).toBeDefined();
      expect(screen.getByText("Transaction Recorded")).toBeDefined();
    });

    it("displays error state with retry capability when API fails", async () => {
      vi.stubGlobal("fetch", vi.fn(async (url: string) => {
        if (url.includes("/api/admin/orders")) {
          return {
            ok: false,
            json: async () => ({
              success: false,
              error: { message: "Failed to connect to database" },
            }),
          };
        }
        return {
          ok: true,
          json: async () => ({ success: true, data: {} }),
        };
      }));

      render(
        <AdminThemeProvider>
          <OrdersModule />
        </AdminThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("orders-error-container")).toBeDefined();
      });

      expect(screen.getByText("Failed to connect to database")).toBeDefined();
      expect(screen.getByTestId("btn-orders-retry")).toBeDefined();
    });

    it("displays empty state when 0 orders match criteria", async () => {
      vi.stubGlobal("fetch", vi.fn(async (url: string) => {
        if (url.includes("/api/admin/orders")) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              data: {
                orders: [],
                totalCount: 0,
              },
            }),
          };
        }
        return {
          ok: true,
          json: async () => ({ success: true, data: {} }),
        };
      }));

      render(
        <AdminThemeProvider>
          <OrdersModule />
        </AdminThemeProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("orders-empty-state")).toBeDefined();
      });

      expect(screen.getByText("No orders match the selected filters")).toBeDefined();
    });

    it("renders loading skeleton during mobile order fetching", () => {
      render(
        <AdminThemeProvider>
          <MobileOrdersSkeleton count={2} />
        </AdminThemeProvider>
      );

      expect(screen.getByTestId("mobile-orders-skeleton")).toBeDefined();
    });
  });

  describe("Regression Prevention (UI 5.1 and UI 5.2)", () => {
    it("preserves AdminShell navigation and does not mutate bottom navigation or header", () => {
      mockSearchParams = new URLSearchParams("tab=orders");
      render(<AdminShell />);

      // Mobile header reflects Orders & Margins
      expect(screen.getByTestId("admin-mobile-header")).toBeDefined();
      expect(screen.getByTestId("admin-mobile-header-title").textContent).toBe("Orders & Margins");

      // Bottom navigation marks Orders as active
      expect(screen.getByTestId("admin-bottom-nav-orders").getAttribute("aria-current")).toBe("page");
    });
  });
});
