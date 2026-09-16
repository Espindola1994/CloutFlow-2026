import { describe, it, expect, vi } from 'vitest';
import { OFFICIAL_PERFECTPAY_66_DATASET } from '@/config/official-perfectpay-dataset';
import {
  PLATFORM_SERVICES,
  CommercialPlatform,
  CommercialService,
  CommercialPlan,
  CANONICAL_PLANS,
  getCanonicalPerfectPayItem,
  resolveCommercialCardsForService,
  resolveCommercialOffer,
} from '@/services/commercial-offer.resolver';
import { POST as createCheckoutContext } from '@/app/api/checkout/context/route';

vi.mock('@/db', () => ({
  db: {
    query: {
      offers: {
        findMany: vi.fn().mockImplementation(() => Promise.resolve([])),
      },
      customerOffers: {
        findMany: vi.fn().mockImplementation(() => Promise.resolve([])),
      },
      orders: {
        findMany: vi.fn().mockImplementation(() => Promise.resolve([])),
      },
    },
    insert: vi.fn().mockImplementation(() => ({
      values: vi.fn().mockImplementation(() => Promise.resolve()),
    })),
    execute: vi.fn().mockImplementation(() => Promise.resolve()),
  },
}));

describe('Offer Direct Checkout & Canonical 66/66 Parity Test Suite', () => {
  it('1. Exactly 11 combinations and 66 canonical plans in OFFICIAL_PERFECTPAY_66_DATASET', () => {
    expect(OFFICIAL_PERFECTPAY_66_DATASET).toHaveLength(66);

    const platforms: CommercialPlatform[] = ['instagram', 'tiktok', 'twitter', 'youtube'];
    let totalCombinations = 0;

    for (const p of platforms) {
      const services = PLATFORM_SERVICES[p];
      totalCombinations += services.length;
    }

    expect(totalCombinations).toBe(11);
  });

  it('2. YouTube strictly possesses only Likes and Views (Followers is prohibited)', () => {
    const ytServices = PLATFORM_SERVICES['youtube'];
    expect(ytServices).toEqual(['likes', 'views']);
    expect(ytServices).not.toContain('followers');

    const ytFollowersInDataset = OFFICIAL_PERFECTPAY_66_DATASET.filter(
      (item) => item.platform === 'youtube' && item.service === ('followers' as any)
    );
    expect(ytFollowersInDataset).toHaveLength(0);
  });

  it('3. Comparative Validation HOME x OFFER: 66/66 correspond to the EXACT same canonical checkout destination', () => {
    const platforms: CommercialPlatform[] = ['instagram', 'tiktok', 'twitter', 'youtube'];
    let verifiedCount = 0;
    const discrepancies: string[] = [];

    for (const platform of platforms) {
      const services = PLATFORM_SERVICES[platform];
      for (const service of services) {
        // Resolve Home cards
        const homeCards = resolveCommercialCardsForService(platform, service, [], 'home');
        // Resolve Offer Step 3 cards
        const offerCards = resolveCommercialCardsForService(platform, service, [], 'offer_step3');

        expect(homeCards).toHaveLength(6);
        expect(offerCards).toHaveLength(6);

        for (let i = 0; i < 6; i++) {
          const homeCard = homeCards[i];
          const offerCard = offerCards[i];
          const planKey = CANONICAL_PLANS[i].key;

          // Identity match
          expect(homeCard.platform).toBe(offerCard.platform);
          expect(homeCard.service).toBe(offerCard.service);
          expect(homeCard.plan).toBe(offerCard.plan);
          expect(homeCard.quantity).toBe(offerCard.quantity);
          expect(homeCard.priceCents).toBe(offerCard.priceCents);

          // Canonical checkout destination match
          const canonicalDatasetItem = getCanonicalPerfectPayItem(platform, service, planKey);
          expect(canonicalDatasetItem).not.toBeNull();

          const homeCanonicalItem = getCanonicalPerfectPayItem(homeCard.platform, homeCard.service, homeCard.plan);
          const offerCanonicalItem = getCanonicalPerfectPayItem(offerCard.platform, offerCard.service, offerCard.plan);

          if (!homeCanonicalItem || !offerCanonicalItem || homeCanonicalItem.checkoutUrl !== offerCanonicalItem.checkoutUrl) {
            discrepancies.push(
              `${platform} / ${service} / ${planKey}: Home=${homeCanonicalItem?.checkoutUrl} vs Offer=${offerCanonicalItem?.checkoutUrl}`
            );
          } else {
            expect(homeCanonicalItem.checkoutUrl).toBe(offerCanonicalItem.checkoutUrl);
            expect(homeCanonicalItem.productCode).toBe(offerCanonicalItem.productCode);
            expect(homeCanonicalItem.planCode).toBe(offerCanonicalItem.planCode);
            verifiedCount++;
          }
        }
      }
    }

    expect(discrepancies).toHaveLength(0);
    expect(verifiedCount).toBe(66);
  });

  it('4. Checkout resolution does NOT map by quantity alone across platforms and services', () => {
    // Both Instagram Likes and TikTok Likes have a 500 quantity plan
    const ig500 = OFFICIAL_PERFECTPAY_66_DATASET.find(
      (item) => item.platform === 'instagram' && item.service === 'likes' && item.plan === 'starter'
    );
    const tt500 = OFFICIAL_PERFECTPAY_66_DATASET.find(
      (item) => item.platform === 'tiktok' && item.service === 'likes' && item.plan === 'starter'
    );

    expect(ig500).toBeDefined();
    expect(tt500).toBeDefined();
    // They have different checkouts/plan codes despite identical quantity
    expect(ig500!.checkoutUrl).not.toBe(tt500!.checkoutUrl);
    expect(ig500!.planCode).not.toBe(tt500!.planCode);

    // Instagram Followers 2,000 vs TikTok Followers 2,000
    const igFollowers2k = OFFICIAL_PERFECTPAY_66_DATASET.find(
      (item) => item.platform === 'instagram' && item.service === 'followers' && item.plan === 'growth'
    );
    const ttFollowers2k = OFFICIAL_PERFECTPAY_66_DATASET.find(
      (item) => item.platform === 'tiktok' && item.service === 'followers' && item.plan === 'growth'
    );

    expect(igFollowers2k).toBeDefined();
    expect(ttFollowers2k).toBeDefined();
    expect(igFollowers2k!.checkoutUrl).not.toBe(ttFollowers2k!.checkoutUrl);
    expect(igFollowers2k!.planCode).not.toBe(ttFollowers2k!.planCode);
  });

  it('5. Rejects invalid platform/service combination (e.g. YouTube Followers) with HTTP 400', async () => {
    const req = new Request('http://localhost:3000/api/checkout/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offerId: 'canonical-youtube-followers-starter',
        targetType: 'channel',
        targetValue: 'UC123456',
        socialUsername: 'yt_user',
      }),
    });

    const res = await createCheckoutContext(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
  });

  it('6. All 11 combinations resolve through POST /api/checkout/context preserving content target', async () => {
    const testCases: {
      platform: CommercialPlatform;
      service: CommercialService;
      plan: CommercialPlan;
      targetType: 'profile' | 'post' | 'video' | 'channel';
      targetUrl: string | null;
      socialUsername: string;
    }[] = [
      { platform: 'instagram', service: 'followers', plan: 'starter', targetType: 'profile', targetUrl: null, socialUsername: 'ig_test' },
      { platform: 'instagram', service: 'likes', plan: 'starter', targetType: 'post', targetUrl: 'https://instagram.com/p/C-test123/', socialUsername: 'content_order' },
      { platform: 'instagram', service: 'views', plan: 'starter', targetType: 'video', targetUrl: 'https://instagram.com/reel/C-test123/', socialUsername: 'content_order' },
      { platform: 'tiktok', service: 'followers', plan: 'starter', targetType: 'profile', targetUrl: null, socialUsername: 'tt_test' },
      { platform: 'tiktok', service: 'likes', plan: 'starter', targetType: 'video', targetUrl: 'https://tiktok.com/@user/video/123456', socialUsername: 'content_order' },
      { platform: 'tiktok', service: 'views', plan: 'starter', targetType: 'video', targetUrl: 'https://tiktok.com/@user/video/123456', socialUsername: 'content_order' },
      { platform: 'twitter', service: 'followers', plan: 'starter', targetType: 'profile', targetUrl: null, socialUsername: 'x_test' },
      { platform: 'twitter', service: 'likes', plan: 'starter', targetType: 'post', targetUrl: 'https://x.com/user/status/123456', socialUsername: 'content_order' },
      { platform: 'twitter', service: 'views', plan: 'starter', targetType: 'video', targetUrl: 'https://x.com/user/status/123456', socialUsername: 'content_order' },
      { platform: 'youtube', service: 'likes', plan: 'starter', targetType: 'video', targetUrl: 'https://youtube.com/watch?v=123456', socialUsername: 'content_order' },
      { platform: 'youtube', service: 'views', plan: 'starter', targetType: 'video', targetUrl: 'https://youtube.com/watch?v=123456', socialUsername: 'content_order' },
    ];

    expect(testCases).toHaveLength(11);

    for (const tc of testCases) {
      const canonicalItem = getCanonicalPerfectPayItem(tc.platform, tc.service, tc.plan);
      expect(canonicalItem).not.toBeNull();

      const req = new Request('http://localhost:3000/api/checkout/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          offerId: `canonical-${tc.platform}-${tc.service}-${tc.plan}`,
          targetType: tc.targetType,
          targetValue: tc.targetUrl || tc.socialUsername,
          targetUrl: tc.targetUrl,
          socialUsername: tc.socialUsername,
          profileUrl: tc.targetUrl || `https://${tc.platform}.com/${tc.socialUsername}`,
        }),
      });

      const res = await createCheckoutContext(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data?.checkoutUrl).toContain(canonicalItem!.checkoutUrl);
    }
  });
});
