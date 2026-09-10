"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  BarChart3, 
  RefreshCw, 
  Calendar, 
  AlertCircle 
} from "lucide-react";
import { AnalyticsDateRange, AnalyticsResponseData } from "@/types/admin-analytics";
import { AnalyticsKpis } from "./AnalyticsKpis";
import { CheckoutFunnelCard } from "./CheckoutFunnelCard";
import { PerformanceTimeSeriesChart } from "./PerformanceTimeSeriesChart";
import { NetworkPerformanceCard } from "./NetworkPerformanceCard";
import { ServicePerformanceCard } from "./ServicePerformanceCard";
import { TopPlansCard } from "./TopPlansCard";
import { AbandonmentAnalyticsCard } from "./AbandonmentAnalyticsCard";
import { AttributionCompactCard } from "./AttributionCompactCard";
import { FullFunnelCard } from "./FullFunnelCard";
import { PreCheckoutInterestsCard } from "./PreCheckoutInterestsCard";
import { PreCheckoutPlanInterestCard } from "./PreCheckoutPlanInterestCard";
import { AnalyzePerformanceCard } from "./AnalyzePerformanceCard";
import { TrafficAndDevicesCard } from "./TrafficAndDevicesCard";

interface AnalyticsModuleProps {
  onNavigateToAttribution?: () => void;
}

export function AnalyticsModule({ onNavigateToAttribution }: AnalyticsModuleProps) {
  const [range, setRange] = useState<AnalyticsDateRange>("7d");
  const [data, setData] = useState<AnalyticsResponseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async (selectedRange: AnalyticsDateRange, silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setIsRefreshing(true);
      setError(null);

      const res = await fetch(`/api/admin/analytics?range=${selectedRange}`);
      const json = await res.json();

      if (res.ok && json.success) {
        setData(json.data);
      } else {
        setError(json.error?.message || "Failed to load analytics data");
      }
    } catch {
      setError("Network error connecting to analytics service");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchAnalytics(range, false);
  }, [range, fetchAnalytics]);

  const ranges: { key: AnalyticsDateRange; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "7d", label: "7 Days" },
    { key: "30d", label: "30 Days" },
    { key: "90d", label: "90 Days" },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Module Header with Date Range Selector & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-[#D9E2E3] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(10,35,42,0.03)]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-[8px] bg-[#0F8F8A]/10 text-[#0F8F8A]">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-[#142126] tracking-tight">Commerce & Funnel Analytics</h1>
            <p className="text-[12px] text-[#65737A]">
              Phase A & B — Full funnel tracking, pre-checkout discovery, and commerce performance
            </p>
          </div>
        </div>

        {/* Range Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center bg-[#F1F5F5] p-1 rounded-[8px] border border-[#D9E2E3]">
            {ranges.map((r) => (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                className={`px-3 py-1.5 rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer ${
                  range === r.key
                    ? "bg-white text-[#142126] shadow-xs"
                    : "text-[#65737A] hover:text-[#142126]"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void fetchAnalytics(range, true)}
            disabled={loading || isRefreshing}
            className="p-2 rounded-[8px] border border-[#D9E2E3] bg-white text-[#65737A] hover:text-[#142126] hover:bg-[#F8FAFB] transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#0F8F8A]" : ""}`} />
          </button>
        </div>
      </div>

      {/* 2. Loading State */}
      {loading && !data && (
        <div className="min-h-[400px] flex flex-col items-center justify-center bg-white border border-[#D9E2E3] rounded-[10px] p-12 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#0F8F8A] border-t-transparent animate-spin mb-3" />
          <p className="text-[14px] font-semibold text-[#142126]">Loading Analytics...</p>
          <p className="text-[12px] text-[#65737A] mt-1">Aggregating checkout and order metrics</p>
        </div>
      )}

      {/* 3. Error State */}
      {error && !loading && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] p-5 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
          <div>
            <h3 className="text-[14px] font-bold text-[#991B1B]">Error loading analytics</h3>
            <p className="text-[12px] text-[#B91C1C] mt-0.5">{error}</p>
            <button
              type="button"
              onClick={() => void fetchAnalytics(range, false)}
              className="mt-3 px-3 py-1.5 bg-[#DC2626] text-white rounded-[6px] text-[12px] font-semibold hover:bg-[#B91C1C] transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* 4. Main Analytics Dashboard Content */}
      {data && (
        <div className="space-y-6">
          {/* Row 1: Main KPIs */}
          <AnalyticsKpis kpis={data.kpis} />

          {/* Row 2: Phase B Full Funnel (Pre-Checkout to Payment) */}
          <FullFunnelCard fullFunnel={data.fullFunnel} />

          {/* Row 3: Pre-Checkout Network & Service Interest */}
          <PreCheckoutInterestsCard
            networks={data.preCheckoutNetworkInterest}
            services={data.preCheckoutServiceInterest}
          />

          {/* Row 4: Plan Interest & Analyze Performance */}
          <PreCheckoutPlanInterestCard plans={data.preCheckoutPlanInterest} />
          <AnalyzePerformanceCard performance={data.analyzePerformance} />

          {/* Row 5: Traffic Sources & Device Breakdowns */}
          <TrafficAndDevicesCard
            sources={data.trafficSources}
            devices={data.deviceBreakdown}
            browsers={data.browserBreakdown}
          />

          {/* Row 6: Checkout Funnel & Temporal Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <CheckoutFunnelCard funnel={data.funnel} />
            <PerformanceTimeSeriesChart data={data.performanceOverTime} />
          </div>

          {/* Row 7: Network & Service Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <NetworkPerformanceCard networks={data.networkPerformance} />
            <ServicePerformanceCard services={data.servicePerformance} />
          </div>

          {/* Row 8: Top Plans & Rankings */}
          <TopPlansCard plans={data.topPlans} rankings={data.rankings} />

          {/* Row 9: Checkout Abandonment & Compact Attribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AbandonmentAnalyticsCard abandonment={data.abandonment} />
            </div>
            <div>
              <AttributionCompactCard
                attribution={data.attributionCompact}
                onNavigateToAttribution={
                  onNavigateToAttribution ||
                  (() => {
                    if (typeof window !== "undefined") {
                      window.location.href = "/admin/dashboard?tab=orders";
                    }
                  })
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
