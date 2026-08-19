import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { submitOrderToPeakerrManual } from '@/services/fulfillment.service';
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

describe('Controlled Live Peakerr Order Submit & Safety Tests', () => {
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

  it('A) flag false -> Blocks submitOrderToPeakerrManual with zero HTTP calls', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch');

    const res = await submitOrderToPeakerrManual('ord_test_flag_false');
    expect(res.success).toBe(false);
    expect(res.code).toBe('LIVE_FULFILLMENT_DISABLED');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('B, C, D) flag true + valid order -> Uses orders.quantity = 2000 and Primary Service ID', async () => {
    process.env.PEAKERR_LIVE_FULFILLMENT = 'true';
    process.env.PEAKERR_API_KEY = 'test_key';

    const mockOrder = {
      id: 'ord_live_test_1',
      publicId: 'CF-LIVE-001',
      paymentStatus: 'PAID',
      fulfillmentStatus: 'NOT_DISPATCHED',
      platform: 'instagram',
      service: 'followers',
      quantity: 2000,
      profileUrl: 'https://instagram.com/anaclaramaderite',
    };

    const mockChain = {
      id: 'chain_1',
      platform: 'instagram',
      service: 'followers',
      variant: 'standard',
      name: 'Instagram Followers (Standard)',
      autoFallback: true,
      active: true,
    };

    const mockServices = [
      { providerServiceId: '31714', priority: 1, minQuantity: 10, maxQuantity: 1000000, active: true },
      { providerServiceId: '31849', priority: 2, minQuantity: 10, maxQuantity: 1000000, active: true },
    ];

    (db.query.orders.findMany as any).mockResolvedValue([mockOrder]);
    (db.query.fulfillmentChains.findMany as any).mockResolvedValue([mockChain]);
    (db.query.fulfillmentChainServices.findMany as any).mockResolvedValue(mockServices);

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
            returning: vi.fn().mockResolvedValue([{ id: 'ful_1', orderId: 'ord_live_test_1' }]),
          }),
        }),
      };
      return await cb(mockTx);
    });

    const createSpy = vi.spyOn(peakerrClient, 'createOrder').mockResolvedValueOnce({
      success: true,
      order: 778899,
      rawResponse: { order: 778899 },
    });

    const res = await submitOrderToPeakerrManual('ord_live_test_1');

    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledWith({
      service: '31714',
      link: 'https://instagram.com/anaclaramaderite',
      quantity: 2000,
    });

    expect(res.success).toBe(true);
    expect(res.providerOrderId).toBe(778899);
    expect(res.status).toBe('PROCESSING');
  });

  it('G, H) Unpaid order or non NOT_DISPATCHED fulfillment status cannot be claimed', async () => {
    process.env.PEAKERR_LIVE_FULFILLMENT = 'true';
    process.env.PEAKERR_API_KEY = 'test_key';

    (db.query.orders.findMany as any).mockResolvedValue([
      {
        id: 'ord_unpaid_or_dispatched',
        publicId: 'CF-UNPAID',
        paymentStatus: 'PENDING',
        fulfillmentStatus: 'NOT_DISPATCHED',
      },
    ]);

    const res = await submitOrderToPeakerrManual('ord_unpaid_or_dispatched');
    expect(res.success).toBe(false);
    expect(res.code).toBe('PAYMENT_NOT_ELIGIBLE');
  });

  it('O, P) Network timeout returns isAmbiguous = true and keeps SUBMITTING state (Zero fallback)', async () => {
    process.env.PEAKERR_LIVE_FULFILLMENT = 'true';
    process.env.PEAKERR_API_KEY = 'test_key';

    const mockOrder = {
      id: 'ord_timeout_test',
      publicId: 'CF-TIMEOUT-001',
      paymentStatus: 'PAID',
      fulfillmentStatus: 'NOT_DISPATCHED',
      platform: 'instagram',
      service: 'followers',
      quantity: 1000,
      profileUrl: 'https://instagram.com/anaclaramaderite',
    };

    (db.query.orders.findMany as any).mockResolvedValue([mockOrder]);
    (db.query.fulfillmentChains.findMany as any).mockResolvedValue([{ id: 'c1', platform: 'instagram', service: 'followers', variant: 'standard', name: 'IG' }]);
    (db.query.fulfillmentChainServices.findMany as any).mockResolvedValue([{ providerServiceId: '31714', priority: 1, minQuantity: 10, maxQuantity: 1000000, active: true }]);

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
            returning: vi.fn().mockResolvedValue([{ id: 'ful_timeout' }]),
          }),
        }),
      };
      return await cb(mockTx);
    });

    vi.spyOn(peakerrClient, 'createOrder').mockResolvedValueOnce({
      success: false,
      error: 'AMBIGUOUS_SUBMISSION: Request timed out',
      errorKind: 'AMBIGUOUS_SUBMISSION',
      isAmbiguous: true,
    });

    const res = await submitOrderToPeakerrManual('ord_timeout_test');
    expect(res.success).toBe(false);
    expect(res.isAmbiguous).toBe(true);
    expect(res.code).toBe('AMBIGUOUS_SUBMISSION');
  });
});
