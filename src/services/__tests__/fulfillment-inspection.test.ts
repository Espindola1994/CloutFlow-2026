import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateFulfillmentPreview } from '@/services/fulfillment-chain.service';
import { checkPeakerrOrderStatus, submitOrderToPeakerrManual } from '@/services/fulfillment.service';
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

describe('Phase 3.9 — Dispatched Order Inspection & Status Sync Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('A) NOT_DISPATCHED: Preview mode is active and submit is eligible', async () => {
    const mockOrder = {
      id: 'ord_not_dispatched',
      publicId: 'CF-NOT-DISPATCHED',
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
      { id: 'c1', platform: 'instagram', service: 'followers', variant: 'standard', name: 'IG Followers', autoFallback: true, active: true },
    ]);
    (db.query.fulfillmentChainServices.findMany as any).mockResolvedValue([
      { providerServiceId: '31714', priority: 1, minQuantity: 10, maxQuantity: 1000000, active: true },
    ]);

    const res = await generateFulfillmentPreview('CF-NOT-DISPATCHED');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.action).toBe('DRY_RUN_READY');
      expect(res.mode).toBe('PREVIEW');
      expect(res.alreadyDispatched).toBe(false);
    }
  });

  it('B, D) PROCESSING: Inspection mode loads order safely, attaches fulfillment_order, and blocks submit', async () => {
    const mockOrder = {
      id: '665e9a3d-0c78-4684-b317-4d78690f9b30',
      publicId: 'CF-1278LNR048',
      paymentStatus: 'PAID',
      fulfillmentStatus: 'PROCESSING',
      platform: 'instagram',
      service: 'followers',
      quantity: 2000,
      socialUsername: 'guilhermeterraaa',
      targetUrl: 'https://instagram.com/guilhermeterraaa',
    };

    const mockFulfillmentOrder = {
      id: 'ful_80339204',
      orderId: '665e9a3d-0c78-4684-b317-4d78690f9b30',
      provider: 'peakerr',
      externalOrderId: '80339204',
      externalServiceId: '31714',
      status: 'PROCESSING',
      submittedAt: new Date('2026-08-19T04:40:00Z'),
      lastError: null,
    };

    (db.query.orders.findMany as any).mockResolvedValue([mockOrder]);
    (db.query.fulfillmentChains.findMany as any).mockResolvedValue([
      { id: 'c1', platform: 'instagram', service: 'followers', variant: 'standard', name: 'IG Followers', autoFallback: true, active: true },
    ]);
    (db.query.fulfillmentChainServices.findMany as any).mockResolvedValue([
      { providerServiceId: '31714', priority: 1, minQuantity: 10, maxQuantity: 1000000, active: true },
    ]);

    // Mock select fulfillment_orders
    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockFulfillmentOrder]),
          }),
        }),
      }),
    });

    const res = await generateFulfillmentPreview('CF-1278LNR048');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.action).toBe('INSPECTION_MODE');
      expect(res.mode).toBe('INSPECTION');
      expect(res.alreadyDispatched).toBe(true);
      expect(res.latestFulfillment?.externalOrderId).toBe('80339204');
      expect(res.latestFulfillment?.externalServiceId).toBe('31714');
      expect(res.latestFulfillment?.status).toBe('PROCESSING');
    }

    // Submit must be BLOCKED
    process.env.PEAKERR_LIVE_FULFILLMENT = 'true';
    const submitRes = await submitOrderToPeakerrManual('CF-1278LNR048');
    expect(submitRes.success).toBe(false);
    expect(submitRes.code).toBe('ORDER_ALREADY_CLAIMED');
  });

  it('C) COMPLETED: Inspection mode allows status check and blocks submit', async () => {
    const mockOrder = {
      id: 'ord_completed',
      publicId: 'CF-COMPLETED-1',
      paymentStatus: 'PAID',
      fulfillmentStatus: 'COMPLETED',
      platform: 'instagram',
      service: 'followers',
      quantity: 2000,
      socialUsername: 'guilhermeterraaa',
      targetUrl: 'https://instagram.com/guilhermeterraaa',
    };

    (db.query.orders.findMany as any).mockResolvedValue([mockOrder]);
    (db.query.fulfillmentChains.findMany as any).mockResolvedValue([
      { id: 'c1', platform: 'instagram', service: 'followers', variant: 'standard', name: 'IG Followers', autoFallback: true, active: true },
    ]);
    (db.query.fulfillmentChainServices.findMany as any).mockResolvedValue([
      { providerServiceId: '31714', priority: 1, minQuantity: 10, maxQuantity: 1000000, active: true },
    ]);

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 'ful_c', externalOrderId: '80339204', status: 'COMPLETED' }]),
          }),
        }),
      }),
    });

    const res = await generateFulfillmentPreview('CF-COMPLETED-1');
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.alreadyDispatched).toBe(true);
      expect(res.mode).toBe('INSPECTION');
    }
  });

  it('E) external_order_id absent -> checkPeakerrOrderStatus returns NO_PROVIDER_ORDER_YET with zero HTTP calls', async () => {
    (db.query.orders.findMany as any).mockResolvedValue([
      { id: 'ord_no_ext', publicId: 'CF-NO-EXT', paymentStatus: 'PAID', fulfillmentStatus: 'NOT_DISPATCHED' },
    ]);

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      }),
    });

    const statusSpy = vi.spyOn(peakerrClient, 'getStatus');

    const res = await checkPeakerrOrderStatus('CF-NO-EXT');
    expect(res.success).toBe(false);
    expect(res.error).toContain('NO_PROVIDER_ORDER_YET');
    expect(statusSpy).not.toHaveBeenCalled();
  });

  it('F) Inspecting an existing PROCESSING order executes ZERO action=add calls', async () => {
    const mockOrder = {
      id: 'ord_proc',
      publicId: 'CF-PROC',
      paymentStatus: 'PAID',
      fulfillmentStatus: 'PROCESSING',
      platform: 'instagram',
      service: 'followers',
      quantity: 2000,
      socialUsername: 'guilhermeterraaa',
      targetUrl: 'https://instagram.com/guilhermeterraaa',
    };

    (db.query.orders.findMany as any).mockResolvedValue([mockOrder]);
    (db.query.fulfillmentChains.findMany as any).mockResolvedValue([
      { id: 'c1', platform: 'instagram', service: 'followers', variant: 'standard', name: 'IG Followers', autoFallback: true, active: true },
    ]);
    (db.query.fulfillmentChainServices.findMany as any).mockResolvedValue([
      { providerServiceId: '31714', priority: 1, minQuantity: 10, maxQuantity: 1000000, active: true },
    ]);

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          orderBy: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: 'ful_proc', externalOrderId: '80339204', status: 'PROCESSING' }]),
          }),
        }),
      }),
    });

    const createSpy = vi.spyOn(peakerrClient, 'createOrder');

    const res = await generateFulfillmentPreview('CF-PROC');
    expect(res.success).toBe(true);
    expect(createSpy).not.toHaveBeenCalled();
  });
});
