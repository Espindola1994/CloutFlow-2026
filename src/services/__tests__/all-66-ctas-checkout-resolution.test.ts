import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as createCheckoutContext } from '@/app/api/checkout/context/route';
import { OFFICIAL_PERFECTPAY_66_DATASET } from '@/config/official-perfectpay-dataset';
import { resolveCommercialCardsForService } from '@/services/commercial-offer.resolver';

const mockContextsStore: any[] = [];

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
      values: vi.fn().mockImplementation((val: any) => {
        mockContextsStore.push(val);
        return Promise.resolve();
      }),
    })),
    execute: vi.fn().mockImplementation(() => Promise.resolve()),
  },
}));

describe('66 Identities Full CTA Checkout Context & Resolver Tests', () => {
  beforeEach(() => {
    mockContextsStore.length = 0;
  });

  it('should verify all 66 canonical cards produce a valid HTTPS go.centerpag.com checkout URL with matching identity', async () => {
    expect(OFFICIAL_PERFECTPAY_66_DATASET).toHaveLength(66);

    for (const item of OFFICIAL_PERFECTPAY_66_DATASET) {
      const canonicalOfferId = `canonical-${item.platform}-${item.service}-${item.plan}`;
      
      let targetPayload: Record<string, any> = {
        offerId: canonicalOfferId,
      };

      if (item.service === 'followers') {
        const isYouTube = item.platform === 'youtube';
        const targetType = isYouTube ? 'channel' : 'profile';
        const username = 'cloutflow_test_user';
        const profileUrl = item.platform === 'twitter'
          ? `https://x.com/${username}`
          : item.platform === 'tiktok'
          ? `https://www.tiktok.com/@${username}`
          : `https://www.instagram.com/${username}`;

        targetPayload = {
          ...targetPayload,
          targetType,
          targetValue: username,
          socialUsername: username,
          profileUrl,
        };
      } else {
        // likes or views: requires targetUrl
        const contentUrl = item.platform === 'youtube'
          ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
          : item.platform === 'twitter'
          ? 'https://x.com/user/status/123456789'
          : item.platform === 'tiktok'
          ? 'https://www.tiktok.com/@user/video/123456789'
          : 'https://www.instagram.com/p/C-xyz123/';

        targetPayload = {
          ...targetPayload,
          targetType: item.platform === 'youtube' || item.platform === 'tiktok' ? 'video' : 'post',
          targetValue: contentUrl,
          targetUrl: contentUrl,
        };
      }

      const req = new Request('http://localhost:3000/api/checkout/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetPayload),
      });

      const res = await createCheckoutContext(req);
      const json = await res.json();

      expect(res.status, `Identity ${item.platform} ${item.service} ${item.plan} returned status ${res.status}: ${JSON.stringify(json)}`).toBe(200);
      expect(json.success).toBe(true);
      expect(json.data?.checkoutUrl).not.toBeNull();
      expect(typeof json.data?.checkoutUrl).toBe('string');
      
      const parsedUrl = new URL(json.data.checkoutUrl);
      expect(parsedUrl.protocol).toBe('https:');
      expect(parsedUrl.hostname).toBe('go.centerpag.com');
      expect(json.data.checkoutUrl).toContain(item.checkoutUrl);
      expect(json.data.checkoutUrl).toContain(`src=${json.data.contextId}`);
    }
  });

  it('should validate specific network test matrix requirements', async () => {
    const specificTests = [
      { platform: 'instagram', service: 'followers', plan: 'starter', expectedUrlFragment: 'PPU38CQEOIF' },
      { platform: 'tiktok', service: 'followers', plan: 'starter', expectedUrlFragment: 'PPU38CQFR8B' },
      { platform: 'tiktok', service: 'likes', plan: 'pro', expectedUrlFragment: 'PPU38CQFR8S' },
      { platform: 'tiktok', service: 'views', plan: 'max', expectedUrlFragment: 'PPU38CQFR99' },
      { platform: 'twitter', service: 'followers', plan: 'starter', expectedUrlFragment: 'PPU38CQFR9O' },
      { platform: 'twitter', service: 'likes', plan: 'pro', expectedUrlFragment: 'PPU38CQFREA' },
      { platform: 'twitter', service: 'views', plan: 'max', expectedUrlFragment: 'PPU38CQFREP' },
      { platform: 'youtube', service: 'likes', plan: 'starter', expectedUrlFragment: 'PPU38CQFRFH' },
      { platform: 'youtube', service: 'likes', plan: 'max', expectedUrlFragment: 'PPU38CQFRGC' },
      { platform: 'youtube', service: 'views', plan: 'starter', expectedUrlFragment: 'PPU38CQFRET' },
      { platform: 'youtube', service: 'views', plan: 'max', expectedUrlFragment: 'PPU38CQFRGF' },
    ];

    for (const testCase of specificTests) {
      const canonicalOfferId = `canonical-${testCase.platform}-${testCase.service}-${testCase.plan}`;
      const isFollowers = testCase.service === 'followers';
      const targetPayload = isFollowers
        ? {
            offerId: canonicalOfferId,
            targetType: 'profile',
            targetValue: 'sampleuser',
            socialUsername: 'sampleuser',
          }
        : {
            offerId: canonicalOfferId,
            targetType: testCase.platform === 'youtube' || testCase.platform === 'tiktok' ? 'video' : 'post',
            targetValue: testCase.platform === 'youtube' ? 'https://www.youtube.com/watch?v=abc' : testCase.platform === 'twitter' ? 'https://x.com/u/status/1' : testCase.platform === 'tiktok' ? 'https://www.tiktok.com/@u/video/1' : 'https://www.instagram.com/p/abc/',
            targetUrl: testCase.platform === 'youtube' ? 'https://www.youtube.com/watch?v=abc' : testCase.platform === 'twitter' ? 'https://x.com/u/status/1' : testCase.platform === 'tiktok' ? 'https://www.tiktok.com/@u/video/1' : 'https://www.instagram.com/p/abc/',
          };

      const req = new Request('http://localhost:3000/api/checkout/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetPayload),
      });

      const res = await createCheckoutContext(req);
      const json = await res.json();

      expect(res.status).toBe(200);
      expect(json.data.checkoutUrl).toContain(testCase.expectedUrlFragment);
      expect(json.data.checkoutUrl.startsWith('https://go.centerpag.com/')).toBe(true);
    }
  });
});
