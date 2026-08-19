import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateFulfillmentPreview } from '@/services/fulfillment-chain.service';
import { db } from '@/db';

vi.mock('@/db', () => ({
  db: {
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

describe('Phase 3.7 — Public ID Resolution & Safety Polish Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('A, B, C) Lookup by Public ID (CF-1278LNR048) resolves the exact same Order as UUID', async () => {
    const mockOrder = {
      id: '665e9a3d-0c78-4684-b317-4d78690f9b30',
      publicId: 'CF-1278LNR048',
      paymentStatus: 'PAID',
      fulfillmentStatus: 'NOT_DISPATCHED',
      platform: 'instagram',
      service: 'followers',
      quantity: 2000,
      socialUsername: 'guilhermeterraaa',
      profileUrl: 'https://instagram.com/guilhermeterraaa',
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

    // 1. Test by Public ID
    const resByPublicId = await generateFulfillmentPreview('CF-1278LNR048');
    expect(resByPublicId.success).toBe(true);
    if (resByPublicId.success) {
      expect(resByPublicId.publicId).toBe('CF-1278LNR048');
      expect(resByPublicId.orderId).toBe('665e9a3d-0c78-4684-b317-4d78690f9b30');
      expect(resByPublicId.quantity).toBe(2000);
      expect(resByPublicId.primaryServiceId).toBe('31714');
      expect(resByPublicId.target).toBe('https://instagram.com/guilhermeterraaa');
    }

    // 2. Test by UUID
    const resByUuid = await generateFulfillmentPreview('665e9a3d-0c78-4684-b317-4d78690f9b30');
    expect(resByUuid.success).toBe(true);
    if (resByUuid.success) {
      expect(resByUuid.publicId).toBe('CF-1278LNR048');
      expect(resByUuid.quantity).toBe(2000);
    }
  });

  it('D) Invalid Public ID returns ORDER_NOT_FOUND', async () => {
    (db.query.orders.findMany as any).mockResolvedValue([]);

    const res = await generateFulfillmentPreview('CF-NONEXISTENT');
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.code).toBe('ORDER_NOT_FOUND');
    }
  });
});
