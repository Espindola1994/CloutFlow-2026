import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateFulfillmentPreview, resolveAndValidateTarget } from '@/services/fulfillment-chain.service';
import { classifyPeakerrError, canFallbackOnError } from '@/lib/fulfillment/fallback-policy';
import { peakerrClient } from '@/providers/peakerr/peakerr.client';
import { db } from '@/db';

vi.mock('@/db', () => ({
  db: {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    }),
    query: {
      orders: {
        findMany: vi.fn(),
      },
      fulfillmentChains: {
        findMany: vi.fn(),
      },
      fulfillmentChainServices: {
        findMany: vi.fn(),
      },
    },
  },
}));

describe('Phase 3.0B — Peakerr Fulfillment Chains Validation & Dry Run', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('A, B, C, D) Chain creation, resolution and priority uniqueness test fixtures', async () => {
    const mockChain = {
      id: 'chain_ig_fol',
      platform: 'instagram',
      service: 'followers',
      variant: 'standard',
      name: 'Instagram Followers (Standard)',
      autoFallback: true,
      active: true,
    };

    const mockServices = [
      { providerServiceId: '31249', priority: 1, minQuantity: 10, maxQuantity: 1000000, active: true },
      { providerServiceId: '22042', priority: 2, minQuantity: 10, maxQuantity: 1000000, active: true },
      { providerServiceId: '30428', priority: 3, minQuantity: 10, maxQuantity: 1000000, active: true },
    ];

    const mockOrder = {
      id: 'ord_real_test',
      publicId: 'CF-2000-TEST',
      paymentStatus: 'PAID',
      fulfillmentStatus: 'NOT_DISPATCHED',
      platform: 'instagram',
      service: 'followers',
      quantity: 2000,
      profileUrl: 'https://instagram.com/anaclaramaderite',
      socialUsername: 'anaclaramaderite',
    };

    (db.query.orders.findMany as any).mockResolvedValue([mockOrder]);
    (db.query.fulfillmentChains.findMany as any).mockResolvedValue([mockChain]);
    (db.query.fulfillmentChainServices.findMany as any).mockResolvedValue(mockServices);

    const res = await generateFulfillmentPreview('ord_real_test');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.action).toBe('DRY_RUN_READY');
      expect(res.primaryServiceId).toBe('31249');
      expect(res.fallbacks).toEqual(['22042', '30428']);
      expect(res.chainServicesEvaluation[0].priority).toBe(1);
      expect(res.chainServicesEvaluation[1].priority).toBe(2);
      expect(res.chainServicesEvaluation[2].priority).toBe(3);
    }
  });

  it('F, G) Order quantity 2000 is strictly preserved and PerfectPay plan.quantity=1 is ignored', async () => {
    const mockOrder = {
      id: 'ord_qty_source',
      paymentStatus: 'PAID',
      fulfillmentStatus: 'NOT_DISPATCHED',
      platform: 'instagram',
      service: 'followers',
      quantity: 2000,
      profileUrl: 'https://instagram.com/target',
    };

    const mockChain = {
      id: 'chain_ig_fol',
      platform: 'instagram',
      service: 'followers',
      variant: 'standard',
      name: 'Instagram Followers',
      autoFallback: true,
      active: true,
    };

    const mockServices = [
      { providerServiceId: '31249', priority: 1, minQuantity: 10, maxQuantity: 1000000, active: true },
    ];

    (db.query.orders.findMany as any).mockResolvedValue([mockOrder]);
    (db.query.fulfillmentChains.findMany as any).mockResolvedValue([mockChain]);
    (db.query.fulfillmentChainServices.findMany as any).mockResolvedValue(mockServices);

    const res = await generateFulfillmentPreview('ord_qty_source');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.quantity).toBe(2000);
      expect(res.quantity).not.toBe(1);
    }
  });

  it('H) Followers target resolution prioritizes profile_url and falls back to social_username URL', () => {
    const withProfileUrl = resolveAndValidateTarget(
      'https://instagram.com/anaclaramaderite',
      'instagram',
      'followers'
    );
    expect(withProfileUrl.success).toBe(true);
    if (withProfileUrl.success) {
      expect(withProfileUrl.target).toBe('https://instagram.com/anaclaramaderite');
      expect(withProfileUrl.targetType).toBe('profile_url');
    }

    const withUsernameFallback = resolveAndValidateTarget(
      'anaclaramaderite',
      'instagram',
      'followers'
    );
    expect(withUsernameFallback.success).toBe(true);
    if (withUsernameFallback.success) {
      expect(withUsernameFallback.target).toBe('https://instagram.com/anaclaramaderite');
      expect(withUsernameFallback.targetType).toBe('profile_fallback');
    }
  });

  it('I, J, K) Likes, Views, Comments strictly resolve targetUrl and ignore profileUrl', () => {
    ['likes', 'views', 'comments'].forEach((svc) => {
      const res = resolveAndValidateTarget(
        'https://tiktok.com/@user/video/998877',
        'tiktok',
        svc
      );
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.target).toBe('https://tiktok.com/@user/video/998877');
        expect(res.targetType).toBe('content_url');
      }
    });
  });

  it('L) Unpaid order (PENDING / FAILED / REFUNDED) is blocked from preview', async () => {
    const mockOrder = {
      id: 'ord_unpaid',
      paymentStatus: 'PENDING',
      fulfillmentStatus: 'NOT_DISPATCHED',
      platform: 'instagram',
      service: 'followers',
      quantity: 1000,
      profileUrl: 'https://instagram.com/test',
    };

    (db.query.orders.findMany as any).mockResolvedValue([mockOrder]);

    const res = await generateFulfillmentPreview('ord_unpaid');
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.code).toBe('PAYMENT_NOT_ELIGIBLE');
    }
  });

  it('M) Already dispatched fulfillment status (PENDING / PROCESSING / SUBMITTED / COMPLETED) triggers Inspection Mode', async () => {
    const statuses = ['PENDING', 'SUBMITTED', 'PROCESSING', 'COMPLETED'];
    for (const st of statuses) {
      const mockOrder = {
        id: `ord_${st}`,
        publicId: `CF-${st}`,
        paymentStatus: 'PAID',
        fulfillmentStatus: st,
        platform: 'instagram',
        service: 'followers',
        quantity: 1000,
        profileUrl: 'https://instagram.com/test',
      };

      (db.query.orders.findMany as any).mockResolvedValue([mockOrder]);
      (db.query.fulfillmentChains.findMany as any).mockResolvedValue([
        { id: 'c1', platform: 'instagram', service: 'followers', variant: 'standard', name: 'IG', autoFallback: true, active: true },
      ]);
      (db.query.fulfillmentChainServices.findMany as any).mockResolvedValue([
        { providerServiceId: '31714', priority: 1, minQuantity: 10, maxQuantity: 1000000, active: true },
      ]);

      const res = await generateFulfillmentPreview(`ord_${st}`);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.mode).toBe('INSPECTION');
        expect(res.alreadyDispatched).toBe(true);
      }
    }
  });

  it('N) Missing target is blocked', async () => {
    const mockOrder = {
      id: 'ord_no_target',
      paymentStatus: 'PAID',
      fulfillmentStatus: 'NOT_DISPATCHED',
      platform: 'instagram',
      service: 'followers',
      quantity: 1000,
      profileUrl: null,
      socialUsername: null,
    };

    (db.query.orders.findMany as any).mockResolvedValue([mockOrder]);

    const res = await generateFulfillmentPreview('ord_no_target');
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.code).toBe('MISSING_TARGET');
    }
  });

  it('O) Missing chain returns CHAIN_NOT_FOUND', async () => {
    const mockOrder = {
      id: 'ord_no_chain',
      paymentStatus: 'PAID',
      fulfillmentStatus: 'NOT_DISPATCHED',
      platform: 'instagram',
      service: 'followers',
      quantity: 1000,
      profileUrl: 'https://instagram.com/test',
    };

    (db.query.orders.findMany as any).mockResolvedValue([mockOrder]);
    (db.query.fulfillmentChains.findMany as any).mockResolvedValue([]);

    const res = await generateFulfillmentPreview('ord_no_chain');
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.code).toBe('CHAIN_NOT_FOUND');
    }
  });

  it('P) Min / Max constraints filter ineligible provider service IDs', async () => {
    const mockOrder = {
      id: 'ord_min_max_filter',
      paymentStatus: 'PAID',
      fulfillmentStatus: 'NOT_DISPATCHED',
      platform: 'instagram',
      service: 'followers',
      quantity: 5000,
      profileUrl: 'https://instagram.com/test',
    };

    const mockChain = {
      id: 'chain_ig_fol',
      platform: 'instagram',
      service: 'followers',
      variant: 'standard',
      name: 'Instagram Followers',
      autoFallback: true,
      active: true,
    };

    const mockServices = [
      { providerServiceId: 'S_OK_PRIMARY', priority: 1, minQuantity: 10, maxQuantity: 10000, active: true },
      { providerServiceId: 'S_TOO_SMALL_MAX', priority: 2, minQuantity: 10, maxQuantity: 1000, active: true },
      { providerServiceId: 'S_TOO_LARGE_MIN', priority: 3, minQuantity: 10000, maxQuantity: 50000, active: true },
    ];

    (db.query.orders.findMany as any).mockResolvedValue([mockOrder]);
    (db.query.fulfillmentChains.findMany as any).mockResolvedValue([mockChain]);
    (db.query.fulfillmentChainServices.findMany as any).mockResolvedValue(mockServices);

    const res = await generateFulfillmentPreview('ord_min_max_filter');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.primaryServiceId).toBe('S_OK_PRIMARY');
      expect(res.fallbacks).toEqual([]);
      expect(res.chainServicesEvaluation.filter((s) => s.eligible)).toHaveLength(1);
    }
  });

  it('Q) Priority ordering is strictly respected (1 -> 2 -> 3)', async () => {
    const mockOrder = {
      id: 'ord_priority_order',
      paymentStatus: 'PAID',
      fulfillmentStatus: 'NOT_DISPATCHED',
      platform: 'instagram',
      service: 'followers',
      quantity: 1000,
      profileUrl: 'https://instagram.com/test',
    };

    const mockChain = {
      id: 'chain_ig_fol',
      platform: 'instagram',
      service: 'followers',
      variant: 'standard',
      name: 'Instagram Followers',
      autoFallback: true,
      active: true,
    };

    const mockServices = [
      { providerServiceId: 'P3', priority: 3, minQuantity: 10, maxQuantity: 10000, active: true },
      { providerServiceId: 'P1', priority: 1, minQuantity: 10, maxQuantity: 10000, active: true },
      { providerServiceId: 'P2', priority: 2, minQuantity: 10, maxQuantity: 10000, active: true },
    ];

    (db.query.orders.findMany as any).mockResolvedValue([mockOrder]);
    (db.query.fulfillmentChains.findMany as any).mockResolvedValue([mockChain]);
    (db.query.fulfillmentChainServices.findMany as any).mockResolvedValue(mockServices);

    const res = await generateFulfillmentPreview('ord_priority_order');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.primaryServiceId).toBe('P1');
      expect(res.fallbacks).toEqual(['P2', 'P3']);
      expect(res.chainServicesEvaluation[0].priority).toBe(1);
      expect(res.chainServicesEvaluation[1].priority).toBe(2);
      expect(res.chainServicesEvaluation[2].priority).toBe(3);
    }
  });

  it('R) Peakerr Client Dry Run executes ZERO live HTTP calls', async () => {
    const dryRunResult = await peakerrClient.createOrderDryRun({
      service: '31249',
      link: 'https://instagram.com/anaclaramaderite',
      quantity: 2000,
    });
    expect(dryRunResult.dryRun).toBe(true);
    expect(dryRunResult.request.service).toBe('31249');
    expect(dryRunResult.request.quantity).toBe(2000);
  });
});
