"use client";

import React, { useState, useEffect, useRef, useCallback, useId, useMemo } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { 
  Globe2, 
  RefreshCw, 
  AlertCircle, 
  Smartphone, 
  Tablet, 
  Monitor, 
  ShoppingBag, 
  Users, 
  MapPin, 
  Activity,
  CheckCircle2,
  Clock,
  History,
  DollarSign,
  Layers,
  Filter,
  Calendar,
  X,
  Eye,
  Crosshair
} from "lucide-react";
import { LiveWorldGlobeContainer } from "./LiveWorldGlobeContainer";
import { LiveWorldHistoryView } from "./LiveWorldHistoryView";
import type { 
  LiveWorldResponseData, 
  LiveWorldLocationItem, 
  LiveWorldRecentPurchase 
} from "@/types/admin-live-world";
import type { 
  LiveWorldHistoryResponseData,
  LiveWorldHistoryRange,
  LiveWorldHistoryTopCity
} from "@/types/admin-live-world-history";
import {
  type LiveWorldGlobeMode,
  type MappableCity,
  extractValidMappableCities,
} from "./live-world-geo-utils";

export type LiveWorldSubView = "live" | "history";

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

export function LiveWorldModule() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Navigation tab within Live World: 'live' or 'history'
  const viewParam = searchParams.get("view");
  const activeView: LiveWorldSubView = viewParam === "history" ? "history" : "live";

  // Globe visualization mode: 'live' (Live Activity), 'revenue' (Revenue Map), 'purchase' (Purchase Map)
  const [globeMode, setGlobeMode] = useState<LiveWorldGlobeMode>("live");

  // History query state preservation
  const rangeParam = (searchParams.get("range") || "30d") as LiveWorldHistoryRange;
  const platformParam = searchParams.get("platform") || "all";
  const serviceParam = searchParams.get("service") || "all";
  const countryParam = searchParams.get("country") || "all";

  // State for historical filters used directly on map when in revenue/purchase mode
  const [histRange, setHistRange] = useState<LiveWorldHistoryRange>(rangeParam);
  const [histPlatform, setHistPlatform] = useState<string>(platformParam);
  const [histService, setHistService] = useState<string>(serviceParam);
  const [histCountry, setHistCountry] = useState<string>(countryParam);

  const rangeSelectId = useId();
  const platformSelectId = useId();
  const serviceSelectId = useId();
  const countrySelectId = useId();

  // Navigation handlers
  const handleSelectView = (view: LiveWorldSubView) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "live-world");
    if (view === "history") {
      params.set("view", "history");
    } else {
      params.delete("view");
    }
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  const handleHistoryFilterChange = (filters: {
    range: LiveWorldHistoryRange;
    platform: string;
    service: string;
    country: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", "live-world");
    params.set("view", "history");
    if (filters.range && filters.range !== "30d") {
      params.set("range", filters.range);
    } else {
      params.delete("range");
    }

    if (filters.platform && filters.platform !== "all") {
      params.set("platform", filters.platform);
    } else {
      params.delete("platform");
    }

    if (filters.service && filters.service !== "all") {
      params.set("service", filters.service);
    } else {
      params.delete("service");
    }

    if (filters.country && filters.country !== "all") {
      params.set("country", filters.country);
    } else {
      params.delete("country");
    }

    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  // --- 1. Live Data State & Fetcher ---
  const [liveData, setLiveData] = useState<LiveWorldResponseData | null>(null);
  const [liveLoading, setLiveLoading] = useState<boolean>(true);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [hoveredLocation, setHoveredLocation] = useState<LiveWorldLocationItem | null>(null);
  const [hoveredPurchase, setHoveredPurchase] = useState<LiveWorldRecentPurchase | null>(null);

  // Set of purchase orderIds that are new and should animate pulse once
  const [newPurchaseOrderIds, setNewPurchaseOrderIds] = useState<Set<string>>(new Set());
  const seenOrderIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef<boolean>(true);

  const fetchLiveWorld = useCallback(async (silent = false) => {
    try {
      if (!silent) setLiveLoading(true);
      else setIsRefreshing(true);
      setLiveError(null);

      const res = await fetch("/api/admin/live-world", {
        headers: { "Cache-Control": "no-cache" },
      });
      const json = await res.json();

      if (res.ok && json.success && json.data) {
        const data: LiveWorldResponseData = json.data;
        setLiveData(data);

        // Dedup recent purchases for pulse animation
        const incomingNew = new Set<string>();
        if (data.recentPurchases && Array.isArray(data.recentPurchases)) {
          data.recentPurchases.forEach((p) => {
            if (p.mappable && !seenOrderIdsRef.current.has(p.orderId)) {
              seenOrderIdsRef.current.add(p.orderId);
              if (!initialLoadRef.current) {
                incomingNew.add(p.orderId);
              }
            }
          });
        }
        initialLoadRef.current = false;

        if (incomingNew.size > 0) {
          setNewPurchaseOrderIds(incomingNew);
          setTimeout(() => {
            setNewPurchaseOrderIds((prev) => {
              const updated = new Set(prev);
              incomingNew.forEach((id) => updated.delete(id));
              return updated;
            });
          }, 5000);
        }
      } else {
        setLiveError(json.error?.message || "Live activity temporarily unavailable.");
      }
    } catch {
      setLiveError("Live activity temporarily unavailable.");
    } finally {
      setLiveLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Polling interval ~8 seconds ONLY for live data
  useEffect(() => {
    void fetchLiveWorld(false);

    const intervalId = setInterval(() => {
      void fetchLiveWorld(true);
    }, 8000);

    return () => clearInterval(intervalId);
  }, [fetchLiveWorld]);

  // --- 2. Historical Map Data State & Fetcher (Phase 4C — ZERO POLLING) ---
  const [historyData, setHistoryData] = useState<LiveWorldHistoryResponseData | null>(null);
  const [historyLoading, setHistoryLoading] = useState<boolean>(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Selected city state (for interactive selection panel and highlight)
  const [selectedCity, setSelectedCity] = useState<MappableCity | null>(null);
  const [hoveredHistoricalCity, setHoveredHistoricalCity] = useState<MappableCity | null>(null);

  const fetchHistoryForMap = useCallback(async (
    targetRange: LiveWorldHistoryRange,
    targetPlatform: string,
    targetService: string,
    targetCountry: string
  ) => {
    try {
      setHistoryLoading(true);
      setHistoryError(null);

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
        const hData: LiveWorldHistoryResponseData = json.data;
        setHistoryData(hData);

        // Clear selection if previous selected city is not in new topCities
        setSelectedCity((prev) => {
          if (!prev) return null;
          const valid = extractValidMappableCities(hData.topCities);
          const stillExists = valid.some(
            (c) => c.city === prev.city && c.countryCode === prev.countryCode
          );
          return stillExists ? prev : null;
        });
      } else {
        setHistoryError(json.error?.message || "Historical map data temporarily unavailable.");
      }
    } catch {
      setHistoryError("Historical map data temporarily unavailable.");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  // Fetch historical data ONLY when in revenue or purchase mode or when historical filters change
  useEffect(() => {
    if (globeMode === "revenue" || globeMode === "purchase") {
      void fetchHistoryForMap(histRange, histPlatform, histService, histCountry);
    }
  }, [globeMode, histRange, histPlatform, histService, histCountry, fetchHistoryForMap]);

  // Handle globe mode switcher
  const handleSelectGlobeMode = (mode: LiveWorldGlobeMode) => {
    setGlobeMode(mode);
    setHoveredLocation(null);
    setHoveredPurchase(null);
    setHoveredHistoricalCity(null);
  };

  // Filter change handlers for map controls
  const handleMapPlatformChange = (newPlatform: string) => {
    let nextService = histService;
    if (newPlatform === "youtube" && histService === "followers") {
      nextService = "all";
    }
    setHistPlatform(newPlatform);
    setHistService(nextService);
  };

  const handleMapServiceChange = (newService: string) => {
    if (histPlatform === "youtube" && newService === "followers") return;
    setHistService(newService);
  };

  // Compute available countries for filter dropdown
  const availableCountries = useMemo(() => {
    const map = new Map<string, string>();
    if (historyData?.topCountries) {
      historyData.topCountries.forEach((c) => {
        if (c.countryCode) map.set(c.countryCode.toUpperCase(), c.countryCode.toUpperCase());
      });
    }
    if (histCountry && histCountry !== "all") {
      map.set(histCountry.toUpperCase(), histCountry.toUpperCase());
    }
    return Array.from(map.keys()).sort();
  }, [historyData, histCountry]);

  // Relative time helper
  const getRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 45) return "just now";
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin} min ago`;
      const diffHrs = Math.floor(diffMin / 60);
      return `${diffHrs}h ago`;
    } catch {
      return "recently";
    }
  };

  // Mappable historical cities
  const validHistoricalCities = useMemo(() => {
    return extractValidMappableCities(historyData?.topCities);
  }, [historyData?.topCities]);

  // Mini summary metrics for historical map
  const topHistoricalCountry = historyData?.topCountries?.[0] || null;
  const topHistoricalCity = historyData?.topCities?.[0] || null;
  const totalPurchasesHist = historyData?.summary?.totalPurchases || 0;
  const mappedPurchasesHist = historyData?.summary?.mappedPurchases || 0;
  const unknownGeoPurchasesHist = historyData?.summary?.unknownGeoPurchases || 0;
  const mappedPercentage = totalPurchasesHist > 0 ? ((mappedPurchasesHist / totalPurchasesHist) * 100).toFixed(1) : "0.0";
  const unknownPercentage = totalPurchasesHist > 0 ? ((unknownGeoPurchasesHist / totalPurchasesHist) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6 select-none">
      {/* 1. Module Header with Live Now / History Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#071D26] border border-[#11313B] rounded-[10px] p-4 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-[8px] bg-[#0F8F8A]/20 text-[#0F8F8A] border border-[#0F8F8A]/30">
            <Globe2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[18px] font-bold text-white tracking-tight">Live World</h1>
              {activeView === "live" ? (
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-[#16B77A]/20 text-[#16B77A] border border-[#16B77A]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#16B77A] animate-ping" />
                  Live 8s
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-[#3B82F6]/20 text-[#3B82F6] border border-[#3B82F6]/30">
                  <History className="w-3 h-3" />
                  Historical Analytics
                </span>
              )}
            </div>
            <p className="text-[12px] text-[#8A979D]">
              {activeView === "live"
                ? "Real-time global activity, active visitor clusters, and recent purchase events"
                : "Aggregated historical revenue, top countries, cities, networks, and catalog performance"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {/* Sub-view switcher: Live Now vs History */}
          <div className="inline-flex p-1 bg-[#0A2630] border border-[#11313B] rounded-[8px]">
            <button
              type="button"
              onClick={() => handleSelectView("live")}
              data-testid="tab-live-now"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer ${
                activeView === "live"
                  ? "bg-[#0F8F8A] text-white shadow-sm"
                  : "text-[#8A979D] hover:text-white"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Live Now</span>
            </button>
            <button
              type="button"
              onClick={() => handleSelectView("history")}
              data-testid="tab-history"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-semibold transition-colors cursor-pointer ${
                activeView === "history"
                  ? "bg-[#0F8F8A] text-white shadow-sm"
                  : "text-[#8A979D] hover:text-white"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History</span>
            </button>
          </div>

          {activeView === "live" && (
            <>
              <div className="text-right hidden sm:block">
                <div className="text-[11px] text-[#8A979D]">Active Now</div>
                <div className="text-[16px] font-bold text-[#16B77A]" data-testid="active-now-count">
                  {liveData?.activeVisitorsTotal ?? 0}
                </div>
              </div>
              <button
                type="button"
                onClick={() => void fetchLiveWorld(true)}
                disabled={liveLoading || isRefreshing}
                className="p-2.5 rounded-[8px] border border-[#11313B] bg-[#0A2630] text-[#8A979D] hover:text-white hover:bg-[#11313B] transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh Live Data"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#0F8F8A]" : ""}`} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Conditionally Render Live View OR History View */}
      {activeView === "history" ? (
        <LiveWorldHistoryView
          initialRange={rangeParam}
          initialPlatform={platformParam}
          initialService={serviceParam}
          initialCountry={countryParam}
          onFilterChange={handleHistoryFilterChange}
        />
      ) : (
        <>
          {/* 2. Error Banner if Live API fails */}
          {liveError && (
            <div className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-[10px] p-4 flex items-center justify-between text-red-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
                <span className="text-[13px] font-medium" data-testid="error-message">
                  Live activity temporarily unavailable.
                </span>
              </div>
              <span className="text-[11px] text-[#8A979D]">Retrying automatically in 8s...</span>
            </div>
          )}

          {/* 3. Metrics Summary Cards (Live Activity mode) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Active Visitors */}
            <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(10,35,42,0.03)]">
              <div className="flex items-center justify-between text-[#65737A] text-[12px] font-medium">
                <span>Active Visitors</span>
                <Users className="w-4 h-4 text-[#0F8F8A]" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-[24px] font-bold text-[#142126] tracking-tight" data-testid="metric-active-total">
                  {liveData?.activeVisitorsTotal ?? 0}
                </span>
                <span className="text-[11px] font-medium text-[#16B77A] flex items-center gap-0.5">
                  <Activity className="w-3 h-3" /> Live
                </span>
              </div>
              <div className="mt-1 text-[11px] text-[#65737A] flex items-center gap-1.5">
                <span>{liveData?.mappableVisitorsTotal ?? 0} mapped</span>
                <span>&bull;</span>
                <span>{liveData?.unknownGeoVisitorsTotal ?? 0} unknown</span>
              </div>
            </div>

            {/* Mappable Locations */}
            <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(10,35,42,0.03)]">
              <div className="flex items-center justify-between text-[#65737A] text-[12px] font-medium">
                <span>Mappable Clusters</span>
                <MapPin className="w-4 h-4 text-[#3B82F6]" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-[24px] font-bold text-[#142126] tracking-tight" data-testid="metric-mappable">
                  {liveData?.locations?.length ?? 0}
                </span>
                <span className="text-[11px] text-[#65737A]">active clusters</span>
              </div>
              <div className="mt-1 text-[11px] text-[#65737A]">
                Global distribution (lat/long)
              </div>
            </div>

            {/* Device Breakdown */}
            <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(10,35,42,0.03)]">
              <div className="flex items-center justify-between text-[#65737A] text-[12px] font-medium">
                <span>Device Types</span>
                <div className="flex items-center gap-1 text-[#8A979D]">
                  <Smartphone className="w-3 h-3" />
                  <Tablet className="w-3 h-3" />
                  <Monitor className="w-3 h-3" />
                </div>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-1 text-center">
                <div className="bg-[#F8FAFB] rounded-[6px] p-1.5">
                  <div className="text-[10px] text-[#65737A]">Mobile</div>
                  <div className="text-[14px] font-bold text-[#142126]" data-testid="metric-mobile">
                    {liveData?.devices?.mobile ?? 0}
                  </div>
                </div>
                <div className="bg-[#F8FAFB] rounded-[6px] p-1.5">
                  <div className="text-[10px] text-[#65737A]">Tablet</div>
                  <div className="text-[14px] font-bold text-[#142126]" data-testid="metric-tablet">
                    {liveData?.devices?.tablet ?? 0}
                  </div>
                </div>
                <div className="bg-[#F8FAFB] rounded-[6px] p-1.5">
                  <div className="text-[10px] text-[#65737A]">Desktop</div>
                  <div className="text-[14px] font-bold text-[#142126]" data-testid="metric-desktop">
                    {liveData?.devices?.desktop ?? 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Purchases Count */}
            <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(10,35,42,0.03)]">
              <div className="flex items-center justify-between text-[#65737A] text-[12px] font-medium">
                <span>Recent Orders</span>
                <ShoppingBag className="w-4 h-4 text-[#F59E0B]" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-[24px] font-bold text-[#142126] tracking-tight" data-testid="metric-purchases-count">
                  {liveData?.recentPurchases?.length ?? 0}
                </span>
                <span className="text-[11px] text-[#F59E0B] font-semibold">15 min window</span>
              </div>
              <div className="mt-1 text-[11px] text-[#65737A] flex items-center gap-2">
                <span>iOS: {liveData?.os?.iOS ?? 0}</span>
                <span>&bull;</span>
                <span>Android: {liveData?.os?.Android ?? 0}</span>
                <span>&bull;</span>
                <span>macOS: {liveData?.os?.macOS ?? 0}</span>
              </div>
            </div>
          </div>

          {/* 4. Phase 4C — Globe Visualization Stage with Mode Selector */}
          <div className="space-y-3">
            {/* Mode Selector & Filter Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#071D26] border border-[#11313B] rounded-[10px] p-3 text-white">
              {/* Globe Mode Selector: Live Activity | Revenue Map | Purchase Map */}
              <div className="flex items-center gap-1.5 bg-[#0A2630] border border-[#11313B] rounded-[8px] p-1 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => handleSelectGlobeMode("live")}
                  data-testid="globe-mode-live"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer ${
                    globeMode === "live"
                      ? "bg-[#0F8F8A] text-white shadow-sm"
                      : "text-[#8A979D] hover:text-white"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>Live Activity</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectGlobeMode("revenue")}
                  data-testid="globe-mode-revenue"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer ${
                    globeMode === "revenue"
                      ? "bg-amber-500 text-black shadow-sm font-bold"
                      : "text-[#8A979D] hover:text-white"
                  }`}
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Revenue Map</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectGlobeMode("purchase")}
                  data-testid="globe-mode-purchase"
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[12px] font-semibold transition-all cursor-pointer ${
                    globeMode === "purchase"
                      ? "bg-sky-500 text-white shadow-sm font-bold"
                      : "text-[#8A979D] hover:text-white"
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Purchase Map</span>
                </button>
              </div>

              {/* Historical Filters (Shown only in Revenue Map or Purchase Map mode) */}
              {globeMode !== "live" && (
                <div className="flex flex-wrap items-center gap-2" data-testid="historical-map-filters">
                  {/* Range */}
                  <select
                    id={rangeSelectId}
                    aria-label="Historical map range"
                    data-testid="map-filter-range"
                    value={histRange}
                    onChange={(e) => setHistRange(e.target.value as LiveWorldHistoryRange)}
                    className="bg-[#0A2630] border border-[#11313B] rounded-[6px] px-2 py-1 text-[11px] text-white focus:outline-none focus:border-[#0F8F8A]"
                  >
                    {RANGE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id} className="bg-[#071D26]">
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {/* Platform */}
                  <select
                    id={platformSelectId}
                    aria-label="Historical map platform"
                    data-testid="map-filter-platform"
                    value={histPlatform}
                    onChange={(e) => handleMapPlatformChange(e.target.value)}
                    className="bg-[#0A2630] border border-[#11313B] rounded-[6px] px-2 py-1 text-[11px] text-white focus:outline-none focus:border-[#0F8F8A]"
                  >
                    {PLATFORM_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id} className="bg-[#071D26]">
                        {opt.label}
                      </option>
                    ))}
                  </select>

                  {/* Service */}
                  <select
                    id={serviceSelectId}
                    aria-label="Historical map service"
                    data-testid="map-filter-service"
                    value={histService}
                    onChange={(e) => handleMapServiceChange(e.target.value)}
                    className="bg-[#0A2630] border border-[#11313B] rounded-[6px] px-2 py-1 text-[11px] text-white focus:outline-none focus:border-[#0F8F8A]"
                  >
                    {SERVICE_OPTIONS.map((opt) => {
                      const disabled = histPlatform === "youtube" && opt.id === "followers";
                      return (
                        <option key={opt.id} value={opt.id} disabled={disabled} className="bg-[#071D26]">
                          {opt.label} {disabled ? "(N/A)" : ""}
                        </option>
                      );
                    })}
                  </select>

                  {/* Country */}
                  <select
                    id={countrySelectId}
                    aria-label="Historical map country"
                    data-testid="map-filter-country"
                    value={histCountry}
                    onChange={(e) => setHistCountry(e.target.value)}
                    className="bg-[#0A2630] border border-[#11313B] rounded-[6px] px-2 py-1 text-[11px] text-white focus:outline-none focus:border-[#0F8F8A]"
                  >
                    <option value="all" className="bg-[#071D26]">All Countries</option>
                    {availableCountries.map((c) => (
                      <option key={c} value={c} className="bg-[#071D26]">{c}</option>
                    ))}
                  </select>

                  {/* Manual Retry Button if error */}
                  {historyError && (
                    <button
                      type="button"
                      data-testid="map-retry-button"
                      onClick={() => void fetchHistoryForMap(histRange, histPlatform, histService, histCountry)}
                      className="px-2 py-1 rounded-[6px] bg-red-600 text-white text-[11px] font-bold hover:bg-red-700 transition"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Error Banner for Historical Mode */}
            {globeMode !== "live" && historyError && (
              <div 
                data-testid="history-map-error"
                className="bg-[#EF4444]/10 border border-[#EF4444]/30 rounded-[10px] p-3.5 flex items-center justify-between text-red-300 text-[12px]"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>Historical map data temporarily unavailable.</span>
                </div>
                <button
                  type="button"
                  onClick={() => void fetchHistoryForMap(histRange, histPlatform, histService, histCountry)}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold rounded-[4px] cursor-pointer"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty State Banner for Historical Mode */}
            {globeMode !== "live" && !historyLoading && !historyError && validHistoricalCities.length === 0 && (
              <div 
                data-testid="history-map-empty"
                className="bg-[#0A2630]/80 border border-[#11313B] rounded-[10px] p-3 text-center text-[#8A979D] text-[12px]"
              >
                No mapped purchase data for this period.
              </div>
            )}

            {/* 3D Globe Visual Stage */}
            <div className="relative bg-[#071D26] border border-[#11313B] rounded-[14px] overflow-hidden min-h-[500px] lg:min-h-[580px] shadow-2xl">
              {/* Globe Header Badge Overlay */}
              <div className="absolute top-4 left-4 z-20 pointer-events-none flex flex-col gap-1">
                <div className="flex items-center gap-2 bg-[#0A2630]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#11313B] shadow-sm">
                  <span className={`w-2 h-2 rounded-full ${
                    globeMode === "live" ? "bg-[#0F8F8A] animate-pulse" : globeMode === "revenue" ? "bg-amber-400" : "bg-sky-400"
                  }`} />
                  <span className="text-white text-[12px] font-semibold tracking-wide">
                    {globeMode === "live" ? "3D Global Operations" : globeMode === "revenue" ? "Historical Revenue Map" : "Historical Purchase Map"}
                  </span>
                  {globeMode !== "live" && historyLoading && (
                    <span className="text-[11px] text-[#0F8F8A] animate-pulse ml-1">Updating map...</span>
                  )}
                </div>
                <span className="text-[#8A979D] text-[11px] pl-2 font-mono">
                  North Atlantic Centered &bull; 360&deg; Orbit &bull; Inertial Drag
                </span>
              </div>

              {/* Dynamic Legend Overlay */}
              <div 
                data-testid="globe-legend"
                className="absolute bottom-4 left-4 z-20 pointer-events-none bg-[#0A2630]/90 backdrop-blur-md px-3 py-2 rounded-[8px] border border-[#11313B] shadow-sm text-[11px]"
              >
                {globeMode === "live" ? (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-white">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#0F8F8A] shadow-[0_0_8px_#0F8F8A]" />
                      <span>Active Visitor Cluster</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-white">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]" />
                      <span>Recent Purchase</span>
                    </div>
                  </div>
                ) : globeMode === "revenue" ? (
                  <div className="space-y-1">
                    <div className="text-white font-semibold flex items-center gap-1.5">
                      <DollarSign className="w-3 h-3 text-amber-400" />
                      <span>Revenue Intensity</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#8A979D]">
                      <span className="flex items-center gap-1 text-white">
                        <span className="w-2 h-2 rounded-full bg-amber-600" /> Low
                      </span>
                      <span>—</span>
                      <span className="flex items-center gap-1 text-white">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Medium
                      </span>
                      <span>—</span>
                      <span className="flex items-center gap-1 text-white">
                        <span className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" /> High
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="text-white font-semibold flex items-center gap-1.5">
                      <ShoppingBag className="w-3 h-3 text-sky-400" />
                      <span>Purchase Activity</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#8A979D]">
                      <span className="flex items-center gap-1 text-white">
                        <span className="w-2 h-2 rounded-full bg-sky-400" /> Low
                      </span>
                      <span>—</span>
                      <span className="flex items-center gap-1 text-white">
                        <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Medium
                      </span>
                      <span>—</span>
                      <span className="flex items-center gap-1 text-white">
                        <span className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1]" /> High
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Tooltip Overlay (Live Visitor) */}
              {globeMode === "live" && hoveredLocation && (
                <div 
                  data-testid="visitor-tooltip"
                  className="absolute top-4 right-4 z-30 bg-[#0A2630]/95 backdrop-blur-md border border-[#0F8F8A]/40 rounded-[10px] p-4 text-white shadow-2xl max-w-xs animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="flex items-center gap-1.5 text-[#0F8F8A] text-[11px] font-bold uppercase tracking-wider mb-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Visitor Cluster</span>
                  </div>
                  <div className="text-[15px] font-bold text-white leading-snug">
                    {hoveredLocation.city || "Unknown City"}
                    {hoveredLocation.region ? `, ${hoveredLocation.region}` : ""}
                    {hoveredLocation.countryCode ? ` · ${hoveredLocation.countryCode}` : ""}
                  </div>
                  <div className="mt-2 text-[13px] font-semibold text-[#16B77A]">
                    {hoveredLocation.activeCount} active visitor{hoveredLocation.activeCount !== 1 ? "s" : ""}
                  </div>
                  <div className="mt-2.5 pt-2 border-t border-[#11313B] grid grid-cols-3 gap-1 text-[11px] text-[#8A979D]">
                    <div>Mobile: <span className="text-white font-medium">{hoveredLocation.devices.mobile}</span></div>
                    <div>Tablet: <span className="text-white font-medium">{hoveredLocation.devices.tablet}</span></div>
                    <div>Desktop: <span className="text-white font-medium">{hoveredLocation.devices.desktop}</span></div>
                  </div>
                  <div className="mt-1.5 pt-1.5 border-t border-[#11313B] flex items-center justify-between text-[11px] text-[#8A979D]">
                    <span>iOS: <strong className="text-white">{hoveredLocation.os.iOS}</strong></span>
                    <span>Android: <strong className="text-white">{hoveredLocation.os.Android}</strong></span>
                    <span>Windows: <strong className="text-white">{hoveredLocation.os.Windows}</strong></span>
                    <span>macOS: <strong className="text-white">{hoveredLocation.os.macOS}</strong></span>
                  </div>
                </div>
              )}

              {/* Tooltip Overlay (Live Purchase) */}
              {globeMode === "live" && hoveredPurchase && (
                <div 
                  data-testid="purchase-tooltip"
                  className="absolute top-4 right-4 z-30 bg-[#0A2630]/95 backdrop-blur-md border border-[#F59E0B]/50 rounded-[10px] p-4 text-white shadow-2xl max-w-xs animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="flex items-center gap-1.5 text-[#F59E0B] text-[11px] font-bold uppercase tracking-wider mb-1">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Approved Purchase</span>
                  </div>
                  <div className="text-[15px] font-bold text-white leading-snug">
                    {hoveredPurchase.city || "Unknown City"}
                    {hoveredPurchase.region ? `, ${hoveredPurchase.region}` : ""}
                    {hoveredPurchase.countryCode ? ` · ${hoveredPurchase.countryCode}` : ""}
                  </div>
                  <div className="mt-2 text-[14px] font-bold text-[#F59E0B]">
                    {formatUSD(hoveredPurchase.amountCents)} USD
                  </div>
                  <div className="mt-2 pt-2 border-t border-[#11313B] space-y-1 text-[11px] text-[#8A979D]">
                    <div>Platform: <span className="text-white capitalize">{hoveredPurchase.platform || "Direct"}</span></div>
                    <div>Service: <span className="text-white capitalize">{hoveredPurchase.service || "Standard"}</span></div>
                    <div>Plan: <span className="text-white font-mono">{hoveredPurchase.planId || "default"}</span></div>
                    <div>Approved: <span className="text-white">{getRelativeTime(hoveredPurchase.approvedAt)}</span></div>
                  </div>
                </div>
              )}

              {/* Tooltip Overlay (Historical City — Revenue Map or Purchase Map) */}
              {globeMode !== "live" && hoveredHistoricalCity && (
                <div 
                  data-testid="historical-tooltip"
                  className={`absolute top-4 right-4 z-30 bg-[#0A2630]/95 backdrop-blur-md border rounded-[10px] p-4 text-white shadow-2xl max-w-xs animate-in fade-in zoom-in-95 duration-150 ${
                    globeMode === "revenue" ? "border-amber-500/50" : "border-sky-500/50"
                  }`}
                >
                  <div className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider mb-1 ${
                    globeMode === "revenue" ? "text-amber-400" : "text-sky-400"
                  }`}>
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{globeMode === "revenue" ? "Revenue Aggregation" : "Purchase Aggregation"}</span>
                  </div>
                  <div className="text-[15px] font-bold text-white leading-snug">
                    {hoveredHistoricalCity.city}
                    {hoveredHistoricalCity.region ? `, ${hoveredHistoricalCity.region}` : ""}
                    {hoveredHistoricalCity.countryCode ? ` · ${hoveredHistoricalCity.countryCode}` : ""}
                  </div>
                  
                  {globeMode === "revenue" ? (
                    <div className="mt-2 space-y-1">
                      <div className="text-[14px] font-bold text-amber-400" data-testid="tooltip-revenue-amount">
                        {formatUSD(hoveredHistoricalCity.revenueCents)} USD
                      </div>
                      <div className="text-[12px] text-[#8A979D]" data-testid="tooltip-revenue-purchases">
                        Purchases: <span className="text-white font-semibold">{formatNumber(hoveredHistoricalCity.purchaseCount)}</span>
                      </div>
                      <div className="text-[11px] text-[#8A979D]" data-testid="tooltip-revenue-aov">
                        AOV: <span className="text-white font-mono">{formatUSD(hoveredHistoricalCity.averageOrderValueCents)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 space-y-1">
                      <div className="text-[14px] font-bold text-sky-400" data-testid="tooltip-purchase-count">
                        {formatNumber(hoveredHistoricalCity.purchaseCount)} purchases
                      </div>
                      <div className="text-[12px] text-[#8A979D]" data-testid="tooltip-purchase-revenue">
                        Revenue: <span className="text-white font-semibold">{formatUSD(hoveredHistoricalCity.revenueCents)} USD</span>
                      </div>
                      <div className="text-[11px] text-[#8A979D]" data-testid="tooltip-purchase-aov">
                        AOV: <span className="text-white font-mono">{formatUSD(hoveredHistoricalCity.averageOrderValueCents)}</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-2 pt-2 border-t border-[#11313B] text-[10px] text-[#8A979D] italic">
                    Click marker to inspect location breakdown
                  </div>
                </div>
              )}

              {/* Globe Container (Single persistent 3D instance) */}
              <div className="w-full h-[500px] lg:h-[580px]">
                <LiveWorldGlobeContainer
                  mode={globeMode}
                  locations={liveData?.locations ?? []}
                  recentPurchases={liveData?.recentPurchases ?? []}
                  newPurchaseOrderIds={newPurchaseOrderIds}
                  onHoverLocation={setHoveredLocation}
                  onHoverPurchase={setHoveredPurchase}
                  historicalCities={historyData?.topCities ?? []}
                  selectedCity={selectedCity}
                  onHoverHistoricalCity={setHoveredHistoricalCity}
                  onSelectHistoricalCity={setSelectedCity}
                />
              </div>
            </div>

            {/* Selected Location Panel (Card below the globe on mobile/tablet or prominent desktop card) */}
            {globeMode !== "live" && selectedCity && (
              <div 
                data-testid="selected-location-panel"
                className="bg-[#071D26] border border-[#0F8F8A]/40 rounded-[10px] p-4 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-full bg-[#0F8F8A]/20 text-[#0F8F8A] border border-[#0F8F8A]/30 shrink-0">
                    <Crosshair className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-[#0F8F8A] uppercase tracking-wider">
                      Selected Location
                    </div>
                    <div className="text-[16px] font-bold text-white flex items-center gap-2">
                      <span data-testid="selected-location-title">
                        {selectedCity.city}
                        {selectedCity.region ? `, ${selectedCity.region}` : ""}
                        {selectedCity.countryCode ? ` (${selectedCity.countryCode})` : ""}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#8A979D] font-mono mt-0.5">
                      Coordinates: {selectedCity.latitude.toFixed(2)}&deg;, {selectedCity.longitude.toFixed(2)}&deg;
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 md:gap-6 border-t md:border-t-0 md:border-l border-[#11313B] pt-3 md:pt-0 md:pl-6">
                  <div>
                    <div className="text-[11px] text-[#8A979D]">Revenue (USD)</div>
                    <div className="text-[15px] font-bold text-amber-400" data-testid="selected-location-revenue">
                      {formatUSD(selectedCity.revenueCents)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#8A979D]">Purchases</div>
                    <div className="text-[15px] font-bold text-sky-400" data-testid="selected-location-purchases">
                      {formatNumber(selectedCity.purchaseCount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-[#8A979D]">Average Order</div>
                    <div className="text-[15px] font-bold text-white font-mono" data-testid="selected-location-aov">
                      {formatUSD(selectedCity.averageOrderValueCents)}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCity(null)}
                  data-testid="selected-location-close"
                  className="p-1.5 rounded-[6px] text-[#8A979D] hover:text-white hover:bg-[#11313B] transition self-start md:self-auto cursor-pointer"
                  title="Close panel"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Top Geo Summary (Shown when in Revenue Map or Purchase Map mode) */}
            {globeMode !== "live" && (
              <div 
                data-testid="top-geo-summary"
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 bg-white border border-[#D9E2E3] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(10,35,42,0.03)]"
              >
                <div>
                  <div className="text-[11px] text-[#65737A] font-medium">Top Country</div>
                  <div className="text-[15px] font-bold text-[#142126] mt-0.5 truncate" data-testid="top-geo-country">
                    {topHistoricalCountry ? topHistoricalCountry.countryCode : "None"}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-[#65737A] font-medium">Top City</div>
                  <div className="text-[15px] font-bold text-[#142126] mt-0.5 truncate" data-testid="top-geo-city">
                    {topHistoricalCity ? topHistoricalCity.city : "None"}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-[#65737A] font-medium">Total Revenue</div>
                  <div className="text-[15px] font-bold text-[#16B77A] mt-0.5" data-testid="top-geo-revenue">
                    {formatUSD(historyData?.summary?.revenueCents ?? 0)}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-[#65737A] font-medium">Total Purchases</div>
                  <div className="text-[15px] font-bold text-[#142126] mt-0.5" data-testid="top-geo-purchases">
                    {formatNumber(historyData?.summary?.totalPurchases ?? 0)}
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-[#65737A] font-medium">Mapped %</div>
                  <div className="text-[15px] font-bold text-[#3B82F6] mt-0.5" data-testid="top-geo-mapped">
                    {mappedPercentage}%
                  </div>
                </div>

                <div>
                  <div className="text-[11px] text-[#65737A] font-medium">Unknown %</div>
                  <div className="text-[15px] font-bold text-[#F59E0B] mt-0.5" data-testid="top-geo-unknown">
                    {unknownPercentage}%
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 5. Lower Cards: Top Countries, Top Cities & Recent Purchases Feed (In Live Activity mode) */}
          {globeMode === "live" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Top Countries */}
              <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#D9E2E3]">
                    <div className="flex items-center gap-2">
                      <Globe2 className="w-4 h-4 text-[#0F8F8A]" />
                      <h3 className="text-[14px] font-bold text-[#142126]">Top Countries</h3>
                    </div>
                    <span className="text-[11px] text-[#65737A]">Active now</span>
                  </div>

                  <div className="mt-3 space-y-2" data-testid="top-countries-list">
                    {(!liveData?.topCountries || liveData.topCountries.length === 0) ? (
                      <div className="py-8 text-center text-[#65737A] text-[12px]">
                        No active countries recorded.
                      </div>
                    ) : (
                      liveData.topCountries.map((c, idx) => (
                        <div key={c.countryCode || idx} className="flex items-center justify-between py-1.5 border-b border-[#F1F5F5] last:border-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono font-bold text-[#65737A] w-4">
                              #{idx + 1}
                            </span>
                            <span className="text-[13px] font-semibold text-[#142126]">
                              {c.countryCode}
                            </span>
                          </div>
                          <span className="text-[13px] font-bold text-[#0F8F8A]">
                            {c.activeCount}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Top Cities */}
              <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#D9E2E3]">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#3B82F6]" />
                      <h3 className="text-[14px] font-bold text-[#142126]">Top Cities</h3>
                    </div>
                    <span className="text-[11px] text-[#65737A]">Active now</span>
                  </div>

                  <div className="mt-3 space-y-2" data-testid="top-cities-list">
                    {(!liveData?.topCities || liveData.topCities.length === 0) ? (
                      <div className="py-8 text-center text-[#65737A] text-[12px]">
                        No active cities recorded.
                      </div>
                    ) : (
                      liveData.topCities.map((city, idx) => (
                        <div key={`${city.city}-${idx}`} className="flex items-center justify-between py-1.5 border-b border-[#F1F5F5] last:border-0">
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span className="text-[11px] font-mono font-bold text-[#65737A] w-4">
                              #{idx + 1}
                            </span>
                            <span className="text-[13px] font-semibold text-[#142126] truncate">
                              {city.city} {city.countryCode ? `(${city.countryCode})` : ""}
                            </span>
                          </div>
                          <span className="text-[13px] font-bold text-[#3B82F6] shrink-0">
                            {city.activeCount}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Purchases Feed */}
              <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-5 shadow-[0_1px_2px_rgba(10,35,42,0.03)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-[#D9E2E3]">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-4 h-4 text-[#F59E0B]" />
                      <h3 className="text-[14px] font-bold text-[#142126]">Recent Purchases</h3>
                    </div>
                    <span className="text-[11px] text-[#65737A]">Past 15 min</span>
                  </div>

                  <div className="mt-3 space-y-2.5 max-h-[280px] overflow-y-auto pr-1" data-testid="recent-purchases-feed">
                    {(!liveData?.recentPurchases || liveData.recentPurchases.length === 0) ? (
                      <div className="py-8 text-center text-[#65737A] text-[12px]">
                        No recent purchases in the last 15 minutes.
                      </div>
                    ) : (
                      liveData.recentPurchases.map((purchase) => (
                        <div 
                          key={purchase.orderId}
                          className="p-2.5 rounded-[8px] bg-[#F8FAFB] border border-[#D9E2E3] flex items-center justify-between gap-3 text-[12px]"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 font-bold text-[#142126]">
                              <span>{formatUSD(purchase.amountCents)}</span>
                              <span className="text-[#65737A] font-normal">&bull;</span>
                              <span className="capitalize text-[#0F8F8A]">{purchase.platform || "Platform"}</span>
                              {purchase.service && (
                                <span className="text-[#65737A] font-normal truncate">({purchase.service})</span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#65737A] flex items-center gap-1.5 mt-0.5">
                              <span className="truncate">
                                {purchase.city || purchase.region || purchase.countryCode || "Global"}
                                {purchase.countryCode && purchase.city ? ` · ${purchase.countryCode}` : ""}
                              </span>
                              <span>&bull;</span>
                              <span className="flex items-center gap-0.5 shrink-0 text-[#8A979D]">
                                <Clock className="w-3 h-3" />
                                {getRelativeTime(purchase.approvedAt)}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#16B77A]/10 text-[#16B77A]">
                            <CheckCircle2 className="w-3 h-3" />
                            Paid
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
