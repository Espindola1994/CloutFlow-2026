import { db } from '@/db';
import { orders, lifecycleEvents, paymentLeads, plans } from '@/db/schema';
import { sql, and, gte, lte, eq, or } from 'drizzle-orm';
import { CLOUTFLOW_CATALOG_PACKAGES } from '@/config/financial-protection.config';
import {
  AnalyticsDateRange,
  AnalyticsResponseData,
  AnalyticsKpiSummary,
  AnalyticsFunnel,
  AnalyticsTimeSeriesPoint,
  AnalyticsNetworkPerformance,
  AnalyticsServicePerformance,
  AnalyticsTopPlan,
  AnalyticsRankingSummary,
  AnalyticsAbandonmentMetrics,
  AnalyticsAttributionSummary,
} from '@/types/admin-analytics';

export function resolveDateRangeBounds(range: AnalyticsDateRange): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();

  switch (range) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      break;
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      startDate.setHours(0, 0, 0, 0);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      startDate.setHours(0, 0, 0, 0);
      break;
    default:
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
  }

  return { startDate, endDate };
}

/**
 * Resolves a human-readable plan name given planId, canonicalOfferId, platform, service, and quantity.
 * Cross-references CLOUTFLOW_CATALOG_PACKAGES and database plans table.
 */
export function resolveCanonicalPlanName(
  platform: string | null | undefined,
  service: string | null | undefined,
  quantity: number | null | undefined,
  canonicalOfferId?: string | null,
  dbPlanName?: string | null
): string {
  if (dbPlanName && dbPlanName.trim()) {
    return dbPlanName.trim();
  }

  // If canonicalOfferId exists: canonical-{platform}-{service}-{plan}
  if (canonicalOfferId && canonicalOfferId.startsWith('canonical-')) {
    const parts = canonicalOfferId.split('-');
    if (parts.length >= 4) {
      const planTier = parts[parts.length - 1];
      const capitalized = planTier.charAt(0).toUpperCase() + planTier.slice(1);
      return capitalized;
    }
  }

  // Look up in CLOUTFLOW_CATALOG_PACKAGES by platform, service, and quantity
  if (platform && service && quantity) {
    const matched = CLOUTFLOW_CATALOG_PACKAGES.find(
      (pkg) =>
        pkg.platform.toLowerCase() === platform.toLowerCase() &&
        pkg.service.toLowerCase() === service.toLowerCase() &&
        pkg.quantity === quantity
    );
    if (matched) {
      return matched.name;
    }
  }

  return quantity ? `${quantity.toLocaleString('en-US')} units` : 'Custom Package';
}

/**
 * Pure calculation logic for Analytics, highly testable in isolation.
 */
