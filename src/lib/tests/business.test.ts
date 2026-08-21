import { test, expect, describe } from 'vitest';
import { calculateFinancialTotals, OrderFinancialRecord } from '../financials';

describe('Username Normalization', () => {
  function normalizeUsername(input: string): string {
    if (!input) return '';
    let username = input.trim();
    
    if (username.startsWith('@')) {
      username = username.substring(1);
    }
    
    if (username.includes('instagram.com/')) {
      const urlParts = username.split('instagram.com/');
      if (urlParts.length > 1) {
        username = urlParts[1].split('/')[0].split('?')[0];
      }
    }
    
    return username;
  }

  test('normalizes @username to username', () => {
    expect(normalizeUsername('@testuser')).toBe('testuser');
  });

  test('normalizes full URL to username', () => {
    expect(normalizeUsername('https://instagram.com/testuser')).toBe('testuser');
    expect(normalizeUsername('https://www.instagram.com/testuser/')).toBe('testuser');
    expect(normalizeUsername('https://www.instagram.com/testuser/?hl=en')).toBe('testuser');
  });

  test('handles plain username', () => {
    expect(normalizeUsername('testuser')).toBe('testuser');
  });
});

describe('Price Calculation', () => {
  function calculateTotal(regularPrice: number, quantity: number, discountPercentage = 0): number {
    const total = regularPrice;
    if (discountPercentage > 0) {
      return Math.round(total * (1 - discountPercentage / 100));
    }
    return total;
  }

  test('calculates correct total without discount', () => {
    expect(calculateTotal(1000, 1)).toBe(1000);
  });

  test('calculates correct total with percentage discount', () => {
    expect(calculateTotal(1000, 1, 20)).toBe(800); // 20% off
    expect(calculateTotal(1500, 1, 10)).toBe(1350); // 10% off
  });
});

