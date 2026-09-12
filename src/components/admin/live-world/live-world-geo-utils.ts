/**
 * Utility functions for Live World Phase 4C — Advanced Geo Visualization
 * Pure functions for intensity calculation, mathematical log scaling, color interpolation, and geo validation.
 * READ-ONLY / ADMIN-ONLY.
 */

import type { LiveWorldHistoryTopCity } from "@/types/admin-live-world-history";

export type LiveWorldGlobeMode = "live" | "revenue" | "purchase";

export interface MappableCity {
  city: string;
  region: string | null;
  countryCode: string | null;
  purchaseCount: number;
  revenueCents: number;
  averageOrderValueCents: number;
  latitude: number;
  longitude: number;
}

/**
 * Filter and validate top cities that have valid geographic coordinates.
 * Strictly ignores null, undefined, non-number or out-of-bounds lat/lng.
 * Does NOT fallback to country centers, capitals, or (0,0).
 */
export function extractValidMappableCities(cities: LiveWorldHistoryTopCity[] | null | undefined): MappableCity[] {
  if (!cities || !Array.isArray(cities)) return [];

  const valid: MappableCity[] = [];

  for (const c of cities) {
    if (typeof c.latitude !== "number" || typeof c.longitude !== "number") {
      continue;
    }
    if (isNaN(c.latitude) || isNaN(c.longitude)) {
      continue;
    }
    // Check reasonable coordinates range: lat [-90, 90], lng [-180, 180]
    if (c.latitude < -90 || c.latitude > 90 || c.longitude < -180 || c.longitude > 180) {
      continue;
    }
    // Reject explicit (0, 0) placeholder coordinate unless valid city is right at origin
    // Spec rule 9: "NÃO usar coordenada 0,0"
    if (c.latitude === 0 && c.longitude === 0) {
      continue;
    }

    valid.push({
      city: c.city || "Unknown City",
      region: c.region || null,
      countryCode: c.countryCode || null,
      purchaseCount: Number(c.purchaseCount) || 0,
      revenueCents: Number(c.revenueCents) || 0,
      averageOrderValueCents: Number(c.averageOrderValueCents) || 0,
      latitude: c.latitude,
      longitude: c.longitude,
    });
  }

  return valid;
}

/**
 * Logarithmic intensity scale calculation for revenue or purchaseCount.
 * normalizedIntensity = log1p(value) / log1p(maxValue)
 * Clamped between minRatio and 1.
 */
export function calculateLogIntensity(
  value: number,
  maxValue: number,
  minRatio = 0.15
): number {
  if (value <= 0 || maxValue <= 0) return minRatio;
  const num = Math.log1p(Math.max(0, value));
  const den = Math.log1p(Math.max(1, maxValue));
  const ratio = den > 0 ? num / den : 0;
  return Math.min(1, Math.max(minRatio, ratio));
}

/**
 * Calculate marker radius / size clamped between minSize and maxSize.
 */
export function calculateMarkerSize(
  value: number,
  maxValue: number,
  minSize = 0.45,
  maxSize = 1.35
): number {
  const intensity = calculateLogIntensity(value, maxValue, 0);
  return minSize + intensity * (maxSize - minSize);
}

/**
 * Calculate point altitude clamped between minAlt and maxAlt.
 */
export function calculatePointAltitude(
  value: number,
  maxValue: number,
  minAlt = 0.02,
  maxAlt = 0.12
): number {
  const intensity = calculateLogIntensity(value, maxValue, 0);
  return minAlt + intensity * (maxAlt - minAlt);
}

/**
 * Return color according to intensity and mode.
 * Revenue Map: Amber / Gold / Magenta gradient
 *   Low: rgba(245, 158, 11, 0.75) (amber)
 *   Mid: rgba(251, 191, 36, 0.90) (gold)
 *   High: rgba(244, 63, 94, 0.95) (rose/magenta premium)
 * Purchase Map: Cyan / Neon Blue gradient
 *   Low: rgba(56, 189, 248, 0.75) (light sky blue)
 *   Mid: rgba(14, 165, 233, 0.90) (vibrant cyan)
 *   High: rgba(99, 102, 241, 0.95) (indigo / neon blue)
 */
export function getHistoricalPointColor(
  mode: "revenue" | "purchase",
  intensity: number,
  isSelected = false
): string {
  if (isSelected) {
    return "#FFFFFF"; // Pure bright white halo highlight for selected point
  }

  if (mode === "revenue") {
    if (intensity < 0.4) {
      return "rgba(245, 158, 11, 0.85)"; // warm amber
    } else if (intensity < 0.75) {
      return "rgba(251, 191, 36, 0.95)"; // bright gold
    } else {
      return "rgba(244, 63, 94, 0.95)"; // magenta premium
    }
  } else {
    // purchase mode
    if (intensity < 0.4) {
      return "rgba(56, 189, 248, 0.85)"; // sky blue
    } else if (intensity < 0.75) {
      return "rgba(14, 165, 233, 0.95)"; // neon cyan
    } else {
      return "rgba(99, 102, 241, 0.95)"; // vivid indigo / electric
    }
  }
}
