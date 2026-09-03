import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SupplierRateMonitorService, RATE_CONFIG } from '../supplier-rate-monitor.service';
import { FinancialControlService } from '../financial-control.service';
import { calculateCostCeiling } from '../../lib/routing/financial-routing';

describe('SupplierRateMonitorService', () => {
  it('identifies fresh rate snapshot (<= 5 min)', () => {
    const freshDate = new Date(Date.now() - 2 * 60 * 1000); // 2 min ago
    const result = SupplierRateMonitorService.calculateRateFreshness(freshDate);
    expect(result.status).toBe('FRESH');
    expect(result.ageMinutes).toBe(2);
  });

  it('identifies cached rate snapshot (<= 30 min)', () => {
    const cachedDate = new Date(Date.now() - 20 * 60 * 1000); // 20 min ago
    const result = SupplierRateMonitorService.calculateRateFreshness(cachedDate);
    expect(result.status).toBe('CACHED');
    expect(result.ageMinutes).toBe(20);
  });

  it('identifies stale rate snapshot (> 30 min)', () => {
    const staleDate = new Date(Date.now() - 35 * 60 * 1000); // 35 min ago
    const result = SupplierRateMonitorService.calculateRateFreshness(staleDate);
    expect(result.status).toBe('STALE');
    expect(result.ageMinutes).toBe(35);
  });

  it('identifies unknown rate snapshot if null/missing', () => {
    const result = SupplierRateMonitorService.calculateRateFreshness(null);
    expect(result.status).toBe('UNKNOWN');
  });

  it('calculates rate increase percent correctly and detects >= 15% jump', () => {
    const prevRate = 0.975;
    const newRate = 1.25;
    const increasePct = SupplierRateMonitorService.calculateRateIncreasePercent(prevRate, newRate);
    expect(increasePct).toBe(28.21);
    expect(increasePct >= RATE_CONFIG.supplierRateIncreaseAlertPercent).toBe(true);
  });

  it('does not trigger increase alert if price change is below 15%', () => {
    const prevRate = 1.00;
    const newRate = 1.10; // +10%
    const increasePct = SupplierRateMonitorService.calculateRateIncreasePercent(prevRate, newRate);
    expect(increasePct).toBe(10.00);
    expect(increasePct >= RATE_CONFIG.supplierRateIncreaseAlertPercent).toBe(false);
  });
});

describe('FinancialControlService - Health Evaluation', () => {
  it('returns GREEN when priority supplier is available and within Cost Ceiling', () => {
    const evaluation = FinancialControlService.evaluateCardHealth({
      priorityServiceId: '30159',
      priorityRate: 1.20,
      priorityRateStatus: 'FRESH',
      priorityApproved: true,
      fallback1Rate: 1.50,
      fallback1Approved: true,
      fallback2Rate: null,
      fallback2Approved: false,
    });
    expect(evaluation.health).toBe('GREEN');
    expect(evaluation.reason).toContain('within Cost Ceiling');
  });

  it('returns GREEN when priority supplier is incompatible by quantity, but fallback is quantity-compatible and approved', () => {
    const evaluation = FinancialControlService.evaluateCardHealth({
      priorityServiceId: '33478',
      priorityRate: 0.80,
      priorityRateStatus: 'FRESH',
      priorityApproved: true,
      priorityQuantityCompatible: false, // Priority max is 5000, card is 10000
      fallback1Rate: 1.20,
      fallback1Approved: true,
      fallback1QuantityCompatible: true, // Fallback max is 20000
      fallback2Rate: null,
      fallback2Approved: false,
    });
    expect(evaluation.health).toBe('GREEN');
    expect(evaluation.reason).toContain('Priority supplier incompatible by quantity, but fallback is quantity-compatible');
  });

  it('returns YELLOW when priority supplier fails cost ceiling but a fallback is approved', () => {
    const evaluation = FinancialControlService.evaluateCardHealth({
      priorityServiceId: '30159',
      priorityRate: 3.50,
      priorityRateStatus: 'FRESH',
      priorityApproved: false,
      priorityQuantityCompatible: true,
      fallback1Rate: 1.80,
      fallback1Approved: true,
      fallback1QuantityCompatible: true,
      fallback2Rate: null,
      fallback2Approved: false,
    });
    expect(evaluation.health).toBe('YELLOW');
    expect(evaluation.reason).toContain('fallback is safe & approved');
  });

  it('returns RED when no configured supplier passes financial rules', () => {
    const evaluation = FinancialControlService.evaluateCardHealth({
      priorityServiceId: '30159',
      priorityRate: 10.00,
      priorityRateStatus: 'FRESH',
      priorityApproved: false,
      priorityQuantityCompatible: true,
      fallback1Rate: 12.00,
      fallback1Approved: false,
      fallback1QuantityCompatible: true,
      fallback2Rate: null,
      fallback2Approved: false,
    });
    expect(evaluation.health).toBe('RED');
    expect(evaluation.reason).toContain('No configured supplier passes');
  });

  it('returns RED when all suppliers are quantity-incompatible', () => {
    const evaluation = FinancialControlService.evaluateCardHealth({
      priorityServiceId: '33478',
      priorityRate: 0.80,
      priorityRateStatus: 'FRESH',
      priorityApproved: true,
      priorityQuantityCompatible: false,
      fallback1Rate: 1.20,
      fallback1Approved: true,
      fallback1QuantityCompatible: false,
      fallback2Rate: null,
      fallback2Approved: false,
    });
    expect(evaluation.health).toBe('RED');
  });

  it('returns UNKNOWN when priority supplier rate is missing or unknown', () => {
    const evaluation = FinancialControlService.evaluateCardHealth({
      priorityServiceId: '30159',
      priorityRate: null,
      priorityRateStatus: 'UNKNOWN',
      priorityApproved: false,
      fallback1Rate: null,
      fallback1Approved: false,
      fallback2Rate: null,
      fallback2Approved: false,
    });
    expect(evaluation.health).toBe('UNKNOWN');
  });
});

describe('FinancialControlService - Commercial Price Suggestion', () => {
  it('rounds suggested price to commercial .90 ending', () => {
    expect(FinancialControlService.calculateCommercialPriceSuggestion(4.20)).toBe(5.90);
    expect(FinancialControlService.calculateCommercialPriceSuggestion(6.10)).toBe(7.90);
    expect(FinancialControlService.calculateCommercialPriceSuggestion(8.50)).toBe(9.90);
    expect(FinancialControlService.calculateCommercialPriceSuggestion(13.20)).toBe(14.90);
    expect(FinancialControlService.calculateCommercialPriceSuggestion(25.00)).toBe(29.90);
    expect(FinancialControlService.calculateCommercialPriceSuggestion(720.00)).toBe(749.90);
  });

  it('calculates suggested selling price based on supplier cost, target margin and min profit', () => {
    const suggestion = FinancialControlService.calculateSuggestedSellingPrice({
      supplierCost: 10.00,
      targetMarginPercent: 40,
      minimumGrossProfit: 5.00,
    });
    // Margin required: 10 / (1 - 0.40) = 16.66
    // Profit required: 10 + 5 = 15.00
    // Max = 16.66 -> next .90 is 17.90
    expect(suggestion).toBe(17.90);
  });
});
