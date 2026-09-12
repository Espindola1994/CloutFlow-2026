import { db } from '@/db';
import { orders, checkoutContexts } from '@/db/schema';
import { and, gte, lte, inArray, eq, sql } from 'drizzle-orm';
import { getNonCleanupOrderSqlCondition } from '@/services/admin-order-cleanup.helper';
import { normalizeGeoCoordinate } from '@/services/admin-live-world.service';
import {
  PLATFORM_SERVICES,
  VALID_PLATFORMS,
  CommercialPlatform,
  CommercialService,
} from '@/services/commercial-offer.resolver';
import {
  LiveWorldHistoryRange,
  LiveWorldHistoryFilters,
  LiveWorldHistoryResponseData,
  LiveWorldHistorySummary,
  LiveWorldHistoryTopCountry,
  LiveWorldHistoryTopCity,
  LiveWorldHistoryPlatformItem,
  LiveWorldHistoryServiceItem,
  LiveWorldHistoryPlanItem,
  LiveWorldHistoryTimeSeriesPoint,
} from '@/types/admin-live-world-history';

export const ALLOWED_RANGES: readonly LiveWorldHistoryRange[] = ['24h', '7d', '30d', '90d', 'today'] as const;

/**
 * Validates range query parameter.
 * Returns valid LiveWorldHistoryRange or throws an Error.
 */
export function validateHistoryRange(rawRange: string | null | undefined): LiveWorldHistoryRange {
  if (!rawRange) return '30d';
  const trimmed = rawRange.trim().toLowerCase();
  if (ALLOWED_RANGES.includes(trimmed as LiveWorldHistoryRange)) {
    return trimmed as LiveWorldHistoryRange;
  }
  throw new Error(`Invalid range: ${rawRange}. Allowed ranges: ${ALLOWED_RANGES.join(', ')}`);
}

/**
 * Validates platform query parameter.
 * Must be one of canonical platforms: instagram, tiktok, twitter, youtube.
 */
export function validateHistoryPlatform(rawPlatform: string | null | undefined): string | null {
  if (!rawPlatform) return null;
  const p = rawPlatform.toLowerCase().trim();
  if (VALID_PLATFORMS.includes(p as CommercialPlatform)) {
    return p;
  }
  throw new Error(`Invalid platform: ${rawPlatform}. Allowed platforms: ${VALID_PLATFORMS.join(', ')}`);
}

/**
 * Validates service query parameter and ensures compatibility with platform if platform is present.
 */
export function validateHistoryService(
  rawService: string | null | undefined,
  platform: string | null
): string | null {
  if (!rawService) return null;
  const s = rawService.toLowerCase().trim();
  const canonicalServices = ['followers', 'likes', 'views'];

  if (!canonicalServices.includes(s)) {
    throw new Error(`Invalid service: ${rawService}. Allowed services: ${canonicalServices.join(', ')}`);
  }

  if (platform) {
    const allowed = PLATFORM_SERVICES[platform as CommercialPlatform] || [];
    if (!allowed.includes(s as CommercialService)) {
      throw new Error(`Incompatible service '${s}' for platform '${platform}'. Allowed: ${allowed.join(', ')}`);
    }
  }

  return s;
}

/**
 * Validates country query parameter: must be ISO uppercase 2-letter alpha code (e.g. US, CA, BR).
 */
export function validateHistoryCountry(rawCountry: string | null | undefined): string | null {
  if (!rawCountry) return null;
  const c = rawCountry.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(c)) {
    throw new Error(`Invalid country code: ${rawCountry}. Must be standard 2-letter ISO alpha-2 country code (e.g. US, BR).`);
  }
  return c;
}

/**
 * Resolves deterministic UTC date bounds for each allowed range.
 */
