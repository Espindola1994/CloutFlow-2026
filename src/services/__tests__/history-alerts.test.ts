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

describe('FinancialControlService - History & Alerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('supports paginated and filtered supplier history queries', async () => {
    const mockItems = [
      {
        id: 'att_1',
        orderId: 'ord_123',
        supplierServiceId: '30159',
        supplierPosition: 'priority',
        supplierRate: '0.975000',
        supplierCalculatedCost: '1.9500',
        sellingPrice: '14.9000',
        grossProfit: '12.9500',
        grossMarginPercent: '86.91',
        allowedSupplierCost: '8.1950',
        decision: 'ACCEPTED',
        reason: 'Cost is within allowed threshold',
        createdAt: new Date(),
        platform: 'instagram',
        service: 'followers',
        quantity: 2000,
      },
    ];

    // Mock count query then items query
    (db.select as any)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              orderBy: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  offset: vi.fn().mockResolvedValue(mockItems),
                }),
              }),
            }),
          }),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          leftJoin: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue([{ count: 1 }]),
          }),
        }),
      });

    const result = await FinancialControlService.getSupplierAttemptHistory({
      page: 1,
      pageSize: 20,
      platform: 'instagram',
      service: 'followers',
    });

    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
    expect(result.total).toBe(1);
    expect(result.items.length).toBe(1);
    expect(result.items[0].decision).toBe('ACCEPTED');
    expect(result.items[0].supplierRate).toBe(0.975);
  });

  it('resolves and dismisses alerts properly', async () => {
    (db.update as any).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    });

    const resolved = await FinancialControlService.resolveAlert('alert_1', 'admin_1', 'RESOLVE');
    expect(resolved).toBe(true);

    const dismissed = await FinancialControlService.resolveAlert('alert_2', 'admin_1', 'DISMISS');
    expect(dismissed).toBe(true);
  });
});