describe('Monetary Financial Rates & Order Counting', () => {
  test('A. $0 REFUNDED order does not increment refundedOrdersCount', () => {
    const orders: OrderFinancialRecord[] = [
      {
        id: 'ord_zero_ref',
        totalCents: 0,
        currency: 'USD',
        paymentStatus: 'REFUNDED',
      },
    ];

    const result = calculateFinancialTotals(orders);
    expect(result.refundedOrdersCount).toBe(0);
    expect(result.paidOrdersCount).toBe(0);
    expect(result.chargebackOrdersCount).toBe(0);
    expect(result.totalOrdersCount).toBe(1);
    expect(result.refundRatePercent).toBe('0.0');
  });

  test('B. $0 CHARGEBACK order does not increment chargebackOrdersCount', () => {
    const orders: OrderFinancialRecord[] = [
      {
        id: 'ord_zero_cb',
        totalCents: 0,
        currency: 'USD',
        paymentStatus: 'CHARGEBACK',
      },
    ];

    const result = calculateFinancialTotals(orders);
    expect(result.chargebackOrdersCount).toBe(0);
    expect(result.paidOrdersCount).toBe(0);
    expect(result.refundedOrdersCount).toBe(0);
    expect(result.totalOrdersCount).toBe(1);
    expect(result.chargebackRatePercent).toBe('0.0');
  });

  test('C. $5 PAID + $5 REFUNDED + $0 REFUNDED => Refund Rate = 50.0%', () => {
    const orders: OrderFinancialRecord[] = [
      {
        id: 'ord_paid_5',
        totalCents: 500,
        currency: 'USD',
        paymentStatus: 'PAID',
      },
      {
        id: 'ord_ref_5',
        totalCents: 500,
        currency: 'USD',
        paymentStatus: 'REFUNDED',
      },
      {
        id: 'ord_ref_0',
        totalCents: 0,
        currency: 'USD',
        paymentStatus: 'REFUNDED',
      },
    ];

    const result = calculateFinancialTotals(orders);
    expect(result.paidOrdersCount).toBe(1);
    expect(result.refundedOrdersCount).toBe(1);
    expect(result.chargebackOrdersCount).toBe(0);
    expect(result.totalOrdersCount).toBe(3);
    // Denominator = 1 (paid) + 1 (refunded) + 0 (cb) = 2
    // Refund rate = 1 / 2 = 50.0%
    expect(result.refundRatePercent).toBe('50.0');
    expect(result.chargebackRatePercent).toBe('0.0');
  });

  test('D. $5 REFUNDED + $5 REFUNDED + $0 REFUNDED => Refund Rate = 100.0%', () => {
    const orders: OrderFinancialRecord[] = [
      {
        id: 'ord_ref_5_a',
        totalCents: 500,
        currency: 'USD',
        paymentStatus: 'REFUNDED',
      },
      {
        id: 'ord_ref_5_b',
        totalCents: 500,
        currency: 'USD',
        paymentStatus: 'REFUNDED',
      },
      {
        id: 'ord_ref_0',
        totalCents: 0,
        currency: 'USD',
        paymentStatus: 'REFUNDED',
      },
    ];

    const result = calculateFinancialTotals(orders);
    expect(result.paidOrdersCount).toBe(0);
    expect(result.refundedOrdersCount).toBe(2);
    expect(result.chargebackOrdersCount).toBe(0);
    expect(result.totalOrdersCount).toBe(3);
    // Denominator = 0 (paid) + 2 (refunded) + 0 (cb) = 2
    // Refund rate = 2 / 2 = 100.0%
    expect(result.refundRatePercent).toBe('100.0');
    expect(result.chargebackRatePercent).toBe('0.0');
    expect(result.grossSalesCents).toBe(1000);
    expect(result.refundsCents).toBe(1000);
    expect(result.netRevenueCents).toBe(0);
  });

  test('E. $5 CHARGEBACK + $5 REFUNDED + $0 CHARGEBACK => correct monetary-only rates', () => {
    const orders: OrderFinancialRecord[] = [
      {
        id: 'ord_cb_5',
        totalCents: 500,
        currency: 'USD',
        paymentStatus: 'CHARGEBACK',
      },
      {
        id: 'ord_ref_5',
        totalCents: 500,
        currency: 'USD',
        paymentStatus: 'REFUNDED',
      },
      {
        id: 'ord_cb_0',
        totalCents: 0,
        currency: 'USD',
        paymentStatus: 'CHARGEBACK',
      },
    ];

    const result = calculateFinancialTotals(orders);
    expect(result.paidOrdersCount).toBe(0);
    expect(result.refundedOrdersCount).toBe(1);
    expect(result.chargebackOrdersCount).toBe(1);
    expect(result.totalOrdersCount).toBe(3);
    // Denominator = 0 + 1 + 1 = 2
    expect(result.refundRatePercent).toBe('50.0');
    expect(result.chargebackRatePercent).toBe('50.0');
  });

  test('F. Ensure zero-dollar orders remain counted in totalOrdersCount and operational metrics', () => {
    const orders: OrderFinancialRecord[] = [
      {
        id: 'ord_zero_paid',
        totalCents: 0,
        currency: 'USD',
        paymentStatus: 'PAID',
      },
      {
        id: 'ord_zero_ref',
        totalCents: 0,
        currency: 'USD',
        paymentStatus: 'REFUNDED',
      },
      {
        id: 'ord_zero_cb',
        totalCents: 0,
        currency: 'USD',
        paymentStatus: 'CHARGEBACK',
      },
    ];

    const result = calculateFinancialTotals(orders);
    expect(result.totalOrdersCount).toBe(3);
    expect(result.paidOrdersCount).toBe(0);
    expect(result.refundedOrdersCount).toBe(0);
    expect(result.chargebackOrdersCount).toBe(0);
    expect(result.refundRatePercent).toBe('0.0');
    expect(result.chargebackRatePercent).toBe('0.0');
  });
});
