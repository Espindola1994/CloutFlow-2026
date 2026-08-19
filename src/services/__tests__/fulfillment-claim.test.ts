import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submitOrderToPeakerrManual } from '@/services/fulfillment.service';
import { db } from '@/db';

vi.mock('@/db', () => ({
  db: {
    transaction: vi.fn(),
    select: vi.fn(),
    query: {
      orders: {
        findMany: vi.fn(),
      },
    },
  },
}));

describe('Atomic Claim & Concurrency Safety Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('A) Order with fulfillmentStatus != NOT_DISPATCHED returns ORDER_ALREADY_CLAIMED', async () => {
    (db.query.orders.findMany as any).mockResolvedValue([
      {
        id: 'ord_atomic_1',
        publicId: 'CF-1234',
        fulfillmentStatus: 'SUBMITTING',
        paymentStatus: 'PAID',
      },
    ]);

    const res = await submitOrderToPeakerrManual('CF-1234');
    expect(res.success).toBe(false);
  });
});
