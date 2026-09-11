import { describe, it, expect } from 'vitest';
import {
  PRODUCTION_LAUNCH_CLEANUP_EXACT_ADMIN_NOTES,
  PRODUCTION_LAUNCH_CLEANUP_EVENT_ACTION,
  isProductionLaunchCleanupOrder,
} from '@/services/admin-order-cleanup.helper';
import { computeAnalyticsMetrics } from '@/services/admin-analytics.service';

describe('Admin Order Cleanup Exclusion Tests', () => {
  describe('isProductionLaunchCleanupOrder Helper', () => {
    it('PAID + CANCELED + sem cleanup marker => NÃO pode ser excluído apenas por CANCELED', () => {
      const order = {
        paymentStatus: 'PAID',
        fulfillmentStatus: 'CANCELED',
        adminNotes: null,
        hasCleanupEvent: false,
      };

      const isCleanup = isProductionLaunchCleanupOrder(order);
      expect(isCleanup).toBe(false);
    });

    it('PAID + CANCELED + custom admin notes (not the cleanup marker) => NÃO pode ser excluído', () => {
      const order = {
        paymentStatus: 'PAID',
        fulfillmentStatus: 'CANCELED',
        adminNotes: 'Customer requested manual cancellation',
        hasCleanupEvent: false,
      };

      const isCleanup = isProductionLaunchCleanupOrder(order);
      expect(isCleanup).toBe(false);
    });

    it('cleanup por admin_notes EXATO => excluído', () => {
      const order = {
        paymentStatus: 'PAID',
        fulfillmentStatus: 'CANCELED',
        adminNotes: PRODUCTION_LAUNCH_CLEANUP_EXACT_ADMIN_NOTES,
        hasCleanupEvent: false,
      };

      const isCleanup = isProductionLaunchCleanupOrder(order);
      expect(isCleanup).toBe(true);
    });

    it('cleanup por order_events metadata.action = PRODUCTION_LAUNCH_CLEANUP => excluído', () => {
      const order = {
        paymentStatus: 'PAID',
        fulfillmentStatus: 'CANCELED',
        adminNotes: null,
        hasCleanupEvent: true,
      };

      const isCleanup = isProductionLaunchCleanupOrder(order);
      expect(isCleanup).toBe(true);
    });

    it('PAID + cleanup marker => deve ser excluído mesmo se paymentStatus for PAID e fulfillmentStatus for COMPLETED ou qualquer outro', () => {
      const order1 = {
        paymentStatus: 'PAID',
        fulfillmentStatus: 'COMPLETED',
        adminNotes: PRODUCTION_LAUNCH_CLEANUP_EXACT_ADMIN_NOTES,
      };
      expect(isProductionLaunchCleanupOrder(order1)).toBe(true);

      const order2 = {
        paymentStatus: 'PAID',
        fulfillmentStatus: 'PROCESSING',
        hasCleanupEvent: true,
      };
      expect(isProductionLaunchCleanupOrder(order2)).toBe(true);
    });
  });

  describe('Financial Metrics Consistency with Cleanup Exclusion', () => {
    const defaultDates = {
      range: '7d' as const,
      startDate: new Date('2026-09-01T00:00:00Z'),
      endDate: new Date('2026-09-10T23:59:59Z'),
    };

    it('processes non-cleanup orders correctly and maintains normal financial semantics for PAID + CANCELED without marker', () => {
      const legitimateCanceledPaidOrder = {
        id: 'legit-paid-canceled',
        totalCents: 2990,
        paymentStatus: 'PAID',
        platform: 'instagram',
        service: 'followers',
        planId: null,
        canonicalOfferId: 'canonical-instagram-followers-boost',
        quantity: 6200,
        createdAt: new Date('2026-09-05'),
        utmSource: 'google',
        utmCampaign: 'promo',
      };

      const legitimateCompletedPaidOrder = {
        id: 'legit-paid-completed',
        totalCents: 1490,
        paymentStatus: 'PAID',
        platform: 'tiktok',
        service: 'followers',
        planId: null,
        canonicalOfferId: 'canonical-tiktok-followers-starter',
        quantity: 2000,
        createdAt: new Date('2026-09-05'),
        utmSource: 'direct',
        utmCampaign: null,
      };

      const result = computeAnalyticsMetrics({
        ...defaultDates,
        checkoutsStartedJourneys: 5,
        checkoutsAbandonedJourneys: 3,
        ordersRows: [legitimateCanceledPaidOrder, legitimateCompletedPaidOrder],
        dailyLifecycleEvents: [],
        dailyPaidOrders: [{ day: '2026-09-05', paid: 2 }],
        abandonedCartEstimateCents: 1000,
        recoveredOrdersCount: 0,
        recoveredRevenueCents: 0,
      });

      // Both orders are included in financial metrics because neither has the cleanup marker
      expect(result.kpis.paidOrders).toBe(2);
      expect(result.kpis.revenue).toBe(44.8); // 29.90 + 14.90
      expect(result.kpis.averageOrderValue).toBe(22.4);

      // Top plans
      expect(result.topPlans).toHaveLength(2);
      expect(result.topPlans[0].planName).toBe('Boost');
      expect(result.topPlans[1].planName).toBe('Starter');

      // Network performance
      const ig = result.networkPerformance.find((n) => n.platformKey === 'instagram');
      expect(ig?.paidOrders).toBe(1);
      expect(ig?.revenue).toBe(29.9);

      const tt = result.networkPerformance.find((n) => n.platformKey === 'tiktok');
      expect(tt?.paidOrders).toBe(1);
      expect(tt?.revenue).toBe(14.9);
    });
  });
});
