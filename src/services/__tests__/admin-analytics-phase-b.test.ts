import { describe, it, expect } from 'vitest';
import { computeAnalyticsMetrics } from '../admin-analytics.service';

describe('Admin Analytics Phase B Full Funnel Metrics Computation', () => {
  it('correctly aggregates multi-stage funnel and calculates drop-offs', () => {
    const startDate = new Date('2026-09-10T00:00:00.000Z');
    const endDate = new Date('2026-09-17T00:00:00.000Z');

    const rawFunnelEvents = [
      // Session 1: Full Journey
      { event: 'page_view', sessionId: 's1', planId: null, metadata: { platform: 'instagram', service: 'followers' }, createdAt: startDate },
      { event: 'platform_selected', sessionId: 's1', planId: null, metadata: { platform: 'instagram', service: 'followers' }, createdAt: startDate },
      { event: 'identifier_completed', sessionId: 's1', planId: null, metadata: { platform: 'instagram', service: 'followers' }, createdAt: startDate },
      { event: 'email_completed', sessionId: 's1', planId: null, metadata: { platform: 'instagram', service: 'followers' }, createdAt: startDate },
      { event: 'analyze_clicked', sessionId: 's1', planId: null, metadata: { platform: 'instagram', service: 'followers' }, createdAt: startDate },
      { event: 'analysis_completed', sessionId: 's1', planId: null, metadata: { platform: 'instagram', service: 'followers' }, createdAt: startDate },
      { event: 'result_viewed', sessionId: 's1', planId: null, metadata: { platform: 'instagram', service: 'followers' }, createdAt: startDate },
      { event: 'profile_confirmed', sessionId: 's1', planId: null, metadata: { platform: 'instagram', service: 'followers' }, createdAt: startDate },
      { event: 'pricing_viewed', sessionId: 's1', planId: null, metadata: { platform: 'instagram', service: 'followers' }, createdAt: startDate },
      { event: 'plan_cta_clicked', sessionId: 's1', planId: 'plan-1000', metadata: { platform: 'instagram', service: 'followers' }, createdAt: startDate },
      { event: 'checkout_started_linked', sessionId: 's1', planId: 'plan-1000', metadata: { platform: 'instagram', service: 'followers' }, createdAt: startDate },

      // Session 2: Abandons after Email
      { event: 'page_view', sessionId: 's2', planId: null, metadata: { platform: 'tiktok', service: 'likes' }, createdAt: startDate },
      { event: 'platform_selected', sessionId: 's2', planId: null, metadata: { platform: 'tiktok', service: 'likes' }, createdAt: startDate },
      { event: 'identifier_completed', sessionId: 's2', planId: null, metadata: { platform: 'tiktok', service: 'likes' }, createdAt: startDate },
      { event: 'email_completed', sessionId: 's2', planId: null, metadata: { platform: 'tiktok', service: 'likes' }, createdAt: startDate },

      // Session 3: Abandons after Analysis Fails
      { event: 'page_view', sessionId: 's3', planId: null, metadata: { platform: 'youtube', service: 'views' }, createdAt: startDate },
      { event: 'platform_selected', sessionId: 's3', planId: null, metadata: { platform: 'youtube', service: 'views' }, createdAt: startDate },
      { event: 'identifier_completed', sessionId: 's3', planId: null, metadata: { platform: 'youtube', service: 'views' }, createdAt: startDate },
      { event: 'email_completed', sessionId: 's3', planId: null, metadata: { platform: 'youtube', service: 'views' }, createdAt: startDate },
      { event: 'analyze_clicked', sessionId: 's3', planId: null, metadata: { platform: 'youtube', service: 'views' }, createdAt: startDate },
      { event: 'analysis_failed', sessionId: 's3', planId: null, metadata: { platform: 'youtube', service: 'views' }, createdAt: startDate },
    ];

    const ordersRows = [
      {
        id: 'ord-1',
        totalCents: 2990,
        paymentStatus: 'PAID',
        platform: 'instagram',
        service: 'followers',
        planId: 'plan-1000',
        canonicalOfferId: null,
        quantity: 1000,
        createdAt: startDate,
        utmSource: 'google',
        utmCampaign: 'spring_promo',
      },
    ];

    const result = computeAnalyticsMetrics({
      range: '7d',
      startDate,
      endDate,
      checkoutsStartedJourneys: 1,
      checkoutsAbandonedJourneys: 0,
      ordersRows,
      dailyLifecycleEvents: [],
      dailyPaidOrders: [],
      abandonedCartEstimateCents: 0,
      recoveredOrdersCount: 0,
      recoveredRevenueCents: 0,
      rawFunnelEvents,
    });

    expect(result.fullFunnel).toBeDefined();
    expect(result.fullFunnel.steps.length).toBe(12);

    const visitorsStep = result.fullFunnel.steps.find((s) => s.stage === 'visitors');
    expect(visitorsStep?.count).toBe(3);

    const paidStep = result.fullFunnel.steps.find((s) => s.stage === 'paid');
    expect(paidStep?.count).toBe(1);

    expect(result.fullFunnel.biggestDropOff).toBeDefined();

    // Verify analyze performance
    expect(result.analyzePerformance.totalAttempts).toBe(2);
    expect(result.analyzePerformance.successful).toBe(1);
    expect(result.analyzePerformance.failed).toBe(1);
    expect(result.analyzePerformance.successRate).toBe(50);

    // Verify preCheckoutNetworkInterest
    const igInterest = result.preCheckoutNetworkInterest.find((n) => n.platformKey === 'instagram');
    expect(igInterest?.selectedSessions).toBe(1);
    expect(igInterest?.paidOrders).toBe(1);

    // Verify preCheckoutServiceInterest
    const followersInterest = result.preCheckoutServiceInterest.find((s) => s.serviceKey === 'followers');
    expect(followersInterest?.selectedSessions).toBe(1);
  });
});