export function computeAnalyticsMetrics(params: {
  range: AnalyticsDateRange;
  startDate: Date;
  endDate: Date;
  checkoutsStartedJourneys: number;
  checkoutsAbandonedJourneys: number;
  ordersRows: Array<{
    id: string;
    totalCents: number;
    paymentStatus: string | null;
    platform: string | null;
    service: string | null;
    planId: string | null;
    canonicalOfferId: string | null;
    quantity: number;
    createdAt: Date;
    utmSource: string | null;
    utmCampaign: string | null;
  }>;
  dailyLifecycleEvents: Array<{
    day: string; // YYYY-MM-DD
    started: number;
    abandoned: number;
  }>;
  dailyPaidOrders: Array<{
    day: string; // YYYY-MM-DD
    paid: number;
  }>;
  abandonedCartEstimateCents: number;
  recoveredOrdersCount: number;
  recoveredRevenueCents: number;
  dbPlansMap?: Map<string, string>; // planId -> planName
}): AnalyticsResponseData {
  const {
    range,
    startDate,
    endDate,
    checkoutsStartedJourneys,
    checkoutsAbandonedJourneys,
    ordersRows,
    dailyLifecycleEvents,
    dailyPaidOrders,
    abandonedCartEstimateCents,
    recoveredOrdersCount,
    recoveredRevenueCents,
    dbPlansMap,
  } = params;

  // 1. Filter Paid Orders according to canonical status
  const paidOrdersList = ordersRows.filter((o) => {
    const st = (o.paymentStatus || '').toUpperCase();
    return st === 'PAID' || st === 'COMPLETED' || st === 'APPROVED';
  });

  const paidOrdersCount = paidOrdersList.length;
  const totalRevenueCents = paidOrdersList.reduce((acc, o) => acc + (Number(o.totalCents) || 0), 0);
  const revenueDollars = Math.round(totalRevenueCents) / 100;
  const aovDollars = paidOrdersCount > 0 ? Math.round((revenueDollars / paidOrdersCount) * 100) / 100 : 0;

  // Checkout conversion rate:
  // If checkoutsStartedJourneys > 0: (paidOrdersCount / checkoutsStartedJourneys) * 100
  // Capped at 100% in case historical orders arrived via alternative/direct flows
  const conversionRate =
    checkoutsStartedJourneys > 0
      ? Math.min(100, Math.round((paidOrdersCount / checkoutsStartedJourneys) * 1000) / 10)
      : 0;

  const abandonmentRate =
    checkoutsStartedJourneys > 0
      ? Math.min(100, Math.round((checkoutsAbandonedJourneys / checkoutsStartedJourneys) * 1000) / 10)
      : 0;

  const kpis: AnalyticsKpiSummary = {
    checkoutsStarted: checkoutsStartedJourneys,
    checkoutsAbandoned: checkoutsAbandonedJourneys,
    paidOrders: paidOrdersCount,
    checkoutConversionRate: conversionRate,
    abandonmentRate: abandonmentRate,
    revenue: revenueDollars,
    averageOrderValue: aovDollars,
  };

  const funnel: AnalyticsFunnel = {
    started: checkoutsStartedJourneys,
    converted: {
      count: paidOrdersCount,
      rate: conversionRate,
    },
    abandoned: {
      count: checkoutsAbandonedJourneys,
      rate: abandonmentRate,
    },
  };

  // 2. Time-Series Construction: Group by day
  const daysMap = new Map<string, { started: number; paid: number; abandoned: number }>();

  // Prepopulate days in range so chart is continuous
  const cur = new Date(startDate);
  const maxDay = new Date(endDate);
  while (cur <= maxDay) {
    const dayStr = cur.toISOString().slice(0, 10);
    daysMap.set(dayStr, { started: 0, paid: 0, abandoned: 0 });
    cur.setDate(cur.getDate() + 1);
  }

  for (const item of dailyLifecycleEvents) {
    const existing = daysMap.get(item.day) || { started: 0, paid: 0, abandoned: 0 };
    existing.started += Number(item.started) || 0;
    existing.abandoned += Number(item.abandoned) || 0;
    daysMap.set(item.day, existing);
  }

  for (const item of dailyPaidOrders) {
    const existing = daysMap.get(item.day) || { started: 0, paid: 0, abandoned: 0 };
    existing.paid += Number(item.paid) || 0;
    daysMap.set(item.day, existing);
  }

  const performanceOverTime: AnalyticsTimeSeriesPoint[] = Array.from(daysMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({
      date,
      started: data.started,
      paid: data.paid,
      abandoned: data.abandoned,
    }));

  // 3. Network Performance
  const canonicalPlatforms = ['instagram', 'tiktok', 'twitter', 'youtube'] as const;
  const platformDisplayNameMap: Record<string, string> = {
    instagram: 'Instagram',
    tiktok: 'TikTok',
    twitter: 'X / Twitter',
    youtube: 'YouTube',
  };

  const networkStatsMap = new Map<
    string,
    { paidOrders: number; revenueCents: number; quantitySold: number }
  >();

  for (const plat of canonicalPlatforms) {
    networkStatsMap.set(plat, { paidOrders: 0, revenueCents: 0, quantitySold: 0 });
  }

  for (const order of paidOrdersList) {
    const plat = (order.platform || 'instagram').toLowerCase();
    const current = networkStatsMap.get(plat) || { paidOrders: 0, revenueCents: 0, quantitySold: 0 };
    current.paidOrders += 1;
    current.revenueCents += Number(order.totalCents) || 0;
    current.quantitySold += Number(order.quantity) || 0;
    networkStatsMap.set(plat, current);
  }

  const networkPerformance: AnalyticsNetworkPerformance[] = canonicalPlatforms.map((plat) => {
    const data = networkStatsMap.get(plat) || { paidOrders: 0, revenueCents: 0, quantitySold: 0 };
    const revDollars = Math.round(data.revenueCents) / 100;
    const share = revenueDollars > 0 ? Math.round((revDollars / revenueDollars) * 1000) / 10 : 0;
    const aov = data.paidOrders > 0 ? Math.round((revDollars / data.paidOrders) * 100) / 100 : 0;

    return {
      network: platformDisplayNameMap[plat] || plat,
      platformKey: plat,
      paidOrders: data.paidOrders,
      revenue: revDollars,
      revenueShare: share,
      aov,
      quantitySold: data.quantitySold,
    };
  });

  // 4. Service Performance
  const serviceDisplayNameMap: Record<string, string> = {
    followers: 'Followers',
    likes: 'Likes',
    views: 'Views',
  };
  const canonicalServices = ['followers', 'likes', 'views'] as const;

  const serviceStatsMap = new Map<
    string,
    { paidOrders: number; revenueCents: number; quantitySold: number }
  >();

  for (const serv of canonicalServices) {
    serviceStatsMap.set(serv, { paidOrders: 0, revenueCents: 0, quantitySold: 0 });
  }

  for (const order of paidOrdersList) {
    const serv = (order.service || 'followers').toLowerCase();
    const current = serviceStatsMap.get(serv) || { paidOrders: 0, revenueCents: 0, quantitySold: 0 };
    current.paidOrders += 1;
    current.revenueCents += Number(order.totalCents) || 0;
    current.quantitySold += Number(order.quantity) || 0;
    serviceStatsMap.set(serv, current);
  }

  const servicePerformance: AnalyticsServicePerformance[] = canonicalServices.map((serv) => {
    const data = serviceStatsMap.get(serv) || { paidOrders: 0, revenueCents: 0, quantitySold: 0 };
    const revDollars = Math.round(data.revenueCents) / 100;
    const share = revenueDollars > 0 ? Math.round((revDollars / revenueDollars) * 1000) / 10 : 0;
    const aov = data.paidOrders > 0 ? Math.round((revDollars / data.paidOrders) * 100) / 100 : 0;

    return {
      service: serviceDisplayNameMap[serv] || serv,
      serviceKey: serv,
      paidOrders: data.paidOrders,
      revenue: revDollars,
      revenueShare: share,
      aov,
      quantitySold: data.quantitySold,
    };
  });

  // 5. Top Plans
  // Group by (platform, service, quantity, canonicalOfferId, planId)
  const plansAggMap = new Map<
    string,
    {
      planId: string;
      planName: string;
      network: string;
      service: string;
      quantity: number;
      paidOrders: number;
      revenueCents: number;
    }
  >();

  for (const order of paidOrdersList) {
    const plat = (order.platform || 'instagram').toLowerCase();
    const serv = (order.service || 'followers').toLowerCase();
    const qty = Number(order.quantity) || 0;
    const dbPlanName = order.planId && dbPlansMap ? dbPlansMap.get(order.planId) : null;
    const resolvedName = resolveCanonicalPlanName(plat, serv, qty, order.canonicalOfferId, dbPlanName);

    const aggKey = `${plat}:${serv}:${qty}:${resolvedName}`;
    const existing = plansAggMap.get(aggKey) || {
      planId: order.planId || order.canonicalOfferId || aggKey,
      planName: resolvedName,
      network: platformDisplayNameMap[plat] || plat,
      service: serviceDisplayNameMap[serv] || serv,
      quantity: qty,
      paidOrders: 0,
      revenueCents: 0,
    };

    existing.paidOrders += 1;
    existing.revenueCents += Number(order.totalCents) || 0;
    plansAggMap.set(aggKey, existing);
  }

  const topPlans: AnalyticsTopPlan[] = Array.from(plansAggMap.values())
    .map((item) => {
      const planRevDollars = Math.round(item.revenueCents) / 100;
      const share = revenueDollars > 0 ? Math.round((planRevDollars / revenueDollars) * 1000) / 10 : 0;
      const aov = item.paidOrders > 0 ? Math.round((planRevDollars / item.paidOrders) * 100) / 100 : 0;
      return {
        planId: item.planId,
        planName: item.planName,
        network: item.network,
        service: item.service,
        quantity: item.quantity,
        paidOrders: item.paidOrders,
        revenue: planRevDollars,
        revenueShare: share,
        aov,
      };
    })
    .sort((a, b) => b.revenue - a.revenue || b.paidOrders - a.paidOrders);

  // 6. Rankings Summary
  const bestSellingPlan = topPlans.length > 0 ? {
    name: topPlans[0].planName,
    network: topPlans[0].network,
    service: topPlans[0].service,
    revenue: topPlans[0].revenue,
    paidOrders: topPlans[0].paidOrders,
  } : null;

  const sortedNetworks = [...networkPerformance].sort((a, b) => b.revenue - a.revenue);
  const topNetwork = sortedNetworks.length > 0 && sortedNetworks[0].revenue > 0 ? {
    network: sortedNetworks[0].network,
    revenue: sortedNetworks[0].revenue,
    share: sortedNetworks[0].revenueShare,
  } : null;

  const sortedServices = [...servicePerformance].sort((a, b) => b.revenue - a.revenue);
  const topService = sortedServices.length > 0 && sortedServices[0].revenue > 0 ? {
    service: sortedServices[0].service,
    revenue: sortedServices[0].revenue,
    share: sortedServices[0].revenueShare,
  } : null;

  const rankings: AnalyticsRankingSummary = {
    bestSellingPlan,
    topNetwork,
    topService,
  };

  // 7. Abandonment Analytics
  const abandonment: AnalyticsAbandonmentMetrics = {
    started: checkoutsStartedJourneys,
    abandoned: checkoutsAbandonedJourneys,
    paid: paidOrdersCount,
    abandonmentRate,
    conversionRate,
    abandonedCartValueEstimated: Math.round(abandonedCartEstimateCents) / 100,
    recoveredOrders: recoveredOrdersCount,
    recoveredRevenue: Math.round(recoveredRevenueCents) / 100,
  };

  // 8. Compact Attribution
  const sourceCountMap = new Map<string, number>();
  const campaignCountMap = new Map<string, number>();
  let attributedPaidCount = 0;
  let attributedRevCents = 0;

  for (const order of paidOrdersList) {
    if (order.utmSource || order.utmCampaign) {
      attributedPaidCount += 1;
      attributedRevCents += Number(order.totalCents) || 0;
    }
    const src = order.utmSource || 'Direct / Organic';
    sourceCountMap.set(src, (sourceCountMap.get(src) || 0) + 1);

    if (order.utmCampaign) {
      campaignCountMap.set(order.utmCampaign, (campaignCountMap.get(order.utmCampaign) || 0) + 1);
    }
  }

  let topSource = 'Direct / Organic';
  let maxSrcCount = 0;
  for (const [src, count] of sourceCountMap.entries()) {
    if (count > maxSrcCount) {
      maxSrcCount = count;
      topSource = src;
    }
  }

  let topCampaign = 'None';
  let maxCampCount = 0;
  for (const [camp, count] of campaignCountMap.entries()) {
    if (count > maxCampCount) {
      maxCampCount = count;
      topCampaign = camp;
    }
  }

  const attributionCompact: AnalyticsAttributionSummary = {
    topSource,
    topCampaign,
    attributedPaidOrders: attributedPaidCount,
    attributedRevenue: Math.round(attributedRevCents) / 100,
  };

  return {
    range,
    rangeStart: startDate.toISOString(),
    rangeEnd: endDate.toISOString(),
    kpis,
    funnel,
    performanceOverTime,
    networkPerformance,
    servicePerformance,
    topPlans,
    rankings,
    abandonment,
    attributionCompact,
  };
}

