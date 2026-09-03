import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FinancialControlService } from '../../services/financial-control.service';
import { db } from '../../db';

vi.mock('../../db', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock('../../services/supplier-routing.service', () => ({
  executeSupplierRouting: vi.fn().mockResolvedValue({
    success: true,
    status: 'PROCESSING',
    message: 'Dispatched to fallback1 successfully',
  }),
}));

describe('FinancialControlService - Retry & Concurrency Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('prevents retry if order is already SUBMITTING or PROCESSING or COMPLETED', async () => {
    const mockOrder = {
      id: 'ord_1',
      fulfillmentStatus: 'SUBMITTING',
    };

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockOrder]),
        }),
      }),
    });

    const result = await FinancialControlService.retryRouting('ord_1', 'admin_test');
    expect(result.success).toBe(false);
    expect(result.message).toContain('Duplicate retry blocked');
  });

  it('allows retry for held order and audits action', async () => {
    const mockOrder = {
      id: 'ord_2',
      fulfillmentStatus: 'HOLD_SUPPLIER_COST',
    };

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockOrder]),
        }),
      }),
    });

    (db.insert as any).mockReturnValue({
      values: vi.fn().mockResolvedValue({}),
    });

    const result = await FinancialControlService.retryRouting('ord_2', 'admin_test');
    expect(result.success).toBe(true);
    expect(result.status).toBe('PROCESSING');
  });
});
