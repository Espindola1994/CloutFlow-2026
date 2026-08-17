import { describe, it, expect } from 'vitest';
import { normalizePerfectPayPayload } from '../normalize';

describe('PerfectPay Adapter - Unit Tests (Controlled Fixtures)', () => {
  it('correctly normalizes pre_checkout / abandonment event', () => {
    const fixture = {
      token: 'test_token_123',
      event: 'pre_checkout',
      id: 'evt_test_01',
      customer: { email: 'buyer@example.com', name: 'John Doe', phone: '+123456789' },
      sale_amount: 19.99,
      utm_source: 'instagram_ads',
    };
    const result = normalizePerfectPayPayload(fixture);
    expect(result.normalizedStatus).toBe('pre_checkout');
    expect(result.rawToken).toBe('test_token_123');
    expect(result.customerEmail).toBe('buyer@example.com');
    expect(result.amountCents).toBe(1999);
    expect(result.utmSource).toBe('instagram_ads');
    expect(result.metadataSafe.token).toBeUndefined(); // Stripped from metadataSafe
  });

  it('correctly normalizes pending payment (billet/pix generated)', () => {
    const fixture = {
      status: 'waiting_payment',
      sale_code: 'PP-SALE-002',
      payment_method: 'pix',
      amount: 49.90,
    };
    const result = normalizePerfectPayPayload(fixture);
    expect(result.normalizedStatus).toBe('pending');
    expect(result.externalOrderId).toBe('PP-SALE-002');
    expect(result.paymentMethod).toBe('pix');
    expect(result.amountCents).toBe(4990);
  });

  it('correctly normalizes approved sale', () => {
    const fixture = {
      sale_status: 'approved',
      sale_code: 'PP-SALE-003',
      product_id: 'PROD_100',
      plan_id: 'PLAN_100',
      amount_cents: 2990,
      checkout_reference: 'cloutflow_ref_abc123',
    };
    const result = normalizePerfectPayPayload(fixture);
    expect(result.normalizedStatus).toBe('approved');
    expect(result.externalOrderId).toBe('PP-SALE-003');
    expect(result.amountCents).toBe(2990);
    expect(result.checkoutReference).toBe('cloutflow_ref_abc123');
  });

  it('correctly normalizes completed event', () => {
    const fixture = {
      status: 'completed',
      sale_code: 'PP-SALE-004',
    };
    const result = normalizePerfectPayPayload(fixture);
    expect(result.normalizedStatus).toBe('completed');
  });

  it('correctly normalizes rejected / refused sale', () => {
    const fixture = {
      status: 'refused',
      sale_code: 'PP-SALE-005',
    };
    const result = normalizePerfectPayPayload(fixture);
    expect(result.normalizedStatus).toBe('rejected');
  });

  it('correctly normalizes refunded sale', () => {
    const fixture = {
      status: 'refunded',
      sale_code: 'PP-SALE-006',
    };
    const result = normalizePerfectPayPayload(fixture);
    expect(result.normalizedStatus).toBe('refunded');
  });

  it('correctly normalizes chargeback / dispute', () => {
    const fixture = {
      status: 'chargeback',
      sale_code: 'PP-SALE-007',
    };
    const result = normalizePerfectPayPayload(fixture);
    expect(result.normalizedStatus).toBe('chargeback');
  });

  it('safely falls back to unknown on unrecognized status without crashing', () => {
    const fixture = {
      status: 'some_future_custom_status_xyz',
      custom_token: 'secret_token_123',
    };
    const result = normalizePerfectPayPayload(fixture);
    expect(result.normalizedStatus).toBe('unknown');
    expect(result.metadataSafe.custom_token).toBeUndefined(); // confirms sanitization
  });
});
