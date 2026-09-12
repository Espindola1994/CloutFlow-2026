import { db } from '@/db';
import { visitorPresence, orders, checkoutContexts } from '@/db/schema';
import { sql, and, gte, inArray } from 'drizzle-orm';
import { getNonCleanupOrderSqlCondition } from '@/services/admin-order-cleanup.helper';
import {
  LiveWorldResponseData,
  LiveWorldLocationItem,
  LiveWorldTopCountryItem,
  LiveWorldTopCityItem,
  LiveWorldDeviceBreakdown,
  LiveWorldOsBreakdown,
  LiveWorldBrowserBreakdown,
  LiveWorldRecentPurchase,
} from '@/types/admin-live-world';

export const LIVE_WORLD_ACTIVE_WINDOW_SECONDS = 90;
export const LIVE_WORLD_RECENT_PURCHASE_MINUTES = 15;

/**
 * Normalizes device type into canonical categories: mobile, tablet, desktop, other.
 */
export function normalizeDeviceCategory(deviceType: string | null | undefined): keyof LiveWorldDeviceBreakdown {
  if (!deviceType) return 'other';
  const dt = deviceType.toLowerCase().trim();
  if (dt === 'mobile') return 'mobile';
  if (dt === 'tablet') return 'tablet';
  if (dt === 'desktop') return 'desktop';
  return 'other';
}

/**
 * Normalizes OS into canonical categories: iOS, Android, Windows, macOS, Linux, ChromeOS, Other.
 */
export function normalizeOsCategory(os: string | null | undefined): keyof LiveWorldOsBreakdown {
  if (!os) return 'Other';
  const raw = os.trim();
  const lower = raw.toLowerCase();
  if (lower === 'ios' || lower.includes('iphone') || lower.includes('ipad')) return 'iOS';
  if (lower === 'android') return 'Android';
  if (lower === 'windows') return 'Windows';
  if (lower === 'macos' || lower === 'mac os' || lower.includes('macintosh')) return 'macOS';
  if (lower === 'linux') return 'Linux';
  if (lower === 'chromeos' || lower === 'chrome os' || lower === 'cros') return 'ChromeOS';
  return 'Other';
}

/**
 * Normalizes browser into canonical categories: Safari, Chrome, Edge, Firefox, Other.
 */
export function normalizeBrowserCategory(browser: string | null | undefined): keyof LiveWorldBrowserBreakdown {
  if (!browser) return 'Other';
  const raw = browser.trim();
  const lower = raw.toLowerCase();
  if (lower === 'edge' || lower.includes('edg')) return 'Edge';
  if (lower === 'firefox') return 'Firefox';
  if (lower === 'chrome' && !lower.includes('chromium')) return 'Chrome';
  if (lower === 'safari') return 'Safari';
  return 'Other';
}

function createEmptyDeviceBreakdown(): LiveWorldDeviceBreakdown {
  return { mobile: 0, tablet: 0, desktop: 0, other: 0 };
}

function createEmptyOsBreakdown(): LiveWorldOsBreakdown {
  return { iOS: 0, Android: 0, Windows: 0, macOS: 0, Linux: 0, ChromeOS: 0, Other: 0 };
}

function createEmptyBrowserBreakdown(): LiveWorldBrowserBreakdown {
  return { Safari: 0, Chrome: 0, Edge: 0, Firefox: 0, Other: 0 };
}

/**
 * Pure aggregation function for Live World data.
 * Highly testable and free of side-effects.
 */
