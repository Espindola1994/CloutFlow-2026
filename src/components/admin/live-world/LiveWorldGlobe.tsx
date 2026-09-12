"use client";

import React, { useEffect, useRef, useState } from "react";
import type { LiveWorldLocationItem, LiveWorldRecentPurchase } from "@/types/admin-live-world";
import type { LiveWorldHistoryTopCity } from "@/types/admin-live-world-history";
import {
  type LiveWorldGlobeMode,
  type MappableCity,
  extractValidMappableCities,
  calculateLogIntensity,
  calculateMarkerSize,
  calculatePointAltitude,
  getHistoricalPointColor,
} from "./live-world-geo-utils";

export interface LiveWorldGlobeProps {
  // Mode selection: "live" (Live Activity), "revenue" (Revenue Map), "purchase" (Purchase Map)
  mode?: LiveWorldGlobeMode;
  // Live Activity datasets
  locations?: LiveWorldLocationItem[];
  recentPurchases?: LiveWorldRecentPurchase[];
  newPurchaseOrderIds?: Set<string>;
  onHoverLocation?: (location: LiveWorldLocationItem | null) => void;
  onHoverPurchase?: (purchase: LiveWorldRecentPurchase | null) => void;

  // Phase 4C Historical datasets
  historicalCities?: LiveWorldHistoryTopCity[];
  selectedCity?: MappableCity | null;
  onHoverHistoricalCity?: (city: MappableCity | null) => void;
  onSelectHistoricalCity?: (city: MappableCity | null) => void;
}

interface GlobePoint {
  lat: number;
  lng: number;
  size: number;
  color: string;
  altitude: number;
  location?: LiveWorldLocationItem;
  purchase?: LiveWorldRecentPurchase;
  historicalCity?: MappableCity;
  type: "visitor" | "purchase" | "historical";
}

interface GlobeRing {
  lat: number;
  lng: number;
  maxR: number;
  propagationSpeed: number;
  repeatPeriod: number;
  color: string;
}

