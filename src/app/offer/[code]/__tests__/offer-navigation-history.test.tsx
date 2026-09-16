import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OfferLandingPage from '../page';
import { PLATFORM_SERVICES, CommercialPlatform, resolveCommercialCardsForService } from '@/services/commercial-offer.resolver';

// Mock Next.js navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ code: 'CF25-HISTORY-TEST' }),
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));

describe('Offer Navigation & Journey Termination: History, Replace, BFCache & Back Protection', () => {
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
      code: 'CF25-HISTORY-TEST',
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
    username: 'history_user',
    full_name: 'History User',
    biography: 'Bio for history user',
    profile_pic_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
    followers_count: 3200,
    following_count: 140,
    posts_count: 22,
    is_private: false,
    is_verified: false,
    profile_url: 'https://instagram.com/history_user',
    resolvedTargetType: 'profile',
    resolvedTargetValue: 'history_user',
    resolvedTargetUrl: 'https://instagram.com/history_user',
  };

  it('1. Successful checkout uses window.location.replace (not push or href assignment), marks journey completed in sessionStorage and history.state', async () => {
    const replaceMock = vi.fn();
    const originalLocation = window.location;

    // Define replace on location
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      replace: replaceMock,
      href: 'http://localhost:3000/offer/CF25-HISTORY-TEST',
    } as any;

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
          ok: true,
          json: async () => ({
            success: true,
            data: {
              contextId: 'CTX_REPLACE_TEST',
              checkoutUrl: 'https://go.centerpag.com/PPU38CQEOIF?src=CTX_REPLACE_TEST',
            },
          }),
        } as any);
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });

    render(<OfferLandingPage />);

    await waitFor(() => {
      expect(screen.getByText('Choose your network')).toBeDefined();
    });

    const usernameInput = screen.getByLabelText('Profile username or link');
    fireEvent.change(usernameInput, { target: { value: 'history_user' } });
    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'history_user@example.com' } });

    const analyzeBtn = await screen.findByRole('button', { name: /Analyze Profile/i });
    fireEvent.click(analyzeBtn);

    const confirmBtn = await screen.findByRole('button', { name: /Yes, This is my profile/i }, { timeout: 4000 });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(screen.getByText('growth package')).toBeDefined();
    });

    const planCards = screen.getAllByRole('article').filter((c) => c.classList.contains('cf-o10-package-ref-card'));
    const starterCard = planCards[0];
    const starterCta = starterCard.querySelector('.cf-o10-package-ref-cta')!;

    fireEvent.click(starterCta);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('https://go.centerpag.com/PPU38CQEOIF?src=CTX_REPLACE_TEST');
    });

    // Check that sessionStorage has marked the journey as completed
    const sessionKeys = Object.keys(sessionStorage).filter((k) => k.startsWith('cf_offer_journey_completed_'));
    expect(sessionKeys.length).toBeGreaterThan(0);
    expect(sessionStorage.getItem(sessionKeys[0])).toBe('1');

    // Check history.state has cfOfferJourneyCompleted: true
    expect(window.history.state?.cfOfferJourneyCompleted).toBe(true);

    // Verify UI switched to Session Completed state
    expect(screen.getByText('Session Completed')).toBeDefined();

    // Restore window.location
    window.location = originalLocation as any;
  });

  it('2. Checkout failure or missing checkoutUrl does NOT terminate the journey and user stays in PACKAGE', async () => {
    const replaceMock = vi.fn();
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = {
      ...originalLocation,
      replace: replaceMock,
      href: 'http://localhost:3000/offer/CF25-HISTORY-TEST',
    } as any;

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
          status: 500,
          json: async () => ({
            success: false,
            error: { message: 'Internal payment gateway error' },
          }),
        } as any);
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });

    render(<OfferLandingPage />);

    await waitFor(() => {
      expect(screen.getByText('Choose your network')).toBeDefined();
    });

    const usernameInput = screen.getByLabelText('Profile username or link');
    fireEvent.change(usernameInput, { target: { value: 'history_user' } });
    const emailInput = screen.getByLabelText('Email');
    fireEvent.change(emailInput, { target: { value: 'history_user@example.com' } });

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

    await waitFor(() => {
      expect(screen.getByText('Internal payment gateway error')).toBeDefined();
    });

    // Replace must NOT have been called
    expect(replaceMock).not.toHaveBeenCalled();

    // Journey must NOT be marked completed
    const sessionKeys = Object.keys(sessionStorage).filter((k) => k.startsWith('cf_offer_journey_completed_'));
    expect(sessionKeys.length).toBe(0);

    // User is still in PACKAGE screen, not Session Completed
    expect(screen.queryByText('Session Completed')).toBeNull();
    expect(screen.getByText('growth package')).toBeDefined();

    window.location = originalLocation as any;
  });

  it('3. BFCache pageshow event (e.g. mobile Safari back navigation) shows Session Completed and does not restore PACKAGE or profile', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/offers/')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockActiveOfferResponse,
        } as any);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any);
    });

    // Mark previous journey as completed in history state and sessionStorage
    const completedJourneyId = 'oj_test_bfcache_123';
    sessionStorage.setItem(`cf_offer_journey_completed_${completedJourneyId}`, '1');
    window.history.replaceState({ cfOfferJourneyId: completedJourneyId, cfOfferJourneyCompleted: true }, '');

    render(<OfferLandingPage />);

    // Simulate pageshow event with persisted=true (Safari BFCache restoration)
    const pageShowEvent = new Event('pageshow') as any;
    pageShowEvent.persisted = true;
    window.dispatchEvent(pageShowEvent);

    await waitFor(() => {
      expect(screen.getByText('Session Completed')).toBeDefined();
    });

    // Ensure PACKAGE, profiles, or plans are not shown
    expect(screen.queryByText('growth package')).toBeNull();
    expect(screen.queryByText('Choose your network')).toBeNull();
  });

  it('4. Reopening the link explicitly creates a new journey and allows normal access if offer is still ACTIVE', async () => {
    // Existing completed journey in sessionStorage from a previous checkout
    sessionStorage.setItem('cf_offer_journey_completed_oj_past_session_999', '1');

    // Simulate a fresh navigation (navType = 'navigate', fresh history state without completed flag)
    window.history.replaceState(null, '');

    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/offers/')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockActiveOfferResponse,
        } as any);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any);
    });

    render(<OfferLandingPage />);

    // Fresh journey loads normally into Step 1
    await waitFor(() => {
      expect(screen.getByText('Choose your network')).toBeDefined();
    });

    expect(screen.queryByText('Session Completed')).toBeNull();
    expect(screen.queryByText('Offer Unavailable')).toBeNull();
  });

  it('5. If an offer is expired, it continues to show Offer Unavailable regardless of navigation history', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/offers/')) {
        return Promise.resolve({
          ok: false,
          status: 410,
          json: async () => ({
            success: false,
            error: { message: 'This offer is no longer available.' },
          }),
        } as any);
      }
      return Promise.resolve({ ok: true, json: async () => ({}) } as any);
    });

    render(<OfferLandingPage />);

    await waitFor(() => {
      expect(screen.getByText('Offer Unavailable')).toBeDefined();
    });

    expect(screen.queryByText('Session Completed')).toBeNull();
    expect(screen.queryByText('Choose your network')).toBeNull();
  });
});