export function resolveHistoryDateBounds(range: LiveWorldHistoryRange, referenceNow?: Date): {
  startDate: Date;
  endDate: Date;
  bucketType: 'hour' | 'day';
} {
  const now = referenceNow ? new Date(referenceNow) : new Date();
  const endDate = new Date(now);
  const startDate = new Date(now);

  switch (range) {
    case '24h':
      startDate.setTime(endDate.getTime() - 24 * 60 * 60 * 1000);
      return { startDate, endDate, bucketType: 'hour' };
    case 'today': {
      const utcToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
      return { startDate: utcToday, endDate, bucketType: 'hour' };
    }
    case '7d':
      startDate.setTime(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { startDate, endDate, bucketType: 'day' };
    case '30d':
      startDate.setTime(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { startDate, endDate, bucketType: 'day' };
    case '90d':
      startDate.setTime(endDate.getTime() - 90 * 24 * 60 * 60 * 1000);
      return { startDate, endDate, bucketType: 'day' };
    default:
      startDate.setTime(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { startDate, endDate, bucketType: 'day' };
  }
}

/**
 * Helper to compute Average Order Value in cents with integer rounding.
 */
export function computeAovCents(revenueCents: number, purchasesCount: number): number {
  if (purchasesCount <= 0) return 0;
  return Math.round(revenueCents / purchasesCount);
}

/**
 * Aggregates raw history orders and resolved context geography in memory.
 * Pure function, easily testable in isolation.
 */
export function aggregateHistoryData(params: {
  orders: Array<{
    id: string;
    totalCents: number;
    platform: string | null;
    service: string | null;
    planId: string | null;
    canonicalOfferId: string | null;
    src: string | null;
    effectiveDate: Date;
  }>;
  contextsMap: Map<
    string,
    {
      countryCode: string | null;
      region: string | null;
      city: string | null;
      latitude: string | number | null;
      longitude: string | number | null;
    }
  >;
  range: LiveWorldHistoryRange;
  filters: LiveWorldHistoryFilters;
  startDate: Date;
  endDate: Date;
  bucketType: 'hour' | 'day';
  referenceNow?: Date;
}): LiveWorldHistoryResponseData {
  const {
    orders: orderList,
    contextsMap,
    range,
    filters,
    startDate,
    endDate,
    bucketType,
    referenceNow = new Date(),
  } = params;

  let totalPurchases = 0;
  let revenueCents = 0;
  let mappedPurchases = 0;
  let unknownGeoPurchases = 0;

  // Aggregation maps
  const countryMap = new Map<string, { purchaseCount: number; revenueCents: number }>();
  const cityMap = new Map<
    string,
    {
      city: string;
      region: string | null;
      countryCode: string | null;
      latitude: number | null;
      longitude: number | null;
      purchaseCount: number;
      revenueCents: number;
    }
  >();
  const platformMap = new Map<string, { purchaseCount: number; revenueCents: number }>();
  const serviceMap = new Map<string, { platform: string; service: string; purchaseCount: number; revenueCents: number }>();
  const planMap = new Map<string, { planId: string | null; platform: string; service: string; purchaseCount: number; revenueCents: number }>();

  // Time series map: pre-fill buckets for smooth continuous time-series
  const timeBucketsMap = new Map<string, { timestamp: string; purchaseCount: number; revenueCents: number; mappedPurchases: number }>();

  if (bucketType === 'hour') {
    // Generate buckets hour by hour from startDate aligned to hour
    const startHour = new Date(startDate);
    startHour.setUTCMinutes(0, 0, 0);
    const endHour = new Date(endDate);
    for (let d = new Date(startHour); d <= endHour; d.setUTCHours(d.getUTCHours() + 1)) {
      const iso = d.toISOString();
      timeBucketsMap.set(iso, { timestamp: iso, purchaseCount: 0, revenueCents: 0, mappedPurchases: 0 });
    }
  } else {
    // Generate buckets day by day from startDate aligned to UTC midnight
    const startDay = new Date(startDate);
    startDay.setUTCHours(0, 0, 0, 0);
    const endDay = new Date(endDate);
    for (let d = new Date(startDay); d <= endDay; d.setUTCDate(d.getUTCDate() + 1)) {
      const iso = d.toISOString();
      timeBucketsMap.set(iso, { timestamp: iso, purchaseCount: 0, revenueCents: 0, mappedPurchases: 0 });
    }
  }

  // Iterate over orders
  for (const ord of orderList) {
    const ctx = ord.src && ord.src.startsWith('CFCTX_') ? contextsMap.get(ord.src) : null;
    const countryCode = ctx?.countryCode ? ctx.countryCode.trim().toUpperCase() : null;

    // Apply country filter if specified
    if (filters.country && countryCode !== filters.country) {
      continue;
    }

    const orderRev = Number(ord.totalCents) || 0;
    totalPurchases += 1;
    revenueCents += orderRev;

    const lat = normalizeGeoCoordinate(ctx?.latitude, 'lat');
    const lng = normalizeGeoCoordinate(ctx?.longitude, 'lng');
    const isMappable = lat !== null && lng !== null;

    if (isMappable) {
      mappedPurchases += 1;
    } else {
      unknownGeoPurchases += 1;
    }

    // Country Aggregation
    if (countryCode) {
      const currCountry = countryMap.get(countryCode) || { purchaseCount: 0, revenueCents: 0 };
      currCountry.purchaseCount += 1;
      currCountry.revenueCents += orderRev;
      countryMap.set(countryCode, currCountry);
    }

    // City Aggregation (Preserve Unicode, lat/lng <= 2 decimals)
    if (ctx?.city && ctx.city.trim()) {
      const rawCity = ctx.city.trim();
      const rawRegion = ctx.region ? ctx.region.trim() : null;
      const cityKey = `${countryCode || 'UNKNOWN'}::${rawRegion || 'UNKNOWN'}::${rawCity}`;
      const currCity = cityMap.get(cityKey) || {
        city: rawCity,
        region: rawRegion,
        countryCode: countryCode,
        latitude: lat,
        longitude: lng,
        purchaseCount: 0,
        revenueCents: 0,
      };
      currCity.purchaseCount += 1;
      currCity.revenueCents += orderRev;
      if (currCity.latitude === null && lat !== null) {
        currCity.latitude = lat;
        currCity.longitude = lng;
      }
      cityMap.set(cityKey, currCity);
    }

    // Platform Aggregation
    const plat = (ord.platform || 'unknown').toLowerCase();
    const currPlat = platformMap.get(plat) || { purchaseCount: 0, revenueCents: 0 };
    currPlat.purchaseCount += 1;
    currPlat.revenueCents += orderRev;
    platformMap.set(plat, currPlat);

    // Service Aggregation
    const serv = (ord.service || 'unknown').toLowerCase();
    const serviceKey = `${plat}::${serv}`;
    const currServ = serviceMap.get(serviceKey) || {
      platform: plat,
      service: serv,
      purchaseCount: 0,
      revenueCents: 0,
    };
    currServ.purchaseCount += 1;
    currServ.revenueCents += orderRev;
    serviceMap.set(serviceKey, currServ);

    // Plan Aggregation
    const effectivePlanId = ord.canonicalOfferId || ord.planId || null;
    const planKey = `${plat}::${serv}::${effectivePlanId || 'NONE'}`;
    const currPlan = planMap.get(planKey) || {
      planId: effectivePlanId,
      platform: plat,
      service: serv,
      purchaseCount: 0,
      revenueCents: 0,
    };
    currPlan.purchaseCount += 1;
    currPlan.revenueCents += orderRev;
    planMap.set(planKey, currPlan);

    // Time Series Bucket
    const od = new Date(ord.effectiveDate);
    let bucketIso: string;
    if (bucketType === 'hour') {
      const bucketDate = new Date(Date.UTC(od.getUTCFullYear(), od.getUTCMonth(), od.getUTCDate(), od.getUTCHours(), 0, 0, 0));
      bucketIso = bucketDate.toISOString();
    } else {
      const bucketDate = new Date(Date.UTC(od.getUTCFullYear(), od.getUTCMonth(), od.getUTCDate(), 0, 0, 0, 0));
      bucketIso = bucketDate.toISOString();
    }

    let b = timeBucketsMap.get(bucketIso);
    if (!b) {
      b = { timestamp: bucketIso, purchaseCount: 0, revenueCents: 0, mappedPurchases: 0 };
      timeBucketsMap.set(bucketIso, b);
    }
    b.purchaseCount += 1;
    b.revenueCents += orderRev;
    if (isMappable) {
      b.mappedPurchases += 1;
    }
  }

  // Summary
  const summary: LiveWorldHistorySummary = {
    totalPurchases,
    revenueCents,
    averageOrderValueCents: computeAovCents(revenueCents, totalPurchases),
    mappedPurchases,
    unknownGeoPurchases,
  };

  // Top Countries (Top <= 20)
  const topCountries: LiveWorldHistoryTopCountry[] = Array.from(countryMap.entries())
    .map(([cc, data]) => ({
      countryCode: cc,
      purchaseCount: data.purchaseCount,
      revenueCents: data.revenueCents,
      averageOrderValueCents: computeAovCents(data.revenueCents, data.purchaseCount),
    }))
    .sort((a, b) => b.purchaseCount - a.purchaseCount || b.revenueCents - a.revenueCents)
    .slice(0, 20);

  // Top Cities (Top <= 20)
  const topCities: LiveWorldHistoryTopCity[] = Array.from(cityMap.values())
    .map((c) => ({
      countryCode: c.countryCode,
      region: c.region,
      city: c.city,
      purchaseCount: c.purchaseCount,
      revenueCents: c.revenueCents,
      averageOrderValueCents: computeAovCents(c.revenueCents, c.purchaseCount),
      latitude: c.latitude,
      longitude: c.longitude,
    }))
    .sort((a, b) => b.purchaseCount - a.purchaseCount || b.revenueCents - a.revenueCents)
    .slice(0, 20);

  // Platforms
  const platforms: LiveWorldHistoryPlatformItem[] = Array.from(platformMap.entries())
    .map(([p, data]) => ({
      platform: p,
      purchaseCount: data.purchaseCount,
      revenueCents: data.revenueCents,
      averageOrderValueCents: computeAovCents(data.revenueCents, data.purchaseCount),
    }))
    .sort((a, b) => b.purchaseCount - a.purchaseCount || b.revenueCents - a.revenueCents);

  // Services
  const services: LiveWorldHistoryServiceItem[] = Array.from(serviceMap.values())
    .map((s) => ({
      platform: s.platform,
      service: s.service,
      purchaseCount: s.purchaseCount,
      revenueCents: s.revenueCents,
      averageOrderValueCents: computeAovCents(s.revenueCents, s.purchaseCount),
    }))
    .sort((a, b) => b.purchaseCount - a.purchaseCount || b.revenueCents - a.revenueCents);

  // Plans
  const plans: LiveWorldHistoryPlanItem[] = Array.from(planMap.values())
    .map((p) => ({
      planId: p.planId,
      platform: p.platform,
      service: p.service,
      purchaseCount: p.purchaseCount,
      revenueCents: p.revenueCents,
      averageOrderValueCents: computeAovCents(p.revenueCents, p.purchaseCount),
    }))
    .sort((a, b) => b.purchaseCount - a.purchaseCount || b.revenueCents - a.revenueCents);

  // Time Series (sorted chronologically)
  const series: LiveWorldHistoryTimeSeriesPoint[] = Array.from(timeBucketsMap.values())
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  return {
    generatedAt: referenceNow.toISOString(),
    range,
    filters,
    summary,
    topCountries,
    topCities,
    platforms,
    services,
    plans,
    series,
  };
}

/**
 * Primary read-only service for Live World History analytics.
 * Zero N+1: executes 1 query for filtered orders and 1 batch query for checkout_contexts if any CFCTX present.
 */
export async function getAdminLiveWorldHistoryData(params: {
  rangeInput?: string | null;
  platformInput?: string | null;
  serviceInput?: string | null;
  countryInput?: string | null;
  referenceNow?: Date;
}): Promise<LiveWorldHistoryResponseData> {
  const range = validateHistoryRange(params.rangeInput);
  const platform = validateHistoryPlatform(params.platformInput);
  const service = validateHistoryService(params.serviceInput, platform);
  const country = validateHistoryCountry(params.countryInput);

  const referenceNow = params.referenceNow || new Date();
  const { startDate, endDate, bucketType } = resolveHistoryDateBounds(range, referenceNow);

  // Build filter conditions
  const nonCleanupCondition = getNonCleanupOrderSqlCondition();
  const whereConditions = [
    sql`(${orders.paidAt} >= ${startDate} AND ${orders.paidAt} <= ${endDate} OR (${orders.paidAt} IS NULL AND ${orders.createdAt} >= ${startDate} AND ${orders.createdAt} <= ${endDate}))`,
    sql`UPPER(${orders.paymentStatus}) IN ('PAID', 'COMPLETED', 'APPROVED')`,
    nonCleanupCondition,
  ];

  if (platform) {
    whereConditions.push(eq(orders.platform, platform));
  }
  if (service) {
    whereConditions.push(eq(orders.service, service));
  }

  // 1. Fetch filtered paid/approved orders
  const ordersList = await db
    .select({
      id: orders.id,
      totalCents: orders.totalCents,
      platform: orders.platform,
      service: orders.service,
      planId: orders.planId,
      canonicalOfferId: orders.canonicalOfferId,
      src: orders.src,
      paidAt: orders.paidAt,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(and(...whereConditions));

  // 2. Batch resolve checkout_contexts for all orders with CFCTX_ src (NO N+1)
  const cfctxIds: string[] = [];
  for (const ord of ordersList) {
    if (ord.src && ord.src.startsWith('CFCTX_') && !cfctxIds.includes(ord.src)) {
      cfctxIds.push(ord.src);
    }
  }

  const contextsMap = new Map<
    string,
    {
      countryCode: string | null;
      region: string | null;
      city: string | null;
      latitude: string | number | null;
      longitude: string | number | null;
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
      })
      .from(checkoutContexts)
      .where(inArray(checkoutContexts.contextId, cfctxIds));

    for (const ctx of contexts) {
      contextsMap.set(ctx.contextId, ctx);
    }
  }

  // Transform raw orders with effectiveDate
  const transformedOrders = ordersList.map((ord) => ({
    id: ord.id,
    totalCents: Number(ord.totalCents) || 0,
    platform: ord.platform,
    service: ord.service,
    planId: ord.planId,
    canonicalOfferId: ord.canonicalOfferId,
    src: ord.src,
    effectiveDate: ord.paidAt || ord.createdAt || referenceNow,
  }));

  return aggregateHistoryData({
    orders: transformedOrders,
    contextsMap,
    range,
    filters: {
      platform,
      service,
      country,
    },
    startDate,
    endDate,
    bucketType,
    referenceNow,
  });
}
