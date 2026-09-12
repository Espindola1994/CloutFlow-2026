"use client";

import React, { useState, useEffect, useCallback, useId } from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  MapPin,
  Globe2,
  RefreshCw,
  AlertCircle,
  BarChart3,
  Calendar,
  Layers,
  Filter,
  CheckCircle2,
  Percent,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import type {
  LiveWorldHistoryResponseData,
  LiveWorldHistoryRange,
} from "@/types/admin-live-world-history";

export interface LiveWorldHistoryViewProps {
  initialRange?: LiveWorldHistoryRange;
  initialPlatform?: string;
  initialService?: string;
  initialCountry?: string;
  onFilterChange?: (filters: {
    range: LiveWorldHistoryRange;
    platform: string;
    service: string;
    country: string;
  }) => void;
}

const RANGE_OPTIONS: { id: LiveWorldHistoryRange; label: string }[] = [
  { id: "24h", label: "24 Hours" },
  { id: "7d", label: "7 Days" },
  { id: "30d", label: "30 Days" },
  { id: "90d", label: "90 Days" },
  { id: "today", label: "Today (UTC)" },
];

const PLATFORM_OPTIONS = [
  { id: "all", label: "All Platforms", apiValue: "" },
  { id: "instagram", label: "Instagram", apiValue: "instagram" },
  { id: "tiktok", label: "TikTok", apiValue: "tiktok" },
  { id: "twitter", label: "X / Twitter", apiValue: "twitter" },
  { id: "youtube", label: "YouTube", apiValue: "youtube" },
];

const SERVICE_OPTIONS = [
  { id: "all", label: "All Services", apiValue: "" },
  { id: "followers", label: "Followers", apiValue: "followers" },
  { id: "likes", label: "Likes", apiValue: "likes" },
  { id: "views", label: "Views", apiValue: "views" },
];

