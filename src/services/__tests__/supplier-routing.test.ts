import { describe, it, expect, vi, beforeEach } from 'vitest';
import { executeSupplierRouting } from '@/services/supplier-routing.service';
import { peakerrClient } from '@/providers/peakerr/peakerr.client';
import { db } from '@/db';

describe('Supplier Routing Service - Full Cascade & Fulfillment Engine', () => {
  const mockOrderId = 'ord_routing_test_1';
  const mockPublicId = 'CF-ROUTE-123';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('routes to Priority supplier in Dry Run when priority is available and within Cost Ceiling', async () => {
    // Mock Order
    vi.spyOn(db.query.orders, 'findMany').mockResolvedValueOnce([
      {
        id: mockOrderId,
        publicId: mockPublicId,
        platform: 'instagram',
        service: 'followers',
        quantity: 1000,
        totalCents: 2000, // $20.00
        paymentStatus: 'PAID',
        fulfillmentStatus: 'NOT_DISPATCHED',
        profileUrl: 'https://instagram.com/cloutflow',
        planId: 'plan_1',
        offerId: null,
      } as any,
    ]);

    // Mock Plan with Priority ($1.50/1000), Fallback 1 ($2.50), Fallback 2 ($3.00)
    // Min margin: 40% (max cost $12.00), Min profit: $5.00 (max cost $15.00) -> Allowed cost = $12.00
    vi.spyOn(db.query.plans, 'findMany').mockResolvedValueOnce([
      {
        id: 'plan_1',
        name: '1000 Followers Package',
        regularPriceCents: 2000,
        priorityServiceId: '30159',
        fallback1ServiceId: '30160',
        fallback2ServiceId: '30161',
        minimumGrossMarginPercent: 40,
        minimumGrossProfitCents: 500,
        costCeilingEnabled: true,
        manualReviewEnabled: false,
      } as any,
    ]);

    // Mock Live Peakerr Catalog
    vi.spyOn(peakerrClient, 'getServices').mockResolvedValueOnce([
      { service: '30159', rate: '0.975', min: '10', max: '100000', name: 'IG Followers Priority' } as any,
      { service: '30160', rate: '1.500', min: '10', max: '100000', name: 'IG Followers FB1' } as any,
    ]);

    const createOrderSpy = vi.spyOn(peakerrClient, 'createOrder');

    const result = await executeSupplierRouting(mockOrderId, { dryRun: true });

    expect(result.success).toBe(true);
    expect(result.isDryRun).toBe(true);
    expect(result.routingStatus).toBe('SUBMITTED');
    expect(result.selectedSupplierPosition).toBe('priority');
    expect(result.selectedSupplierServiceId).toBe('30159');
    expect(result.selectedRate).toBe(0.975);
    expect(result.calculatedCost).toBe(0.975);
    expect(result.sellingPrice).toBe(20.0);
    expect(result.allowedSupplierCost).toBe(12.0);
    expect(result.grossProfit).toBe(19.025);
    expect(result.grossMarginPercent).toBe(95.13);
    // Crucial: createOrder must NEVER be called in dryRun
    expect(createOrderSpy).not.toHaveBeenCalled();
  });

  it('falls back to Fallback 1 when Priority is unavailable in live catalog', async () => {
    vi.spyOn(db.query.orders, 'findMany').mockResolvedValueOnce([
      {
        id: mockOrderId,
        publicId: mockPublicId,
        platform: 'instagram',
        service: 'followers',
        quantity: 2000,
        totalCents: 3000, // $30.00
        paymentStatus: 'PAID',
        fulfillmentStatus: 'NOT_DISPATCHED',
        profileUrl: 'https://instagram.com/cloutflow',
        planId: 'plan_2',
        offerId: null,
      } as any,
    ]);

    vi.spyOn(db.query.plans, 'findMany').mockResolvedValueOnce([
      {
        id: 'plan_2',
        name: '2000 Followers Package',
        regularPriceCents: 3000,
        priorityServiceId: '99999', // Dead service ID
        fallback1ServiceId: '30160',
        fallback2ServiceId: '30161',
        minimumGrossMarginPercent: 50, // Max cost $15.00
        minimumGrossProfitCents: 1000, // Max cost $20.00
        costCeilingEnabled: true,
        manualReviewEnabled: false,
      } as any,
    ]);

    // Service 99999 is NOT in live catalog, 30160 is
    vi.spyOn(peakerrClient, 'getServices').mockResolvedValueOnce([
      { service: '30160', rate: '2.00', min: '10', max: '50000', name: 'FB1 Service' } as any,
    ]);

    const result = await executeSupplierRouting(mockOrderId, { dryRun: true });

    expect(result.success).toBe(true);
    expect(result.selectedSupplierPosition).toBe('fallback1');
    expect(result.selectedSupplierServiceId).toBe('30160');
    expect(result.attempts.length).toBe(2);
    expect(result.attempts[0].decision).toBe('REJECTED');
    expect(result.attempts[0].reason).toContain('SERVICE_UNAVAILABLE');
    expect(result.attempts[1].decision).toBe('ACCEPTED');
  });

  it('falls back to Fallback 1 when Priority rate exceeds Cost Ceiling', async () => {
    vi.spyOn(db.query.orders, 'findMany').mockResolvedValueOnce([
      {
        id: mockOrderId,
        publicId: mockPublicId,
        platform: 'instagram',
        service: 'followers',
        quantity: 5000,
        totalCents: 2500, // Selling price $25.00
        paymentStatus: 'PAID',
        fulfillmentStatus: 'NOT_DISPATCHED',
        profileUrl: 'https://instagram.com/cloutflow',
        planId: 'plan_3',
        offerId: null,
      } as any,
    ]);

    // Max cost allowed: min(25 * (1 - 0.5) = $12.50, 25 - 15 = $10.00) = $10.00
    vi.spyOn(db.query.plans, 'findMany').mockResolvedValueOnce([
      {
        id: 'plan_3',
        name: '5000 Followers',
        regularPriceCents: 2500,
        priorityServiceId: 'priority_expensive',
        fallback1ServiceId: 'fallback1_cheap',
        fallback2ServiceId: null,
        minimumGrossMarginPercent: 50,
        minimumGrossProfitCents: 1500,
        costCeilingEnabled: true,
        manualReviewEnabled: false,
      } as any,
    ]);

    // Priority rate: $2.50 / 1000 -> 5000 units = $12.50 > $10.00 (HOLD_COST)
    // Fallback 1 rate: $1.20 / 1000 -> 5000 units = $6.00 <= $10.00 (APPROVED)
    vi.spyOn(peakerrClient, 'getServices').mockResolvedValueOnce([
      { service: 'priority_expensive', rate: '2.50', min: '10', max: '100000' } as any,
      { service: 'fallback1_cheap', rate: '1.20', min: '10', max: '100000' } as any,
    ]);

    const result = await executeSupplierRouting(mockOrderId, { dryRun: true });

    expect(result.success).toBe(true);
    expect(result.selectedSupplierPosition).toBe('fallback1');
    expect(result.selectedSupplierServiceId).toBe('fallback1_cheap');
    expect(result.attempts.length).toBe(2);
    expect(result.attempts[0].decision).toBe('HOLD_COST');
    expect(result.attempts[1].decision).toBe('ACCEPTED');
  });

  it('falls back to Fallback 2 when Priority and Fallback 1 exceed Cost Ceiling', async () => {
    vi.spyOn(db.query.orders, 'findMany').mockResolvedValueOnce([
      {
        id: mockOrderId,
        publicId: mockPublicId,
        platform: 'instagram',
        service: 'followers',
        quantity: 10000,
        totalCents: 5000, // $50.00
        paymentStatus: 'PAID',
        fulfillmentStatus: 'NOT_DISPATCHED',
        profileUrl: 'https://instagram.com/cloutflow',
        planId: 'plan_4',
        offerId: null,
      } as any,
    ]);

    // Allowed cost: $20.00
    vi.spyOn(db.query.plans, 'findMany').mockResolvedValueOnce([
      {
        id: 'plan_4',
        name: '10000 Followers',
        regularPriceCents: 5000,
        priorityServiceId: 'pri_exp',
        fallback1ServiceId: 'fb1_exp',
        fallback2ServiceId: 'fb2_ok',
        minimumGrossMarginPercent: 60, // Max cost $20.00
        minimumGrossProfitCents: 2000, // Max cost $30.00
        costCeilingEnabled: true,
        manualReviewEnabled: false,
      } as any,
    ]);

    // Priority: $2.50/k -> 10k = $25.00 > $20 (HOLD)
    // FB1: $2.20/k -> 10k = $22.00 > $20 (HOLD)
    // FB2: $1.80/k -> 10k = $18.00 <= $20 (ACCEPTED)
    vi.spyOn(peakerrClient, 'getServices').mockResolvedValueOnce([
      { service: 'pri_exp', rate: '2.50', min: '10', max: '100000' } as any,
      { service: 'fb1_exp', rate: '2.20', min: '10', max: '100000' } as any,
      { service: 'fb2_ok', rate: '1.80', min: '10', max: '100000' } as any,
    ]);

    const result = await executeSupplierRouting(mockOrderId, { dryRun: true });

    expect(result.success).toBe(true);
    expect(result.selectedSupplierPosition).toBe('fallback2');
    expect(result.selectedSupplierServiceId).toBe('fb2_ok');
    expect(result.attempts.length).toBe(3);
    expect(result.attempts[0].decision).toBe('HOLD_COST');
    expect(result.attempts[1].decision).toBe('HOLD_COST');
    expect(result.attempts[2].decision).toBe('ACCEPTED');
  });

  it('sets routingStatus to HOLD_SUPPLIER_COST when all suppliers exceed Cost Ceiling', async () => {
    vi.spyOn(db.query.orders, 'findMany').mockResolvedValueOnce([
      {
        id: mockOrderId,
        publicId: mockPublicId,
        platform: 'instagram',
        service: 'followers',
        quantity: 5000,
        totalCents: 2000, // $20.00
        paymentStatus: 'PAID',
        fulfillmentStatus: 'NOT_DISPATCHED',
        profileUrl: 'https://instagram.com/cloutflow',
        planId: 'plan_5',
        offerId: null,
      } as any,
    ]);

    // Allowed cost: $8.00
    vi.spyOn(db.query.plans, 'findMany').mockResolvedValueOnce([
      {
        id: 'plan_5',
        name: '5000 Followers',
        regularPriceCents: 2000,
        priorityServiceId: 'pri_1',
        fallback1ServiceId: 'fb_1',
        fallback2ServiceId: 'fb_2',
        minimumGrossMarginPercent: 60, // Max cost $8.00
        minimumGrossProfitCents: 1000,
        costCeilingEnabled: true,
        manualReviewEnabled: false,
      } as any,
    ]);

    // All > $8.00
    vi.spyOn(peakerrClient, 'getServices').mockResolvedValueOnce([
      { service: 'pri_1', rate: '2.00', min: '10', max: '50000' } as any, // 5k @ 2.0 = $10.00 > $8.00
      { service: 'fb_1', rate: '1.90', min: '10', max: '50000' } as any, // 5k @ 1.9 = $9.50 > $8.00
      { service: 'fb_2', rate: '1.80', min: '10', max: '50000' } as any, // 5k @ 1.8 = $9.00 > $8.00
    ]);

    const result = await executeSupplierRouting(mockOrderId, { dryRun: true });

    expect(result.success).toBe(false);
    expect(result.routingStatus).toBe('HOLD_SUPPLIER_COST');
    expect(result.code).toBe('HOLD_SUPPLIER_COST');
    expect(result.attempts.length).toBe(3);
    expect(result.attempts.every((a) => a.decision === 'HOLD_COST')).toBe(true);
  });

  it('skips supplier with INCOMPATIBLE_MAX_QUANTITY when quantity exceeds supplier max and routes to fallback', async () => {
    vi.spyOn(db.query.orders, 'findMany').mockResolvedValueOnce([
      {
        id: mockOrderId,
        publicId: mockPublicId,
        platform: 'instagram',
        service: 'followers',
        quantity: 25000,
        totalCents: 10000, // $100.00
        paymentStatus: 'PAID',
        fulfillmentStatus: 'NOT_DISPATCHED',
        profileUrl: 'https://instagram.com/cloutflow',
        planId: 'plan_6',
        offerId: null,
      } as any,
    ]);

    vi.spyOn(db.query.plans, 'findMany').mockResolvedValueOnce([
      {
        id: 'plan_6',
        name: '25000 Followers',
        regularPriceCents: 10000,
        priorityServiceId: 'small_cap_service',
        fallback1ServiceId: 'large_cap_service',
        fallback2ServiceId: null,
        minimumGrossMarginPercent: 40,
        minimumGrossProfitCents: 1000,
        costCeilingEnabled: true,
        manualReviewEnabled: false,
      } as any,
    ]);

    // Priority has max of 10000 (below order qty of 25000)
    // Fallback 1 has max of 50000 (fits 25000)
    vi.spyOn(peakerrClient, 'getServices').mockResolvedValueOnce([
      { service: 'small_cap_service', rate: '0.80', min: '100', max: '10000' } as any,
      { service: 'large_cap_service', rate: '1.00', min: '100', max: '50000' } as any,
    ]);

    const result = await executeSupplierRouting(mockOrderId, { dryRun: true });

    expect(result.success).toBe(true);
    expect(result.selectedSupplierPosition).toBe('fallback1');
    expect(result.selectedSupplierServiceId).toBe('large_cap_service');
    expect(result.attempts[0].reason).toContain('INCOMPATIBLE_MAX_QUANTITY');
  });

  it('places order on MANUAL_REVIEW when manualReviewEnabled is true', async () => {
    vi.spyOn(db.query.orders, 'findMany').mockResolvedValueOnce([
      {
        id: mockOrderId,
        publicId: mockPublicId,
        platform: 'instagram',
        service: 'followers',
        quantity: 50000,
        totalCents: 30000,
        paymentStatus: 'PAID',
        fulfillmentStatus: 'NOT_DISPATCHED',
        profileUrl: 'https://instagram.com/cloutflow',
        planId: 'plan_whale',
        offerId: null,
      } as any,
    ]);

    vi.spyOn(db.query.plans, 'findMany').mockResolvedValueOnce([
      {
        id: 'plan_whale',
        name: '50k Enterprise Package',
        regularPriceCents: 30000,
        priorityServiceId: 'pri_serv',
        minimumGrossMarginPercent: 40,
        minimumGrossProfitCents: 2000,
        costCeilingEnabled: true,
        manualReviewEnabled: true, // Requires manual approval
      } as any,
    ]);

    const result = await executeSupplierRouting(mockOrderId, { dryRun: true });

    expect(result.success).toBe(false);
    expect(result.routingStatus).toBe('MANUAL_REVIEW');
    expect(result.code).toBe('MANUAL_REVIEW');
  });

  it('enforces idempotency and prevents duplicate routing for already claimed orders', async () => {
    vi.spyOn(db.query.orders, 'findMany').mockResolvedValueOnce([
      {
        id: mockOrderId,
        publicId: mockPublicId,
        platform: 'instagram',
        service: 'followers',
        quantity: 1000,
        totalCents: 2000,
        paymentStatus: 'PAID',
        fulfillmentStatus: 'PROCESSING', // Already dispatched!
        profileUrl: 'https://instagram.com/cloutflow',
      } as any,
    ]);

    const result = await executeSupplierRouting(mockOrderId, { dryRun: false });

    expect(result.success).toBe(false);
    expect(result.code).toBe('ORDER_ALREADY_CLAIMED');
  });
});
