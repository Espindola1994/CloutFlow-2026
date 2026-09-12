"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
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
  History
} from "lucide-react";
import { LiveWorldGlobeContainer } from "./LiveWorldGlobeContainer";
import { LiveWorldHistoryView } from "./LiveWorldHistoryView";
import type { 
  LiveWorldResponseData, 
  LiveWorldLocationItem, 
  LiveWorldRecentPurchase 
} from "@/types/admin-live-world";
import type { LiveWorldHistoryRange } from "@/types/admin-live-world-history";

export type LiveWorldSubView = "live" | "history";

export function LiveWorldModule() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Navigation tab within Live World: 'live' or 'history'
  const viewParam = searchParams.get("view");
  const activeView: LiveWorldSubView = viewParam === "history" ? "history" : "live";

  // History query state preservation
  const rangeParam = (searchParams.get("range") || "30d") as LiveWorldHistoryRange;
  const platformParam = searchParams.get("platform") || "all";
  const serviceParam = searchParams.get("service") || "all";
  const countryParam = searchParams.get("country") || "all";

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

  const [data, setData] = useState<LiveWorldResponseData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [hoveredLocation, setHoveredLocation] = useState<LiveWorldLocationItem | null>(null);
  const [hoveredPurchase, setHoveredPurchase] = useState<LiveWorldRecentPurchase | null>(null);

  // Set of purchase orderIds that are new and should animate pulse once
  const [newPurchaseOrderIds, setNewPurchaseOrderIds] = useState<Set<string>>(new Set());
  // Seen orderIds client-side dedup to prevent re-animating identical purchases on subsequent polls
  const seenOrderIdsRef = useRef<Set<string>>(new Set());
  const initialLoadRef = useRef<boolean>(true);

  const fetchLiveWorld = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setIsRefreshing(true);
      setError(null);

      const res = await fetch("/api/admin/live-world", {
        headers: { "Cache-Control": "no-cache" },
      });
      const json = await res.json();

      if (res.ok && json.success && json.data) {
        const liveData: LiveWorldResponseData = json.data;
        setData(liveData);

        // Dedup recent purchases for pulse animation
        const incomingNew = new Set<string>();
        if (liveData.recentPurchases && Array.isArray(liveData.recentPurchases)) {
          liveData.recentPurchases.forEach((p) => {
            if (p.mappable && !seenOrderIdsRef.current.has(p.orderId)) {
              seenOrderIdsRef.current.add(p.orderId);
              // If not first mount, trigger pulse animation
              if (!initialLoadRef.current) {
                incomingNew.add(p.orderId);
              }
            }
          });
        }
        initialLoadRef.current = false;

        if (incomingNew.size > 0) {
          setNewPurchaseOrderIds(incomingNew);
          // Auto clear pulse state after 5 seconds
          setTimeout(() => {
            setNewPurchaseOrderIds((prev) => {
              const updated = new Set(prev);
              incomingNew.forEach((id) => updated.delete(id));
              return updated;
            });
          }, 5000);
        }
      } else {
        setError(json.error?.message || "Live activity temporarily unavailable.");
      }
    } catch {
      setError("Live activity temporarily unavailable.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Polling interval ~8 seconds ONLY when live view is active or kept isolated
  useEffect(() => {
    void fetchLiveWorld(false);

    const intervalId = setInterval(() => {
      void fetchLiveWorld(true);
    }, 8000);

    return () => clearInterval(intervalId);
  }, [fetchLiveWorld]);

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

  // Format USD
  const formatUSD = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

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
                  {data?.activeVisitorsTotal ?? 0}
                </div>
              </div>
              <button
                type="button"
                onClick={() => void fetchLiveWorld(true)}
                disabled={loading || isRefreshing}
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
          {error && (
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

          {/* 3. Metrics Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Active Visitors */}
            <div className="bg-white border border-[#D9E2E3] rounded-[10px] p-4 shadow-[0_1px_2px_rgba(10,35,42,0.03)]">
              <div className="flex items-center justify-between text-[#65737A] text-[12px] font-medium">
                <span>Active Visitors</span>
                <Users className="w-4 h-4 text-[#0F8F8A]" />
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-[24px] font-bold text-[#142126] tracking-tight" data-testid="metric-active-total">
                  {data?.activeVisitorsTotal ?? 0}
                </span>
                <span className="text-[11px] font-medium text-[#16B77A] flex items-center gap-0.5">
                  <Activity className="w-3 h-3" /> Live
                </span>
              </div>
              <div className="mt-1 text-[11px] text-[#65737A] flex items-center gap-1.5">
                <span>{data?.mappableVisitorsTotal ?? 0} mapped</span>
                <span>&bull;</span>
                <span>{data?.unknownGeoVisitorsTotal ?? 0} unknown</span>
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
                  {data?.locations?.length ?? 0}
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
                    {data?.devices?.mobile ?? 0}
                  </div>
                </div>
                <div className="bg-[#F8FAFB] rounded-[6px] p-1.5">
                  <div className="text-[10px] text-[#65737A]">Tablet</div>
                  <div className="text-[14px] font-bold text-[#142126]" data-testid="metric-tablet">
                    {data?.devices?.tablet ?? 0}
                  </div>
                </div>
                <div className="bg-[#F8FAFB] rounded-[6px] p-1.5">
                  <div className="text-[10px] text-[#65737A]">Desktop</div>
                  <div className="text-[14px] font-bold text-[#142126]" data-testid="metric-desktop">
                    {data?.devices?.desktop ?? 0}
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
                  {data?.recentPurchases?.length ?? 0}
                </span>
                <span className="text-[11px] text-[#F59E0B] font-semibold">15 min window</span>
              </div>
              <div className="mt-1 text-[11px] text-[#65737A] flex items-center gap-2">
                <span>iOS: {data?.os?.iOS ?? 0}</span>
                <span>&bull;</span>
                <span>Android: {data?.os?.Android ?? 0}</span>
                <span>&bull;</span>
                <span>macOS: {data?.os?.macOS ?? 0}</span>
              </div>
            </div>
          </div>

          {/* 4. 3D Globe Main Visual Stage */}
          <div className="relative bg-[#071D26] border border-[#11313B] rounded-[14px] overflow-hidden min-h-[500px] lg:min-h-[580px] shadow-2xl">
            {/* Globe Header Overlay */}
            <div className="absolute top-4 left-4 z-20 pointer-events-none flex flex-col gap-1">
              <div className="flex items-center gap-2 bg-[#0A2630]/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-[#11313B] shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[#0F8F8A] animate-pulse" />
                <span className="text-white text-[12px] font-semibold tracking-wide">3D Global Operations</span>
              </div>
              <span className="text-[#8A979D] text-[11px] pl-2 font-mono">
                North Atlantic Centered &bull; 360&deg; Orbit &bull; Inertial Drag
              </span>
            </div>

            {/* Legend Overlay */}
            <div className="absolute bottom-4 left-4 z-20 pointer-events-none bg-[#0A2630]/90 backdrop-blur-md px-3 py-2 rounded-[8px] border border-[#11313B] shadow-sm flex items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1.5 text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0F8F8A] shadow-[0_0_8px_#0F8F8A]" />
                <span>Active Visitor Cluster</span>
              </div>
              <div className="flex items-center gap-1.5 text-white">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-[0_0_8px_#F59E0B]" />
                <span>Recent Purchase</span>
              </div>
            </div>

            {/* Interactive Tooltip Overlay (Visitor) */}
            {hoveredLocation && (
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

            {/* Interactive Tooltip Overlay (Purchase) */}
            {hoveredPurchase && (
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

            {/* Globe Container (Client-only WebGL dynamic import) */}
            <div className="w-full h-[500px] lg:h-[580px]">
              <LiveWorldGlobeContainer
                locations={data?.locations ?? []}
                recentPurchases={data?.recentPurchases ?? []}
                newPurchaseOrderIds={newPurchaseOrderIds}
                onHoverLocation={setHoveredLocation}
                onHoverPurchase={setHoveredPurchase}
              />
            </div>
          </div>

          {/* 5. Lower Cards: Top Countries, Top Cities & Recent Purchases Feed */}
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
                  {(!data?.topCountries || data.topCountries.length === 0) ? (
                    <div className="py-8 text-center text-[#65737A] text-[12px]">
                      No active countries recorded.
                    </div>
                  ) : (
                    data.topCountries.map((c, idx) => (
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
                  {(!data?.topCities || data.topCities.length === 0) ? (
                    <div className="py-8 text-center text-[#65737A] text-[12px]">
                      No active cities recorded.
                    </div>
                  ) : (
                    data.topCities.map((city, idx) => (
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
                  {(!data?.recentPurchases || data.recentPurchases.length === 0) ? (
                    <div className="py-8 text-center text-[#65737A] text-[12px]">
                      No recent purchases in the last 15 minutes.
                    </div>
                  ) : (
                    data.recentPurchases.map((purchase) => (
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
        </>
      )}
    </div>
  );
}
