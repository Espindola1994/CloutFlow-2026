import { describe, it, expect, vi } from 'vitest';
import { GET as getPublicOffers } from '@/app/api/offers/route';

const mockOffersDb = [
  {
    id: 'off_active_ig_1',
    platform: 'instagram',
    service: 'followers',
    name: 'Starter',
    slug: 'instagram-followers-starter',
    quantity: 2000,
    bonusQuantity: 0,
    priceCents: 1490,
    oldPriceCents: 2990,
    currency: 'USD',
    badge: 'Popular',
    isPopular: true,
    sortOrder: 1,
    externalCheckoutUrl: 'https://checkout.perfectpay.com.br/pay/SECRET_URL',
    perfectpayProductId: 'PPPBF6TP',
    perfectpayPlanId: 'PPLQQQ3F7',
    active: true,
  },
  {
    id: 'off_inactive_ig_2',
    platform: 'instagram',
    service: 'followers',
    name: 'Inactive Plan',
    slug: 'ig-followers-inactive',
    quantity: 500,
    priceCents: 990,
    currency: 'USD',
    active: false,
  },
  {
    id: 'off_active_tt_3',
    platform: 'tiktok',
    service: 'views',
    name: '10,000 Views',
    slug: 'tt-views-10k',
    quantity: 10000,
    priceCents: 1990,
    currency: 'USD',
    active: true,
  },
];

vi.mock('@/db', () => ({
  db: {
    query: {
      offers: {
        findMany: vi.fn().mockImplementation(({ where }: any = {}) => {
          // Return only active Instagram Followers
          return Promise.resolve(mockOffersDb.filter((o) => o.active && o.platform === 'instagram' && o.service === 'followers'));
        }),
      },
    },
  },
}));

describe('Public Offers API - Security & Data Sanitization', () => {
  it('Returns only active offers and strictly STRIPS internal checkout URLs, product codes and plan codes', async () => {
    const req = new Request('http://localhost:3000/api/offers?platform=instagram&service=followers');
    const res = await getPublicOffers(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.items.length).toBe(6);

    const item = json.data.items[0];
    expect(item.id).toBe('off_active_ig_1');
    expect(item.name).toBe('Starter');
    expect(item.quantity).toBe(2000);
    expect(item.priceCents).toBe(1490);
    expect(item.currency).toBe('USD');

    // Strict Security verification: NEVER expose checkout URLs or PerfectPay codes to public client
    expect((item as any).externalCheckoutUrl).toBeUndefined();
    expect((item as any).perfectpayProductId).toBeUndefined();
    expect((item as any).perfectpayPlanId).toBeUndefined();
  });
});
