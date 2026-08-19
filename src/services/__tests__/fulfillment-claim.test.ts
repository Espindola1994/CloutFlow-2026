import { describe, it, expect, vi, beforeEach } from 'vitest';
import { claimOrderForFulfillment } from '@/services/fulfillment.service';
import { db } from '@/db';

vi.mock('@/db', () => ({
  db: {
    update: vi.fn(),
    insert: vi.fn(),
  },
}));

describe('Atomic Claim & Concurrency Safety Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('A) Order with fulfillmentStatus = NOT_DISPATCHED and paymentStatus = PAID is successfully claimed', async () => {
    const mockClaimedOrder = {
      id: 'ord_atomic_1',
      publicId: 'CF-1234',
      fulfillmentStatus: 'SUBMITTING',
      paymentStatus: 'PAID',
    };

    (db.update as any).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([mockClaimedOrder]),
        }),
      }),
    });

    const res = await claimOrderForFulfillment('ord_atomic_1');
    expect(res.success).toBe(true);
    expect(res.order?.fulfillmentStatus).toBe('SUBMITTING');
  });

  it('B) Second concurrent claim on the same order returns ORDER_NOT_CLAIMABLE', async () => {
    (db.update as any).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]), // 0 rows affected
        }),
      }),
    });

    const res = await claimOrderForFulfillment('ord_already_claimed');
    expect(res.success).toBe(false);
    expect(res.error).toContain('ORDER_NOT_CLAIMABLE');
  });
});
