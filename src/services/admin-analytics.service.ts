import { db } from '@/db';
import { orders, lifecycleEvents, paymentLeads, plans, orderEvents } from '@/db/schema';
import { funnelEvents } from '@/db/schema/analytics';
import { sql, and, gte, lte, eq, or } from 'drizzle-orm';
import { CLOUTFLOW_CATALOG_PACKAGES } from '@/config/financial-protection.config';
import {
  PRODUCTION_LAUNCH_CLEANUP_EXACT_ADMIN_NOTES,
  PRODUCTION_LAUNCH_CLEANUP_EVENT_ACTION,
  getNonCleanupOrderSqlCondition,
} from '@/services/admin-order-cleanup.helper';

import {
  AnalyticsDateRange,
  AnalyticsResponseData,
  AnalyticsKpiSummary,
  AnalyticsFunnel,
  AnalyticsFunnelStep,
  FullFunnelData,
  PreCheckoutNetworkInterest,
  PreCheckoutServiceInterest,
  PreCheckoutPlanInterest,
  AnalyzePerformanceSummary,
  TrafficSourceItem,
  DeviceBreakdownItem,
  BrowserBreakdownItem,
  AnalyticsTimeSeriesPoint,
  AnalyticsNetworkPerformance,
  AnalyticsServicePerformance,
  AnalyticsTopPlan,
  AnalyticsRankingSummary,
  AnalyticsAbandonmentMetrics,
  AnalyticsAttributionSummary,
} from '@/types/admin-analytics';

