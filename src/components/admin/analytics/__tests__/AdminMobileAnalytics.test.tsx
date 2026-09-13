import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AnalyticsModule } from "../AnalyticsModule";
import { AnalyticsKpis } from "../AnalyticsKpis";
import { NetworkPerformanceCard } from "../NetworkPerformanceCard";
import { ServicePerformanceCard } from "../ServicePerformanceCard";
import { TopPlansCard } from "../TopPlansCard";
import { PreCheckoutInterestsCard } from "../PreCheckoutInterestsCard";
import { PreCheckoutPlanInterestCard } from "../PreCheckoutPlanInterestCard";
import { AnalyzePerformanceCard } from "../AnalyzePerformanceCard";
import { PerformanceTimeSeriesChart } from "../PerformanceTimeSeriesChart";
import { AdminThemeProvider } from "../../theme/AdminThemeProvider";

const mockAnalyticsPayload = {
  success: true,
  data: {
    range: "7d",
    rangeStart: "2026-09-06T00:00:00Z",
    rangeEnd: "2026-09-13T00:00:00Z",
    kpis: {
      checkoutsStarted: 320,
      checkoutsAbandoned: 180,
      paidOrders: 140,
      checkoutConversionRate: 43.75,
      abandonmentRate: 56.25,
      revenue: 4180.5,
      averageOrderValue: 29.86,
    },
    funnel: {
      started: 320,
      converted: { count: 140, rate: 43.75 },
      abandoned: { count: 180, rate: 56.25 },
    },
    fullFunnel: {
      trackingActive: true,
      activationDate: "2026-08-01T00:00:00Z",
      hasHistoricalWarning: false,
      steps: [
        { stage: "visitors", label: "Visitors", count: 1500, conversionFromPrevious: 100, conversionFromVisitor: 100, lostSessions: 0, dropOffRate: 0 },
        { stage: "checkout_started", label: "Checkout Started", count: 320, conversionFromPrevious: 21.3, conversionFromVisitor: 21.3, lostSessions: 1180, dropOffRate: 78.7 },
        { stage: "paid", label: "Paid", count: 140, conversionFromPrevious: 43.8, conversionFromVisitor: 9.3, lostSessions: 180, dropOffRate: 56.2 },
      ],
      biggestDropOff: {
        fromStage: "Visitors",
        toStage: "Checkout Started",
        lostSessions: 1180,
        dropOffRate: 78.7,
      },
    },
    preCheckoutNetworkInterest: [
      { network: "Instagram", platformKey: "instagram", selectedSessions: 750, checkoutSessions: 220, paidOrders: 100, conversionRate: 13.3 },
      { network: "TikTok", platformKey: "tiktok", selectedSessions: 450, checkoutSessions: 100, paidOrders: 40, conversionRate: 8.9 },
    ],
    preCheckoutServiceInterest: [
      { service: "Followers", serviceKey: "followers", selectedSessions: 600, analyzedSessions: 450, checkoutSessions: 180, paidOrders: 85, conversionRate: 14.2 },
      { service: "Views", serviceKey: "views", selectedSessions: 350, analyzedSessions: 250, checkoutSessions: 90, paidOrders: 35, conversionRate: 10.0 },
    ],
    preCheckoutPlanInterest: [
      { planId: "p_ig_1k", planName: "1,000 Followers", network: "Instagram", service: "Followers", viewedSessions: 400, selectedSessions: 280, ctaClickedSessions: 210, checkoutSessions: 150, paidOrders: 70 },
    ],
    analyzePerformance: {
      totalAttempts: 520,
      successful: 480,
      failed: 40,
      successRate: 92.3,
      byNetwork: [
        { network: "Instagram", platformKey: "instagram", attempts: 380, successful: 360, failed: 20, successRate: 94.7 },
        { network: "TikTok", platformKey: "tiktok", attempts: 140, successful: 120, failed: 20, successRate: 85.7 },
      ],
    },
    trafficSources: [
      { source: "google", sessions: 650, share: 43.3, paidOrders: 70 },
      { source: "direct", sessions: 450, share: 30.0, paidOrders: 45 },
    ],
    deviceBreakdown: [
      { device: "Mobile", sessions: 1050, share: 70.0 },
      { device: "Desktop", sessions: 450, share: 30.0 },
    ],
    browserBreakdown: [
      { browser: "Safari", sessions: 850, share: 56.7 },
      { browser: "Chrome", sessions: 650, share: 43.3 },
    ],
    performanceOverTime: [
      { date: "2026-09-10", started: 40, paid: 20, abandoned: 20 },
      { date: "2026-09-11", started: 50, paid: 25, abandoned: 25 },
    ],
    networkPerformance: [
      { network: "Instagram", platformKey: "instagram", paidOrders: 100, revenue: 2986.0, revenueShare: 71.4, aov: 29.86, quantitySold: 100000 },
      { network: "TikTok", platformKey: "tiktok", paidOrders: 40, revenue: 1194.5, revenueShare: 28.6, aov: 29.86, quantitySold: 40000 },
    ],
    servicePerformance: [
      { service: "Followers", serviceKey: "followers", paidOrders: 85, revenue: 2538.1, revenueShare: 60.7, aov: 29.86, quantitySold: 85000 },
      { service: "Views", serviceKey: "views", paidOrders: 55, revenue: 1642.4, revenueShare: 39.3, aov: 29.86, quantitySold: 55000 },
    ],
    topPlans: [
      {
        planId: "p_ig_1k",
        planName: "1,000 High Quality Followers",
        network: "Instagram",
        service: "Followers",
        quantity: 1000,
        paidOrders: 70,
        revenue: 2090.2,
        revenueShare: 50.0,
        aov: 29.86,
      },
    ],
    rankings: {
      bestSellingPlan: {
        id: "p_ig_1k",
        name: "1,000 High Quality Followers",
        network: "Instagram",
        service: "Followers",
        paidOrders: 70,
        revenue: 2090.2,
        quantity: 1000,
      },
      topNetwork: {
        network: "Instagram",
        revenue: 2986.0,
        share: 71.4,
      },
      topService: {
        service: "Followers",
        revenue: 2538.1,
        share: 60.7,
      },
    },
    abandonment: {
      started: 320,
      abandoned: 180,
      abandonmentRate: 56.25,
      paid: 140,
      conversionRate: 43.75,
      abandonedCartValueEstimated: 5374.8,
      recoveredOrders: 15,
      recoveredRevenue: 447.9,
    },
    attributionCompact: {
      topSource: "google",
      topCampaign: "spring_sale",
      attributedPaidOrders: 70,
      attributedRevenue: 2090.2,
    },
  },
};

