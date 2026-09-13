import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SupplierRoutingControlCenter } from "../SupplierRoutingControlCenter";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/admin/dashboard",
}));

// Mock sonner toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("UI 5.5 — Admin Mobile Supplier Routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (typeof url === "string" && url.includes("/api/admin/supplier-routing/overview")) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              data: {
                revenueTodayFormatted: "$1,250.00",
                supplierSpendTodayFormatted: "$320.00",
                estimatedGrossProfitTodayFormatted: "$930.00",
                averageGrossMarginPercent: 74,
                ordersRoutedPriority: 85,
                ordersRoutedFallback1: 12,
                ordersRoutedFallback2: 3,
                ordersOnHold: 0,
                manualReviews: 0,
              },
            }),
          };
        }

        if (typeof url === "string" && url.includes("/api/admin/supplier-routing/products")) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              data: [
                {
                  id: "prod_insta_f_1k",
                  platform: "instagram",
                  service: "followers",
                  plan: "1,000 Followers",
                  quantity: 1000,
                  sellingPrice: 9.99,
                  priorityServiceId: "31714",
                  priorityRate: 0.85,
                  priorityEstimatedCost: 0.85,
                  fallback1ServiceId: "31849",
                  fallback1Rate: 0.95,
                  fallback1EstimatedCost: 0.95,
                  fallback2ServiceId: "31850",
                  fallback2Rate: 1.10,
                  fallback2EstimatedCost: 1.10,
                  allowedSupplierCost: 2.50,
                  minimumGrossMarginPercent: 70,
                  minimumGrossProfit: 5.00,
                  routingHealth: "GREEN",
                  effectiveEligibleSupplier: "priority",
                },
              ],
            }),
          };
        }

        if (typeof url === "string" && url.includes("/api/admin/supplier-routing/manual-review")) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              data: [
                {
                  id: "ord_hold_001",
                  publicId: "ORD-HOLD1",
                  platform: "instagram",
                  service: "followers",
                  quantity: 5000,
                  username: "targetcreator",
                  customerPaidFormatted: "$45.00",
                  holdReason: "Cost Ceiling Violation ($15.00 > $10.00)",
                  allowedSupplierCost: 10.00,
                  createdAt: new Date().toISOString(),
                  priorityAttempt: {
                    supplierId: "31714",
                    cost: 15.00,
                    decision: "REJECTED_CEILING",
                  },
                },
              ],
            }),
          };
        }

        if (typeof url === "string" && url.includes("/api/admin/supplier-routing/alerts")) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              data: [],
            }),
          };
        }

        if (typeof url === "string" && url.includes("/api/admin/supplier-routing/history")) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              data: {
                items: [
                  {
                    id: "hist_001",
                    createdAt: new Date().toISOString(),
                    orderId: "ord_hist_123",
                    supplierPosition: "priority",
                    supplierServiceId: "31714",
                    supplierRate: 0.85,
                    supplierCalculatedCost: 0.85,
                    sellingPrice: 9.99,
                    grossProfit: 7.50,
                    grossMarginPercent: 75,
                    allowedSupplierCost: 2.50,
                    decision: "ACCEPTED",
                  },
                ],
                totalPages: 1,
              },
            }),
          };
        }

        return {
          ok: true,
          json: async () => ({ success: true }),
        };
      })
    );
  });

  it("1. metrics grid renderiza adaptada para mobile em 2 colunas", async () => {
    render(<SupplierRoutingControlCenter />);

    await waitFor(() => {
      expect(screen.getByTestId("supplier-routing-metrics-grid")).toBeDefined();
    });

    const grid = screen.getByTestId("supplier-routing-metrics-grid");
    expect(grid.className).toContain("grid-cols-2");
    expect(grid.className).toContain("md:grid-cols-4");
  });

  it("2. mobile routing catalog cards renderizam com IDs intactos e touch targets apropriados", async () => {
    render(<SupplierRoutingControlCenter />);

    await waitFor(() => {
      expect(screen.getByTestId("supplier-routing-mobile-cards")).toBeDefined();
    });

    const mobileCards = screen.getByTestId("supplier-routing-mobile-cards");
    expect(mobileCards.className).toContain("md:hidden");

    // Primary ID 31714 must be present and untouched
    expect(screen.getAllByText(/#31714/i).length).toBeGreaterThan(0);
    // Fallback 1 ID 31849 must be present and untouched
    expect(screen.getAllByText(/#31849/i).length).toBeGreaterThan(0);
  });

  it("3. manual review queue renders mobile cards with touch targets >=44px", async () => {
    render(<SupplierRoutingControlCenter />);

    // Click on manual review subtab
    const queueTab = screen.getByRole("button", { name: /Manual Review Queue/i });
    fireEvent.click(queueTab);

    await waitFor(() => {
      expect(screen.getByTestId("manual-review-mobile-list")).toBeDefined();
    });

    const mobileQueue = screen.getByTestId("manual-review-mobile-list");
    expect(mobileQueue.className).toContain("md:hidden");

    // Retry and Override buttons have min-h-[44px]
    const retryBtn = screen.getByRole("button", { name: /Retry Routing ORD-HOLD1/i });
    expect(retryBtn).toBeDefined();
    expect(retryBtn.className).toContain("min-h-[44px]");

    const overrideBtn = screen.getByRole("button", { name: /Override ORD-HOLD1/i });
    expect(overrideBtn).toBeDefined();
    expect(overrideBtn.className).toContain("min-h-[44px]");
  });

  it("4. routing attempt history renders mobile cards with full audit trail", async () => {
    render(<SupplierRoutingControlCenter />);

    // Click on history subtab
    const historyTab = screen.getByRole("button", { name: /Supplier Routing History/i });
    fireEvent.click(historyTab);

    await waitFor(() => {
      expect(screen.getByTestId("supplier-history-mobile-list")).toBeDefined();
    });

    const mobileHistory = screen.getByTestId("supplier-history-mobile-list");
    expect(mobileHistory.className).toContain("md:hidden");

    expect(screen.getAllByText(/ACCEPTED/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ID #31714/i).length).toBeGreaterThan(0);
  });
});