export default function LiveWorldGlobe({
  mode = "live",
  locations = [],
  recentPurchases = [],
  newPurchaseOrderIds = new Set(),
  onHoverLocation,
  onHoverPurchase,
  historicalCities = [],
  selectedCity = null,
  onHoverHistoricalCity,
  onSelectHistoricalCity,
}: LiveWorldGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const globeInstanceRef = useRef<any>(null);
  const [webglSupported, setWebglSupported] = useState<boolean>(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [isGlobeReady, setIsGlobeReady] = useState<boolean>(false);

  // References to keep callbacks current without re-binding globe event listeners
  const callbacksRef = useRef({
    onHoverLocation,
    onHoverPurchase,
    onHoverHistoricalCity,
    onSelectHistoricalCity,
  });

  useEffect(() => {
    callbacksRef.current = {
      onHoverLocation,
      onHoverPurchase,
      onHoverHistoricalCity,
      onSelectHistoricalCity,
    };
  });

  // Check WebGL availability
  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
      if (!gl) {
        setWebglSupported(false);
      }
    } catch {
      setWebglSupported(false);
    }
  }, []);

  // Initialize Globe once
  useEffect(() => {
    if (!webglSupported || !containerRef.current || globeInstanceRef.current) return;

    let destroyed = false;
    let globe: any = null;

    const initGlobe = async () => {
      try {
        const GlobeModule = await import("globe.gl");
        const GlobeConstructor = (GlobeModule.default || GlobeModule) as any;

        if (destroyed || !containerRef.current) return;

        const width = containerRef.current.clientWidth || 600;
        const height = containerRef.current.clientHeight || 500;

        globe = new GlobeConstructor(containerRef.current)
          .width(width)
          .height(height)
          .backgroundColor("rgba(0,0,0,0)")
          .showAtmosphere(true)
          .atmosphereColor("#0F8F8A")
          .atmosphereAltitude(0.18)
          .globeImageUrl("//unpkg.com/three-globe/example/img/earth-night.jpg")
          .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
          .pointAltitude("altitude")
          .pointRadius("size")
          .pointColor("color")
          .pointResolution(24)
          .pointsMerge(false)
          .pointLabel(() => "") // Custom UI overlays handle tooltips
          .ringsData([])
          .ringColor("color")
          .ringMaxRadius("maxR")
          .ringPropagationSpeed("propagationSpeed")
          .ringRepeatPeriod("repeatPeriod")
          .onPointHover((point: GlobePoint | null) => {
            if (!point) {
              callbacksRef.current.onHoverLocation?.(null);
              callbacksRef.current.onHoverPurchase?.(null);
              callbacksRef.current.onHoverHistoricalCity?.(null);
            } else if (point.type === "visitor" && point.location) {
              callbacksRef.current.onHoverPurchase?.(null);
              callbacksRef.current.onHoverHistoricalCity?.(null);
              callbacksRef.current.onHoverLocation?.(point.location);
            } else if (point.type === "purchase" && point.purchase) {
              callbacksRef.current.onHoverLocation?.(null);
              callbacksRef.current.onHoverHistoricalCity?.(null);
              callbacksRef.current.onHoverPurchase?.(point.purchase);
            } else if (point.type === "historical" && point.historicalCity) {
              callbacksRef.current.onHoverLocation?.(null);
              callbacksRef.current.onHoverPurchase?.(null);
              callbacksRef.current.onHoverHistoricalCity?.(point.historicalCity);
            }
          });

        if (typeof globe.onPointClick === "function") {
          globe.onPointClick((point: GlobePoint | null) => {
            if (point && point.type === "historical" && point.historicalCity) {
              callbacksRef.current.onSelectHistoricalCity?.(point.historicalCity);
            }
          });
        }

        // Configure controls
        const controls = globe.controls();
        if (controls) {
          controls.enableZoom = true;
          controls.autoRotate = true;
          controls.autoRotateSpeed = 0.6;
          controls.enableDamping = true;
          controls.dampingFactor = 0.05;

          // Pause auto-rotation on user interaction and resume after delay
          let resumeTimeout: NodeJS.Timeout;
          const onStartInteraction = () => {
            controls.autoRotate = false;
            if (resumeTimeout) clearTimeout(resumeTimeout);
          };
          const onEndInteraction = () => {
            if (resumeTimeout) clearTimeout(resumeTimeout);
            resumeTimeout = setTimeout(() => {
              if (controls) controls.autoRotate = true;
            }, 4000);
          };

          controls.addEventListener("start", onStartInteraction);
          controls.addEventListener("end", onEndInteraction);
        }

        // Global-First initial view: North Atlantic / International (US, Canada, UK, Western Europe)
        // lat: 35, lng: -40, altitude: 2.1
        globe.pointOfView({ lat: 35, lng: -40, altitude: 2.1 }, 0);

        globeInstanceRef.current = globe;
        setIsGlobeReady(true);

        // Resize handler
        const handleResize = () => {
          if (!containerRef.current || !globeInstanceRef.current) return;
          globeInstanceRef.current
            .width(containerRef.current.clientWidth)
            .height(containerRef.current.clientHeight);
        };
        window.addEventListener("resize", handleResize);

        (globe as any)._cleanupResize = () => {
          window.removeEventListener("resize", handleResize);
        };
      } catch (err: any) {
        console.error("Failed to initialize globe.gl:", err);
        setInitError(err?.message || "Failed to initialize 3D Globe");
      }
    };

    void initGlobe();

    return () => {
      destroyed = true;
      if (globeInstanceRef.current) {
        try {
          if (globeInstanceRef.current._cleanupResize) {
            globeInstanceRef.current._cleanupResize();
          }
          if (typeof globeInstanceRef.current._destructor === "function") {
            globeInstanceRef.current._destructor();
          }
        } catch {
          // ignore cleanup errors
        }
        globeInstanceRef.current = null;
      }
    };
  }, [webglSupported]);

  // Update Points and Rings dynamically without recreating the Globe or resetting camera/zoom
  useEffect(() => {
    const globe = globeInstanceRef.current;
    if (!globe) return;

    if (mode === "live") {
      // 1. Live Activity Mode
      const pointsData: GlobePoint[] = [];

      // Visitors points
      locations.forEach((loc) => {
        if (typeof loc.latitude !== "number" || typeof loc.longitude !== "number") return;
        const baseRadius = 0.35;
        const size = Math.min(baseRadius + Math.log2(Math.max(1, loc.activeCount)) * 0.22, 1.4);

        pointsData.push({
          lat: loc.latitude,
          lng: loc.longitude,
          size,
          color: "rgba(15, 143, 138, 0.92)",
          altitude: 0.02,
          location: loc,
          type: "visitor",
        });
      });

      // Recent purchases points
      recentPurchases.forEach((purchase) => {
        if (!purchase.mappable || typeof purchase.latitude !== "number" || typeof purchase.longitude !== "number") return;

        const isNew = newPurchaseOrderIds.has(purchase.orderId);
        pointsData.push({
          lat: purchase.latitude,
          lng: purchase.longitude,
          size: isNew ? 0.75 : 0.5,
          color: isNew ? "rgba(255, 184, 0, 1)" : "rgba(245, 158, 11, 0.85)",
          altitude: isNew ? 0.06 : 0.035,
          purchase,
          type: "purchase",
        });
      });

      globe.pointsData(pointsData);

      // Rings for recent purchases (animated pulse effect for new live purchases)
      const ringsData: GlobeRing[] = [];
      recentPurchases.forEach((purchase) => {
        if (!purchase.mappable || typeof purchase.latitude !== "number" || typeof purchase.longitude !== "number") return;

        if (newPurchaseOrderIds.has(purchase.orderId)) {
          ringsData.push({
            lat: purchase.latitude,
            lng: purchase.longitude,
            maxR: 3.5,
            propagationSpeed: 2.2,
            repeatPeriod: 1200,
            color: "rgba(255, 196, 0, 0.85)",
          });
        }
      });

      globe.ringsData(ringsData);
    } else {
      // 2. Historical Mode (Revenue Map or Purchase Map)
      // Zero live rings in historical mode
      globe.ringsData([]);

      const validCities = extractValidMappableCities(historicalCities);

      if (validCities.length === 0) {
        globe.pointsData([]);
        return;
      }

      // Compute max value for normalized log scaling
      let maxValue = 1;
      if (mode === "revenue") {
        maxValue = Math.max(...validCities.map((c) => c.revenueCents), 1);
      } else {
        maxValue = Math.max(...validCities.map((c) => c.purchaseCount), 1);
      }

      const pointsData: GlobePoint[] = validCities.map((city) => {
        const val = mode === "revenue" ? city.revenueCents : city.purchaseCount;
        const intensity = calculateLogIntensity(val, maxValue, 0.2);
        const isSelected = selectedCity?.city === city.city && selectedCity?.countryCode === city.countryCode;

        const size = calculateMarkerSize(val, maxValue, isSelected ? 0.7 : 0.45, isSelected ? 1.6 : 1.35);
        const altitude = calculatePointAltitude(val, maxValue, 0.02, 0.10);
        const color = getHistoricalPointColor(mode, intensity, isSelected);

        return {
          lat: city.latitude,
          lng: city.longitude,
          size,
          color,
          altitude: isSelected ? altitude + 0.03 : altitude,
          historicalCity: city,
          type: "historical",
        };
      });

      globe.pointsData(pointsData);
    }
  }, [
    mode,
    locations,
    recentPurchases,
    newPurchaseOrderIds,
    historicalCities,
    selectedCity,
    isGlobeReady,
  ]);

  if (!webglSupported || initError) {
    return (
      <div 
        data-testid="webgl-fallback"
        className="w-full h-full min-h-[420px] flex flex-col items-center justify-center bg-[#071D26] rounded-[12px] border border-[#11313B] p-8 text-center"
      >
        <div className="w-12 h-12 rounded-full bg-[#11313B] flex items-center justify-center text-[#8A979D] mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-white font-bold text-[15px]">3D view unavailable on this device.</h3>
        <p className="text-[#8A979D] text-[12px] mt-1 max-w-sm">
          WebGL hardware acceleration is disabled or unsupported. Activity metrics, Top Countries, and analytics cards remain fully operational.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-h-[440px] relative select-none" ref={containerRef}>
      {/* Globe canvas attaches here */}
    </div>
  );
}
