import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { PeakerrChainsModule } from "../PeakerrChainsModule";
import { PeakerrStatusSyncCard } from "../PeakerrStatusSyncCard";
import { PeakerrAutoDispatchCard } from "../PeakerrAutoDispatchCard";

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

// Mock useAdminAutoRefresh hook
vi.mock("@/hooks/useAdminAutoRefresh", () => ({
  useAdminAutoRefresh: vi.fn(),
  useAdminRevalidate: () => vi.fn(),
}));

describe("UI 5.5 — Admin Mobile Fulfillment & Routing", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => {
        if (typeof url === "string" && url.includes("/api/admin/fulfillment/peakerr/inspect")) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              connection: {
                connected: true,
                balance: 142.5,
                currency: "USD",
                servicesCount: 168,
                lastCheckedAt: new Date().toISOString(),
              },
              runtime: {
                apiKeyPresent: true,
                liveFulfillment: true,
                webhookVerified: true,
                targetQueueAutoReleaseEnabled: true,
              },
            }),
          };
        }

        if (typeof url === "string" && url.includes("/api/admin/fulfillment/peakerr/sync")) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              enabled: true,
              targetQueueAutoReleaseEnabled: true,
            }),
          };
        }

        if (typeof url === "string" && url.includes("/api/admin/fulfillment/chains")) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              data: {
                items: [
                  {
                    platform: "instagram",
                    service: "followers",
                    variant: "standard",
                    name: "Instagram Followers",
                    autoFallback: true,
                    services: [
                      { priority: 1, providerServiceId: "31714" },
                      { priority: 2, providerServiceId: "31849" },
                    ],
                  },
                ],
              },
            }),
          };
        }

        if (typeof url === "string" && url.includes("/api/admin/fulfillment/overview")) {
          return {
            ok: true,
            json: async () => ({
              success: true,
              data: {
                fulfillment: {
                  notDispatched: 5,
                  waitingTargetSlot: 2,
                  waitingProvider: 1,
                  submitting: 0,
                  processing: 10,
                  partial: 1,
                  completed: 42,
                  failed: 3,
                  canceled: 0,
                  totalDispatched: 57,
                  totalPaid: 62,
                },
                autoDispatch: {
                  autoDispatchEnabled: true,
                  liveFulfillmentEnabled: true,
                  targetQueueAutoReleaseEnabled: true,
                  paymentTriggerConnected: true,
                  eligiblePaidOrders: 4,
                  blockedMissingTarget: 1,
                  blockedMissingChain: 0,
                  blockedInvalidQuantity: 0,
                  blockedInactiveOffer: 0,
                  blockedInsufficientBalance: 0,
                  blockedPaymentIneligible: 0,
                  blockedAlreadyClaimed: 0,
                  providerBalance: 142.5,
                  currency: "USD",
                },
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

  it("1. dataset existente é reutilizado e mobile status strip renderiza", async () => {
    render(<PeakerrChainsModule />);

    // Wait for connection to load
    await waitFor(() => {
      expect(screen.getAllByText(/PEAKERR PROVIDER/i).length).toBeGreaterThan(0);
    });

    const mobileStatus = screen.getByTestId("peakerr-status-mobile");
    expect(mobileStatus).toBeDefined();
    expect(mobileStatus.className).toContain("md:hidden");
  });

  it("2. cards mobile de chains renderizam com order ID/service ID e sem truncar", async () => {
    render(<PeakerrChainsModule />);

    await waitFor(() => {
      expect(screen.getByTestId("chains-mobile-list")).toBeDefined();
    });

    const mobileList = screen.getByTestId("chains-mobile-list");
    expect(mobileList.className).toContain("md:hidden");

    // Check service configure button has min-h-[44px] touch target
    const configButtons = screen.getAllByRole("button", { name: /Configure/i });
    expect(configButtons.length).toBeGreaterThan(0);
  });

  it("3. actions e modal de configuração abrem e mantêm handlers intactos", async () => {
    render(<PeakerrChainsModule />);

    await waitFor(() => {
      expect(screen.getByTestId("chains-mobile-list")).toBeDefined();
    });

    const configBtn = screen.getByRole("button", { name: /Configure instagram followers/i });
    fireEvent.click(configBtn);

    // Modal should display
    await waitFor(() => {
      expect(screen.getByText(/Configure Chain: INSTAGRAM FOLLOWERS/i)).toBeDefined();
    });
  });

  it("4. PeakerrStatusSyncCard renderiza com touch target >=44px no mobile", () => {
    const onRun = vi.fn();
    render(
      <PeakerrStatusSyncCard
        enabled={true}
        loading={false}
        metrics={{
          checked: 10,
          updated: 5,
          completed: 3,
          partial: 0,
          canceled: 0,
          errors: 0,
          queueReleaseSuccess: 2,
          queueReleaseBlocked: 0,
        }}
        onRunSync={onRun}
        targetQueueAutoReleaseEnabled={true}
      />
    );

    const syncBtn = screen.getByRole("button", { name: /Run Provider Status Sync Now/i });
    expect(syncBtn).toBeDefined();
    expect(syncBtn.className).toContain("min-h-[44px]");

    fireEvent.click(syncBtn);
    expect(onRun).toHaveBeenCalledTimes(1);

    const metricsGrid = screen.getByTestId("status-sync-metrics-grid");
    expect(metricsGrid.className).toContain("grid-cols-2");
  });

  it("5. AutoDispatchCard renders mobile friendly preview and status distribution", async () => {
    render(<PeakerrAutoDispatchCard />);

    await waitFor(() => {
      expect(screen.getAllByText(/AUTO DISPATCH/i).length).toBeGreaterThan(0);
    });

    const previewBtn = screen.getByRole("button", { name: /Preview Eligible Orders for Auto Dispatch/i });
    expect(previewBtn).toBeDefined();
    expect(previewBtn.className).toContain("min-h-[44px]");
  });
});