export function aggregateLiveWorldData(params: {
  visitors: Array<{
    countryCode: string | null;
    region: string | null;
    city: string | null;
    latitude: string | number | null;
    longitude: string | number | null;
    deviceType: string | null;
    os: string | null;
    browser: string | null;
  }>;
  recentPurchases: LiveWorldRecentPurchase[];
  now?: Date;
}): LiveWorldResponseData {
  const { visitors, recentPurchases, now = new Date() } = params;

  let activeVisitorsTotal = 0;
  let mappableVisitorsTotal = 0;
  let unknownGeoVisitorsTotal = 0;

  const globalDevices = createEmptyDeviceBreakdown();
  const globalOs = createEmptyOsBreakdown();
  const globalBrowsers = createEmptyBrowserBreakdown();

  // Map keyed by rounded lat,lng + countryCode + city for exact cluster/city grouping
  // Coords formatted to 4 decimals (~11m resolution) to deduplicate locations
  const locationMap = new Map<
    string,
    {
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
  >();

  const countryCounts = new Map<string, number>();
  const cityCounts = new Map<string, { city: string; countryCode: string | null; count: number }>();

  for (const v of visitors) {
    activeVisitorsTotal += 1;

    const dev = normalizeDeviceCategory(v.deviceType);
    const os = normalizeOsCategory(v.os);
    const br = normalizeBrowserCategory(v.browser);

    globalDevices[dev] += 1;
    globalOs[os] += 1;
    globalBrowsers[br] += 1;

    // Check if coordinates exist and are valid numbers
    const latNum = v.latitude !== null && v.latitude !== undefined && v.latitude !== '' ? parseFloat(String(v.latitude)) : NaN;
    const lngNum = v.longitude !== null && v.longitude !== undefined && v.longitude !== '' ? parseFloat(String(v.longitude)) : NaN;

    const isMappable = !isNaN(latNum) && !isNaN(lngNum) && latNum >= -90 && latNum <= 90 && lngNum >= -180 && lngNum <= 180;

    if (isMappable) {
      mappableVisitorsTotal += 1;

      // Grouping key: Lat (4 decimals), Lng (4 decimals), normalized countryCode, city
      const latFixed = parseFloat(latNum.toFixed(4));
      const lngFixed = parseFloat(lngNum.toFixed(4));
      const cc = v.countryCode ? v.countryCode.trim().toUpperCase() : null;
      const city = v.city ? v.city.trim() : null;
      const region = v.region ? v.region.trim() : null;

      const locKey = `${latFixed},${lngFixed}:${cc || 'UNKNOWN'}:${city || 'UNKNOWN'}`;

      let loc = locationMap.get(locKey);
      if (!loc) {
        loc = {
          countryCode: cc,
          region,
          city,
          latitude: latFixed,
          longitude: lngFixed,
          activeCount: 0,
          devices: createEmptyDeviceBreakdown(),
          os: createEmptyOsBreakdown(),
          browsers: createEmptyBrowserBreakdown(),
        };
        locationMap.set(locKey, loc);
      }

      loc.activeCount += 1;
      loc.devices[dev] += 1;
      loc.os[os] += 1;
      loc.browsers[br] += 1;

      // Country count aggregation
      if (cc) {
        countryCounts.set(cc, (countryCounts.get(cc) || 0) + 1);
      }

      // City count aggregation
      if (city) {
        const cityKey = `${city}::${cc || ''}`;
        const existing = cityCounts.get(cityKey);
        if (!existing) {
          cityCounts.set(cityKey, { city, countryCode: cc, count: 1 });
        } else {
          existing.count += 1;
        }
      }
    } else {
      unknownGeoVisitorsTotal += 1;
      if (v.countryCode) {
        const cc = v.countryCode.trim().toUpperCase();
        countryCounts.set(cc, (countryCounts.get(cc) || 0) + 1);
      }
      if (v.city) {
        const city = v.city.trim();
        const cc = v.countryCode ? v.countryCode.trim().toUpperCase() : null;
        const cityKey = `${city}::${cc || ''}`;
        const existing = cityCounts.get(cityKey);
        if (!existing) {
          cityCounts.set(cityKey, { city, countryCode: cc, count: 1 });
        } else {
          existing.count += 1;
        }
      }
    }
  }

  // Sort locations by activeCount descending
  const locations: LiveWorldLocationItem[] = Array.from(locationMap.values()).sort(
    (a, b) => b.activeCount - a.activeCount
  );

  // Top countries (max 10)
  const topCountries: LiveWorldTopCountryItem[] = Array.from(countryCounts.entries())
    .map(([countryCode, activeCount]) => ({ countryCode, activeCount }))
    .sort((a, b) => b.activeCount - a.activeCount)
    .slice(0, 10);

  // Top cities (max 10)
  const topCities: LiveWorldTopCityItem[] = Array.from(cityCounts.values())
    .map((c) => ({ city: c.city, countryCode: c.countryCode, activeCount: c.count }))
    .sort((a, b) => b.activeCount - a.activeCount)
    .slice(0, 10);

  return {
    generatedAt: now.toISOString(),
    activeVisitorsTotal,
    mappableVisitorsTotal,
    unknownGeoVisitorsTotal,
    locations,
    topCountries,
    topCities,
    devices: globalDevices,
    os: globalOs,
    browsers: globalBrowsers,
    recentPurchases,
  };
}

/**
 * Service function to retrieve real-time Live World data.
 * Runs fast, optimized queries with ZERO N+1.
 */
export async function getAdminLiveWorldData(): Promise<LiveWorldResponseData> {
  const now = new Date();
  const activeWindowStart = new Date(now.getTime() - LIVE_WORLD_ACTIVE_WINDOW_SECONDS * 1000);
  const recentPurchasesStart = new Date(now.getTime() - LIVE_WORLD_RECENT_PURCHASE_MINUTES * 60 * 1000);

  // 1. Fetch active visitors (last_seen_at >= now - 90s)
  // Strictly excludes expired/inactive naturally by timestamp condition.
  // Never uses expires_at as definition of active.
  const activeVisitors = await db
    .select({
      countryCode: visitorPresence.countryCode,
      region: visitorPresence.region,
      city: visitorPresence.city,
      latitude: visitorPresence.latitude,
      longitude: visitorPresence.longitude,
      deviceType: visitorPresence.deviceType,
      os: visitorPresence.os,
      browser: visitorPresence.browser,
    })
    .from(visitorPresence)
    .where(gte(visitorPresence.lastSeenAt, activeWindowStart));

  // 2. Fetch recent paid/approved orders from last 15 minutes
  // Reuses exact exclusion conditions from Admin Analytics (non-cleanup, non-historical-free-tests)
  const nonCleanupCondition = getNonCleanupOrderSqlCondition();

  const recentOrders = await db
    .select({
      id: orders.id,
      publicId: orders.publicId,
      totalCents: orders.totalCents,
      paymentStatus: orders.paymentStatus,
      status: orders.status,
      platform: orders.platform,
      service: orders.service,
      planId: orders.planId,
      canonicalOfferId: orders.canonicalOfferId,
      src: orders.src,
      paidAt: orders.paidAt,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(
      and(
        sql`(${orders.paidAt} >= ${recentPurchasesStart} OR (${orders.paidAt} IS NULL AND ${orders.createdAt} >= ${recentPurchasesStart}))`,
        sql`UPPER(${orders.paymentStatus}) IN ('PAID', 'COMPLETED', 'APPROVED')`,
        nonCleanupCondition
      )
    );

  // 3. Batch resolve checkout_contexts for all orders with CFCTX_ src (NO N+1)
  const cfctxIds: string[] = [];
  for (const ord of recentOrders) {
    if (ord.src && ord.src.startsWith('CFCTX_') && !cfctxIds.includes(ord.src)) {
      cfctxIds.push(ord.src);
    }
  }

  const contextMap = new Map<
    string,
    {
      countryCode: string | null;
      region: string | null;
      city: string | null;
      latitude: string | number | null;
      longitude: string | number | null;
      deviceType: string | null;
      os: string | null;
      browser: string | null;
    }
  >();

  if (cfctxIds.length > 0) {
    const contexts = await db
      .select({
        contextId: checkoutContexts.contextId,
        countryCode: checkoutContexts.countryCode,
        region: checkoutContexts.region,
        city: checkoutContexts.city,
        latitude: checkoutContexts.latitude,
        longitude: checkoutContexts.longitude,
        deviceType: checkoutContexts.deviceType,
        os: checkoutContexts.os,
        browser: checkoutContexts.browser,
      })
      .from(checkoutContexts)
      .where(inArray(checkoutContexts.contextId, cfctxIds));

    for (const ctx of contexts) {
      contextMap.set(ctx.contextId, ctx);
    }
  }

  // 4. Transform orders into LiveWorldRecentPurchase (strictly zero PII)
  const recentPurchases: LiveWorldRecentPurchase[] = recentOrders.map((ord) => {
    const ctx = ord.src && ord.src.startsWith('CFCTX_') ? contextMap.get(ord.src) : null;

    let latitude: number | null = null;
    let longitude: number | null = null;
    let mappable = false;

    if (ctx?.latitude !== null && ctx?.latitude !== undefined && ctx?.longitude !== null && ctx?.longitude !== undefined) {
      const lat = parseFloat(String(ctx.latitude));
      const lng = parseFloat(String(ctx.longitude));
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        latitude = parseFloat(lat.toFixed(4));
        longitude = parseFloat(lng.toFixed(4));
        mappable = true;
      }
    }

    const effectivePlanId = ord.canonicalOfferId || ord.planId || null;
    const approvedTimestamp = (ord.paidAt || ord.createdAt || now).toISOString();

    return {
      orderId: ord.publicId || ord.id,
      countryCode: ctx?.countryCode ? ctx.countryCode.trim().toUpperCase() : null,
      region: ctx?.region ? ctx.region.trim() : null,
      city: ctx?.city ? ctx.city.trim() : null,
      latitude,
      longitude,
      mappable,
      deviceType: ctx?.deviceType || null,
      os: ctx?.os || null,
      browser: ctx?.browser || null,
      platform: ord.platform || null,
      service: ord.service || null,
      planId: effectivePlanId,
      amountCents: Number(ord.totalCents) || 0,
      approvedAt: approvedTimestamp,
    };
  });

  // Sort recent purchases newest first
  recentPurchases.sort((a, b) => new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime());

  return aggregateLiveWorldData({
    visitors: activeVisitors,
    recentPurchases,
    now,
  });
}
