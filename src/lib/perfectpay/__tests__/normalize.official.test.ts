import { describe, it, expect } from 'vitest';
import { normalizePerfectPayPayload } from '../normalize';

describe('PerfectPay Adapter - Official Postback Contract (Controlled Fixtures)', () => {
  it('correctly normalizes pre_checkout (status enum 12)', () => {
    const fixture = {
      token: 'pub_token_test_123',
      code: 'PP-CODE-001',
      sale_status_enum: 12,
      sale_status_detail: 'Pre Checkout initiated',
      sale_amount: '19.90',
      product: { code: 'PROD_100', name: 'Followers' },
      plan: { code: 'PLAN_100', quantity: 1000 },
      customer: { email: 'buyer@example.com', full_name: 'John Doe', phone_area_code: '11', phone_number: '912345678' },
      metadata: { src: 'cloutflow_ref_001', utm_source: 'fb_ads' }
    };
    
    const result = normalizePerfectPayPayload(fixture);
    expect(result.normalizedStatus).toBe('pre_checkout');
    expect(result.rawToken).toBe('pub_token_test_123');
    expect(result.externalOrderId).toBe('PP-CODE-001');
    expect(result.productId).toBe('PROD_100');
    expect(result.customerEmail).toBe('buyer@example.com');
    expect(result.customerPhone).toBe('11912345678');
    expect(result.amountCents).toBe(1990); // 19.90 * 100
    expect(result.checkoutReference).toBe('cloutflow_ref_001');
    expect(result.metadataSafe.token).toBeUndefined();
  });

  it('correctly normalizes approved sale (status enum 2)', () => {
    const fixture = {
      code: 'PP-CODE-002',
      sale_status_enum: 2,
      sale_amount: 385,
    };
    const result = normalizePerfectPayPayload(fixture);
    expect(result.normalizedStatus).toBe('approved');
    expect(result.externalOrderId).toBe('PP-CODE-002');
    expect(result.amountCents).toBe(38500);
  });

  it('correctly normalizes pending payment (status enum 1)', () => {
    const fixture = {
      sale_status_enum: 1,
      payment_method_enum: 3, // e.g. PIX
    };
    const result = normalizePerfectPayPayload(fixture);
    expect(result.normalizedStatus).toBe('pending');
    expect(result.paymentMethod).toBe('enum_3');
  });

  it('correctly normalizes in_mediation (status enum 4)', () => {
    const fixture = { sale_status_enum: 4 };
    const result = normalizePerfectPayPayload(fixture);
    expect(result.normalizedStatus).toBe('in_mediation');
  });

  it('correctly normalizes chargeback / charged_back (status enum 9)', () => {
    const fixture = { sale_status_enum: 9 };
    const result = normalizePerfectPayPayload(fixture);
    expect(result.normalizedStatus).toBe('charged_back');
  });

  it('correctly normalizes completed (status enum 10)', () => {
    const fixture = { sale_status_enum: 10 };
    const result = normalizePerfectPayPayload(fixture);
    expect(result.normalizedStatus).toBe('completed');
  });

  it('correctly normalizes rejected (status enum 5)', () => {
    const fixture = { sale_status_enum: 5 };
    const result = normalizePerfectPayPayload(fixture);
    expect(result.normalizedStatus).toBe('rejected');
  });

  it('correctly normalizes cancelled (status enum 6)', () => {
    const fixture = { sale_status_enum: 6 };
    const result = normalizePerfectPayPayload(fixture);
    expect(result.normalizedStatus).toBe('cancelled');
  });

  it('correctly normalizes refunded (status enum 7)', () => {
    const fixture = { sale_status_enum: 7 };
    const result = normalizePerfectPayPayload(fixture);
    expect(result.normalizedStatus).toBe('refunded');
  });

  it('correctly normalizes checkout_error (status enum 11)', () => {
    const fixture = { sale_status_enum: 11 };
    const result = normalizePerfectPayPayload(fixture);
    expect(result.normalizedStatus).toBe('checkout_error');
  });

  it('correctly normalizes expired (status enum 13)', () => {
    const fixture = { sale_status_enum: 13 };
    const result = normalizePerfectPayPayload(fixture);
    expect(result.normalizedStatus).toBe('expired');
  });

  it('correctly normalizes in_review (status enum 16)', () => {
    const fixture = { sale_status_enum: 16 };
    const result = normalizePerfectPayPayload(fixture);
    expect(result.normalizedStatus).toBe('in_review');
  });

  it('safely falls back to unknown on unrecognized enum', () => {
    const fixture = { sale_status_enum: 999 };
    const result = normalizePerfectPayPayload(fixture);
    expect(result.normalizedStatus).toBe('unknown');
  });
});
