/**
 * Types for Admin Live World (Real-time Global Activity API)
 *
 * Strictly Read-Only, Zero-PII, Global-First telemetry contracts.
 */

export interface LiveWorldDeviceBreakdown {
  mobile: number;
  tablet: number;
  desktop: number;
  other: number;
}

export interface LiveWorldOsBreakdown {
  iOS: number;
  Android: number;
  Windows: number;
  macOS: number;
  Linux: number;
  ChromeOS: number;
  Other: number;
}

export interface LiveWorldBrowserBreakdown {
  Safari: number;
  Chrome: number;
  Edge: number;
  Firefox: number;
  Other: number;
}

export interface LiveWorldLocationItem {
  countryCode: string | null;
  region: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
  activeCount: number;
  devices: LiveWorldDeviceBreakdown;
  os: LiveWorldOsBreakdown;
  browsers: LiveWorldBrowserBreakdown;
}

export interface LiveWorldTopCountryItem {
  countryCode: string;
  activeCount: number;
}

export interface LiveWorldTopCityItem {
  city: string;
  countryCode: string | null;
  activeCount: number;
}

export interface LiveWorldRecentPurchase {
  orderId: string;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  mappable: boolean;
  deviceType: string | null;
  os: string | null;
  browser: string | null;
  platform: string | null;
  service: string | null;
  planId: string | null;
  amountCents: number;
  approvedAt: string;
}

export interface LiveWorldResponseData {
  generatedAt: string;
  activeVisitorsTotal: number;
  mappableVisitorsTotal: number;
  unknownGeoVisitorsTotal: number;
  locations: LiveWorldLocationItem[];
  topCountries: LiveWorldTopCountryItem[];
  topCities: LiveWorldTopCityItem[];
  devices: LiveWorldDeviceBreakdown;
  os: LiveWorldOsBreakdown;
  browsers: LiveWorldBrowserBreakdown;
  recentPurchases: LiveWorldRecentPurchase[];
}
