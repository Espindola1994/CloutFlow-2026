import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  submitOrderToPeakerrManual,
  resolveCanonicalFulfillmentTarget,
} from '@/services/fulfillment.service';
import { peakerrClient } from '@/providers/peakerr/peakerr.client';
import { db } from '@/db';

vi.mock('@/db', () => ({
  db: {
    transaction: vi.fn(),
    select: vi.fn(),
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

describe('Phase 3.8 — Atomic Claim, Rollback & Canonical Target Tests', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...ORIGINAL_ENV };
    delete process.env.PEAKERR_LIVE_FULFILLMENT;
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    vi.restoreAllMocks();
  });

  it('A) Canonical target resolves https://instagram.com/guilhermeterraaa even if profileUrl is null and socialUsername is provided', () => {
    const orderFixture = {
      platform: 'instagram',
      service: 'followers',
      socialUsername: 'guilhermeterraaa',
      profileUrl: null,
      targetUrl: 'https://instagram.com/guilhermeterraaa',
    };

    const targetRes = resolveCanonicalFulfillmentTarget(orderFixture);
    expect(targetRes.success).toBe(true);
    if (targetRes.success) {
      expect(targetRes.target).toBe('https://instagram.com/guilhermeterraaa');
      expect(targetRes.target).not.toBe('guilhermeterraaa');
    }
  });

  it('B) Canonical target normalizes bare username to full https URL for Instagram Followers', () => {
    const orderFixture = {
      platform: 'instagram',
      service: 'followers',
      socialUsername: 'guilhermeterraaa',
      profileUrl: null,
      targetUrl: null,
    };

    const targetRes = resolveCanonicalFulfillmentTarget(orderFixture);
    expect(targetRes.success).toBe(true);
    if (targetRes.success) {
      expect(targetRes.target).toBe('https://instagram.com/guilhermeterraaa');
    }
  });

  it('C) Single transaction failure (e.g. relation fulfillment_orders does not exist) causes full rollback and leaves Order as NOT_DISPATCHED', async () => {
    process.env.PEAKERR_LIVE_FULFILLMENT = 'true';
    process.env.PEAKERR_API_KEY = 'test_key';

    const mockOrder = {
      id: '665e9a3d-0c78-4684-b317-4d78690f9b30',
      publicId: 'CF-1278LNR048',
      paymentStatus: 'PAID',
      fulfillmentStatus: 'NOT_DISPATCHED',
      platform: 'instagram',
      service: 'followers',
      quantity: 2000,
      socialUsername: 'guilhermeterraaa',
      targetUrl: 'https://instagram.com/guilhermeterraaa',
    };

    (db.query.orders.findMany as any).mockResolvedValue([mockOrder]);
    (db.query.fulfillmentChains.findMany as any).mockResolvedValue([
      { id: 'c1', platform: 'instagram', service: 'followers', variant: 'standard', name: 'IG Followers' },
    ]);
    (db.query.fulfillmentChainServices.findMany as any).mockResolvedValue([
      { providerServiceId: '31714', priority: 1, minQuantity: 10, maxQuantity: 1000000, active: true },
    ]);

    // Simulate database transaction failure when inserting to fulfillment_orders (42P01 table missing)
    (db.transaction as any).mockImplementationOnce(async () => {
      const err: any = new Error('relation "fulfillment_orders" does not exist');
      err.code = '42P01';
      throw err;
    });

    const createSpy = vi.spyOn(peakerrClient, 'createOrder');

    const res = await submitOrderToPeakerrManual('CF-1278LNR048');

    // Peakerr HTTP call must NEVER be executed if transaction failed
    expect(createSpy).not.toHaveBeenCalled();
    expect(res.success).toBe(false);
    expect(res.code).toBe('ATOMIC_CLAIM_FAILED');
    expect(res.error).toContain('relation "fulfillment_orders" does not exist');
  });

  it('D) Successful submit passes canonical full URL (https://instagram.com/guilhermeterraaa) to Peakerr action=add', async () => {
    process.env.PEAKERR_LIVE_FULFILLMENT = 'true';
    process.env.PEAKERR_API_KEY = 'test_key';

    const mockOrder = {
      id: '665e9a3d-0c78-4684-b317-4d78690f9b30',
      publicId: 'CF-1278LNR048',
      paymentStatus: 'PAID',
      fulfillmentStatus: 'NOT_DISPATCHED',
      platform: 'instagram',
      service: 'followers',
      quantity: 2000,
      socialUsername: 'guilhermeterraaa',
      targetUrl: 'https://instagram.com/guilhermeterraaa',
    };

    (db.query.orders.findMany as any).mockResolvedValue([mockOrder]);
    (db.query.fulfillmentChains.findMany as any).mockResolvedValue([
      { id: 'c1', platform: 'instagram', service: 'followers', variant: 'standard', name: 'IG Followers' },
    ]);
    (db.query.fulfillmentChainServices.findMany as any).mockResolvedValue([
      { providerServiceId: '31714', priority: 1, minQuantity: 10, maxQuantity: 1000000, active: true },
    ]);

    (db.transaction as any).mockImplementation(async (cb: any) => {
      const mockTx = {
        update: vi.fn().mockReturnValue({
          set: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              returning: vi.fn().mockResolvedValue([{ ...mockOrder, fulfillmentStatus: 'SUBMITTING' }]),
            }),
          }),
        }),
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([{ id: 'ful_entry_1' }]),
          }),
        }),
      };
      return await cb(mockTx);
    });

    const createSpy = vi.spyOn(peakerrClient, 'createOrder').mockResolvedValueOnce({
      success: true,
      order: 112233,
      rawResponse: { order: 112233 },
    });

    const res = await submitOrderToPeakerrManual('CF-1278LNR048');

    expect(res.success).toBe(true);
    expect(createSpy).toHaveBeenCalledWith({
      service: '31714',
      link: 'https://instagram.com/guilhermeterraaa',
      quantity: 2000,
    });
  });
});
