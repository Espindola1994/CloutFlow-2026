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

describe('FinancialControlService - Protection Reduction & Overrides', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('detects reduction of minimumGrossMarginPercent and requires confirmation', async () => {
    const mockPlan = {
      id: 'plan_1',
      name: 'Starter',
      minimumGrossMarginPercent: 45,
      minimumGrossProfitCents: BigInt(500),
      costCeilingEnabled: true,
      priorityServiceId: '30159',
      fallback1ServiceId: '30160',
      fallback2ServiceId: null,
    };

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockPlan]),
        }),
      }),
    });

    const result = await FinancialControlService.updateProductFinancialRules({
      planId: 'plan_1',
      adminUserId: 'admin_test',
      minimumGrossMarginPercent: 20, // reducing from 45% to 20%
      confirmedReduction: false,
    });

    expect(result.success).toBe(false);
    expect(result.requiresConfirmation).toBe(true);
    expect(result.warningMessage).toContain('Minimum Margin changing from 45% to 20%');
  });

  it('allows reduction when confirmedReduction is explicitly true', async () => {
    const mockPlan = {
      id: 'plan_1',
      name: 'Starter',
      minimumGrossMarginPercent: 45,
      minimumGrossProfitCents: BigInt(500),
      costCeilingEnabled: true,
      priorityServiceId: '30159',
      fallback1ServiceId: '30160',
      fallback2ServiceId: null,
    };

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockPlan]),
        }),
      }),
    });

    (db.update as any).mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue({}),
      }),
    });

    (db.insert as any).mockReturnValue({
      values: vi.fn().mockResolvedValue({}),
    });

    const result = await FinancialControlService.updateProductFinancialRules({
      planId: 'plan_1',
      adminUserId: 'admin_test',
      minimumGrossMarginPercent: 20,
      confirmedReduction: true,
    });

    expect(result.success).toBe(true);
    expect(result.message).toContain('Product financial protection rules updated');
  });

  it('warns when manualSupplierOverride violates financial protection', async () => {
    const mockOrder = {
      id: 'ord_123',
      platform: 'instagram',
      service: 'followers',
      quantity: 10000,
      totalCents: 3990, // $39.90 selling price
      fulfillmentStatus: 'HOLD_SUPPLIER_COST',
    };

    (db.select as any).mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue([mockOrder]),
        }),
      }),
    });

    const result = await FinancialControlService.manualSupplierOverride({
      orderId: 'ord_123',
      supplierId: '99999',
      supplierCost: 35.00, // Leaves only $4.90 profit (< $5.00) & margin = 12% (< 45%)
      reason: 'Urgent customer request VIP',
      adminUserId: 'admin_test',
      confirmedViolation: false,
    });

    expect(result.success).toBe(false);
    expect(result.requiresConfirmation).toBe(true);
    expect(result.warningDetails).toBeDefined();
    expect(result.warningDetails.grossMargin).toBeLessThan(45);
  });

  it('requires an override reason with at least 5 characters', async () => {
    const result = await FinancialControlService.manualSupplierOverride({
      orderId: 'ord_123',
      supplierId: '99999',
      supplierCost: 10.00,
      reason: 'no',
      adminUserId: 'admin_test',
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('minimum 5 characters');
  });
});
