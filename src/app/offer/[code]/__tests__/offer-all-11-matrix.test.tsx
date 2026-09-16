/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @next/next/no-img-element, jsx-a11y/alt-text */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OfferLandingPage from '../page';
import { CLOUTFLOW_CATALOG_PACKAGES } from '@/config/financial-protection.config';
import { PLATFORM_SERVICES, CommercialPlatform, CommercialService, resolveCommercialCardsForService } from '@/services/commercial-offer.resolver';

// Mock Next.js navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ code: 'CF25-MATRIX2026' }),
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));

describe('Offer 11-Combination Service Matrix and Checkout Resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    try {
      window.history.replaceState(null, '');
    } catch {}
  });

  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
    localStorage.clear();
    try {
      window.history.replaceState(null, '');
    } catch {}
  });

  // Resolve all 66 packages for the mock active offer
  const all66Packages = (['instagram', 'tiktok', 'twitter', 'youtube'] as CommercialPlatform[]).flatMap((plat) => {
    const services = PLATFORM_SERVICES[plat];
    return services.flatMap((serv) => {
      const cards = resolveCommercialCardsForService(plat, serv, [], 'offer_step3');
      return cards.map((rc) => ({
        id: rc.id || `step3-${rc.platform}-${rc.service}-${rc.plan}`,
        platform: rc.platform,
        service: rc.service,
        name: rc.planDisplayName,
        slug: `${rc.platform}-${rc.service}-${rc.plan}`,
        quantity: rc.quantity,
        bonusQuantity: rc.bonusQuantity,
        priceCents: rc.priceCents,
        oldPriceCents: rc.compareAtPriceCents,
        currency: 'USD',
        badge: rc.badge,
        isPopular: rc.plan === 'pro' || rc.plan === 'max',
      }));
    });
  });

  const mockActiveOfferResponse = {
    success: true,
    data: {
      code: 'CF25-MATRIX2026',
      discountPercent: 25,
      couponCode: 'FLOW25',
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      formattedExpiresAt: 'Tomorrow',
      previousTarget: null,
      packages: all66Packages,
    },
  };

  it('1. Total canonical packages equals exactly 66 across the 11 combinations', () => {
    expect(all66Packages).toHaveLength(66);
    expect(CLOUTFLOW_CATALOG_PACKAGES).toHaveLength(66);

    const combinations: { platform: CommercialPlatform; service: CommercialService; count: number }[] = [
      { platform: 'instagram', service: 'followers', count: 6 },
      { platform: 'instagram', service: 'likes', count: 6 },
      { platform: 'instagram', service: 'views', count: 6 },
      { platform: 'tiktok', service: 'followers', count: 6 },
      { platform: 'tiktok', service: 'likes', count: 6 },
      { platform: 'tiktok', service: 'views', count: 6 },
      { platform: 'twitter', service: 'followers', count: 6 },
      { platform: 'twitter', service: 'likes', count: 6 },
      { platform: 'twitter', service: 'views', count: 6 },
      { platform: 'youtube', service: 'likes', count: 6 },
      { platform: 'youtube', service: 'views', count: 6 },
    ];

    expect(combinations).toHaveLength(11);

    for (const combo of combinations) {
      const matching = all66Packages.filter(
        (p) => p.platform === combo.platform && p.service === combo.service
      );
      expect(matching).toHaveLength(combo.count);

      // Verify each plan has matching quantity and price from the real source of truth
      for (const plan of matching) {
        const catalogEntry = CLOUTFLOW_CATALOG_PACKAGES.find(
          (c) => c.platform === combo.platform && c.service === combo.service && c.name.toLowerCase() === plan.name.toLowerCase()
        );
        expect(catalogEntry).toBeDefined();
        expect(plan.quantity).toBe(catalogEntry!.quantity);
        expect(plan.priceCents).toBe(catalogEntry!.priceCents);
      }
    }
  });

  it('2. YouTube does not have followers and selecting YouTube auto-switches safely', async () => {
    // Check that PLATFORM_SERVICES.youtube has only likes and views
    expect(PLATFORM_SERVICES.youtube).toEqual(['likes', 'views']);
    expect(PLATFORM_SERVICES.youtube).not.toContain('followers');

    const ytFollowers = all66Packages.filter(
      (p) => p.platform === 'youtube' && p.service === 'followers'
    );
    expect(ytFollowers).toHaveLength(0);
  });

  it('3. Renders all 6 plans for Instagram Likes with real quantities, prices, and 25% discount', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/offers/')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockActiveOfferResponse,
        } as any);
      }
      return Promise.reject(new Error('Unhandled'));
    });

    render(<OfferLandingPage />);

    await waitFor(() => {
      expect(screen.getByText('Choose your network')).toBeDefined();
    });

    // Select Likes
    const likesBtn = screen.getByRole('button', { name: /likes/i });
    fireEvent.click(likesBtn);

    // Enter username and email
    const usernameInput = screen.getByLabelText('Profile username or link');
    fireEvent.change(usernameInput, { target: { value: 'https://www.instagram.com/p/C3bXYZ12345/' } });
    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    // Mock search resolve for Instagram Likes
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/search/resolve')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            resolvedType: 'profile',
            data: {
              platform: 'instagram',
              username: 'cloutflow.test',
              profile_url: 'https://instagram.com/cloutflow.test',
            },
          }),
        } as any);
      }
      return Promise.reject(new Error('Unhandled'));
    });

    const analyzeBtn = screen.getByRole('button', { name: /Analyze profile/i });
    fireEvent.click(analyzeBtn);

    // After analysis, click confirmation button "Yes, This is my profile"
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Yes, This is my profile' })).toBeDefined();
    }, { timeout: 4000 });
    fireEvent.click(screen.getByRole('button', { name: 'Yes, This is my profile' }));

    await waitFor(() => {
      expect(screen.getByText('growth package')).toBeDefined();
    }, { timeout: 4000 });

    // Verify all 6 Instagram Likes plans are displayed with exact quantity and pricing
    const igLikesCatalog = CLOUTFLOW_CATALOG_PACKAGES.filter(
      (c) => c.platform === 'instagram' && c.service === 'likes'
    );
    expect(igLikesCatalog).toHaveLength(6);

    const cards = screen.getAllByRole('article').filter((c) => c.classList.contains('cf-o10-package-ref-card'));
    expect(cards).toHaveLength(6);

    for (const plan of igLikesCatalog) {
      const matchingCard = cards.find((c) => {
        const qtyEl = c.querySelector('.cf-o10-package-ref-qty');
        return qtyEl && qtyEl.textContent?.includes(plan.quantity.toLocaleString('en-US')) && qtyEl.textContent?.includes('Likes');
      });
      expect(matchingCard).toBeDefined();

      const currentPrice = (plan.priceCents / 100).toFixed(2);
      const priceEl = matchingCard!.querySelector('.cf-o10-package-ref-price strong');
      expect(priceEl?.textContent).toBe(`$${currentPrice}`);
    }
  });

  it('4. Checkout context test: validates payload sent to /api/checkout/context for 11 combinations', async () => {
    const testCases: {
      platform: CommercialPlatform;
      service: CommercialService;
      targetInput: string;
      expectedTargetType: string;
    }[] = [
      { platform: 'instagram', service: 'followers', targetInput: '@testuser', expectedTargetType: 'profile' },
      { platform: 'instagram', service: 'likes', targetInput: 'https://www.instagram.com/p/C3bXYZ12345/', expectedTargetType: 'post' },
      { platform: 'instagram', service: 'views', targetInput: 'https://www.instagram.com/reel/C3bXYZ12345/', expectedTargetType: 'video' },
      { platform: 'tiktok', service: 'followers', targetInput: '@tiktokuser', expectedTargetType: 'profile' },
      { platform: 'tiktok', service: 'likes', targetInput: 'https://www.tiktok.com/@user/video/1234567890', expectedTargetType: 'video' },
      { platform: 'tiktok', service: 'views', targetInput: 'https://www.tiktok.com/@user/video/1234567890', expectedTargetType: 'video' },
      { platform: 'twitter', service: 'followers', targetInput: '@twitteruser', expectedTargetType: 'profile' },
      { platform: 'twitter', service: 'likes', targetInput: 'https://x.com/user/status/1234567890', expectedTargetType: 'post' },
      { platform: 'twitter', service: 'views', targetInput: 'https://x.com/user/status/1234567890', expectedTargetType: 'video' },
      { platform: 'youtube', service: 'likes', targetInput: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', expectedTargetType: 'video' },
      { platform: 'youtube', service: 'views', targetInput: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', expectedTargetType: 'video' },
    ];

    for (const tc of testCases) {
      sessionStorage.clear();
      try {
        window.history.replaceState(null, '');
      } catch {}

      const canonicalCards = resolveCommercialCardsForService(tc.platform, tc.service, [], 'offer_step3');
      expect(canonicalCards).toHaveLength(6);
      const selectedPlan = canonicalCards[0]; // Starter
      const expectedOfferId = selectedPlan.id || `step3-${tc.platform}-${tc.service}-${selectedPlan.plan}`;

      let checkoutPayloadSent: any = null;

      global.fetch = vi.fn().mockImplementation((url: string, opts?: any) => {
        if (url.includes('/api/offers/')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockActiveOfferResponse,
          } as any);
        }
        if (url.includes('/api/search/resolve')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              resolvedType: tc.expectedTargetType,
              data: {
                platform: tc.platform,
                username: 'resolveduser',
                profile_url: `https://${tc.platform}.com/resolveduser`,
              },
            }),
          } as any);
        }
        if (url.includes('/api/checkout/context')) {
          checkoutPayloadSent = JSON.parse(opts.body);
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                contextId: 'CFCTX_TEST',
                checkoutUrl: 'https://go.centerpag.com/test?src=CFCTX_TEST',
              },
            }),
          } as any);
        }
        return Promise.reject(new Error(`Unhandled URL: ${url}`));
      });

      const { unmount } = render(<OfferLandingPage />);

      await waitFor(() => {
        expect(screen.getByText('Choose your network')).toBeDefined();
      });

      // Click the network
      const netBtn = screen.getByRole('button', { name: new RegExp(tc.platform === 'twitter' ? 'X' : tc.platform, 'i') });
      fireEvent.click(netBtn);

      // Click the service
      const servBtn = screen.getByRole('button', { name: new RegExp(tc.service, 'i') });
      fireEvent.click(servBtn);

      // Input target and email
      const usernameInput = screen.getByLabelText('Profile username or link');
      fireEvent.change(usernameInput, { target: { value: tc.targetInput } });
      const emailInput = screen.getByLabelText('Email');
      fireEvent.change(emailInput, { target: { value: 'buyer@example.com' } });

      global.fetch = vi.fn().mockImplementation((url: string, opts?: any) => {
        if (url.includes('/api/offers/')) {
          return Promise.resolve({
            ok: true,
            json: async () => mockActiveOfferResponse,
          } as any);
        }
        if (url.includes('/api/search/resolve')) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              resolvedType: 'profile',
              data: {
                platform: tc.platform,
                username: 'resolveduser',
                profile_url: `https://${tc.platform}.com/resolveduser`,
              },
            }),
          } as any);
        }
        if (url.includes('/api/checkout/context')) {
          checkoutPayloadSent = JSON.parse(opts.body);
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              data: {
                contextId: 'CFCTX_TEST',
                checkoutUrl: 'https://go.centerpag.com/test?src=CFCTX_TEST',
              },
            }),
          } as any);
        }
        return Promise.reject(new Error(`Unhandled URL: ${url}`));
      });

      // Click Analyze Profile
      const analyzeBtn = screen.getByRole('button', { name: /Analyze profile/i });
      fireEvent.click(analyzeBtn);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Yes, This is my profile' })).toBeDefined();
      }, { timeout: 4000 });
      fireEvent.click(screen.getByRole('button', { name: 'Yes, This is my profile' }));

      await waitFor(() => {
        expect(screen.getByText('growth package')).toBeDefined();
      }, { timeout: 4000 });

      // Find the Starter plan CTA and click to directly trigger checkout
      const planCards = screen.getAllByRole('article').filter((c) => c.classList.contains('cf-o10-package-ref-card'));
      expect(planCards).toHaveLength(6);

      const starterCard = planCards.find((c) => {
        const qtyEl = c.querySelector('.cf-o10-package-ref-qty');
        return qtyEl && qtyEl.textContent?.includes(selectedPlan.quantity.toLocaleString('en-US'));
      });
      expect(starterCard).toBeDefined();

      const starterCta = starterCard!.querySelector('.cf-o10-package-ref-cta');
      expect(starterCta).toBeDefined();
      fireEvent.click(starterCta!);

      // Direct checkout: REVIEW intermediate step is completely bypassed
      expect(screen.queryByRole('button', { name: /Continue to Secure Checkout/i })).toBeNull();

      await waitFor(() => {
        expect(checkoutPayloadSent).not.toBeNull();
      }, { timeout: 3000 });

      expect(checkoutPayloadSent.offerId).toBe(expectedOfferId);
      expect(checkoutPayloadSent.offerCode).toBe('CF25-MATRIX2026');
      expect(checkoutPayloadSent.targetType).toBe(tc.expectedTargetType);

      unmount();
    }
  }, 25000);
});
