import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as checkoutContextPOST } from '@/app/api/checkout/context/route';

// Mock DB
vi.mock('@/db', () => ({
  db: {
    query: {
      offers: { findMany: vi.fn() },
      customerOffers: { findMany: vi.fn() },
      customers: { findMany: vi.fn() },
    },
    execute: vi.fn().mockResolvedValue(true),
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        onConflictDoUpdate: vi.fn().mockReturnValue({ catch: vi.fn() }),
        returning: vi.fn().mockResolvedValue([{ id: 'lead-123' }]),
        catch: vi.fn(),
      })
    })
  }
}));

vi.mock('@/services/lifecycle/event.service', () => ({
  emitLifecycleEvent: vi.fn().mockResolvedValue(true)
}));

import { db } from '@/db';

describe('Checkout Context Validation with Canonical Offer Expiration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockActiveOffer = {
    id: 'offer-1',
    active: true,
    platform: 'instagram',
    service: 'followers',
    priceCents: 1000,
    externalCheckoutUrl: 'https://checkout.perfectpay.com.br/pay/PPU38CQ1234',
    perfectpayProductId: 'PROD1',
    perfectpayPlanId: 'PLAN1'
  };

  it('F/G. Rejects expired offer code during checkout context preparation', async () => {
    (db.query.offers.findMany as any).mockResolvedValueOnce([mockActiveOffer]);
    
    // Customer offer expired 5 minutes ago, but status in DB might still say 'ACTIVE'
    const expiredOffer = {
      id: 'cust-offer-1',
      code: 'EXPIRED25',
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() - 5 * 60 * 1000)
    };
    (db.query.customerOffers.findMany as any).mockResolvedValueOnce([expiredOffer]);
    (db.query.customers.findMany as any).mockResolvedValueOnce([]);

    const request = new Request('http://localhost/api/checkout/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offerId: 'offer-1',
        targetType: 'profile',
        socialUsername: 'testuser',
        email: 'test@example.com',
        offerCode: 'EXPIRED25'
      })
    });

    const response = await checkoutContextPOST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);

    // Checkout URL must NOT have the cupom parameter
    expect(json.data.checkoutUrl).not.toContain('cupom=EXPIRED25');
  });

  it('Accepts valid active offer code during checkout context preparation', async () => {
    (db.query.offers.findMany as any).mockResolvedValueOnce([mockActiveOffer]);
    
    // Customer offer valid for next 1 hour
    const activeOffer = {
      id: 'cust-offer-2',
      code: 'VALID25',
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000)
    };
    (db.query.customerOffers.findMany as any).mockResolvedValueOnce([activeOffer]);
    (db.query.customers.findMany as any).mockResolvedValueOnce([]);

    const request = new Request('http://localhost/api/checkout/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offerId: 'offer-1',
        targetType: 'profile',
        socialUsername: 'testuser',
        email: 'test@example.com',
        offerCode: 'VALID25'
      })
    });

    const response = await checkoutContextPOST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);

    // Checkout URL MUST have the cupom parameter
    expect(json.data.checkoutUrl).toContain('cupom=VALID25');
  });

  it('J. Normal checkout without offerCode remains completely unaffected', async () => {
    (db.query.offers.findMany as any).mockResolvedValueOnce([mockActiveOffer]);
    (db.query.customers.findMany as any).mockResolvedValueOnce([]);

    const request = new Request('http://localhost/api/checkout/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offerId: 'offer-1',
        targetType: 'profile',
        socialUsername: 'testuser',
        email: 'test@example.com'
      })
    });

    const response = await checkoutContextPOST(request);
    expect(response.status).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.checkoutUrl).not.toContain('cupom=');
  });
});
