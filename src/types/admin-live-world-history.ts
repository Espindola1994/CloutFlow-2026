/**
 * Types for Admin Live World Historical Analytics API
 * Phase 4A — Read-Only Admin-Only Geo Analytics + Filters
 */

export type LiveWorldHistoryRange = '24h' | '7d' | '30d' | '90d' | 'today';

export interface LiveWorldHistoryFilters {
  platform: string | null;
  service: string | null;
  country: string | null;
}

export interface LiveWorldHistorySummary {
  totalPurchases: number;
  revenueCents: number;
  averageOrderValueCents: number;
  mappedPurchases: number;
  unknownGeoPurchases: number;
}

export interface LiveWorldHistoryTopCountry {
  countryCode: string;
  purchaseCount: number;
  revenueCents: number;
  averageOrderValueCents: number;
}

export interface LiveWorldHistoryTopCity {
  countryCode: string | null;
  region: string | null;
  city: string;
  purchaseCount: number;
  revenueCents: number;
  averageOrderValueCents: number;
  latitude: number | null;
  longitude: number | null;
}

export interface LiveWorldHistoryPlatformItem {
  platform: string;
  purchaseCount: number;
  revenueCents: number;
  averageOrderValueCents: number;
}

export interface LiveWorldHistoryServiceItem {
  platform: string;
  service: string;
  purchaseCount: number;
  revenueCents: number;
  averageOrderValueCents: number;
}

export interface LiveWorldHistoryPlanItem {
  planId: string | null;
  platform: string;
  service: string;
  purchaseCount: number;
  revenueCents: number;
  averageOrderValueCents: number;
}

export interface LiveWorldHistoryTimeSeriesPoint {
  timestamp: string; // ISO UTC string
  purchaseCount: number;
  revenueCents: number;
  mappedPurchases: number;
}

export interface LiveWorldHistoryResponseData {
  generatedAt: string;
  range: LiveWorldHistoryRange;
  filters: LiveWorldHistoryFilters;
  summary: LiveWorldHistorySummary;
  topCountries: LiveWorldHistoryTopCountry[];
  topCities: LiveWorldHistoryTopCity[];
  platforms: LiveWorldHistoryPlatformItem[];
  services: LiveWorldHistoryServiceItem[];
  plans: LiveWorldHistoryPlanItem[];
  series: LiveWorldHistoryTimeSeriesPoint[];
}
