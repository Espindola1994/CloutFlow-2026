import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AnalyticsModule } from "../AnalyticsModule";
import { OrdersModule } from "../../orders/OrdersModule";

// Mock fetch globally
const mockAnalyticsData = {
  success: true,
  data: {
    range: "7d",
    rangeStart: "2026-09-05T00:00:00Z",
    rangeEnd: "2026-09-12T00:00:00Z",
    kpis: {
      checkoutsStarted: 250,
      checkoutsAbandoned: 150,
      paidOrders: 100,
      checkoutConversionRate: 40.0,
      abandonmentRate: 60.0,
      revenue: 2990.0,
      averageOrderValue: 29.9,
    },
    funnel: {
      started: 250,
      converted: { count: 100, rate: 40.0 },
      abandoned: { count: 150, rate: 60.0 },
    },
    fullFunnel: {
      trackingActive: true,
      activationDate: "2026-08-01T00:00:00Z",
      hasHistoricalWarning: false,
      steps: [
        { stage: "visitors", label: "Visitors", count: 1000, conversionFromPrevious: 100, conversionFromVisitor: 100, lostSessions: 0, dropOffRate: 0 },
        { stage: "network_selected", label: "Network Selected", count: 800, conversionFromPrevious: 80, conversionFromVisitor: 80, lostSessions: 200, dropOffRate: 20 },
        { stage: "paid", label: "Paid", count: 100, conversionFromPrevious: 50, conversionFromVisitor: 10, lostSessions: 100, dropOffRate: 50 },
      ],
      biggestDropOff: {
        fromStage: "Visitors",
        toStage: "Network Selected",
        lostSessions: 200,
        dropOffRate: 20,
      },
    },
    preCheckoutNetworkInterest: [
      { network: "Instagram", platformKey: "instagram", selectedSessions: 500, checkoutSessions: 150, paidOrders: 60, conversionRate: 12 },
    ],
    preCheckoutServiceInterest: [
      { service: "Followers", serviceKey: "followers", selectedSessions: 400, analyzedSessions: 300, checkoutSessions: 120, paidOrders: 50, conversionRate: 12.5 },
    ],
    preCheckoutPlanInterest: [
      { planId: "p1", planName: "1,000 Followers", network: "Instagram", service: "Followers", viewedSessions: 300, selectedSessions: 200, ctaClickedSessions: 150, checkoutSessions: 100, paidOrders: 40 },
    ],
    analyzePerformance: {
      totalAttempts: 350,
      successful: 315,
      failed: 35,
      successRate: 90,
      byNetwork: [
        { network: "Instagram", platformKey: "instagram", attempts: 350, successful: 315, failed: 35, successRate: 90 },
      ],
    },
    trafficSources: [
      { source: "google", sessions: 450, share: 45, paidOrders: 50 },
    ],
    deviceBreakdown: [
      { device: "Mobile", sessions: 700, share: 70 },
      { device: "Desktop", sessions: 300, share: 30 },
    ],
    browserBreakdown: [
      { browser: "Chrome", sessions: 600, share: 60 },
    ],
    performanceOverTime: [
      { date: "2026-09-10", started: 30, paid: 15, abandoned: 15 },
    ],
    networkPerformance: [
      { network: "Instagram", platformKey: "instagram", paidOrders: 60, revenue: 1800, revenueShare: 60, aov: 30, quantitySold: 60000 },
    ],
    servicePerformance: [
      { service: "Followers", serviceKey: "followers", paidOrders: 50, revenue: 1500, revenueShare: 50, aov: 30, quantitySold: 50000 },
    ],
    topPlans: [
      { planId: "p1", planName: "1,000 Followers", network: "Instagram", service: "Followers", quantity: 1000, paidOrders: 40, revenue: 1200, revenueShare: 40, aov: 30 },
    ],
    rankings: {
      bestSellingPlan: { name: "1,000 Followers", network: "Instagram", service: "Followers", revenue: 1200, paidOrders: 40 },
      topNetwork: { network: "Instagram", revenue: 1800, share: 60 },
      topService: { service: "Followers", revenue: 1500, share: 50 },
    },
    abandonment: {
      started: 250,
      abandoned: 150,
      paid: 100,
      abandonmentRate: 60,
      conversionRate: 40,
      abandonedCartValueEstimated: 4500,
      recoveredOrders: 10,
      recoveredRevenue: 300,
    },
    attributionCompact: {
      topSource: "google",
      topCampaign: "summer_sale",
      attributedPaidOrders: 45,
      attributedRevenue: 1350,
    },
  },
};

