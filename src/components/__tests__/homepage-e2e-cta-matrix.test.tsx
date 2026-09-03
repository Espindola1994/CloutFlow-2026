import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HomePage from '@/app/page';
import { useFunnelStore } from '@/stores/funnel.store';
import { OFFICIAL_PERFECTPAY_66_DATASET } from '@/config/official-perfectpay-dataset';
import { resolveCommercialCardsForService } from '@/services/commercial-offer.resolver';

vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));

describe('HomePage E2E DOM Interaction & Checkout Flow for TikTok, Twitter, YouTube and Instagram', () => {
  beforeEach(() => {
    useFunnelStore.getState().reset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const testMatrix = [
    // TikTok
    { platform: 'tiktok', service: 'followers', plan: 'starter', targetType: 'profile', username: 'tiktok_creator', targetUrl: null },
    { platform: 'tiktok', service: 'likes', plan: 'starter', targetType: 'video', username: 'tiktok_creator', targetUrl: 'https://www.tiktok.com/@tiktok_creator/video/123456789' },
    { platform: 'tiktok', service: 'views', plan: 'starter', targetType: 'video', username: 'tiktok_creator', targetUrl: 'https://www.tiktok.com/@tiktok_creator/video/123456789' },

    // Twitter / X
    { platform: 'twitter', service: 'followers', plan: 'starter', targetType: 'profile', username: 'twitter_creator', targetUrl: null },
    { platform: 'twitter', service: 'likes', plan: 'starter', targetType: 'post', username: 'twitter_creator', targetUrl: 'https://x.com/twitter_creator/status/123456789' },
    { platform: 'twitter', service: 'views', plan: 'starter', targetType: 'post', username: 'twitter_creator', targetUrl: 'https://x.com/twitter_creator/status/123456789' },

    // YouTube
    { platform: 'youtube', service: 'likes', plan: 'starter', targetType: 'video', username: 'yt_creator', targetUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    { platform: 'youtube', service: 'views', plan: 'starter', targetType: 'video', username: 'yt_creator', targetUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },

    // Instagram (Baseline)
    { platform: 'instagram', service: 'followers', plan: 'starter', targetType: 'profile', username: 'ig_creator', targetUrl: null },
    { platform: 'instagram', service: 'likes', plan: 'starter', targetType: 'post', username: 'ig_creator', targetUrl: 'https://www.instagram.com/p/C-xyz123/' },
    { platform: 'instagram', service: 'views', plan: 'starter', targetType: 'post', username: 'ig_creator', targetUrl: 'https://www.instagram.com/p/C-xyz123/' },
  ];

  for (const item of testMatrix) {
    it(`executes real CTA click -> POST /api/checkout/context -> window.location redirect for ${item.platform} ${item.service} ${item.plan}`, async () => {
      const canonicalOfferId = `canonical-${item.platform}-${item.service}-${item.plan}`;
      const matchingDataset = OFFICIAL_PERFECTPAY_66_DATASET.find(
        (d) => d.platform === item.platform && d.service === item.service && d.plan === item.plan
      );
      expect(matchingDataset).toBeDefined();

      const expectedCheckoutUrl = matchingDataset!.checkoutUrl.startsWith('http')
        ? `${matchingDataset!.checkoutUrl}?src=CFCTX_mock123`
        : `https://go.centerpag.com/${matchingDataset!.checkoutUrl}?src=CFCTX_mock123`;

      const fetchCalls: any[] = [];
      const origFetch = global.fetch;
      global.fetch = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url.includes('/api/offers')) {
          const cards = resolveCommercialCardsForService(item.platform as any, item.service as any, [], 'home');
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: {
                items: cards.map((c, idx) => ({
                  id: c.id || `canonical-${c.platform}-${c.service}-${c.plan}`,
                  name: c.planDisplayName,
                  slug: `${c.platform}-${c.service}-${c.plan}`,
                  quantity: c.quantity,
                  bonusQuantity: c.bonusQuantity,
                  priceCents: c.priceCents,
                  oldPriceCents: c.compareAtPriceCents,
                  currency: 'USD',
                  badge: c.badge,
                  isPopular: idx === 3 || idx === 5,
                })),
              },
            }),
          });
        }

        if (url.includes('/api/search/resolve')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              resolvedType: 'profile',
              data: {
                platform: item.platform,
                username: item.username,
                full_name: 'Test Creator',
                profile_url: `https://${item.platform === 'twitter' ? 'x.com' : item.platform === 'youtube' ? 'youtube.com/@' : `${item.platform}.com/`}${item.username}`,
                avatar_url: null,
                followers_count: 5000,
              },
            }),
          });
        }

        if (url.includes('/api/checkout/context')) {
          fetchCalls.push({ url, init });
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({
              success: true,
              data: {
                contextId: 'CFCTX_mock123',
                checkoutUrl: expectedCheckoutUrl,
              },
            }),
          });
        }

        if (url.includes('/api/leads/capture')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: async () => ({ success: true }),
          });
        }
      }) as any;

      // Set funnel store target state matching the scenario
      useFunnelStore.getState().setPlatform(item.platform);
      useFunnelStore.getState().setService(item.service);
      useFunnelStore.getState().setEmail('customer@example.com');
      useFunnelStore.getState().setTarget({
        targetType: item.targetType as any,
        targetValue: item.username,
        targetUrl: item.targetUrl || `https://${item.platform === 'twitter' ? 'x.com' : item.platform === 'youtube' ? 'youtube.com/@' : `${item.platform}.com/`}${item.username}`,
        socialUsername: item.username,
        profileUrl: `https://${item.platform === 'twitter' ? 'x.com' : item.platform === 'youtube' ? 'youtube.com/@' : `${item.platform}.com/`}${item.username}`,
        email: 'customer@example.com',
      });
      useFunnelStore.getState().setUsername(item.username);

      const { container } = render(<HomePage initialPlatform={item.platform as any} initialService={item.service as any} />);

      // Wait for offers to be rendered in PlanSelector
      await waitFor(() => {
        expect(container.querySelectorAll('.cf-o10-package-ref-card').length).toBe(6);
      }, { timeout: 4000 });

      // Find the first plan card (Starter plan)
      const starterCard = container.querySelectorAll('.cf-o10-package-ref-card')[0];
      expect(starterCard).toBeDefined();

      // Click the CTA button (triggering select and onSelectPlan -> handleCheckout)
      const ctaButton = starterCard.querySelector('.cf-o10-package-ref-cta');
      expect(ctaButton).not.toBeNull();
      fireEvent.click(ctaButton!);

      // Verify that checkout context API was called with the canonical offer ID
      await waitFor(() => {
        expect(fetchCalls.length).toBe(1);
        const requestPayload = JSON.parse(fetchCalls[0].init.body);
        expect(requestPayload.offerId).toBe(canonicalOfferId);
      }, { timeout: 4000 });
    });
  }
});
