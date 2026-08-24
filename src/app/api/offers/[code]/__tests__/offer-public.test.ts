/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getPublicOffer } from '@/app/api/offers/[code]/route';

// Mock DB
vi.mock('@/db', () => ({
  db: {
    query: {
      customerOffers: { findMany: vi.fn() },
      offers: { findMany: vi.fn() },
      orders: { findMany: vi.fn() },
    },
  },
}));

import { db } from '@/db';

describe('Public Offer Landing API (/api/offers/[code])', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockActiveGrowthOffer = {
    id: 'growth-offer-1',
    name: '1000 Instagram Followers',
    slug: '1000-instagram-followers',
    platform: 'instagram',
    service: 'followers',
    quantity: 1000,
    bonusQuantity: 0,
    priceCents: 1490,
    currency: 'USD',
    active: true,
    sortOrder: 1,
    metadata: { isPopular: true },
  };

  it('A. Valid active CF25 offer returns 200 with FLOW25 coupon and sanitized packages', async () => {
    const activeCustomerOffer = {
      id: 'cust-off-1',
      customerEmail: 'customer@example.com',
      campaignType: 'POST_PURCHASE_25_OFF',
      discountType: 'PERCENTAGE',
      discountValue: 25,
      status: 'ACTIVE',
      code: 'CF25-E772159F',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h in future
      createdAt: new Date(),
    };

    (db.query.customerOffers.findMany as any).mockResolvedValueOnce([activeCustomerOffer]);
    (db.query.offers.findMany as any).mockResolvedValueOnce([mockActiveGrowthOffer]);

    const req = new Request('http://localhost/api/offers/CF25-E772159F');
    const res = await getPublicOffer(req, { params: { code: 'CF25-E772159F' } });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.code).toBe('CF25-E772159F');
    expect(json.data.couponCode).toBe('FLOW25');
    expect(json.data.discountPercent).toBe(25);
    expect(json.data.status).toBe('ACTIVE');
    expect(json.data.packages).toHaveLength(1);
    expect(json.data.packages[0].name).toBe('1000 Instagram Followers');

    // Sensitive fields MUST NOT be exposed
    expect(json.data.packages[0].externalCheckoutUrl).toBeUndefined();
    expect(json.data.packages[0].perfectpayProductId).toBeUndefined();
    expect(json.data.packages[0].perfectpayPlanId).toBeUndefined();
    expect(json.data.customerEmail).toBeUndefined();
    expect(json.data.sourceOrderId).toBeUndefined();
  });

  it('B. Unknown offer returns 404', async () => {
    (db.query.customerOffers.findMany as any).mockResolvedValueOnce([]);

    const req = new Request('http://localhost/api/offers/CF25-UNKNOWN');
    const res = await getPublicOffer(req, { params: { code: 'CF25-UNKNOWN' } });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.message).toBe('This offer is no longer available.');
  });

  it('C. Expired offer returns 410 with unavailable status and NO coupon details', async () => {
    const expiredCustomerOffer = {
      id: 'cust-off-2',
      customerEmail: 'customer@example.com',
      campaignType: 'POST_PURCHASE_25_OFF',
      discountType: 'PERCENTAGE',
      discountValue: 25,
      status: 'ACTIVE',
      code: 'CF25-EXPIRED',
      expiresAt: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
      createdAt: new Date(),
    };

    (db.query.customerOffers.findMany as any).mockResolvedValueOnce([expiredCustomerOffer]);

    const req = new Request('http://localhost/api/offers/CF25-EXPIRED');
    const res = await getPublicOffer(req, { params: { code: 'CF25-EXPIRED' } });

    expect(res.status).toBe(410);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.message).toBe('This offer is no longer available.');
  });

  it('D. Redeemed offer returns 410 with unavailable status', async () => {
    const redeemedCustomerOffer = {
      id: 'cust-off-3',
      customerEmail: 'customer@example.com',
      campaignType: 'POST_PURCHASE_25_OFF',
      discountType: 'PERCENTAGE',
      discountValue: 25,
      status: 'REDEEMED',
      code: 'CF25-REDEEMED',
      redeemedAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };

    (db.query.customerOffers.findMany as any).mockResolvedValueOnce([redeemedCustomerOffer]);

    const req = new Request('http://localhost/api/offers/CF25-REDEEMED');
    const res = await getPublicOffer(req, { params: { code: 'CF25-REDEEMED' } });

    expect(res.status).toBe(410);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.message).toBe('This offer is no longer available.');
  });

  it('E. ADMIN_TEST offer with campaignType POST_PURCHASE_25_OFF resolves correctly', async () => {
    const adminTestOffer = {
      id: 'cust-off-admin',
      customerEmail: 'admin-test@example.com',
      campaignType: 'POST_PURCHASE_25_OFF',
      discountType: 'PERCENTAGE',
      discountValue: 25,
      status: 'ACTIVE',
      sourceOrderId: 'ADMIN_TEST',
      code: 'CF25-ADM12345',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes validity
      createdAt: new Date(),
    };

    (db.query.customerOffers.findMany as any).mockResolvedValueOnce([adminTestOffer]);
    (db.query.offers.findMany as any).mockResolvedValueOnce([mockActiveGrowthOffer]);

    const req = new Request('http://localhost/api/offers/CF25-ADM12345');
    const res = await getPublicOffer(req, { params: { code: 'CF25-ADM12345' } });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.code).toBe('CF25-ADM12345');
    expect(json.data.couponCode).toBe('FLOW25');
  });

  it('F. Evaluates previousTarget from customerOffer metadata if available', async () => {
    const offerWithMeta = {
      id: 'cust-off-meta',
      customerEmail: 'returning@example.com',
      campaignType: 'POST_PURCHASE_25_OFF',
      discountType: 'PERCENTAGE',
      discountValue: 25,
      status: 'ACTIVE',
      code: 'CF25-META1234',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      metadata: {
        platform: 'instagram',
        targetHandle: 'guilhermeterraaa',
        targetType: 'profile',
        avatarUrl: 'https://example.com/historical-pic.jpg',
      },
    };

    (db.query.customerOffers.findMany as any).mockResolvedValueOnce([offerWithMeta]);
    (db.query.offers.findMany as any).mockResolvedValueOnce([mockActiveGrowthOffer]);

    const req = new Request('http://localhost/api/offers/CF25-META1234');
    const res = await getPublicOffer(req, { params: { code: 'CF25-META1234' } });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.previousTarget).toEqual({
      platform: 'instagram',
      username: 'guilhermeterraaa',
      targetType: 'profile',
      profileUrl: null,
      avatarUrl: 'https://example.com/historical-pic.jpg',
      maskedEmail: 'ret*****@example.com',
      previousPackageName: null,
    });
    // Ensure no sensitive fields
    expect(json.data.customerEmail).toBeUndefined();
  });

  it('G. Evaluates previousTarget from previous customer order history', async () => {
    const offerWithoutMeta = {
      id: 'cust-off-history',
      customerEmail: 'returning2@example.com',
      campaignType: 'POST_PURCHASE_25_OFF',
      discountType: 'PERCENTAGE',
      discountValue: 25,
      status: 'ACTIVE',
      code: 'CF25-HIST1234',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      sourceOrderId: 'ord-123',
    };

    const previousOrder = {
      id: 'ord-123',
      platform: 'tiktok',
      socialUsername: 'tiktokcreator',
      profileUrl: 'https://tiktok.com/@tiktokcreator',
    };

    (db.query.customerOffers.findMany as any).mockResolvedValueOnce([offerWithoutMeta]);
    (db.query.orders.findMany as any).mockResolvedValueOnce([previousOrder]);
    (db.query.offers.findMany as any).mockResolvedValueOnce([mockActiveGrowthOffer]);

    const req = new Request('http://localhost/api/offers/CF25-HIST1234');
    const res = await getPublicOffer(req, { params: { code: 'CF25-HIST1234' } });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.previousTarget).toEqual({
      platform: 'tiktok',
      username: 'tiktokcreator',
      targetType: 'profile',
      profileUrl: 'https://tiktok.com/@tiktokcreator',
      avatarUrl: null,
      maskedEmail: 'ret*****@example.com',
      previousPackageName: null,
    });
  });
});
