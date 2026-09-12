"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  BarChart3, 
  RefreshCw, 
  Globe2,
  Filter,
  Layers,
  Search,
  Compass
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

export type AnalyticsTab = 
  | "overview" 
  | "funnel" 
  | "attribution" 
  | "products" 
  | "precheckout";

interface AnalyticsModuleProps {
  onNavigateToAttribution?: () => void;
  onNavigateToLiveWorld?: () => void;
}

export function AnalyticsModule({ onNavigateToAttribution, onNavigateToLiveWorld }: AnalyticsModuleProps) {
  const [range, setRange] = useState<AnalyticsDateRange>("7d");
  const [activeTab, setActiveTab] = useState<AnalyticsTab>("overview");
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

  const tabs: { key: AnalyticsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "funnel", label: "Full Funnel", icon: Filter },
    { key: "attribution", label: "Traffic & Attribution", icon: Compass },
    { key: "products", label: "Products & Services", icon: Layers },
    { key: "precheckout", label: "Pre-Checkout", icon: Search },
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
              Full buyer funnel, pre-checkout discovery, traffic attribution, and package performance
            </p>
          </div>
        </div>

        {/* Range Controls & Actions */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
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

          {onNavigateToLiveWorld && (
            <button
              type="button"
              onClick={onNavigateToLiveWorld}
              className="px-3 py-1.5 rounded-[8px] border border-[#0F8F8A]/30 bg-[#0F8F8A]/10 text-[#0F8F8A] hover:bg-[#0F8F8A]/20 transition-colors cursor-pointer flex items-center gap-1.5 text-[12px] font-semibold"
            >
              <Globe2 className="w-3.5 h-3.5 animate-pulse" />
              <span>Live World 3D</span>
            </button>
          )}

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

      {/* 2. Secondary Tab Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-[#D9E2E3]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-[8px] text-[13px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? "bg-[#E7F5F4] text-[#0F8F8A] border border-[#BFE5E2] shadow-xs"
                  : "text-[#65737A] hover:text-[#142126] hover:bg-white/80 border border-transparent"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-[#0F8F8A]" : "text-[#8A979D]"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Loading State */}
      {loading && !data && (
        <div className="min-h-[400px] flex flex-col items-center justify-center bg-white border border-[#D9E2E3] rounded-[10px] p-12 text-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#0F8F8A] border-t-transparent animate-spin mb-3" />
          <p className="text-[14px] font-semibold text-[#142126]">Loading Analytics...</p>
          <p className="text-[12px] text-[#65737A] mt-1">Aggregating checkout and order metrics</p>
        </div>
      )}

      {/* 4. Error State */}
      {error && !loading && (
        <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-[10px] p-5 flex items-start gap-3">
          <div className="p-1.5 rounded-full bg-[#FEE2E2] text-[#DC2626] shrink-0 mt-0.5">
            <RefreshCw className="w-4 h-4" />
          </div>
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

      {/* 5. Main Analytics Dashboard Content By Tab */}
      {data && (
        <div className="space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Primary KPI Row */}
              <AnalyticsKpis kpis={data.kpis} />

              {/* Funnel Snapshot & Performance Trend */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CheckoutFunnelCard funnel={data.funnel} />
                <PerformanceTimeSeriesChart data={data.performanceOverTime} />
              </div>

              {/* Platform & Service Snapshot */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <NetworkPerformanceCard networks={data.networkPerformance} />
                <ServicePerformanceCard services={data.servicePerformance} />
              </div>

              {/* Traffic & Device Snapshot */}
              <TrafficAndDevicesCard
                sources={data.trafficSources}
                devices={data.deviceBreakdown}
                browsers={data.browserBreakdown}
              />

              {/* Bottom Attribution & Abandonment row */}
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

          {/* TAB 2: FULL FUNNEL */}
          {activeTab === "funnel" && (
            <div className="space-y-6">
              <FullFunnelCard fullFunnel={data.fullFunnel} />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <CheckoutFunnelCard funnel={data.funnel} />
                <AbandonmentAnalyticsCard abandonment={data.abandonment} />
              </div>
            </div>
          )}

          {/* TAB 3: TRAFFIC & ATTRIBUTION */}
          {activeTab === "attribution" && (
            <div className="space-y-6">
              <TrafficAndDevicesCard
                sources={data.trafficSources}
                devices={data.deviceBreakdown}
                browsers={data.browserBreakdown}
              />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
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
                <div className="lg:col-span-2">
                  <PerformanceTimeSeriesChart data={data.performanceOverTime} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PRODUCTS & SERVICES */}
          {activeTab === "products" && (
            <div className="space-y-6">
              <TopPlansCard plans={data.topPlans} rankings={data.rankings} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <NetworkPerformanceCard networks={data.networkPerformance} />
                <ServicePerformanceCard services={data.servicePerformance} />
              </div>
            </div>
          )}

          {/* TAB 5: PRE-CHECKOUT */}
          {activeTab === "precheckout" && (
            <div className="space-y-6">
              <AnalyzePerformanceCard performance={data.analyzePerformance} />
              <PreCheckoutInterestsCard
                networks={data.preCheckoutNetworkInterest}
                services={data.preCheckoutServiceInterest}
              />
              <PreCheckoutPlanInterestCard plans={data.preCheckoutPlanInterest} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