function formatUSD(cents: number): string {
  if (isNaN(cents) || cents === null || cents === undefined) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function formatNumber(num: number): string {
  if (isNaN(num) || num === null || num === undefined) return "0";
  return new Intl.NumberFormat("en-US").format(num);
}

export function LiveWorldHistoryView({
  initialRange = "30d",
  initialPlatform = "all",
  initialService = "all",
  initialCountry = "all",
  onFilterChange,
}: LiveWorldHistoryViewProps) {
  const rangeSelectId = useId();
  const platformSelectId = useId();
  const serviceSelectId = useId();
  const countrySelectId = useId();

  const [range, setRange] = useState<LiveWorldHistoryRange>(initialRange);
  const [platform, setPlatform] = useState<string>(initialPlatform);
  const [service, setService] = useState<string>(initialService);
  const [country, setCountry] = useState<string>(initialCountry);

  const [data, setData] = useState<LiveWorldHistoryResponseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [metricTab, setMetricTab] = useState<"revenue" | "purchases">("revenue");

  // Fetch history data only on mount or when filters change (NO continuous polling)
  const fetchHistory = useCallback(async (
    targetRange: LiveWorldHistoryRange,
    targetPlatform: string,
    targetService: string,
    targetCountry: string
  ) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.set("range", targetRange);

      const platOption = PLATFORM_OPTIONS.find((p) => p.id === targetPlatform);
      if (platOption && platOption.apiValue) {
        params.set("platform", platOption.apiValue);
      }

      const servOption = SERVICE_OPTIONS.find((s) => s.id === targetService);
      if (servOption && servOption.apiValue) {
        params.set("service", servOption.apiValue);
      }

      if (targetCountry && targetCountry !== "all") {
        params.set("country", targetCountry.toUpperCase().trim());
      }

      const url = `/api/admin/live-world/history?${params.toString()}`;
      const res = await fetch(url, {
        headers: { "Cache-Control": "no-cache" },
      });
      const json = await res.json();

      if (res.ok && json.success && json.data) {
        setData(json.data);
      } else {
        setError(json.error?.message || "Historical analytics temporarily unavailable.");
      }
    } catch {
      setError("Historical analytics temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHistory(range, platform, service, country);
  }, [fetchHistory, range, platform, service, country]);

  // Handle platform change with compatibility block:
  // YouTube does not support 'followers'
  const handlePlatformChange = (newPlatform: string) => {
    let nextService = service;
    if (newPlatform === "youtube" && service === "followers") {
      nextService = "all";
    }
    setPlatform(newPlatform);
    setService(nextService);
    if (onFilterChange) {
      onFilterChange({
        range,
        platform: newPlatform,
        service: nextService,
        country,
      });
    }
  };

  const handleServiceChange = (newService: string) => {
    // If YouTube and selecting followers, do not allow
    if (platform === "youtube" && newService === "followers") {
      return;
    }
    setService(newService);
    if (onFilterChange) {
      onFilterChange({
        range,
        platform,
        service: newService,
        country,
      });
    }
  };

  const handleRangeChange = (newRange: LiveWorldHistoryRange) => {
    setRange(newRange);
    if (onFilterChange) {
      onFilterChange({
        range: newRange,
        platform,
        service,
        country,
      });
    }
  };

  const handleCountryChange = (newCountry: string) => {
    setCountry(newCountry);
    if (onFilterChange) {
      onFilterChange({
        range,
        platform,
        service,
        country: newCountry,
      });
    }
  };

  // Build country options based on topCountries in current or previous payload plus standard
  const availableCountries = React.useMemo(() => {
    const map = new Map<string, string>();
    if (data?.topCountries) {
      data.topCountries.forEach((c) => {
        if (c.countryCode) {
          map.set(c.countryCode.toUpperCase(), c.countryCode.toUpperCase());
        }
      });
    }
    if (country && country !== "all") {
      map.set(country.toUpperCase(), country.toUpperCase());
    }
    return Array.from(map.keys()).sort();
  }, [data, country]);

  // Format series for chart display
  const chartPoints = React.useMemo(() => {
    if (!data?.series || data.series.length === 0) return [];
    return data.series.map((pt) => {
      const d = new Date(pt.timestamp);
      let label = pt.timestamp;
      try {
        if (range === "24h" || range === "today") {
          label = d.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: false,
          });
        } else {
          label = d.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
        }
      } catch {
        // fallback
      }
      return {
        rawTime: pt.timestamp,
        label,
        revenueUSD: pt.revenueCents / 100,
        purchases: pt.purchaseCount,
        revenueFormatted: formatUSD(pt.revenueCents),
        purchasesFormatted: formatNumber(pt.purchaseCount),
      };
    });
  }, [data, range]);

  const totalPurchases = data?.summary?.totalPurchases ?? 0;
  const isEmpty = !loading && totalPurchases === 0;

  return (
    <div className="space-y-6" data-testid="live-world-history-view">
      {/* 1. Control & Filter Bar */}
      <section
        aria-label="Historical Analytics Filters"
        className="bg-white border border-[#D9E2E3] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(10,35,42,0.03)]"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[#142126]">
            <Filter className="w-4 h-4 text-[#0F8F8A]" />
            <span className="text-[14px] font-bold tracking-tight">Analytics Filters</span>
            <span className="text-[11px] text-[#65737A] font-medium ml-1">
              (Historical Aggregations)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Range Selector */}
            <div className="flex flex-col gap-1">
              <label htmlFor={rangeSelectId} className="text-[11px] font-semibold text-[#65737A] flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Range
              </label>
              <select
                id={rangeSelectId}
                aria-label="Filter by time range"
                data-testid="filter-range-select"
                value={range}
                onChange={(e) => handleRangeChange(e.target.value as LiveWorldHistoryRange)}
                className="w-full bg-[#F8FAFB] border border-[#D9E2E3] rounded-[6px] px-2.5 py-1.5 text-[12px] font-medium text-[#142126] focus:outline-none focus:border-[#0F8F8A]"
              >
                {RANGE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Platform Selector */}
            <div className="flex flex-col gap-1">
              <label htmlFor={platformSelectId} className="text-[11px] font-semibold text-[#65737A] flex items-center gap-1">
                <Globe2 className="w-3 h-3" />
                Platform
              </label>
              <select
                id={platformSelectId}
                aria-label="Filter by platform"
                data-testid="filter-platform-select"
                value={platform}
                onChange={(e) => handlePlatformChange(e.target.value)}
                className="w-full bg-[#F8FAFB] border border-[#D9E2E3] rounded-[6px] px-2.5 py-1.5 text-[12px] font-medium text-[#142126] focus:outline-none focus:border-[#0F8F8A]"
              >
                {PLATFORM_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Service Selector */}
            <div className="flex flex-col gap-1">
              <label htmlFor={serviceSelectId} className="text-[11px] font-semibold text-[#65737A] flex items-center gap-1">
                <Layers className="w-3 h-3" />
                Service
              </label>
              <select
                id={serviceSelectId}
                aria-label="Filter by service"
                data-testid="filter-service-select"
                value={service}
                onChange={(e) => handleServiceChange(e.target.value)}
                className="w-full bg-[#F8FAFB] border border-[#D9E2E3] rounded-[6px] px-2.5 py-1.5 text-[12px] font-medium text-[#142126] focus:outline-none focus:border-[#0F8F8A]"
              >
                {SERVICE_OPTIONS.map((opt) => {
                  const isBlocked = platform === "youtube" && opt.id === "followers";
                  return (
                    <option key={opt.id} value={opt.id} disabled={isBlocked}>
                      {opt.label} {isBlocked ? "(Unavailable)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Country Selector */}
            <div className="flex flex-col gap-1">
              <label htmlFor={countrySelectId} className="text-[11px] font-semibold text-[#65737A] flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                Country
              </label>
              <select
                id={countrySelectId}
                aria-label="Filter by country"
                data-testid="filter-country-select"
                value={country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full bg-[#F8FAFB] border border-[#D9E2E3] rounded-[6px] px-2.5 py-1.5 text-[12px] font-medium text-[#142126] focus:outline-none focus:border-[#0F8F8A]"
              >
                <option value="all">All Countries</option>
                {availableCountries.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Error State */}
      {error && (
        <div
          data-testid="history-error-banner"
          className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-[10px] p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-red-600"
        >
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <div>
              <div className="text-[13px] font-bold">Historical analytics temporarily unavailable.</div>
              <div className="text-[11px] text-red-700/80">{error}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void fetchHistory(range, platform, service, country)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white text-[12px] font-semibold rounded-[6px] hover:bg-red-700 transition cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Query
          </button>
        </div>
      )}

      {/* 3. Summary Cards */}
      <section aria-label="Historical Summary Metrics" className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
        {/* Purchases Card */}
        <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(10,35,42,0.03)]">
          <div className="flex items-center justify-between text-[#65737A] text-[12px] font-medium">
            <span>Purchases</span>
            <ShoppingBag className="w-4 h-4 text-[#0F8F8A]" />
          </div>
          <div className="mt-2 text-[24px] font-bold text-[#142126] tracking-tight" data-testid="summary-purchases">
            {loading ? (
              <div className="h-7 w-16 bg-slate-200 animate-pulse rounded" />
            ) : (
              formatNumber(data?.summary?.totalPurchases ?? 0)
            )}
          </div>
          <div className="mt-1 text-[11px] text-[#65737A]">Approved transactions</div>
        </div>

        {/* Revenue Card */}
        <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(10,35,42,0.03)]">
          <div className="flex items-center justify-between text-[#65737A] text-[12px] font-medium">
            <span>Revenue</span>
            <DollarSign className="w-4 h-4 text-[#16B77A]" />
          </div>
          <div className="mt-2 text-[24px] font-bold text-[#142126] tracking-tight" data-testid="summary-revenue">
            {loading ? (
              <div className="h-7 w-24 bg-slate-200 animate-pulse rounded" />
            ) : (
              formatUSD(data?.summary?.revenueCents ?? 0)
            )}
          </div>
          <div className="mt-1 text-[11px] text-[#65737A]">Total gross volume (USD)</div>
        </div>

        {/* Average Order Value Card */}
        <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(10,35,42,0.03)]">
          <div className="flex items-center justify-between text-[#65737A] text-[12px] font-medium">
            <span>Average Order Value</span>
            <Percent className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <div className="mt-2 text-[24px] font-bold text-[#142126] tracking-tight" data-testid="summary-aov">
            {loading ? (
              <div className="h-7 w-20 bg-slate-200 animate-pulse rounded" />
            ) : (
              formatUSD(data?.summary?.averageOrderValueCents ?? 0)
            )}
          </div>
          <div className="mt-1 text-[11px] text-[#65737A]">Mean transaction value</div>
        </div>

        {/* Mapped Purchases Card */}
        <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(10,35,42,0.03)]">
          <div className="flex items-center justify-between text-[#65737A] text-[12px] font-medium">
            <span>Mapped Purchases</span>
            <MapPin className="w-4 h-4 text-[#8B5CF6]" />
          </div>
          <div className="mt-2 text-[24px] font-bold text-[#142126] tracking-tight" data-testid="summary-mapped">
            {loading ? (
              <div className="h-7 w-16 bg-slate-200 animate-pulse rounded" />
            ) : (
              formatNumber(data?.summary?.mappedPurchases ?? 0)
            )}
          </div>
          <div className="mt-1 text-[11px] text-[#65737A]">With valid geo coordinates</div>
        </div>

        {/* Unknown Location Card */}
        <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(10,35,42,0.03)] col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-[#65737A] text-[12px] font-medium">
            <span>Unknown Location</span>
            <AlertCircle className="w-4 h-4 text-[#F59E0B]" />
          </div>
          <div className="mt-2 text-[24px] font-bold text-[#142126] tracking-tight" data-testid="summary-unknown">
            {loading ? (
              <div className="h-7 w-16 bg-slate-200 animate-pulse rounded" />
            ) : (
              formatNumber(data?.summary?.unknownGeoPurchases ?? 0)
            )}
          </div>
          <div className="mt-1 text-[11px] text-[#65737A]">Missing CFCTX geo</div>
        </div>
      </section>

      {/* 4. Time Series Chart Section */}
      <section
        aria-label="Historical Time Series Chart"
        className="bg-white border border-[#D9E2E3] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03)]"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EEF2F3] gap-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#0F8F8A]" />
              <h2 className="text-[16px] font-bold text-[#142126] tracking-tight">
                Historical Activity Over Time
              </h2>
            </div>
            <p className="text-[12px] text-[#65737A]">
              Aggregated historical trend according to selected range ({range}) and filters
            </p>
          </div>

          {/* Metric Toggle */}
          <div className="flex items-center bg-[#F1F5F5] p-1 rounded-[8px] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setMetricTab("revenue")}
              className={`px-3 py-1 text-[12px] font-semibold rounded-[6px] transition ${
                metricTab === "revenue"
                  ? "bg-white text-[#142126] shadow-sm"
                  : "text-[#65737A] hover:text-[#142126]"
              }`}
            >
              Revenue ($)
            </button>
            <button
              type="button"
              onClick={() => setMetricTab("purchases")}
              className={`px-3 py-1 text-[12px] font-semibold rounded-[6px] transition ${
                metricTab === "purchases"
                  ? "bg-white text-[#142126] shadow-sm"
                  : "text-[#65737A] hover:text-[#142126]"
              }`}
            >
              Purchases (#)
            </button>
          </div>
        </div>

        {/* Chart View */}
        <div className="h-[320px] w-full mt-4" data-testid="history-timeseries-chart">
          {loading ? (
            <div className="h-full w-full flex flex-col items-center justify-center gap-2 bg-[#F8FAFB] rounded-[8px] animate-pulse">
              <BarChart3 className="w-8 h-8 text-[#8A979D]" />
              <span className="text-[12px] text-[#8A979D]">Loading historical series...</span>
            </div>
          ) : isEmpty || chartPoints.length === 0 ? (
            <div className="h-full flex items-center justify-center text-[13px] text-[#8A979D] bg-[#F8FAFB] rounded-[8px]">
              No purchase data for this period.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartPoints} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0F8F8A" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0F8F8A" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorPurchases" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F5" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={{ stroke: "#D9E2E3" }}
                  tick={{ fill: "#65737A", fontSize: 11 }}
                />
                <YAxis
                  allowDecimals={false}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#65737A", fontSize: 11 }}
                  tickFormatter={(val) => (metricTab === "revenue" ? `$${val}` : `${val}`)}
                />
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#D9E2E3",
                    borderRadius: "8px",
                    color: "#142126",
                    fontSize: "12px",
                    boxShadow: "0 4px 16px rgba(10,35,42,0.08)",
                  }}
                  labelStyle={{ color: "#65737A", fontWeight: "bold", marginBottom: "4px" }}
                  formatter={(value: any) => [
                    metricTab === "revenue" ? `$${Number(value).toFixed(2)} USD` : `${value} purchases`,
                    metricTab === "revenue" ? "Revenue" : "Purchases",
                  ]}
                />
                {metricTab === "revenue" ? (
                  <Area
                    type="monotone"
                    dataKey="revenueUSD"
                    name="Revenue"
                    stroke="#0F8F8A"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                  />
                ) : (
                  <Area
                    type="monotone"
                    dataKey="purchases"
                    name="Purchases"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPurchases)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Accessible Data Summary Table for Screen Readers & Non-Chart Users */}
        <div className="sr-only">
          <table>
            captionTimeSeries Data Summary
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Purchases</th>
                <th>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {chartPoints.map((pt) => (
                <tr key={pt.rawTime}>
                  <td>{pt.label}</td>
                  <td>{pt.purchasesFormatted}</td>
                  <td>{pt.revenueFormatted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Geographic Breakdown: Top Countries & Top Cities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Countries */}
        <section
          aria-label="Top Countries Ranking"
          className="bg-white border border-[#D9E2E3] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03)] flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#D9E2E3]">
              <div className="flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-[#0F8F8A]" />
                <h3 className="text-[14px] font-bold text-[#142126]">Top Countries</h3>
              </div>
              <span className="text-[11px] text-[#65737A]">By Revenue & Volume</span>
            </div>

            <div className="mt-3 overflow-x-auto" data-testid="top-countries-section">
              {loading ? (
                <div className="space-y-2 py-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-9 bg-slate-100 animate-pulse rounded" />
                  ))}
                </div>
              ) : !data?.topCountries || data.topCountries.length === 0 ? (
                <div className="py-8 text-center text-[#65737A] text-[12px]">
                  No purchase data for this period.
                </div>
              ) : (
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-[#EEF2F3] text-[#65737A] text-[11px]">
                      <th className="py-2 font-semibold">Country</th>
                      <th className="py-2 font-semibold text-right">Purchases</th>
                      <th className="py-2 font-semibold text-right">Revenue (USD)</th>
                      <th className="py-2 font-semibold text-right">AOV (USD)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topCountries.map((c, idx) => (
                      <tr key={c.countryCode || idx} className="border-b border-[#F8FAFB] hover:bg-[#F8FAFB]/60">
                        <td className="py-2.5 font-semibold text-[#142126] flex items-center gap-2">
                          <span className="text-[10px] font-mono text-[#65737A] w-3.5">
                            #{idx + 1}
                          </span>
                          <span>{c.countryCode}</span>
                        </td>
                        <td className="py-2.5 text-right font-medium text-[#142126]">
                          {formatNumber(c.purchaseCount)}
                        </td>
                        <td className="py-2.5 text-right font-bold text-[#0F8F8A]">
                          {formatUSD(c.revenueCents)}
                        </td>
                        <td className="py-2.5 text-right text-[#65737A]">
                          {formatUSD(c.averageOrderValueCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>

        {/* Top Cities */}
        <section
          aria-label="Top Cities Ranking"
          className="bg-white border border-[#D9E2E3] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03)] flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#D9E2E3]">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#3B82F6]" />
                <h3 className="text-[14px] font-bold text-[#142126]">Top Cities</h3>
              </div>
              <span className="text-[11px] text-[#65737A]">Aggregated Geo</span>
            </div>

            <div className="mt-3 overflow-x-auto" data-testid="top-cities-section">
              {loading ? (
                <div className="space-y-2 py-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-9 bg-slate-100 animate-pulse rounded" />
                  ))}
                </div>
              ) : !data?.topCities || data.topCities.length === 0 ? (
                <div className="py-8 text-center text-[#65737A] text-[12px]">
                  No purchase data for this period.
                </div>
              ) : (
                <table className="w-full text-left text-[12px]">
                  <thead>
                    <tr className="border-b border-[#EEF2F3] text-[#65737A] text-[11px]">
                      <th className="py-2 font-semibold">City</th>
                      <th className="py-2 font-semibold">Region / Country</th>
                      <th className="py-2 font-semibold text-right">Purchases</th>
                      <th className="py-2 font-semibold text-right">Revenue (USD)</th>
                      <th className="py-2 font-semibold text-right">AOV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topCities.map((city, idx) => (
                      <tr
                        key={`${city.city}-${city.region}-${city.countryCode}-${idx}`}
                        className="border-b border-[#F8FAFB] hover:bg-[#F8FAFB]/60"
                      >
                        <td className="py-2.5 font-semibold text-[#142126] truncate max-w-[140px]">
                          {city.city || "Unknown"}
                        </td>
                        <td className="py-2.5 text-[#65737A] text-[11px]">
                          {[city.region, city.countryCode].filter(Boolean).join(", ") || "-"}
                        </td>
                        <td className="py-2.5 text-right font-medium text-[#142126]">
                          {formatNumber(city.purchaseCount)}
                        </td>
                        <td className="py-2.5 text-right font-bold text-[#3B82F6]">
                          {formatUSD(city.revenueCents)}
                        </td>
                        <td className="py-2.5 text-right text-[#65737A]">
                          {formatUSD(city.averageOrderValueCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* 6. Platform & Service Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Performance */}
        <section
          aria-label="Platform Performance Breakdown"
          className="bg-white border border-[#D9E2E3] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03)]"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#D9E2E3]">
            <div className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-[#8B5CF6]" />
              <h3 className="text-[14px] font-bold text-[#142126]">Platform Performance</h3>
            </div>
            <span className="text-[11px] text-[#65737A]">Network Distribution</span>
          </div>

          <div className="mt-3 space-y-3" data-testid="platform-performance-section">
            {loading ? (
              <div className="space-y-2 py-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-slate-100 animate-pulse rounded" />
                ))}
              </div>
            ) : !data?.platforms || data.platforms.length === 0 ? (
              <div className="py-8 text-center text-[#65737A] text-[12px]">
                No purchase data for this period.
              </div>
            ) : (
              data.platforms.map((p) => {
                const displayName =
                  p.platform === "twitter" ? "X / Twitter" : p.platform.charAt(0).toUpperCase() + p.platform.slice(1);
                return (
                  <div
                    key={p.platform}
                    className="p-3 bg-[#F8FAFB] border border-[#D9E2E3] rounded-[8px] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-[13px] font-bold text-[#142126]">{displayName}</div>
                      <div className="text-[11px] text-[#65737A]">
                        {formatNumber(p.purchaseCount)} purchases &bull; AOV {formatUSD(p.averageOrderValueCents)}
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-[14px] font-bold text-[#0F8F8A]">{formatUSD(p.revenueCents)}</div>
                      <div className="text-[10px] text-[#65737A]">USD Total</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Service Performance */}
        <section
          aria-label="Service Performance Breakdown"
          className="bg-white border border-[#D9E2E3] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03)]"
        >
          <div className="flex items-center justify-between pb-3 border-b border-[#D9E2E3]">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#16B77A]" />
              <h3 className="text-[14px] font-bold text-[#142126]">Service Performance</h3>
            </div>
            <span className="text-[11px] text-[#65737A]">Service by Platform</span>
          </div>

          <div className="mt-3 space-y-3" data-testid="service-performance-section">
            {loading ? (
              <div className="space-y-2 py-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-slate-100 animate-pulse rounded" />
                ))}
              </div>
            ) : !data?.services || data.services.length === 0 ? (
              <div className="py-8 text-center text-[#65737A] text-[12px]">
                No purchase data for this period.
              </div>
            ) : (
              data.services.map((s, idx) => {
                const platName =
                  s.platform === "twitter" ? "X" : s.platform.charAt(0).toUpperCase() + s.platform.slice(1);
                const servName = s.service.charAt(0).toUpperCase() + s.service.slice(1);
                return (
                  <div
                    key={`${s.platform}-${s.service}-${idx}`}
                    className="p-3 bg-[#F8FAFB] border border-[#D9E2E3] rounded-[8px] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="text-[13px] font-bold text-[#142126] flex items-center gap-1.5">
                        <span>{servName}</span>
                        <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-[#0F8F8A]/10 text-[#0F8F8A]">
                          {platName}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#65737A] mt-0.5">
                        {formatNumber(s.purchaseCount)} purchases &bull; AOV {formatUSD(s.averageOrderValueCents)}
                      </div>
                    </div>
                    <div className="text-left sm:text-right">
                      <div className="text-[14px] font-bold text-[#16B77A]">{formatUSD(s.revenueCents)}</div>
                      <div className="text-[10px] text-[#65737A]">USD Total</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* 7. Plan Performance Section */}
      <section
        aria-label="Plan Performance Breakdown"
        className="bg-white border border-[#D9E2E3] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03)]"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#D9E2E3]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#F59E0B]" />
            <h3 className="text-[14px] font-bold text-[#142126]">Plan Performance</h3>
          </div>
          <span className="text-[11px] text-[#65737A]">Catalog Performance (Payload Plans)</span>
        </div>

        <div className="mt-3 overflow-x-auto" data-testid="plan-performance-section">
          {loading ? (
            <div className="space-y-2 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 bg-slate-100 animate-pulse rounded" />
              ))}
            </div>
          ) : !data?.plans || data.plans.length === 0 ? (
            <div className="py-8 text-center text-[#65737A] text-[12px]">
              No purchase data for this period.
            </div>
          ) : (
            <table className="w-full text-left text-[12px]">
              <thead>
                <tr className="border-b border-[#EEF2F3] text-[#65737A] text-[11px]">
                  <th className="py-2 font-semibold">Plan ID</th>
                  <th className="py-2 font-semibold">Platform</th>
                  <th className="py-2 font-semibold">Service</th>
                  <th className="py-2 font-semibold text-right">Purchases</th>
                  <th className="py-2 font-semibold text-right">Revenue (USD)</th>
                  <th className="py-2 font-semibold text-right">AOV (USD)</th>
                </tr>
              </thead>
              <tbody>
                {data.plans.map((plan, idx) => (
                  <tr
                    key={`${plan.planId || "unassigned"}-${plan.platform}-${plan.service}-${idx}`}
                    className="border-b border-[#F8FAFB] hover:bg-[#F8FAFB]/60"
                  >
                    <td className="py-2.5 font-mono font-semibold text-[#142126]">
                      {plan.planId || "default"}
                    </td>
                    <td className="py-2.5 text-[#142126] capitalize">
                      {plan.platform === "twitter" ? "X" : plan.platform}
                    </td>
                    <td className="py-2.5 text-[#65737A] capitalize">{plan.service}</td>
                    <td className="py-2.5 text-right font-medium text-[#142126]">
                      {formatNumber(plan.purchaseCount)}
                    </td>
                    <td className="py-2.5 text-right font-bold text-[#F59E0B]">
                      {formatUSD(plan.revenueCents)}
                    </td>
                    <td className="py-2.5 text-right text-[#65737A]">
                      {formatUSD(plan.averageOrderValueCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
