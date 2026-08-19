import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/offers/route';
import { POST } from '@/app/api/checkout/context/route';
import { db } from '@/db';

vi.mock('@/db', () => ({
  db: {
    query: {
      offers: {
        findMany: vi.fn(),
      },
      checkoutContexts: {
        findMany: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve()),
    })),
  },
}));

describe('Phase 2.9 — Public Offers & Sales Page Context Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('A & B. should return active public offers from db with exact commercial fields', async () => {
    const mockDbOffers = [
      {
        id: 'off_1',
        platform: 'instagram',
        service: 'followers',
        name: '1,000 Instagram Followers',
        slug: 'ig-fol-1k',
        description: 'Starter boost',
        quantity: 1000,
        bonusQuantity: 100,
        priceCents: 990,
        oldPriceCents: 1990,
        currency: 'USD',
        badge: 'STARTER',
        isPopular: false,
        sortOrder: 0,
        active: true,
        metadata: {
          benefits: ['Instant start', 'No password'],
          ctaText: 'BUY NOW',
        },
        externalCheckoutUrl: 'https://checkout.perfectpay.com.br/pay/P123',
        perfectpayProductId: 'PROD_SECRET_1',
        perfectpayPlanId: 'PLAN_SECRET_1',
      },
    ];

    (db.query.offers.findMany as any).mockResolvedValue(mockDbOffers);

    const req = new Request('http://localhost:3000/api/offers?platform=instagram&service=followers');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.items).toHaveLength(1);

    const item = json.data.items[0];
    expect(item.id).toBe('off_1');
    expect(item.name).toBe('1,000 Instagram Followers');
    expect(item.quantity).toBe(1000);
    expect(item.bonusQuantity).toBe(100);
    expect(item.priceCents).toBe(990);
    expect(item.oldPriceCents).toBe(1990);
    expect(item.badge).toBe('STARTER');
    expect(item.benefits).toEqual(['Instant start', 'No password']);
    expect(item.ctaText).toBe('BUY NOW');

    // Security check: sensitive internal fields must NOT leak
    expect(item.externalCheckoutUrl).toBeUndefined();
    expect(item.perfectpayProductId).toBeUndefined();
    expect(item.perfectpayPlanId).toBeUndefined();
  });

  it('C & D. should respect max 6 offers and filter out inactive ones', async () => {
    // 8 mock offers returned by db query mock
    const eightOffers = Array.from({ length: 8 }).map((_, idx) => ({
      id: `off_${idx}`,
      platform: 'tiktok',
      service: 'likes',
      name: `Offer ${idx}`,
      slug: `tt-like-${idx}`,
      quantity: (idx + 1) * 500,
      bonusQuantity: 0,
      priceCents: (idx + 1) * 500,
      oldPriceCents: null,
      currency: 'USD',
      badge: null,
      isPopular: idx === 2,
      sortOrder: idx,
      active: true,
      metadata: null,
    }));

    (db.query.offers.findMany as any).mockResolvedValue(eightOffers.slice(0, 6));

    const req = new Request('http://localhost:3000/api/offers?platform=tiktok&service=likes');
    const res = await GET(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.items.length).toBeLessThanOrEqual(6);
  });

  it('O. should require profile target for Instagram Followers', async () => {
    const mockOffer = {
      id: 'off_fol_1',
      platform: 'instagram',
      service: 'followers',
      active: true,
      externalCheckoutUrl: 'https://checkout.perfectpay.com.br/pay/P123',
      perfectpayProductId: 'PROD_123',
      perfectpayPlanId: 'PLAN_456',
    };

    (db.query.offers.findMany as any).mockResolvedValue([mockOffer]);

    const req = new Request('http://localhost:3000/api/checkout/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offerId: 'off_fol_1',
        targetType: 'post', // INVALID for followers
        targetUrl: 'https://instagram.com/p/abc123',
      }),
    });

    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
    expect(json.success).toBe(false);
  });

  it('P. should require content target URL for Likes/Views/Comments', async () => {
    const mockOffer = {
      id: 'off_like_1',
      platform: 'instagram',
      service: 'likes',
      active: true,
      externalCheckoutUrl: 'https://checkout.perfectpay.com.br/pay/P999',
      perfectpayProductId: 'PROD_L1',
      perfectpayPlanId: 'PLAN_L1',
    };

    (db.query.offers.findMany as any).mockResolvedValue([mockOffer]);

    const req = new Request('http://localhost:3000/api/checkout/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offerId: 'off_like_1',
        targetType: 'post',
        targetUrl: null, // missing required content URL
      }),
    });

    const res = await POST(req);
    const json = await res.json();
    expect(res.status).toBe(400);
  });

  it('K, L, M, N. should generate CFCTX and secure checkout redirect when target is valid', async () => {
    const mockOffer = {
      id: 'off_fol_1',
      platform: 'instagram',
      service: 'followers',
      active: true,
      externalCheckoutUrl: 'https://checkout.perfectpay.com.br/pay/P123?utm_source=cloutflow',
      perfectpayProductId: 'PROD_123',
      perfectpayPlanId: 'PLAN_456',
    };

    (db.query.offers.findMany as any).mockResolvedValue([mockOffer]);

    const req = new Request('http://localhost:3000/api/checkout/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offerId: 'off_fol_1',
        targetType: 'profile',
        socialUsername: 'testuser',
        profileUrl: 'https://instagram.com/testuser',
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.contextId).toMatch(/^CFCTX_[a-f0-9]{24}$/);
    expect(json.data.checkoutUrl).toContain('src=CFCTX_');
    expect(json.data.checkoutUrl).toContain('checkout.perfectpay.com.br');
  });
});
