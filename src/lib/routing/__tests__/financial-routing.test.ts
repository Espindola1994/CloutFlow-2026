import { describe, it, expect } from 'vitest';
import {
  calculateCostCeiling,
  calculateSupplierCost,
  calculateGrossProfit,
  calculateGrossMarginPercent,
  evaluateSupplierOption,
  evaluateSupplierCascade,
} from '@/lib/routing/financial-routing';
import { SupplierCandidate } from '@/lib/routing/financial-routing';

describe('Financial Cost Ceiling & Supplier Routing Engine', () => {
  describe('calculateCostCeiling', () => {
    it('calculates allowedSupplierCost by minimum margin and minimum profit when absolute cap is omitted', () => {
      // Selling price: $20.00
      // Min margin: 40% -> max cost by margin = 20 * (1 - 0.4) = $12.00
      // Min profit: $5.00 -> max cost by profit = 20 - 5 = $15.00
      // Allowed cost = Math.min(12, 15) = $12.00
      const res = calculateCostCeiling({
        sellingPrice: 20.0,
        minimumGrossMarginPercent: 40,
        minimumGrossProfit: 5.0,
      });

      expect(res.maximumCostByMargin).toBe(12.0);
      expect(res.maximumCostByProfit).toBe(15.0);
      expect(res.maxSupplierCostAbsolute).toBeNull();
      expect(res.allowedSupplierCost).toBe(12.0);
    });

    it('calculates allowedSupplierCost when minimum profit is more restrictive than margin', () => {
      // Selling price: $10.00
      // Min margin: 30% -> max cost by margin = 10 * (1 - 0.3) = $7.00
      // Min profit: $6.00 -> max cost by profit = 10 - 6 = $4.00
      // Allowed cost = Math.min(7, 4) = $4.00
      const res = calculateCostCeiling({
        sellingPrice: 10.0,
        minimumGrossMarginPercent: 30,
        minimumGrossProfit: 6.0,
      });

      expect(res.maximumCostByMargin).toBe(7.0);
      expect(res.maximumCostByProfit).toBe(4.0);
      expect(res.allowedSupplierCost).toBe(4.0);
    });

    it('applies maxSupplierCostAbsolute when configured and it is the lowest cap', () => {
      // Selling price: $30.00
      // Min margin: 40% -> max cost = 30 * 0.6 = $18.00
      // Min profit: $5.00 -> max cost = 30 - 5 = $25.00
      // Absolute cap: $8.00
      // Allowed cost = Math.min(18, 25, 8) = $8.00
      const res = calculateCostCeiling({
        sellingPrice: 30.0,
        minimumGrossMarginPercent: 40,
        minimumGrossProfit: 5.0,
        maxSupplierCostAbsolute: 8.0,
      });

      expect(res.maximumCostByMargin).toBe(18.0);
      expect(res.maximumCostByProfit).toBe(25.0);
      expect(res.maxSupplierCostAbsolute).toBe(8.0);
      expect(res.allowedSupplierCost).toBe(8.0);
    });

    it('ignores maxSupplierCostAbsolute if null or undefined', () => {
      const res = calculateCostCeiling({
        sellingPrice: 50.0,
        minimumGrossMarginPercent: 50,
        minimumGrossProfit: 10.0,
        maxSupplierCostAbsolute: null,
      });

      expect(res.maximumCostByMargin).toBe(25.0);
      expect(res.maximumCostByProfit).toBe(40.0);
      expect(res.maxSupplierCostAbsolute).toBeNull();
      expect(res.allowedSupplierCost).toBe(25.0);
    });
  });

  describe('calculateSupplierCost & Metrics', () => {
    it('computes supplier cost correctly from quantity and rate per 1000', () => {
      // 2500 units at $0.80 / 1000 = $2.00
      expect(calculateSupplierCost(2500, 0.8)).toBe(2.0);
      // 10000 units at $1.50 / 1000 = $15.00
      expect(calculateSupplierCost(10000, 1.5)).toBe(15.0);
      // Edge case: 0 quantity
      expect(calculateSupplierCost(0, 1.5)).toBe(0);
    });

    it('computes gross profit and gross margin percent accurately', () => {
      const sellingPrice = 25.0;
      const supplierCost = 5.0;
      const profit = calculateGrossProfit(sellingPrice, supplierCost);
      const margin = calculateGrossMarginPercent(sellingPrice, supplierCost);

      expect(profit).toBe(20.0);
      expect(margin).toBe(80.0);
    });
  });

  describe('evaluateSupplierOption', () => {
    it('accepts supplier when cost is within ceiling limits', () => {
      const result = evaluateSupplierOption({
        orderId: 'ord_123',
        platform: 'instagram',
        serviceType: 'followers',
        quantity: 1000,
        sellingPrice: 15.0,
        costCeilingEnabled: true,
        manualReviewEnabled: false,
        minimumGrossMarginPercent: 40,
        minimumGrossProfit: 5.0,
        supplierServiceId: 'peakerr_101',
        supplierPosition: 'priority',
        supplierRate: 2.5, // 1000 * 2.5 / 1000 = $2.50
      });

      expect(result.allowed).toBe(true);
      expect(result.decision).toBe('ACCEPTED');
      expect(result.nextStatus).toBe('CHECKING_SUPPLIER');
      expect(result.attemptRecord.supplierCalculatedCost).toBe(2.5);
      expect(result.attemptRecord.sellingPrice).toBe(15.0); // Selling price is never changed
      expect(result.attemptRecord.grossProfit).toBe(12.5);
      expect(result.attemptRecord.grossMarginPercent).toBe(83.33);
      expect(result.attemptRecord.allowedSupplierCost).toBe(9.0); // 15 * (1 - 0.4) = 9.0
    });

    it('blocks supplier with HOLD_COST when cost exceeds ceiling', () => {
      // Selling price $10.00, Margin 50% (max cost $5.00), Min Profit $6.00 (max cost $4.00)
      // Allowed cost = $4.00
      // Supplier cost: 1000 @ $4.50 = $4.50 > $4.00
      const result = evaluateSupplierOption({
        orderId: 'ord_456',
        platform: 'instagram',
        serviceType: 'followers',
        quantity: 1000,
        sellingPrice: 10.0,
        costCeilingEnabled: true,
        manualReviewEnabled: false,
        minimumGrossMarginPercent: 50,
        minimumGrossProfit: 6.0,
        supplierServiceId: 'peakerr_102',
        supplierPosition: 'priority',
        supplierRate: 4.5,
      });

      expect(result.allowed).toBe(false);
      expect(result.decision).toBe('HOLD_COST');
      expect(result.nextStatus).toBe('HOLD_SUPPLIER_COST');
      expect(result.attemptRecord.supplierCalculatedCost).toBe(4.5);
      expect(result.attemptRecord.allowedSupplierCost).toBe(4.0);
    });

    it('triggers MANUAL_REVIEW when manualReviewEnabled is true', () => {
      const result = evaluateSupplierOption({
        orderId: 'ord_789',
        platform: 'instagram',
        serviceType: 'followers',
        quantity: 1000,
        sellingPrice: 50.0,
        costCeilingEnabled: true,
        manualReviewEnabled: true,
        minimumGrossMarginPercent: 40,
        minimumGrossProfit: 10.0,
        supplierServiceId: 'peakerr_103',
        supplierPosition: 'priority',
        supplierRate: 2.0,
      });

      expect(result.allowed).toBe(false);
      expect(result.decision).toBe('MANUAL_REVIEW');
      expect(result.nextStatus).toBe('MANUAL_REVIEW');
    });
  });

  describe('evaluateSupplierCascade (Priority -> Fallback 1 -> Fallback 2)', () => {
    const baseParams = {
      orderId: 'ord_cascade_1',
      platform: 'instagram',
      serviceType: 'followers',
      quantity: 2000,
      sellingPrice: 20.0,
      costCeilingEnabled: true,
      manualReviewEnabled: false,
      minimumGrossMarginPercent: 50, // Max cost $10.00
      minimumGrossProfit: 8.0, // Max cost $12.00
      // Allowed cost = $10.00
    };

    it('selects priority when priority satisfies cost ceiling', () => {
      const candidates: SupplierCandidate[] = [
        { position: 'priority', serviceId: 'peak_1', rate: 2.0 }, // Cost = $4.00 <= $10.00 (OK)
        { position: 'fallback1', serviceId: 'peak_2', rate: 3.0 },
        { position: 'fallback2', serviceId: 'peak_3', rate: 4.0 },
      ];

      const res = evaluateSupplierCascade(baseParams, candidates);

      expect(res.selectedSupplier?.serviceId).toBe('peak_1');
      expect(res.selectedSupplier?.position).toBe('priority');
      expect(res.selectedDecision).toBe('ACCEPTED');
      expect(res.finalStatus).toBe('SUBMITTED');
      expect(res.attempts.length).toBe(1);
    });

    it('falls back to Fallback 1 when Priority exceeds cost ceiling', () => {
      const candidates: SupplierCandidate[] = [
        { position: 'priority', serviceId: 'peak_expensive', rate: 6.0 }, // 2000 @ 6.0 = $12.00 > $10.00 (REJECTED)
        { position: 'fallback1', serviceId: 'peak_fb1', rate: 3.5 }, // 2000 @ 3.5 = $7.00 <= $10.00 (ACCEPTED)
        { position: 'fallback2', serviceId: 'peak_fb2', rate: 4.5 },
      ];

      const res = evaluateSupplierCascade(baseParams, candidates);

      expect(res.selectedSupplier?.serviceId).toBe('peak_fb1');
      expect(res.selectedSupplier?.position).toBe('fallback1');
      expect(res.selectedDecision).toBe('ACCEPTED');
      expect(res.finalStatus).toBe('SUBMITTED');
      expect(res.attempts.length).toBe(2);
      expect(res.attempts[0].decision).toBe('HOLD_COST');
      expect(res.attempts[1].decision).toBe('ACCEPTED');
    });

    it('falls back to Fallback 2 when Priority and Fallback 1 exceed cost ceiling', () => {
      const candidates: SupplierCandidate[] = [
        { position: 'priority', serviceId: 'peak_exp1', rate: 6.0 }, // $12.00 (HOLD)
        { position: 'fallback1', serviceId: 'peak_exp2', rate: 5.5 }, // $11.00 (HOLD)
        { position: 'fallback2', serviceId: 'peak_fb2', rate: 4.0 }, // $8.00 <= $10.00 (ACCEPTED)
      ];

      const res = evaluateSupplierCascade(baseParams, candidates);

      expect(res.selectedSupplier?.serviceId).toBe('peak_fb2');
      expect(res.selectedSupplier?.position).toBe('fallback2');
      expect(res.selectedDecision).toBe('ACCEPTED');
      expect(res.finalStatus).toBe('SUBMITTED');
      expect(res.attempts.length).toBe(3);
    });

    it('sets status to HOLD_SUPPLIER_COST when all suppliers exceed cost ceiling', () => {
      const candidates: SupplierCandidate[] = [
        { position: 'priority', serviceId: 'peak_exp1', rate: 6.0 }, // $12.00
        { position: 'fallback1', serviceId: 'peak_exp2', rate: 5.5 }, // $11.00
        { position: 'fallback2', serviceId: 'peak_exp3', rate: 5.2 }, // $10.40 > $10.00
      ];

      const res = evaluateSupplierCascade(baseParams, candidates);

      expect(res.selectedSupplier).toBeNull();
      expect(res.selectedDecision).toBe('HOLD_COST');
      expect(res.finalStatus).toBe('HOLD_SUPPLIER_COST');
      expect(res.attempts.length).toBe(3);
      expect(res.attempts.every((a) => a.decision === 'HOLD_COST')).toBe(true);
    });

    it('sets status to HOLD_NO_SUPPLIER when no candidates are provided', () => {
      const res = evaluateSupplierCascade(baseParams, []);

      expect(res.selectedSupplier).toBeNull();
      expect(res.finalStatus).toBe('HOLD_NO_SUPPLIER');
      expect(res.attempts.length).toBe(0);
    });
  });
});
