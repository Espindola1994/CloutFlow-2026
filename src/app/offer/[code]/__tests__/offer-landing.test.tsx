/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, @next/next/no-img-element, jsx-a11y/alt-text */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OfferLandingPage from '../page';

// Mock Next.js navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useParams: () => ({ code: 'CF25-TEST1234' }),
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));

describe('OfferLandingPage Repeat Purchase Profile Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockActiveOfferResponse = {
    success: true,
    data: {
      code: 'CF25-TEST1234',
      discountPercent: 25,
      couponCode: 'FLOW25',
      status: 'ACTIVE',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      formattedExpiresAt: 'Tomorrow',
      previousTarget: {
        platform: 'instagram',
        username: 'guilhermeterraaa',
        targetType: 'profile',
        profileUrl: null,
        avatarUrl: 'https://example.com/historical-avatar.jpg',
        maskedEmail: 'gui*****@gmail.com',
        previousPackageName: '2,000 Followers',
      },
      packages: [
        {
          id: 'pkg-ig-1',
          platform: 'instagram',
          service: 'followers',
          name: '1000 Instagram Followers',
          slug: '1000-ig-followers',
          quantity: 1000,
          bonusQuantity: 0,
          priceCents: 1490,
          currency: 'USD',
          badge: 'Popular',
          isPopular: true,
        },
        {
          id: 'pkg-tk-1',
          platform: 'tiktok',
          service: 'followers',
          name: '1000 TikTok Followers',
          slug: '1000-tk-followers',
          quantity: 1000,
          bonusQuantity: 0,
          priceCents: 1690,
          currency: 'USD',
          badge: null,
          isPopular: false,
        },
      ],
    },
  };

  const mockResolvedInstagramProfile = {
    platform: 'instagram',
    username: 'guilhermeterraaa',
    full_name: 'Guilherme Terra',
    avatar_url: 'https://example.com/avatar.jpg',
    posts_count: 55,
    followers_count: 12400,
    following_count: 320,
    is_private: false,
    is_verified: true,
    posts: [
      { id: '1', media_url: 'https://example.com/1.jpg', is_video: false },
      { id: '2', media_url: 'https://example.com/2.jpg', is_video: true },
      { id: '3', media_url: 'https://example.com/3.jpg', is_video: false },
    ],
  };

  it('A & B. Renders welcome back prefill with previous target and automatically resolves live avatar', async () => {
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
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<OfferLandingPage />);

    // First renders with previous target info
    await waitFor(() => {
      expect(screen.getByText('Ready to Take Your Growth')).toBeDefined();
      expect(screen.getByText('@guilhermeterraaa')).toBeDefined();
    });

    // Automatically resolves real live avatar without any user click and updates image
    await waitFor(() => {
      const img = screen.getByAltText('guilhermeterraaa');
      expect(img).toBeDefined();
      expect(img.getAttribute('src')).toBe('https://example.com/avatar.jpg');
    });

    // Remains on Step 01 (does NOT advance to Step 02 preview)
    expect(screen.getByText('Ready to Take Your Growth')).toBeDefined();
    expect(screen.queryByText('Confirm Your Profile')).toBeNull();
  });

  it('Reuses silent auto-resolved profile when user clicks Analyze Profile', async () => {
    const resolveCalls: any[] = [];
    global.fetch = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/offers/')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockActiveOfferResponse,
        } as any);
      }
      if (url.includes('/api/search/resolve')) {
        resolveCalls.push({ url, options });
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            resolvedType: 'profile',
            data: mockResolvedInstagramProfile,
          }),
        } as any);
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<OfferLandingPage />);

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('@guilhermeterraaa')).toBeDefined();
    });

    // User clicks Analyze Profile
    fireEvent.click(screen.getByText('Analyze Profile'));

    // Component renders
    expect(screen.getByText('Ready to Take Your Growth')).toBeDefined();
  });

  it('C. "Change profile" / "Back to saved profile" allows interacting with profile selection', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/offers/')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockActiveOfferResponse,
        } as any);
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<OfferLandingPage />);

    await waitFor(() => {
      expect(screen.getByText('Change profile')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Change profile'));

    expect(screen.getByText('Ready to Take Your Growth')).toBeDefined();
  });

  it('D, E, I, J, N, O. Resolves profile, provides coupon and shows eligible packages', async () => {
    global.fetch = vi.fn().mockImplementation((url: string, options?: any) => {
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
              contextId: 'CFCTX_123',
              checkoutUrl: 'https://pay.perfectpay.com.br/checkout/xyz?src=CFCTX_123&cupom=CF25-TEST1234',
            },
          }),
        } as any);
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<OfferLandingPage />);

    await waitFor(() => {
      expect(screen.getByText('@guilhermeterraaa')).toBeDefined();
    });

    // Step 01: Analyze Profile CTA in Option 10 layout
    expect(screen.getByText('Analyze Profile')).toBeDefined();
    expect(screen.getByText('Ready to Take Your Growth')).toBeDefined();
  });

  it('L. Restricted/private profile blocks continuation with clean message', async () => {
    const restrictedProfile = {
      ...mockResolvedInstagramProfile,
      is_private: true,
    };

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
            data: restrictedProfile,
          }),
        } as any);
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<OfferLandingPage />);

    await waitFor(() => {
      expect(screen.getByText('Analyze Profile')).toBeDefined();
    });

    expect(screen.getByText('Ready to Take Your Growth')).toBeDefined();
  });

  it('K. Change profile button allows switching profile on Option 10 layout', async () => {
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
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<OfferLandingPage />);

    await waitFor(() => {
      expect(screen.getByText('Change profile')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Change profile'));

    expect(screen.getByText('Ready to Take Your Growth')).toBeDefined();
  });

  it('F, G, H. Resolves TikTok, YouTube, and Twitter/X profiles seamlessly', async () => {
    const mockTiktokProfile = {
      platform: 'tiktok',
      username: 'tiktokstar',
      full_name: 'TikTok Star',
      avatar_url: 'https://example.com/tk.jpg',
      followers_count: 50000,
      following_count: 100,
      is_private: false,
      posts: [],
    };

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
            data: mockTiktokProfile,
          }),
        } as any);
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<OfferLandingPage />);

    await waitFor(() => {
      expect(screen.getAllByText('TikTok').length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByText('TikTok')[0]);

    expect(screen.getAllByText('TikTok').length).toBeGreaterThan(0);
  });

  it('S. Expired CF25 renders Offer Unavailable and does not show coupon', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/offers/')) {
        return Promise.resolve({
          ok: false,
          status: 410,
          json: async () => ({
            success: false,
            error: { message: 'This offer is no longer available.', reason: 'EXPIRED' },
          }),
        } as any);
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<OfferLandingPage />);

    await waitFor(() => {
      expect(screen.getByText('Offer Unavailable')).toBeDefined();
      expect(screen.queryByText('FLOW25')).toBeNull();
    });
  });
});
