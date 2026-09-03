import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as getOffers, POST as createOffer } from '@/app/api/admin/offers/route';
import { GET as getOfferById, PATCH as updateOffer } from '@/app/api/admin/offers/[id]/route';

const mockOffersStore: any[] = [];

vi.mock('@/lib/auth', () => ({
  requireAdmin: vi.fn().mockResolvedValue({ id: 'admin_test', role: 'SUPER_ADMIN' }),
}));

vi.mock('@/db', () => ({
  db: {
    query: {
      offers: {
        findMany: vi.fn().mockImplementation(({ where }: any = {}) => {
          return Promise.resolve(mockOffersStore);
        }),
      },
    },
    insert: vi.fn().mockImplementation(() => ({
      values: vi.fn().mockImplementation((val: any) => ({
        returning: vi.fn().mockImplementation(() => {
          const item = { id: `off_${Date.now()}_${Math.random()}`, ...val, createdAt: new Date(), updatedAt: new Date() };
          mockOffersStore.push(item);
          return Promise.resolve([item]);
        }),
      })),
    })),
    update: vi.fn().mockImplementation(() => ({
      set: vi.fn().mockImplementation((val: any) => ({
        where: vi.fn().mockImplementation(() => ({
          returning: vi.fn().mockImplementation(() => {
            if (mockOffersStore.length > 0) {
              Object.assign(mockOffersStore[0], val);
              return Promise.resolve([mockOffersStore[0]]);
            }
            return Promise.resolve([]);
          }),
        })),
      })),
    })),
  },
}));

describe('Admin Offers API - Phase 2.3 Unit & Security Tests', () => {
  beforeEach(() => {
    mockOffersStore.length = 0;
  });

  it('A) Create valid offer with product & plan codes -> persists successfully', async () => {
    const payload = {
      platform: 'instagram',
      service: 'followers',
      name: '1,000 Premium Followers',
      slug: 'ig-followers-1k',
      quantity: 1000,
      priceCents: 999,
      currency: 'USD',
      externalCheckoutUrl: 'https://checkout.perfectpay.com.br/pay/PPU123',
      perfectpayProductId: 'PP_PROD_100',
      perfectpayPlanId: 'PP_PLAN_100',
      active: true,
    };

    const req = new Request('http://localhost:3000/api/admin/offers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await createOffer(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.offer.name).toBe('1,000 Premium Followers');
    expect(json.data.offer.perfectpayProductId).toBe('PP_PROD_100');
    expect(json.data.offer.perfectpayPlanId).toBe('PP_PLAN_100');
    expect(mockOffersStore.length).toBe(1);
  });

  it('B) Reject insecure non-https externalCheckoutUrl', async () => {
    const payload = {
      platform: 'tiktok',
      service: 'likes',
      name: '500 Likes',
      slug: 'tt-likes-500',
      quantity: 500,
      priceCents: 499,
      externalCheckoutUrl: 'javascript:alert(1)',
    };

    const req = new Request('http://localhost:3000/api/admin/offers', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const res = await createOffer(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it('C & D) Product and Plan codes are persisted and returned in GET', async () => {
    mockOffersStore.push({
      id: 'off_test_1',
      platform: 'twitter',
      service: 'followers',
      name: 'Starter',
      slug: 'twitter-followers-starter',
      quantity: 500,
      bonusQuantity: 0,
      priceCents: 1499,
      oldPriceCents: null,
      currency: 'USD',
      badge: null,
      isPopular: false,
      externalCheckoutUrl: 'https://checkout.perfectpay.com.br/pay/X1',
      perfectpayProductId: 'PROD_X',
      perfectpayPlanId: 'PLAN_X',
      active: true,
      sortOrder: 0,
    });

    const res = await getOffers();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    const twitterStarter = json.data.items.find((i: any) => i.platform === 'twitter' && i.service === 'followers' && i.plan === 'starter');
    expect(twitterStarter).toBeDefined();
    expect(twitterStarter.perfectpayProductId).toBe('PROD_X');
    expect(twitterStarter.perfectpayPlanId).toBe('PLAN_X');
    expect(twitterStarter.price).toBe(14.99);
  });

  it('E & F) Edit Offer (PATCH) and Deactivate', async () => {
    mockOffersStore.push({
      id: 'off_edit_1',
      name: 'Old Name',
      priceCents: 999,
      active: true,
    });

    const req = new Request('http://localhost:3000/api/admin/offers/off_edit_1', {
      method: 'PATCH',
      body: JSON.stringify({
        name: 'Updated Name',
        priceCents: 1299,
        active: false,
      }),
    });

    const res = await updateOffer(req, { params: Promise.resolve({ id: 'off_edit_1' }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(mockOffersStore[0].name).toBe('Updated Name');
    expect(mockOffersStore[0].active).toBe(false);
  });
});