/**
 * Read-Only Database Queries for Analytics.
 * Strict READ-ONLY: Never writes or triggers any side effects.
 */
export async function getAdminAnalyticsData(rangeInput?: string | null): Promise<AnalyticsResponseData> {
  const range: AnalyticsDateRange =
    rangeInput === 'today' || rangeInput === '30d' || rangeInput === '90d' ? rangeInput : '7d';

  const { startDate, endDate } = resolveDateRangeBounds(range);

  // 1. Fetch unique initiated journeys (CHECKOUT_STARTED)
  // Extract contextId or fallback to idempotencyKey or event ID
  const startedJourneysResult = await db
    .select({
      count: sql<number>`COUNT(DISTINCT COALESCE(
        ${lifecycleEvents.payload}->>'contextId',
        ${lifecycleEvents.payload}->>'checkoutContextId',
        ${lifecycleEvents.payload}->>'journeyId',
        ${lifecycleEvents.idempotencyKey}
      ))`,
    })
    .from(lifecycleEvents)
    .where(
      and(
        eq(lifecycleEvents.eventType, 'CHECKOUT_STARTED'),
        gte(lifecycleEvents.createdAt, startDate),
        lte(lifecycleEvents.createdAt, endDate)
      )
    );

  const checkoutsStartedJourneys = Number(startedJourneysResult[0]?.count || 0);

  // 2. Fetch unique abandoned journeys (CHECKOUT_ABANDONED)
  const abandonedJourneysResult = await db
    .select({
      count: sql<number>`COUNT(DISTINCT COALESCE(
        ${lifecycleEvents.payload}->>'journeyId',
        ${lifecycleEvents.payload}->>'contextId',
        ${lifecycleEvents.idempotencyKey}
      ))`,
    })
    .from(lifecycleEvents)
    .where(
      and(
        eq(lifecycleEvents.eventType, 'CHECKOUT_ABANDONED'),
        gte(lifecycleEvents.createdAt, startDate),
        lte(lifecycleEvents.createdAt, endDate)
      )
    );

  const checkoutsAbandonedJourneys = Number(abandonedJourneysResult[0]?.count || 0);

  // 3. Fetch orders within the date range
  const ordersRows = await db
    .select({
      id: orders.id,
      totalCents: orders.totalCents,
      paymentStatus: orders.paymentStatus,
      platform: orders.platform,
      service: orders.service,
      planId: orders.planId,
      canonicalOfferId: orders.canonicalOfferId,
      quantity: orders.quantity,
      createdAt: orders.createdAt,
      utmSource: orders.utmSource,
      utmCampaign: orders.utmCampaign,
    })
    .from(orders)
    .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)));

  // 4. Daily time series for lifecycle events
  const dailyLifecycleResult = await db
    .select({
      day: sql<string>`TO_CHAR(${lifecycleEvents.createdAt}, 'YYYY-MM-DD')`,
      started: sql<number>`COALESCE(COUNT(DISTINCT CASE WHEN ${lifecycleEvents.eventType} = 'CHECKOUT_STARTED' THEN COALESCE(${lifecycleEvents.payload}->>'contextId', ${lifecycleEvents.idempotencyKey}) END), 0)`,
      abandoned: sql<number>`COALESCE(COUNT(DISTINCT CASE WHEN ${lifecycleEvents.eventType} = 'CHECKOUT_ABANDONED' THEN COALESCE(${lifecycleEvents.payload}->>'journeyId', ${lifecycleEvents.idempotencyKey}) END), 0)`,
    })
    .from(lifecycleEvents)
    .where(
      and(
        or(
          eq(lifecycleEvents.eventType, 'CHECKOUT_STARTED'),
          eq(lifecycleEvents.eventType, 'CHECKOUT_ABANDONED')
        ),
        gte(lifecycleEvents.createdAt, startDate),
        lte(lifecycleEvents.createdAt, endDate)
      )
    )
    .groupBy(sql`TO_CHAR(${lifecycleEvents.createdAt}, 'YYYY-MM-DD')`);

  const dailyLifecycleEvents = dailyLifecycleResult.map((r) => ({
    day: r.day,
    started: Number(r.started) || 0,
    abandoned: Number(r.abandoned) || 0,
  }));

  // 5. Daily paid orders
  const dailyPaidResult = await db
    .select({
      day: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`,
      paid: sql<number>`COALESCE(COUNT(DISTINCT CASE WHEN ${orders.paymentStatus} IN ('PAID', 'COMPLETED', 'APPROVED') THEN ${orders.id} END), 0)`,
    })
    .from(orders)
    .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)))
    .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`);

  const dailyPaidOrders = dailyPaidResult.map((r) => ({
    day: r.day,
    paid: Number(r.paid) || 0,
  }));

  // 6. Abandoned cart value estimate & recovery correlation
  // In payment_leads: converted_order_id is set when a lead converts into an order
  const leadRecoveryResult = await db
    .select({
      abandonedValueCents: sql<number>`COALESCE(SUM(CASE WHEN ${paymentLeads.inferredStatus} = 'possible_abandonment' OR ${paymentLeads.normalizedStatus} = 'possible_abandonment' THEN ${paymentLeads.amountCents} ELSE 0 END), 0)`,
      recoveredCount: sql<number>`COALESCE(COUNT(DISTINCT CASE WHEN ${paymentLeads.convertedOrderId} IS NOT NULL THEN ${paymentLeads.id} END), 0)`,
      recoveredRevenueCents: sql<number>`COALESCE(SUM(CASE WHEN ${paymentLeads.convertedOrderId} IS NOT NULL THEN ${paymentLeads.amountCents} ELSE 0 END), 0)`,
    })
    .from(paymentLeads)
    .where(and(gte(paymentLeads.createdAt, startDate), lte(paymentLeads.createdAt, endDate)));

  const abandonedCartEstimateCents = Number(leadRecoveryResult[0]?.abandonedValueCents || 0);
  const recoveredOrdersCount = Number(leadRecoveryResult[0]?.recoveredCount || 0);
  const recoveredRevenueCents = Number(leadRecoveryResult[0]?.recoveredRevenueCents || 0);

  // 7. Map database plan names if plan IDs exist
  const dbPlansMap = new Map<string, string>();
  const distinctPlanIds = Array.from(new Set(ordersRows.map((o) => o.planId).filter(Boolean))) as string[];
  if (distinctPlanIds.length > 0) {
    const plansResult = await db
      .select({ id: plans.id, name: plans.name })
      .from(plans);
    for (const p of plansResult) {
      dbPlansMap.set(p.id, p.name);
    }
  }

  return computeAnalyticsMetrics({
    range,
    startDate,
    endDate,
    checkoutsStartedJourneys,
    checkoutsAbandonedJourneys,
    ordersRows,
    dailyLifecycleEvents,
    dailyPaidOrders,
    abandonedCartEstimateCents,
    recoveredOrdersCount,
    recoveredRevenueCents,
    dbPlansMap,
  });
}
