import { describe, it, expect, vi } from 'vitest';
import { POST as createCheckoutContext } from '@/app/api/checkout/context/route';
import { OFFICIAL_PERFECTPAY_66_DATASET } from '@/config/official-perfectpay-dataset';
import { CLOUTFLOW_CATALOG_PACKAGES } from '@/config/financial-protection.config';

vi.mock('@/db', () => ({
  db: {
    query: {
      offers: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
    insert: vi.fn().mockImplementation(() => ({
      values: vi.fn().mockResolvedValue(undefined),
    })),
  },
}));

describe('Twitter/X Views 6 Cards Checkout & Progression Verification', () => {
  const twitterViewsCards = [
    { plan: 'starter', name: 'Starter', quantity: 10000, priceCents: 590, expectedPlanCode: 'PPLQQQD1E', expectedUrl: 'https://go.centerpag.com/PPU38CQFR9Q' },
    { plan: 'boost', name: 'Boost', quantity: 25000, priceCents: 990, expectedPlanCode: 'PPLQQQD29', expectedUrl: 'https://go.centerpag.com/PPU38CQFRDK' },
    { plan: 'growth', name: 'Growth', quantity: 50000, priceCents: 1490, expectedPlanCode: 'PPLQQQD2C', expectedUrl: 'https://go.centerpag.com/PPU38CQFRE7' },
    { plan: 'pro', name: 'Pro', quantity: 100000, priceCents: 2490, expectedPlanCode: 'PPLQQQ3GC', expectedUrl: 'https://go.centerpag.com/PPU38CQFRSL' },
    { plan: 'elite', name: 'Elite', quantity: 150000, priceCents: 3490, expectedPlanCode: 'PPLQQQD2J', expectedUrl: 'https://go.centerpag.com/PPU38CQFREM' },
    { plan: 'max', name: 'Max', quantity: 250000, priceCents: 4990, expectedPlanCode: 'PPLQQQD2L', expectedUrl: 'https://go.centerpag.com/PPU38CQFREP' },
  ] as const;

  // 1. Validate dataset integrity for the 6 cards
  for (const card of twitterViewsCards) {
    it(`preserves configuration and dataset for Twitter Views ${card.name} (${card.quantity.toLocaleString('en-US')} Views @ $${(card.priceCents / 100).toFixed(2)})`, () => {
      const catalogEntry = CLOUTFLOW_CATALOG_PACKAGES.find(
        (p) => p.platform === 'twitter' && p.service === 'views' && p.name === card.name
      );
      expect(catalogEntry).toBeDefined();
      expect(catalogEntry?.quantity).toBe(card.quantity);
      expect(catalogEntry?.priceCents).toBe(card.priceCents);

      const datasetEntry = OFFICIAL_PERFECTPAY_66_DATASET.find(
        (d) => d.platform === 'twitter' && d.service === 'views' && d.plan === card.plan
      );
      expect(datasetEntry).toBeDefined();
      expect(datasetEntry?.planCode).toBe(card.expectedPlanCode);
      expect(datasetEntry?.checkoutUrl).toBe(card.expectedUrl);
    });
  }

  // 2. Test individual checkout creation for each of the 6 cards with targetType: 'post'
  for (const card of twitterViewsCards) {
    it(`successfully creates checkout context for Twitter Views ${card.name} with targetType: post`, async () => {
      const canonicalOfferId = `canonical-twitter-views-${card.plan}`;
      const payload = {
        offerId: canonicalOfferId,
        targetType: 'post',
        targetValue: 'https://x.com/creator/status/123456789',
        targetUrl: 'https://x.com/creator/status/123456789',
        socialUsername: 'creator',
        email: 'customer@example.com',
      };

      const req = new Request('http://localhost:3000/api/checkout/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await createCheckoutContext(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data?.contextId).toBeDefined();
      expect(json.data?.checkoutUrl).toContain(card.expectedUrl);
      expect(json.data?.checkoutUrl).toContain(`src=${json.data.contextId}`);
    });
  }

  // 3. Test individual checkout creation for each of the 6 cards with targetType: 'video'
  for (const card of twitterViewsCards) {
    it(`successfully creates checkout context for Twitter Views ${card.name} with targetType: video`, async () => {
      const canonicalOfferId = `canonical-twitter-views-${card.plan}`;
      const payload = {
        offerId: canonicalOfferId,
        targetType: 'video',
        targetValue: 'https://x.com/creator/status/123456789',
        targetUrl: 'https://x.com/creator/status/123456789',
        socialUsername: 'creator',
        email: 'customer@example.com',
      };

      const req = new Request('http://localhost:3000/api/checkout/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await createCheckoutContext(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data?.contextId).toBeDefined();
      expect(json.data?.checkoutUrl).toContain(card.expectedUrl);
      expect(json.data?.checkoutUrl).toContain(`src=${json.data.contextId}`);
    });
  }

  // 4. Regression tests for other services
  it('confirms Twitter Followers continues working', async () => {
    const req = new Request('http://localhost:3000/api/checkout/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offerId: 'canonical-twitter-followers-starter',
        targetType: 'profile',
        targetValue: 'twitter_user',
        socialUsername: 'twitter_user',
        email: 'test@example.com',
      }),
    });
    const res = await createCheckoutContext(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.checkoutUrl).toContain('https://go.centerpag.com/PPU38CQFR9O');
  });

  it('confirms Twitter Likes continues working', async () => {
    const req = new Request('http://localhost:3000/api/checkout/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offerId: 'canonical-twitter-likes-starter',
        targetType: 'post',
        targetValue: 'https://x.com/user/status/987654321',
        targetUrl: 'https://x.com/user/status/987654321',
        socialUsername: 'user',
        email: 'test@example.com',
      }),
    });
    const res = await createCheckoutContext(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.checkoutUrl).toContain('https://go.centerpag.com/PPU38CQFRSH');
  });

  it('confirms Instagram Followers continues working', async () => {
    const req = new Request('http://localhost:3000/api/checkout/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offerId: 'canonical-instagram-followers-starter',
        targetType: 'profile',
        targetValue: 'insta_user',
        socialUsername: 'insta_user',
        email: 'test@example.com',
      }),
    });
    const res = await createCheckoutContext(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.checkoutUrl).toContain('https://go.centerpag.com/PPU38CQEOIF');
  });

  it('confirms TikTok Likes continues working', async () => {
    const req = new Request('http://localhost:3000/api/checkout/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offerId: 'canonical-tiktok-likes-starter',
        targetType: 'video',
        targetValue: 'https://www.tiktok.com/@tiktok_user/video/123456789',
        targetUrl: 'https://www.tiktok.com/@tiktok_user/video/123456789',
        socialUsername: 'tiktok_user',
        email: 'test@example.com',
      }),
    });
    const res = await createCheckoutContext(req);
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data?.checkoutUrl).toContain('https://go.centerpag.com/PPU38CQFR8P');
  });
});
