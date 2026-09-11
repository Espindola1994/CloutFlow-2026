import { describe, it, expect } from 'vitest';
import {
  PRODUCTION_LAUNCH_CLEANUP_EXACT_ADMIN_NOTES,
  PRODUCTION_LAUNCH_CLEANUP_EVENT_ACTION,
  COMMERCIAL_GO_LIVE_DATE,
  PERFECTPAY_FREE_PRICE_PAYMENT_TYPE,
  PERFECTPAY_FREE_RECURRENT_TIME_STATUS_DETAIL,
  isProductionLaunchCleanupOrder,
  isHistoricalPreGoLiveFreeTest,
  isExcludedFromCommercialAnalytics,
} from '@/services/admin-order-cleanup.helper';
import { computeAnalyticsMetrics } from '@/services/admin-analytics.service';

describe('Admin Order Cleanup and Historical Free Tests Exclusion Tests', () => {
  describe('Category A: isProductionLaunchCleanupOrder Helper', () => {
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

  describe('Category B: isHistoricalPreGoLiveFreeTest Helper', () => {
    // 1. pre-go-live + free_price + free_recurrent_time => EXCLUÍDO
    it('1. pre-go-live + free_price + free_recurrent_time => EXCLUÍDO', () => {
      const order = {
        createdAt: '2026-08-20T03:00:00.000Z',
        paymentTypeEnumKey: PERFECTPAY_FREE_PRICE_PAYMENT_TYPE,
        saleStatusDetail: PERFECTPAY_FREE_RECURRENT_TIME_STATUS_DETAIL,
      };
      expect(isHistoricalPreGoLiveFreeTest(order)).toBe(true);
      expect(isExcludedFromCommercialAnalytics(order)).toBe(true);
    });

    // 2. pre-go-live + free_price + SEM free_recurrent_time => NÃO excluir pela categoria B
    it('2. pre-go-live + free_price + SEM free_recurrent_time => NÃO excluir pela categoria B', () => {
      const order = {
        createdAt: '2026-08-20T03:00:00.000Z',
        paymentTypeEnumKey: PERFECTPAY_FREE_PRICE_PAYMENT_TYPE,
        saleStatusDetail: 'standard_paid',
      };
      expect(isHistoricalPreGoLiveFreeTest(order)).toBe(false);
      expect(isExcludedFromCommercialAnalytics(order)).toBe(false);
    });

    // 3. pre-go-live + free_recurrent_time + SEM free_price => NÃO excluir pela categoria B
    it('3. pre-go-live + free_recurrent_time + SEM free_price => NÃO excluir pela categoria B', () => {
      const order = {
        createdAt: '2026-08-20T03:00:00.000Z',
        paymentTypeEnumKey: 'credit_card',
        saleStatusDetail: PERFECTPAY_FREE_RECURRENT_TIME_STATUS_DETAIL,
      };
      expect(isHistoricalPreGoLiveFreeTest(order)).toBe(false);
      expect(isExcludedFromCommercialAnalytics(order)).toBe(false);
    });

    // 4. pós-go-live + free_price + free_recurrent_time => NÃO excluir automaticamente pela categoria histórica
    it('4. pós-go-live + free_price + free_recurrent_time => NÃO excluir automaticamente pela categoria histórica', () => {
      const order = {
        createdAt: '2026-09-11T12:00:00.000Z',
        paymentTypeEnumKey: PERFECTPAY_FREE_PRICE_PAYMENT_TYPE,
        saleStatusDetail: PERFECTPAY_FREE_RECURRENT_TIME_STATUS_DETAIL,
      };
      expect(isHistoricalPreGoLiveFreeTest(order)).toBe(false);
      expect(isExcludedFromCommercialAnalytics(order)).toBe(false);
    });

    // 5. pós-go-live + total_cents = 0 + cupom legítimo => NÃO excluir
    it('5. pós-go-live + total_cents = 0 + cupom legítimo => NÃO excluir', () => {
      const order = {
        createdAt: '2026-09-12T10:00:00.000Z',
        paymentTypeEnumKey: 'credit_card',
        saleStatusDetail: 'paid',
      };
      expect(isHistoricalPreGoLiveFreeTest(order)).toBe(false);
      expect(isExcludedFromCommercialAnalytics(order)).toBe(false);
    });

    // 6. PAID + CANCELED legítimo sem cleanup => NÃO excluir
    it('6. PAID + CANCELED legítimo sem cleanup => NÃO excluir', () => {
      const order = {
        createdAt: '2026-09-11T10:00:00.000Z',
        paymentTypeEnumKey: 'credit_card',
        saleStatusDetail: 'paid',
        adminNotes: 'Customer cancellation after payment',
      };
      expect(isHistoricalPreGoLiveFreeTest(order)).toBe(false);
      expect(isExcludedFromCommercialAnalytics(order)).toBe(false);
    });

    // 7. PRODUCTION_LAUNCH_CLEANUP => continua excluído pela categoria A
    it('7. PRODUCTION_LAUNCH_CLEANUP => continua excluído via isExcludedFromCommercialAnalytics', () => {
      const order = {
        createdAt: '2026-09-05T10:00:00.000Z',
        adminNotes: PRODUCTION_LAUNCH_CLEANUP_EXACT_ADMIN_NOTES,
      };
      expect(isExcludedFromCommercialAnalytics(order)).toBe(true);
    });

    // 8. Pedido normal pago => continua incluído
    it('8. Pedido normal pago pós-go-live => continua incluído', () => {
      const order = {
        createdAt: '2026-09-11T15:00:00.000Z',
        paymentTypeEnumKey: 'credit_card',
        saleStatusDetail: 'approved',
      };
      expect(isExcludedFromCommercialAnalytics(order)).toBe(false);
    });

    // 9. Pedido real com total_cents > 0 => incluído
    it('9. Pedido real com total_cents > 0 pré-go-live sem marcadores livres => incluído', () => {
      const order = {
        createdAt: '2026-08-25T15:00:00.000Z',
        paymentTypeEnumKey: 'credit_card',
        saleStatusDetail: 'paid',
      };
      expect(isHistoricalPreGoLiveFreeTest(order)).toBe(false);
      expect(isExcludedFromCommercialAnalytics(order)).toBe(false);
    });

    // 10 & 11: Validação de que não usa total_cents = 0 nem fulfillment_status = CANCELED
    it('10 & 11. Nenhuma regra exclui com base isolada em total_cents = 0 ou fulfillment_status = CANCELED', () => {
      const orderWithZeroCents = {
        createdAt: '2026-09-11T10:00:00.000Z',
        paymentTypeEnumKey: 'pix',
        saleStatusDetail: 'completed',
      };
      expect(isExcludedFromCommercialAnalytics(orderWithZeroCents)).toBe(false);
    });
  });

  describe('Financial Metrics Consistency with Cleanup Exclusion', () => {
    const defaultDates = {
      range: '7d' as const,
      startDate: new Date('2026-09-01T00:00:00Z'),
      endDate: new Date('2026-09-10T23:59:59Z'),
    };

    it('12-18. processes legitimate orders correctly, keeping Revenue, AOV, Top Plans, Network, Service, Full Funnel and Recovered Revenue accurate', () => {
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
        recoveredOrdersCount: 1,
        recoveredRevenueCents: 1490,
      });

      // 12. Revenue correto
      expect(result.kpis.revenue).toBe(44.8); // 29.90 + 14.90
      // 13. AOV correto
      expect(result.kpis.averageOrderValue).toBe(22.4);
      // 14. Top Plans correto
      expect(result.topPlans).toHaveLength(2);
      expect(result.topPlans[0].planName).toBe('Boost');
      expect(result.topPlans[1].planName).toBe('Starter');

      // 15. Network purchases correto
      const ig = result.networkPerformance.find((n) => n.platformKey === 'instagram');
      expect(ig?.paidOrders).toBe(1);
      expect(ig?.revenue).toBe(29.9);

      const tt = result.networkPerformance.find((n) => n.platformKey === 'tiktok');
      expect(tt?.paidOrders).toBe(1);
      expect(tt?.revenue).toBe(14.9);

      // 16. Service purchases correto
      const followersService = result.servicePerformance.find((s) => s.serviceKey === 'followers');
      expect(followersService?.paidOrders).toBe(2);
      expect(followersService?.revenue).toBe(44.8);

      // 17. Full Funnel Paid correto
      const paidFunnelStep = result.fullFunnel.steps.find((s) => s.stage === 'paid');
      expect(paidFunnelStep?.count).toBe(2);

      // Funnel simples
      expect(result.funnel.converted.count).toBe(2);

      // 18. Recovered Revenue correto
      expect(result.abandonment.recoveredRevenue).toBe(14.9);
      expect(result.abandonment.recoveredOrders).toBe(1);
    });

    it('When all orders are excluded tests (0 ordersRows), financial metrics evaluate to 0.00 and purchases are 0', () => {
      const result = computeAnalyticsMetrics({
        ...defaultDates,
        checkoutsStartedJourneys: 71,
        checkoutsAbandonedJourneys: 70,
        ordersRows: [],
        dailyLifecycleEvents: [],
        dailyPaidOrders: [],
        abandonedCartEstimateCents: 0,
        recoveredOrdersCount: 0,
        recoveredRevenueCents: 0,
      });

      expect(result.kpis.paidOrders).toBe(0);
      expect(result.kpis.revenue).toBe(0);
      expect(result.kpis.averageOrderValue).toBe(0);
      expect(result.kpis.checkoutConversionRate).toBe(0);
      expect(result.topPlans).toEqual([]);
      
      // Network performance has 0 paidOrders and $0 revenue across all canonical platforms
      for (const net of result.networkPerformance) {
        expect(net.paidOrders).toBe(0);
        expect(net.revenue).toBe(0);
      }

      // Service performance has 0 paidOrders and $0 revenue across all canonical services
      for (const serv of result.servicePerformance) {
        expect(serv.paidOrders).toBe(0);
        expect(serv.revenue).toBe(0);
      }

      // Preserves behavioral checkouts
      expect(result.kpis.checkoutsStarted).toBe(71);
      expect(result.kpis.checkoutsAbandoned).toBe(70);
    });
  });
});

