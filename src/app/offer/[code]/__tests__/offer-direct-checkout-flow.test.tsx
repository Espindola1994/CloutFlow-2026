import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OfferLandingPage from '../page';
import { PLATFORM_SERVICES, CommercialPlatform, resolveCommercialCardsForService } from '@/services/commercial-offer.resolver';
import { OFFICIAL_PERFECTPAY_66_DATASET } from '@/config/official-perfectpay-dataset';

// Mock Next.js navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ code: 'CF25-TESTDIRECT' }),
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));

describe('Offer Direct Checkout E2E: No REVIEW Step, Double-Click Protection, and Exact Target Preservation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

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
      code: 'CF25-TESTDIRECT',
      discountPercent: 25,
      couponCode: 'FLOW25',
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      formattedExpiresAt: 'Tomorrow',
      previousTarget: null,
      packages: all66Packages,
    },
  };

  const mockResolvedInstagramProfile = {
    username: 'direct_user_test',
    full_name: 'Direct User',
    biography: 'Direct growth test profile',
    profile_pic_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    followers_count: 5000,
    following_count: 200,
    posts_count: 50,
    is_private: false,
    is_verified: false,
    profile_url: 'https://instagram.com/direct_user_test',
    resolvedTargetType: 'profile',
    resolvedTargetValue: 'direct_user_test',
    resolvedTargetUrl: 'https://instagram.com/direct_user_test',
  };

  it('1. Clicking a plan card in /offer initiates checkout directly without entering REVIEW step', async () => {
    let checkoutContextCalls = 0;
    let capturedPayload: any = null;

    global.fetch = vi.fn().mockImplementation((url: string, init?: any) => {
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
            data: mockResolvedInstagramProfile,
          }),
        } as any);
      }
      if (url.includes('/api/checkout/context')) {
        checkoutContextCalls++;
        capturedPayload = JSON.parse(init.body);
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              contextId: 'CFCTX_DIRECT123',
              checkoutUrl: 'https://go.centerpag.com/PPU38CQEOIF?src=CFCTX_DIRECT123',
            },
          }),
        } as any);
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });

    render(<OfferLandingPage />);

    // Step 1: Search & verify profile
    await waitFor(() => {
      expect(screen.getByText('Choose your network')).toBeDefined();
    });

    const usernameInput = screen.getByLabelText('Profile username or link');
    fireEvent.change(usernameInput, { target: { value: 'direct_user_test' } });
    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'direct_user@example.com' } });

    const analyzeBtn = await screen.findByRole('button', { name: /Analyze Profile/i });
    fireEvent.click(analyzeBtn);

    const confirmBtn = await screen.findByRole('button', { name: /Yes, This is my profile/i }, { timeout: 4000 });
    fireEvent.click(confirmBtn);

    // Step 2: PACKAGE stage appears
    await waitFor(() => {
      expect(screen.getByText('growth package')).toBeDefined();
    });

    // Ensure REVIEW stage is NOT present
    expect(screen.queryByText(/Review & checkout/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /Continue to Secure Checkout/i })).toBeNull();

    // Click first card CTA
    const planCards = screen.getAllByRole('article').filter((c) => c.classList.contains('cf-o10-package-ref-card'));
    const starterCard = planCards[0];
    const starterCta = starterCard.querySelector('.cf-o10-package-ref-cta');
    expect(starterCta).toBeDefined();

    fireEvent.click(starterCta!);

    // Still no REVIEW stage!
    expect(screen.queryByText(/Review & checkout/i)).toBeNull();
    expect(screen.queryByRole('button', { name: /Continue to Secure Checkout/i })).toBeNull();

    await waitFor(() => {
      expect(checkoutContextCalls).toBe(1);
      expect(capturedPayload).not.toBeNull();
    });

    expect(capturedPayload.offerId).toBe('step3-instagram-followers-starter');
    expect(capturedPayload.targetType).toBe('profile');
    expect(capturedPayload.socialUsername).toBe('direct_user_test');
  });

  it('2. Double-click protection: rapidly clicking plan CTA does not fire duplicate checkout requests', async () => {
    let checkoutContextCalls = 0;

    global.fetch = vi.fn().mockImplementation((url: string) => {
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
            data: mockResolvedInstagramProfile,
          }),
        } as any);
      }
      if (url.includes('/api/checkout/context')) {
        checkoutContextCalls++;
        // Delayed response simulating network latency
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: async () => ({
                success: true,
                data: {
                  contextId: 'CFCTX_DCLICK',
                  checkoutUrl: 'https://go.centerpag.com/PPU38CQEOIF?src=CFCTX_DCLICK',
                },
              }),
            } as any);
          }, 150);
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<OfferLandingPage />);

    await waitFor(() => {
      expect(screen.getByText('Choose your network')).toBeDefined();
    });

    const usernameInput = screen.getByLabelText('Profile username or link');
    fireEvent.change(usernameInput, { target: { value: 'direct_user_test' } });
    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'direct_user@example.com' } });

    const analyzeBtn = await screen.findByRole('button', { name: /Analyze Profile/i });
    fireEvent.click(analyzeBtn);

    const confirmBtn = await screen.findByRole('button', { name: /Yes, This is my profile/i }, { timeout: 4000 });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText('growth package')).toBeDefined();
    });

    const planCards = screen.getAllByRole('article').filter((c) => c.classList.contains('cf-o10-package-ref-card'));
    const starterCta = planCards[0].querySelector('.cf-o10-package-ref-cta')!;

    // Rapid double click
    fireEvent.click(starterCta);
    fireEvent.click(starterCta);
    fireEvent.click(starterCta);

    await waitFor(() => {
      expect(checkoutContextCalls).toBe(1);
    }, { timeout: 1000 });

    expect(checkoutContextCalls).toBe(1);
  });

  it('3. Error handling: if checkout resolution fails, stays on PACKAGE and shows error message without redirecting', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
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
            data: mockResolvedInstagramProfile,
          }),
        } as any);
      }
      if (url.includes('/api/checkout/context')) {
        return Promise.resolve({
          ok: false,
          status: 422,
          json: async () => ({
            success: false,
            error: { message: 'Checkout configuration is temporarily unavailable.' },
          }),
        } as any);
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<OfferLandingPage />);

    await waitFor(() => {
      expect(screen.getByText('Choose your network')).toBeDefined();
    });

    const usernameInput = screen.getByLabelText('Profile username or link');
    fireEvent.change(usernameInput, { target: { value: 'direct_user_test' } });
    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'direct_user@example.com' } });

    const analyzeBtn = await screen.findByRole('button', { name: /Analyze Profile/i });
    fireEvent.click(analyzeBtn);

    const confirmBtn = await screen.findByRole('button', { name: /Yes, This is my profile/i }, { timeout: 4000 });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText('growth package')).toBeDefined();
    });

    const planCards = screen.getAllByRole('article').filter((c) => c.classList.contains('cf-o10-package-ref-card'));
    const starterCta = planCards[0].querySelector('.cf-o10-package-ref-cta')!;

    fireEvent.click(starterCta);

    // Verify error is displayed and user remains on PACKAGE screen
    await waitFor(() => {
      expect(screen.getByText('Checkout configuration is temporarily unavailable.')).toBeDefined();
    });

    expect(screen.getByText('growth package')).toBeDefined();
    expect(screen.queryByText(/Review & checkout/i)).toBeNull();
  });
});