const mockOrdersData = {
  success: true,
  data: {
    orders: [
      {
        id: "ord_123456789",
        publicId: "ORD1234",
        platform: "instagram",
        target: "cristiano",
        username: "cristiano",
        product: "Instagram Followers • 1,000 Followers",
        email: "buyer@example.com",
        service: "followers",
        plan: "1,000 Followers",
        amount: 29.9,
        grossAmount: 29.9,
        perfectPayFee: 3.66,
        providerCost: 1.2,
        netProfit: 25.04,
        status: "paid",
        fulfillmentStatus: "COMPLETED",
        date: "2026-09-12 14:30:00",
        gateway: "PerfectPay",
        providerStatus: "COMPLETED",
        utmSource: "instagram",
        utmCampaign: "bio_link",
        utmMedium: "social",
      },
    ],
    totalCount: 1,
  },
};

const mockMarginsData = {
  success: true,
  data: {
    grossSales: 29.9,
    grossRevenue: 29.9,
    netRevenue: 29.9,
    refunds: 0,
    chargebacks: 0,
    providerCost: 1.2,
    gatewayFees: 3.66,
    perfectPayFees: 3.66,
    netProfit: 25.04,
    marginPercent: "83.7",
    netMarginPercent: "83.7",
    aov: "29.90",
    refundRate: "0.0",
    chargebackRate: "0.0",
    paidOrdersCount: 1,
    refundedOrdersCount: 0,
    chargebackOrdersCount: 0,
    totalOrdersCount: 1,
  },
};

const mockAttributionData = {
  success: true,
  data: {
    campaigns: [
      {
        source: "instagram",
        campaign: "bio_link",
        medium: "social",
        orders: 1,
        paidOrders: 1,
        revenue: 29.9,
        aov: "29.90",
      },
    ],
  },
};

describe("UI-2 Analytics & Orders UX Redesign Tests", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("/api/admin/analytics")) {
        return {
          ok: true,
          json: async () => mockAnalyticsData,
        };
      }
      if (url.includes("/api/admin/orders")) {
        return {
          ok: true,
          json: async () => mockOrdersData,
        };
      }
      if (url.includes("/api/admin/margins")) {
        return {
          ok: true,
          json: async () => mockMarginsData,
        };
      }
      if (url.includes("/api/admin/attribution")) {
        return {
          ok: true,
          json: async () => mockAttributionData,
        };
      }
      return {
        ok: true,
        json: async () => ({ success: true, data: {} }),
      };
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders AnalyticsModule with 5 tabs and allows navigating between them", async () => {
    render(<AnalyticsModule />);

    // Wait for initial load
    expect(await screen.findByText("Commerce & Funnel Analytics")).toBeDefined();

    // Confirm the 5 UI-2 tabs are rendered
    expect(screen.getByRole("button", { name: /Overview/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Full Funnel/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Traffic & Attribution/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Products & Services/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Pre-Checkout/i })).toBeDefined();

    // Switch to Full Funnel tab
    fireEvent.click(screen.getByRole("button", { name: /Full Funnel/i }));
    expect(await screen.findByText(/Full Funnel \(Pre-Checkout & Conversion\)/i)).toBeDefined();

    // Switch to Products & Services tab
    fireEvent.click(screen.getByRole("button", { name: /Products & Services/i }));
    expect(await screen.findByText(/Top Plans & Packages/i)).toBeDefined();

    // Switch to Pre-Checkout tab
    fireEvent.click(screen.getByRole("button", { name: /Pre-Checkout/i }));
    expect(await screen.findByText(/Analyze Resolution Performance/i)).toBeDefined();
  });

  it("renders OrdersModule with Orders, Margins, and Attribution tabs", async () => {
    render(<OrdersModule />);

    expect(await screen.findByText("Orders & Margins")).toBeDefined();

    // Confirm tabs
    const ordersTab = screen.getByRole("button", { name: /All Orders/i });
    const marginsTab = screen.getByRole("button", { name: /Margins & Costs/i });
    const attributionTab = screen.getByRole("button", { name: /Attribution/i });

    expect(ordersTab).toBeDefined();
    expect(marginsTab).toBeDefined();
    expect(attributionTab).toBeDefined();

    // Orders tab renders order ID in both desktop table and mobile view
    const orderElements = await screen.findAllByText("#ORD1234");
    expect(orderElements.length).toBeGreaterThan(0);

    // Switch to Margins tab
    fireEvent.click(marginsTab);
    expect(await screen.findByText(/Commercial Results \(USD\)/i)).toBeDefined();
    expect(await screen.findByText(/Technical Reconciliation & Costs/i)).toBeDefined();

    // Switch to Attribution tab
    fireEvent.click(attributionTab);
    expect(await screen.findByText(/CAMPAIGN & UTM ATTRIBUTION/i)).toBeDefined();
  });
});
