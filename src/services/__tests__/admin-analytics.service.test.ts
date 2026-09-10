import { describe, it, expect } from 'vitest';
import {
  computeAnalyticsMetrics,
  resolveDateRangeBounds,
  resolveCanonicalPlanName,
} from '@/services/admin-analytics.service';

describe('Admin Analytics Service - Phase A', () => {
  describe('resolveDateRangeBounds', () => {
    it('resolves today, 7d, 30d, and 90d cleanly', () => {
      const todayBounds = resolveDateRangeBounds('today');
      expect(todayBounds.startDate).toBeInstanceOf(Date);
      expect(todayBounds.endDate).toBeInstanceOf(Date);
      expect(todayBounds.startDate.getTime()).toBeLessThanOrEqual(todayBounds.endDate.getTime());
      expect(todayBounds.startDate.getHours()).toBe(0);

      const sevenDays = resolveDateRangeBounds('7d');
      expect(sevenDays.startDate.getTime()).toBeLessThan(sevenDays.endDate.getTime());
      const diffHours7 = (sevenDays.endDate.getTime() - sevenDays.startDate.getTime()) / (1000 * 60 * 60);
      expect(diffHours7).toBeGreaterThanOrEqual(7 * 24);
      expect(diffHours7).toBeLessThanOrEqual(8 * 24);

      const thirtyDays = resolveDateRangeBounds('30d');
      expect(thirtyDays.startDate.getTime()).toBeLessThan(thirtyDays.endDate.getTime());
      const diffHours30 = (thirtyDays.endDate.getTime() - thirtyDays.startDate.getTime()) / (1000 * 60 * 60);
      expect(diffHours30).toBeGreaterThanOrEqual(30 * 24);
      expect(diffHours30).toBeLessThanOrEqual(31 * 24);

      const ninetyDays = resolveDateRangeBounds('90d');
      expect(ninetyDays.startDate.getTime()).toBeLessThan(ninetyDays.endDate.getTime());
      const diffHours90 = (ninetyDays.endDate.getTime() - ninetyDays.startDate.getTime()) / (1000 * 60 * 60);
      expect(diffHours90).toBeGreaterThanOrEqual(90 * 24);
      expect(diffHours90).toBeLessThanOrEqual(91 * 24);
    });
  });

  describe('resolveCanonicalPlanName', () => {
    it('uses dbPlanName if provided', () => {
      const name = resolveCanonicalPlanName('instagram', 'followers', 2000, null, 'Custom DB Starter');
      expect(name).toBe('Custom DB Starter');
    });

    it('parses canonicalOfferId correctly', () => {
      const name = resolveCanonicalPlanName('instagram', 'followers', 2000, 'canonical-instagram-followers-starter');
      expect(name).toBe('Starter');

      const nameGrowth = resolveCanonicalPlanName('tiktok', 'likes', 10000, 'canonical-tiktok-likes-growth');
      expect(nameGrowth).toBe('Growth');
    });

    it('matches CLOUTFLOW_CATALOG_PACKAGES by platform, service, and quantity', () => {
      // Instagram Followers 2000 is Starter ($14.90)
      const name = resolveCanonicalPlanName('instagram', 'followers', 2000);
      expect(name).toBe('Starter');

      // Instagram Followers 100000 is Max ($199.90)
      const nameMax = resolveCanonicalPlanName('instagram', 'followers', 100000);
      expect(nameMax).toBe('Max');

      // YouTube Likes 1000 is Starter ($7.90)
      const ytLikes = resolveCanonicalPlanName('youtube', 'likes', 1000);
      expect(ytLikes).toBe('Starter');
    });

    it('falls back safely when unmatched', () => {
      const fallback = resolveCanonicalPlanName('custom', 'service', 12345);
      expect(fallback).toBe('12,345 units');
    });
  });

  describe('computeAnalyticsMetrics Aggregations', () => {
    const defaultDates = {
      range: '7d' as const,
      startDate: new Date('2026-09-01T00:00:00Z'),
      endDate: new Date('2026-09-07T23:59:59Z'),
    };

    it('handles zero checkouts and empty datasets safely without crashing or NaN', () => {
      const result = computeAnalyticsMetrics({
        ...defaultDates,
        checkoutsStartedJourneys: 0,
        checkoutsAbandonedJourneys: 0,
        ordersRows: [],
        dailyLifecycleEvents: [],
        dailyPaidOrders: [],
        abandonedCartEstimateCents: 0,
        recoveredOrdersCount: 0,
        recoveredRevenueCents: 0,
      });

      expect(result.kpis.checkoutsStarted).toBe(0);
      expect(result.kpis.checkoutsAbandoned).toBe(0);
      expect(result.kpis.paidOrders).toBe(0);
      expect(result.kpis.checkoutConversionRate).toBe(0);
      expect(result.kpis.abandonmentRate).toBe(0);
      expect(result.kpis.revenue).toBe(0);
      expect(result.kpis.averageOrderValue).toBe(0);

      expect(result.funnel.started).toBe(0);
      expect(result.funnel.converted.count).toBe(0);
      expect(result.funnel.converted.rate).toBe(0);
      expect(result.funnel.abandoned.count).toBe(0);
      expect(result.funnel.abandoned.rate).toBe(0);

      expect(result.rankings.bestSellingPlan).toBeNull();
      expect(result.rankings.topNetwork).toBeNull();
      expect(result.rankings.topService).toBeNull();

      expect(result.networkPerformance).toHaveLength(4);
      expect(result.servicePerformance).toHaveLength(3);
      expect(result.topPlans).toHaveLength(0);
    });

    it('strictly counts only PAID / COMPLETED / APPROVED orders, ignoring PENDING, FAILED, CANCELED, REFUNDED', () => {
      const orders = [
        {
          id: 'ord-1',
          totalCents: 1490, // $14.90
          paymentStatus: 'PAID',
          platform: 'instagram',
          service: 'followers',
          planId: null,
          canonicalOfferId: 'canonical-instagram-followers-starter',
          quantity: 2000,
          createdAt: new Date('2026-09-02'),
          utmSource: 'google',
          utmCampaign: 'launch',
        },
        {
          id: 'ord-2',
          totalCents: 2990, // $29.90
          paymentStatus: 'COMPLETED',
          platform: 'instagram',
          service: 'followers',
          planId: null,
          canonicalOfferId: 'canonical-instagram-followers-boost',
          quantity: 6200,
          createdAt: new Date('2026-09-03'),
          utmSource: 'google',
          utmCampaign: 'launch',
        },
        {
          id: 'ord-3',
          totalCents: 1490, // $14.90
          paymentStatus: 'APPROVED',
          platform: 'tiktok',
          service: 'likes',
          planId: null,
          canonicalOfferId: 'canonical-tiktok-likes-growth',
          quantity: 10000,
          createdAt: new Date('2026-09-04'),
          utmSource: null,
          utmCampaign: null,
        },
        {
          id: 'ord-unpaid-1',
          totalCents: 9990,
          paymentStatus: 'PENDING_PAYMENT',
          platform: 'instagram',
          service: 'followers',
          planId: null,
          canonicalOfferId: null,
          quantity: 21000,
          createdAt: new Date('2026-09-04'),
          utmSource: null,
          utmCampaign: null,
        },
        {
          id: 'ord-unpaid-2',
          totalCents: 9990,
          paymentStatus: 'FAILED',
          platform: 'instagram',
          service: 'followers',
          planId: null,
          canonicalOfferId: null,
          quantity: 21000,
          createdAt: new Date('2026-09-04'),
          utmSource: null,
          utmCampaign: null,
        },
        {
          id: 'ord-unpaid-3',
          totalCents: 9990,
          paymentStatus: 'CANCELED',
          platform: 'instagram',
          service: 'followers',
          planId: null,
          canonicalOfferId: null,
          quantity: 21000,
          createdAt: new Date('2026-09-04'),
          utmSource: null,
          utmCampaign: null,
        },
        {
          id: 'ord-unpaid-4',
          totalCents: 9990,
          paymentStatus: 'REFUNDED',
          platform: 'instagram',
          service: 'followers',
          planId: null,
          canonicalOfferId: null,
          quantity: 21000,
          createdAt: new Date('2026-09-04'),
          utmSource: null,
          utmCampaign: null,
        },
      ];

      const result = computeAnalyticsMetrics({
        ...defaultDates,
        checkoutsStartedJourneys: 10,
        checkoutsAbandonedJourneys: 7,
        ordersRows: orders,
        dailyLifecycleEvents: [],
        dailyPaidOrders: [],
        abandonedCartEstimateCents: 5000,
        recoveredOrdersCount: 1,
        recoveredRevenueCents: 1490,
      });

      // Only 3 paid orders: 14.90 + 29.90 + 14.90 = $59.70
      expect(result.kpis.paidOrders).toBe(3);
      expect(result.kpis.revenue).toBe(59.7);
      // AOV = 59.7 / 3 = 19.90
      expect(result.kpis.averageOrderValue).toBe(19.9);
      // Conversion Rate: 3 / 10 = 30%
      expect(result.kpis.checkoutConversionRate).toBe(30);
      // Abandonment Rate: 7 / 10 = 70%
      expect(result.kpis.abandonmentRate).toBe(70);

      // Funnel
      expect(result.funnel.started).toBe(10);
      expect(result.funnel.converted.count).toBe(3);
      expect(result.funnel.converted.rate).toBe(30);
      expect(result.funnel.abandoned.count).toBe(7);
      expect(result.funnel.abandoned.rate).toBe(70);

      // Network Performance
      const instagram = result.networkPerformance.find((n) => n.platformKey === 'instagram');
      expect(instagram).toBeDefined();
      expect(instagram?.paidOrders).toBe(2);
      expect(instagram?.revenue).toBe(44.8); // 14.90 + 29.90
      expect(instagram?.aov).toBe(22.4);

      const tiktok = result.networkPerformance.find((n) => n.platformKey === 'tiktok');
      expect(tiktok).toBeDefined();
      expect(tiktok?.paidOrders).toBe(1);
      expect(tiktok?.revenue).toBe(14.9);

      // Service Performance
      const followers = result.servicePerformance.find((s) => s.serviceKey === 'followers');
      expect(followers).toBeDefined();
      expect(followers?.paidOrders).toBe(2);
      expect(followers?.revenue).toBe(44.8);

      const likes = result.servicePerformance.find((s) => s.serviceKey === 'likes');
      expect(likes).toBeDefined();
      expect(likes?.paidOrders).toBe(1);
      expect(likes?.revenue).toBe(14.9);

      // Top Plans
      expect(result.topPlans.length).toBe(3);
      // Best selling by revenue should be Boost ($29.90)
      expect(result.topPlans[0].planName).toBe('Boost');
      expect(result.topPlans[0].revenue).toBe(29.9);

      // Rankings
      expect(result.rankings.bestSellingPlan?.name).toBe('Boost');
      expect(result.rankings.topNetwork?.network).toBe('Instagram');
      expect(result.rankings.topService?.service).toBe('Followers');

      // Abandonment metrics
      expect(result.abandonment.abandonedCartValueEstimated).toBe(50);
      expect(result.abandonment.recoveredOrders).toBe(1);
      expect(result.abandonment.recoveredRevenue).toBe(14.9);

      // Compact attribution
      expect(result.attributionCompact.topSource).toBe('google');
      expect(result.attributionCompact.topCampaign).toBe('launch');
      expect(result.attributionCompact.attributedPaidOrders).toBe(2);
      expect(result.attributionCompact.attributedRevenue).toBe(44.8);
    });
  });
});