export const PHASE_B_ACTIVATION_DATE = '2026-09-10T00:00:00.000Z';

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

  if (canonicalOfferId && canonicalOfferId.startsWith('canonical-')) {
    const parts = canonicalOfferId.split('-');
    if (parts.length >= 4) {
      const planTier = parts[parts.length - 1];
      const capitalized = planTier.charAt(0).toUpperCase() + planTier.slice(1);
      return capitalized;
    }
  }

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

  // Phase B Pre-checkout Data
  rawFunnelEvents?: Array<{
    event: string;
    sessionId: string | null;
    planId: string | null;
    metadata: any;
    createdAt: Date;
  }>;
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
    rawFunnelEvents = [],
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

  // 2. Full Funnel Construction (Phase B)
  // Ordered sequence:
  // Visitors -> Network Selected -> Identifier Completed -> Email Completed -> Analyze Clicked -> Analysis Completed -> Result Viewed -> Profile Confirmed -> Pricing Viewed -> Plan CTA Clicked -> Checkout Started -> Paid
  const sessionStagesMap = new Map<string, Set<string>>(); // sessionId -> Set of events
  const networkSessionsMap = new Map<string, Set<string>>(); // platform -> Set of sessionIds
  const serviceSessionsMap = new Map<string, Set<string>>(); // service -> Set of sessionIds
  const serviceAnalyzedSessionsMap = new Map<string, Set<string>>();
  const planViewedSessionsMap = new Map<string, Set<string>>();
  const planSelectedSessionsMap = new Map<string, Set<string>>();
  const planCtaSessionsMap = new Map<string, Set<string>>();
  const analyzeAttemptsMap = new Map<string, { total: number; success: number; failed: number }>();
  const trafficSourcesMap = new Map<string, Set<string>>();
  const deviceMap = new Map<string, Set<string>>();
  const browserMap = new Map<string, Set<string>>();

  const canonicalPlatforms = ['instagram', 'tiktok', 'twitter', 'youtube'] as const;
  for (const p of canonicalPlatforms) {
    analyzeAttemptsMap.set(p, { total: 0, success: 0, failed: 0 });
    networkSessionsMap.set(p, new Set());
  }

  const canonicalServices = ['followers', 'likes', 'views'] as const;
  for (const s of canonicalServices) {
    serviceSessionsMap.set(s, new Set());
    serviceAnalyzedSessionsMap.set(s, new Set());
  }

  for (const ev of rawFunnelEvents) {
    const sid = ev.sessionId;
    if (!sid) continue;

    if (!sessionStagesMap.has(sid)) {
      sessionStagesMap.set(sid, new Set());
    }
    const currentStages = sessionStagesMap.get(sid)!;
    currentStages.add(ev.event);

    const meta = ev.metadata || {};
    const platformKey = (meta.platform || '').toLowerCase();
    const serviceKey = (meta.service || '').toLowerCase();

    if (platformKey && networkSessionsMap.has(platformKey)) {
      networkSessionsMap.get(platformKey)!.add(sid);
    }
    if (serviceKey && serviceSessionsMap.has(serviceKey)) {
      serviceSessionsMap.get(serviceKey)!.add(sid);
    }

    if (ev.event === 'analyze_clicked' && platformKey && analyzeAttemptsMap.has(platformKey)) {
      const stats = analyzeAttemptsMap.get(platformKey)!;
      stats.total += 1;
      if (serviceKey && serviceAnalyzedSessionsMap.has(serviceKey)) {
        serviceAnalyzedSessionsMap.get(serviceKey)!.add(sid);
      }
    } else if (ev.event === 'analysis_completed' && platformKey && analyzeAttemptsMap.has(platformKey)) {
      const stats = analyzeAttemptsMap.get(platformKey)!;
      stats.success += 1;
    } else if (ev.event === 'analysis_failed' && platformKey && analyzeAttemptsMap.has(platformKey)) {
      const stats = analyzeAttemptsMap.get(platformKey)!;
      stats.failed += 1;
    }

    const planIdKey = ev.planId || meta.planId;
    if (planIdKey) {
      if (ev.event === 'plan_card_viewed') {
        if (!planViewedSessionsMap.has(planIdKey)) planViewedSessionsMap.set(planIdKey, new Set());
        planViewedSessionsMap.get(planIdKey)!.add(sid);
      } else if (ev.event === 'plan_selected') {
        if (!planSelectedSessionsMap.has(planIdKey)) planSelectedSessionsMap.set(planIdKey, new Set());
        planSelectedSessionsMap.get(planIdKey)!.add(sid);
      } else if (ev.event === 'plan_cta_clicked') {
        if (!planCtaSessionsMap.has(planIdKey)) planCtaSessionsMap.set(planIdKey, new Set());
        planCtaSessionsMap.get(planIdKey)!.add(sid);
      }
    }

    // Traffic Source Attribution
    let src = meta.utm_source;
    if (!src && meta.referrer) {
      src = meta.referrer;
    }
    if (!src) {
      src = 'Direct / Organic';
    }
    if (!trafficSourcesMap.has(src)) {
      trafficSourcesMap.set(src, new Set());
    }
    trafficSourcesMap.get(src)!.add(sid);

    // Device Category
    const dev = meta.deviceCategory || 'desktop';
    if (!deviceMap.has(dev)) deviceMap.set(dev, new Set());
    deviceMap.get(dev)!.add(sid);

    // Browser Family
    const browser = meta.browserFamily || 'Other';
    if (!browserMap.has(browser)) browserMap.set(browser, new Set());
    browserMap.get(browser)!.add(sid);
  }

  // Count distinct sessions per funnel stage
  const countUniqueSessionsFor = (events: string[]) => {
    let count = 0;
    for (const stages of sessionStagesMap.values()) {
      if (events.some((e) => stages.has(e))) {
        count += 1;
      }
    }
    return count;
  };

  const visitorsCount = countUniqueSessionsFor(['page_view', 'platform_selected', 'service_selected', 'identifier_started', 'identifier_completed', 'email_started', 'email_completed', 'analyze_clicked']);
  const networkSelectedCount = countUniqueSessionsFor(['platform_selected', 'identifier_started', 'identifier_completed', 'analyze_clicked']);
  const identifierCompletedCount = countUniqueSessionsFor(['identifier_completed', 'analyze_clicked']);
  const emailCompletedCount = countUniqueSessionsFor(['email_completed', 'analyze_clicked']);
  const analyzeClickedCount = countUniqueSessionsFor(['analyze_clicked']);
  const analysisCompletedCount = countUniqueSessionsFor(['analysis_completed', 'result_viewed', 'profile_confirmed']);
  const resultViewedCount = countUniqueSessionsFor(['result_viewed', 'profile_confirmed']);
  const profileConfirmedCount = countUniqueSessionsFor(['profile_confirmed', 'pricing_viewed', 'plan_cta_clicked']);
  const pricingViewedCount = countUniqueSessionsFor(['pricing_viewed', 'plan_cta_clicked', 'plan_selected']);
  const planCtaClickedCount = countUniqueSessionsFor(['plan_cta_clicked', 'checkout_started_linked']);
  
  // Checkout started and paid orders from server-side canonical truth
  const checkoutStartedCount = Math.max(checkoutsStartedJourneys, countUniqueSessionsFor(['checkout_started_linked']));
  const paidCount = paidOrdersCount;

  // Build funnel sequence definitions
  const rawStages = [
    { stage: 'visitors', label: 'Visitors', count: visitorsCount },
    { stage: 'network_selected', label: 'Network Selected', count: Math.min(visitorsCount || networkSelectedCount, networkSelectedCount) },
    { stage: 'identifier_completed', label: 'Identifier Complete', count: identifierCompletedCount },
    { stage: 'email_completed', label: 'Email Complete', count: emailCompletedCount },
    { stage: 'analyze_clicked', label: 'Analyze Clicked', count: analyzeClickedCount },
    { stage: 'analysis_completed', label: 'Analysis Complete', count: analysisCompletedCount },
    { stage: 'result_viewed', label: 'Result Viewed', count: resultViewedCount },
    { stage: 'profile_confirmed', label: 'Profile Confirmed', count: profileConfirmedCount },
    { stage: 'pricing_viewed', label: 'Pricing Viewed', count: pricingViewedCount },
    { stage: 'plan_cta_clicked', label: 'Plan CTA Clicked', count: planCtaClickedCount },
    { stage: 'checkout_started', label: 'Checkout Started', count: checkoutStartedCount },
    { stage: 'paid', label: 'Paid', count: paidCount },
  ];

  const fullFunnelSteps: AnalyticsFunnelStep[] = [];
  const baseVisitors = rawStages[0].count || (rawStages[1].count > 0 ? rawStages[1].count : 1);

  for (let i = 0; i < rawStages.length; i++) {
    const cur = rawStages[i];
    const prev = i > 0 ? rawStages[i - 1] : null;

    const conversionFromVisitor =
      baseVisitors > 0 ? Math.min(100, Math.round((cur.count / baseVisitors) * 1000) / 10) : 0;

    const conversionFromPrevious =
      prev && prev.count > 0
        ? Math.min(100, Math.round((cur.count / prev.count) * 1000) / 10)
        : i === 0
        ? 100
        : 0;

    const lostSessions = prev ? Math.max(0, prev.count - cur.count) : 0;
    const dropOffRate =
      prev && prev.count > 0 ? Math.min(100, Math.round((lostSessions / prev.count) * 1000) / 10) : 0;

    fullFunnelSteps.push({
      stage: cur.stage,
      label: cur.label,
      count: cur.count,
      conversionFromPrevious,
      conversionFromVisitor,
      lostSessions,
      dropOffRate,
    });
  }

  // Find biggest drop-off
  let biggestDropOff: FullFunnelData['biggestDropOff'] = null;
  let maxLost = -1;
  for (let i = 1; i < fullFunnelSteps.length; i++) {
    const step = fullFunnelSteps[i];
    const prev = fullFunnelSteps[i - 1];
    if (step.lostSessions > maxLost) {
      maxLost = step.lostSessions;
      biggestDropOff = {
        fromStage: prev.label,
        toStage: step.label,
        lostSessions: step.lostSessions,
        dropOffRate: step.dropOffRate,
      };
    }
  }

  const hasHistoricalWarning = startDate < new Date(PHASE_B_ACTIVATION_DATE);
  const fullFunnel: FullFunnelData = {
    trackingActive: true,
    activationDate: PHASE_B_ACTIVATION_DATE,
    hasHistoricalWarning,
    steps: fullFunnelSteps,
    biggestDropOff,
  };

  // 3. Pre-checkout Network Interest vs Conversion
  const platformDisplayNameMap: Record<string, string> = {
    instagram: 'Instagram',
    tiktok: 'TikTok',
    twitter: 'X / Twitter',
    youtube: 'YouTube',
  };

  const preCheckoutNetworkInterest: PreCheckoutNetworkInterest[] = canonicalPlatforms.map((plat) => {
    const selectedSessions = networkSessionsMap.get(plat)?.size || 0;
    const paidForPlat = paidOrdersList.filter(
      (o) => (o.platform || 'instagram').toLowerCase() === plat
    ).length;
    const checkoutForPlat = ordersRows.filter(
      (o) => (o.platform || 'instagram').toLowerCase() === plat
    ).length;

    const conv =
      selectedSessions > 0 ? Math.round((paidForPlat / selectedSessions) * 1000) / 10 : 0;

    return {
      network: platformDisplayNameMap[plat] || plat,
      platformKey: plat,
      selectedSessions,
      checkoutSessions: checkoutForPlat,
      paidOrders: paidForPlat,
      conversionRate: conv,
    };
  });

  // 4. Pre-checkout Service Interest
  const serviceDisplayNameMap: Record<string, string> = {
    followers: 'Followers',
    likes: 'Likes',
    views: 'Views',
  };

  const preCheckoutServiceInterest: PreCheckoutServiceInterest[] = canonicalServices.map((serv) => {
    const selectedSessions = serviceSessionsMap.get(serv)?.size || 0;
    const analyzedSessions = serviceAnalyzedSessionsMap.get(serv)?.size || 0;
    const paidForServ = paidOrdersList.filter(
      (o) => (o.service || 'followers').toLowerCase() === serv
    ).length;
    const checkoutForServ = ordersRows.filter(
      (o) => (o.service || 'followers').toLowerCase() === serv
    ).length;
    const conv =
      selectedSessions > 0 ? Math.round((paidForServ / selectedSessions) * 1000) / 10 : 0;

    return {
      service: serviceDisplayNameMap[serv] || serv,
      serviceKey: serv,
      selectedSessions,
      analyzedSessions,
      checkoutSessions: checkoutForServ,
      paidOrders: paidForServ,
      conversionRate: conv,
    };
  });

  // 5. Pre-checkout Plan Interest
  // Gather distinct plans from funnel events and database
  const allPlanIds = new Set<string>();
  for (const p of planViewedSessionsMap.keys()) allPlanIds.add(p);
  for (const p of planSelectedSessionsMap.keys()) allPlanIds.add(p);
  for (const p of planCtaSessionsMap.keys()) allPlanIds.add(p);

  const preCheckoutPlanInterest: PreCheckoutPlanInterest[] = Array.from(allPlanIds).map((pid) => {
    const viewed = planViewedSessionsMap.get(pid)?.size || 0;
    const selected = planSelectedSessionsMap.get(pid)?.size || 0;
    const cta = planCtaSessionsMap.get(pid)?.size || 0;
    const matchingOrders = paidOrdersList.filter((o) => o.planId === pid || o.canonicalOfferId === pid);
    const paidCount = matchingOrders.length;
    const matchingCheckouts = ordersRows.filter((o) => o.planId === pid || o.canonicalOfferId === pid).length;

    const sampleOrder = matchingOrders[0] || ordersRows.find((o) => o.planId === pid || o.canonicalOfferId === pid);
    const plat = sampleOrder?.platform || 'instagram';
    const serv = sampleOrder?.service || 'followers';
    const qty = sampleOrder?.quantity || 1000;
    const dbName = dbPlansMap?.get(pid);
    const resolvedName = resolveCanonicalPlanName(plat, serv, qty, sampleOrder?.canonicalOfferId, dbName);

    return {
      planId: pid,
      planName: resolvedName,
      network: platformDisplayNameMap[plat.toLowerCase()] || plat,
      service: serviceDisplayNameMap[serv.toLowerCase()] || serv,
      viewedSessions: viewed,
      selectedSessions: selected,
      ctaClickedSessions: cta,
      checkoutSessions: matchingCheckouts,
      paidOrders: paidCount,
    };
  }).sort((a, b) => b.ctaClickedSessions - a.ctaClickedSessions || b.viewedSessions - a.viewedSessions);

  // 6. Analyze Performance
  let totalAttempts = 0;
  let totalSuccess = 0;
  let totalFailed = 0;

  const byNetwork = canonicalPlatforms.map((plat) => {
    const stats = analyzeAttemptsMap.get(plat) || { total: 0, success: 0, failed: 0 };
    totalAttempts += stats.total;
    totalSuccess += stats.success;
    totalFailed += stats.failed;

    const successRate =
      stats.total > 0 ? Math.round((stats.success / stats.total) * 1000) / 10 : 100;

    return {
      network: platformDisplayNameMap[plat] || plat,
      platformKey: plat,
      attempts: stats.total,
      successful: stats.success,
      failed: stats.failed,
      successRate,
    };
  });

  const overallAnalyzeSuccessRate =
    totalAttempts > 0 ? Math.round((totalSuccess / totalAttempts) * 1000) / 10 : 100;

  const analyzePerformance: AnalyzePerformanceSummary = {
    totalAttempts,
    successful: totalSuccess,
    failed: totalFailed,
    successRate: overallAnalyzeSuccessRate,
    byNetwork,
  };

  // 7. Traffic Sources Breakdown
  const totalTrackedSessions = sessionStagesMap.size || 1;
  const trafficSources: TrafficSourceItem[] = Array.from(trafficSourcesMap.entries())
    .map(([source, sids]) => {
      const sessions = sids.size;
      const share = Math.round((sessions / totalTrackedSessions) * 1000) / 10;
      const paid = paidOrdersList.filter((o) => (o.utmSource || 'Direct / Organic') === source).length;
      return { source, sessions, share, paidOrders: paid };
    })
    .sort((a, b) => b.sessions - a.sessions);

  // 8. Device Breakdown
  const deviceBreakdown: DeviceBreakdownItem[] = Array.from(deviceMap.entries())
    .map(([device, sids]) => {
      const sessions = sids.size;
      const share = Math.round((sessions / totalTrackedSessions) * 1000) / 10;
      return { device: device.charAt(0).toUpperCase() + device.slice(1), sessions, share };
    })
    .sort((a, b) => b.sessions - a.sessions);

  // 9. Browser Breakdown
  const browserBreakdown: BrowserBreakdownItem[] = Array.from(browserMap.entries())
    .map(([browser, sids]) => {
      const sessions = sids.size;
      const share = Math.round((sessions / totalTrackedSessions) * 1000) / 10;
      return { browser, sessions, share };
    })
    .sort((a, b) => b.sessions - a.sessions);

  // 10. Time-Series Construction: Group by day
  const daysMap = new Map<string, { started: number; paid: number; abandoned: number }>();

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

  // 11. Network Performance (Orders & Revenue)
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

  // 12. Service Performance (Orders & Revenue)
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

  // 13. Top Plans
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

  // 14. Rankings Summary
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

  // 15. Abandonment Analytics
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

  // 16. Compact Attribution
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
    fullFunnel,
    preCheckoutNetworkInterest,
    preCheckoutServiceInterest,
    preCheckoutPlanInterest,
    analyzePerformance,
    trafficSources,
    deviceBreakdown,
    browserBreakdown,
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

  // 3. Fetch orders within the date range (excluding production launch cleanup test orders)
  const nonCleanupCondition = getNonCleanupOrderSqlCondition();

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
    .where(
      and(
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate),
        nonCleanupCondition
      )
    );

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

  // 5. Daily paid orders (excluding production launch cleanup test orders)
  const dailyPaidResult = await db
    .select({
      day: sql<string>`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`,
      paid: sql<number>`COALESCE(COUNT(DISTINCT CASE WHEN ${orders.paymentStatus} IN ('PAID', 'COMPLETED', 'APPROVED') THEN ${orders.id} END), 0)`,
    })
    .from(orders)
    .where(
      and(
        gte(orders.createdAt, startDate),
        lte(orders.createdAt, endDate),
        nonCleanupCondition
      )
    )
    .groupBy(sql`TO_CHAR(${orders.createdAt}, 'YYYY-MM-DD')`);

  const dailyPaidOrders = dailyPaidResult.map((r) => ({
    day: r.day,
    paid: Number(r.paid) || 0,
  }));

  // 6. Abandoned cart value estimate & recovery correlation (excluding production launch cleanup test orders)
  const leadRecoveryResult = await db
    .select({
      abandonedValueCents: sql<number>`COALESCE(SUM(CASE WHEN ${paymentLeads.inferredStatus} = 'possible_abandonment' OR ${paymentLeads.normalizedStatus} = 'possible_abandonment' THEN ${paymentLeads.amountCents} ELSE 0 END), 0)`,
      recoveredCount: sql<number>`COALESCE(COUNT(DISTINCT CASE WHEN ${paymentLeads.convertedOrderId} IS NOT NULL AND ${orders.id} IS NOT NULL THEN ${paymentLeads.id} END), 0)`,
      recoveredRevenueCents: sql<number>`COALESCE(SUM(CASE WHEN ${paymentLeads.convertedOrderId} IS NOT NULL AND ${orders.id} IS NOT NULL THEN ${paymentLeads.amountCents} ELSE 0 END), 0)`,
    })
    .from(paymentLeads)
    .leftJoin(
      orders,
      and(
        eq(paymentLeads.convertedOrderId, orders.id),
        nonCleanupCondition
      )
    )
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

  // 8. Fetch Raw Funnel Events for Phase B
  let rawFunnelEvents: Array<{
    event: string;
    sessionId: string | null;
    planId: string | null;
    metadata: any;
    createdAt: Date;
  }> = [];

  try {
    rawFunnelEvents = await db
      .select({
        event: funnelEvents.event,
        sessionId: funnelEvents.sessionId,
        planId: funnelEvents.planId,
        metadata: funnelEvents.metadata,
        createdAt: funnelEvents.createdAt,
      })
      .from(funnelEvents)
      .where(and(gte(funnelEvents.createdAt, startDate), lte(funnelEvents.createdAt, endDate)));
  } catch (err) {
    console.error('[AdminAnalyticsService] Could not fetch funnel_events:', err);
    // Fail-open: Proceed with empty funnel events rather than failing the whole dashboard
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
    rawFunnelEvents,
  });
}
