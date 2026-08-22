import { describe, it, expect } from 'vitest';
import {
  normalizePerfectPayPayload,
  parseMonetaryAmountToCents,
  resolvePerfectPayMonetaryAmount,
  resolvePerfectPayMonetaryResolution,
} from '../normalize';

describe('PerfectPay Canonical Monetary Normalizer Tests', () => {
  // Test A: sale_amount = 5.00 => 500 cents
  it('A. sale_amount = 5.00 => 500 cents', () => {
    const payload = {
      sale_amount: 5.00,
    };
    const result = normalizePerfectPayPayload(payload);
    expect(result.amountCents).toBe(500);
    expect(resolvePerfectPayMonetaryAmount(payload)).toBe(500);
    const res = resolvePerfectPayMonetaryResolution(payload);
    expect(res.amountCents).toBe(500);
    expect(res.amountResolved).toBe(true);
    expect(res.sourceType).toBe('TRANSACTION');
    expect(res.sourceField).toBe('sale_amount');
  });

  // Test B: sale_amount absent, amount = 5.00 => 500
  it('B. sale_amount absent, amount = 5.00 => 500', () => {
    const payload = {
      amount: 5.00,
    };
    const result = normalizePerfectPayPayload(payload);
    expect(result.amountCents).toBe(500);
    expect(resolvePerfectPayMonetaryAmount(payload)).toBe(500);
    const res = resolvePerfectPayMonetaryResolution(payload);
    expect(res.amountCents).toBe(500);
    expect(res.amountResolved).toBe(true);
    expect(res.sourceType).toBe('TRANSACTION');
    expect(res.sourceField).toBe('amount');
  });

  // Test C: sale_amount/amount absent, sale_amount_without_tax = 5.00 => 500
  it('C. sale_amount/amount absent, sale_amount_without_tax = 5.00 => 500', () => {
    const payload = {
      sale_amount_without_tax: 5.00,
    };
    const result = normalizePerfectPayPayload(payload);
    expect(result.amountCents).toBe(500);
    expect(resolvePerfectPayMonetaryAmount(payload)).toBe(500);
    const res = resolvePerfectPayMonetaryResolution(payload);
    expect(res.amountCents).toBe(500);
    expect(res.amountResolved).toBe(true);
    expect(res.sourceType).toBe('TRANSACTION');
    expect(res.sourceField).toBe('sale_amount_without_tax');
  });

  // Test D: transaction fields absent, plan.amount = 5.00 => fallback 500
  it('D. transaction fields absent, plan.amount = 5.00 => fallback 500', () => {
    const payload = {
      plan: {
        amount: 5.00,
        name: 'Starter Plan',
      },
    };
    const result = normalizePerfectPayPayload(payload);
    expect(result.amountCents).toBe(500);
    expect(resolvePerfectPayMonetaryAmount(payload)).toBe(500);
    const res = resolvePerfectPayMonetaryResolution(payload);
    expect(res.amountCents).toBe(500);
    expect(res.amountResolved).toBe(true);
    expect(res.sourceType).toBe('CATALOG');
    expect(res.sourceField).toBe('plan.amount');
  });

  // Test E: explicit sale_amount = 0 => legitimate 0 cents
  it('E. explicit sale_amount = 0 => legitimate 0 cents', () => {
    const payload = {
      sale_amount: 0,
    };
    const result = normalizePerfectPayPayload(payload);
    expect(result.amountCents).toBe(0);
    expect(resolvePerfectPayMonetaryAmount(payload)).toBe(0);
    const res = resolvePerfectPayMonetaryResolution(payload);
    expect(res.amountCents).toBe(0);
    expect(res.amountResolved).toBe(true);
    expect(res.sourceType).toBe('TRANSACTION');
    expect(res.sourceField).toBe('sale_amount');
  });

  // Test F: all monetary fields absent => unresolved (undefined), NOT implicit zero
  it('F. all monetary fields absent => unresolved (undefined), NOT implicit zero', () => {
    const payload = {
      code: 'PPCPMTB5HJ3M1O9NJM',
      sale_status_enum: 2,
    };
    const result = normalizePerfectPayPayload(payload);
    expect(result.amountCents).toBeUndefined();
    expect(resolvePerfectPayMonetaryAmount(payload)).toBeUndefined();
    const res = resolvePerfectPayMonetaryResolution(payload);
    expect(res.amountCents).toBeNull();
    expect(res.amountResolved).toBe(false);
    expect(res.sourceType).toBe('UNRESOLVED');
  });

  // Test G: malformed amount => reject / unresolved
  it('G. malformed amount => reject / unresolved', () => {
    expect(parseMonetaryAmountToCents('invalid_money')).toBeNull();
    expect(parseMonetaryAmountToCents(-15)).toBeNull();
    expect(parseMonetaryAmountToCents(NaN)).toBeNull();
    expect(parseMonetaryAmountToCents(Infinity)).toBeNull();
    expect(parseMonetaryAmountToCents('')).toBeNull();
    expect(parseMonetaryAmountToCents(null)).toBeNull();

    const payload = {
      sale_amount: 'not_a_number',
    };
    const result = normalizePerfectPayPayload(payload);
    expect(result.amountCents).toBeUndefined();
  });

  // Test H: transaction amount conflicts with plan price => transaction amount wins
  it('H. transaction amount conflicts with plan price => transaction amount wins', () => {
    const payload = {
      sale_amount: 5.00, // actual transaction amount
      plan: {
        amount: 14.90, // catalog list price
      },
      price: 29.90,
    };
    const result = normalizePerfectPayPayload(payload);
    expect(result.amountCents).toBe(500); // 500 cents wins over 1490 and 2990
    expect(resolvePerfectPayMonetaryAmount(payload)).toBe(500);
    const res = resolvePerfectPayMonetaryResolution(payload);
    expect(res.amountCents).toBe(500);
    expect(res.sourceType).toBe('TRANSACTION');
    expect(res.sourceField).toBe('sale_amount');
  });

  // Test I: multiple transaction fields conflict => most authoritative wins + diagnostic recorded
  it('I. multiple transaction fields conflict => authoritative wins and diagnostics recorded', () => {
    const payload = {
      sale_amount: 5.00,
      amount: 14.90,
      plan: {
        amount: 29.90,
      },
    };
    const res = resolvePerfectPayMonetaryResolution(payload);
    expect(res.amountCents).toBe(500);
    expect(res.sourceType).toBe('TRANSACTION');
    expect(res.sourceField).toBe('sale_amount');
    expect(res.diagnostics?.conflictDetected).toBe(true);
    expect(res.diagnostics?.conflictingFields).toHaveLength(2);
  });
});