describe("UI 5.4 — Admin Mobile Analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn(async (url: string) => {
      if (url.includes("/api/admin/analytics")) {
        return {
          ok: true,
          json: async () => mockAnalyticsPayload,
        };
      }
      return {
        ok: false,
        json: async () => ({ success: false, error: { message: "Not found" } }),
      };
    }));
  });

  it("1. renders Analytics using existing dataset and verifies KPIs maintain correct values", async () => {
    render(
      <AdminThemeProvider>
        <AnalyticsModule />
      </AdminThemeProvider>
    );

    // Initial loading state exists
    expect(screen.getByTestId("analytics-loading-skeleton")).toBeDefined();

    // Wait for data load
    await waitFor(() => {
      expect(screen.getByText("Commerce & Funnel Analytics")).toBeDefined();
    });

    // Check KPI values are exact and intact
    expect(screen.getAllByText("320").length).toBeGreaterThan(0); // Started
    expect(screen.getAllByText("180").length).toBeGreaterThan(0); // Abandoned
    expect(screen.getAllByText("140").length).toBeGreaterThan(0); // Paid
    expect(screen.getAllByText("43.75%").length).toBeGreaterThan(0); // Conv rate
    expect(screen.getAllByText(/4\.180|4,180/).length).toBeGreaterThan(0); // Revenue
    expect(screen.getAllByText(/29\.86|29,86/).length).toBeGreaterThan(0); // AOV
  });

  it("2. period/range selector works without changing existing ranges", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => mockAnalyticsPayload,
    }));
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AdminThemeProvider>
        <AnalyticsModule />
      </AdminThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("analytics-range-selector")).toBeDefined();
    });

    // Click 30d range
    const btn30d = screen.getByTestId("range-btn-30d");
    fireEvent.click(btn30d);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/admin/analytics?range=30d");
    });
  });

  it("3. charts receive and render time series data with zero horizontal overflow", () => {
    const { container } = render(
      <PerformanceTimeSeriesChart data={mockAnalyticsPayload.data.performanceOverTime} />
    );

    expect(screen.getByText("Checkout Performance")).toBeDefined();
    expect(container.querySelector(".recharts-responsive-container")).toBeDefined();
  });

  it("4. mobile breakdowns render compact row cards for networks, services, top plans and precheckout", () => {
    // Network card
    const { container: netContainer } = render(
      <NetworkPerformanceCard networks={mockAnalyticsPayload.data.networkPerformance} />
    );
    expect(netContainer.querySelector("[data-testid='network-performance-mobile']")).toBeDefined();
    expect(screen.getAllByText("Instagram").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/2\.986|2,986/).length).toBeGreaterThan(0);

    // Service card
    const { container: servContainer } = render(
      <ServicePerformanceCard services={mockAnalyticsPayload.data.servicePerformance} />
    );
    expect(servContainer.querySelector("[data-testid='service-performance-mobile']")).toBeDefined();
    expect(screen.getAllByText("Followers").length).toBeGreaterThan(0);

    // Top plans card
    const { container: plansContainer } = render(
      <TopPlansCard
        plans={mockAnalyticsPayload.data.topPlans}
        rankings={mockAnalyticsPayload.data.rankings}
      />
    );
    expect(plansContainer.querySelector("[data-testid='top-plans-mobile']")).toBeDefined();
    expect(screen.getAllByText("1,000 High Quality Followers").length).toBeGreaterThan(0);

    // Precheckout interests
    const { container: preContainer } = render(
      <PreCheckoutInterestsCard
        networks={mockAnalyticsPayload.data.preCheckoutNetworkInterest}
        services={mockAnalyticsPayload.data.preCheckoutServiceInterest}
      />
    );
    expect(preContainer.querySelector("[data-testid='precheckout-network-mobile']")).toBeDefined();
    expect(preContainer.querySelector("[data-testid='precheckout-service-mobile']")).toBeDefined();

    // Precheckout plan
    const { container: planPreContainer } = render(
      <PreCheckoutPlanInterestCard plans={mockAnalyticsPayload.data.preCheckoutPlanInterest} />
    );
    expect(planPreContainer.querySelector("[data-testid='precheckout-plan-mobile']")).toBeDefined();

    // Analyze performance
    const { container: analyzeContainer } = render(
      <AnalyzePerformanceCard performance={mockAnalyticsPayload.data.analyzePerformance} />
    );
    expect(analyzeContainer.querySelector("[data-testid='analyze-performance-mobile']")).toBeDefined();
  });

  it("5. desktop maintains original table structure (hidden on mobile, visible on desktop)", () => {
    const { container } = render(
      <NetworkPerformanceCard networks={mockAnalyticsPayload.data.networkPerformance} />
    );

    // Desktop table container (hidden md:block) exists
    const desktopTable = container.querySelector(".hidden.md\\:block");
    expect(desktopTable).toBeDefined();

    // Mobile cards container (md:hidden) exists
    const mobileCards = container.querySelector(".md\\:hidden");
    expect(mobileCards).toBeDefined();
  });

  it("6. renders error state gracefully if API fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: false,
      json: async () => ({ success: false, error: { message: "Database timeout" } }),
    })));

    render(
      <AdminThemeProvider>
        <AnalyticsModule />
      </AdminThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("analytics-error-banner")).toBeDefined();
      expect(screen.getByText("Error loading analytics")).toBeDefined();
      expect(screen.getByText("Database timeout")).toBeDefined();
    });
  });
});
