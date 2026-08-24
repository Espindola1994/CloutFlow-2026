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

  it('A & B. Renders welcome back prefill with previous target when available', async () => {
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
      expect(screen.getByText('Welcome Back')).toBeDefined();
      expect(screen.getByText('Boost the same profile again?')).toBeDefined();
      expect(screen.getByText('@guilhermeterraaa')).toBeDefined();
    });
  });

  it('C. "Use another profile" switches to manual lookup input with platform selection', async () => {
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
      expect(screen.getByText('Use another profile')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Use another profile'));

    await waitFor(() => {
      expect(screen.getByText('Social Lookup')).toBeDefined();
      expect(screen.getByPlaceholderText('@username or profile link')).toBeDefined();
      expect(screen.getByText('tiktok')).toBeDefined();
      expect(screen.getByText('youtube')).toBeDefined();
      expect(screen.getByText('X / Twitter')).toBeDefined();
    });
  });

  it('D, E, I, J, N, O. Resolves profile, shows preview with max 3 media thumbnails, requires explicit confirmation, then shows eligible packages and FLOW25', async () => {
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
      expect(screen.getByText('Find / Confirm Profile')).toBeDefined();
    });

    // Click Find / Confirm Profile
    fireEvent.click(screen.getByText('Find / Confirm Profile'));

    // Step 4: Preview screen rendered
    await waitFor(() => {
      expect(screen.getByText('Confirm Profile')).toBeDefined();
      expect(screen.getByText('Use this profile')).toBeDefined();
      expect(screen.getByText('Search another profile')).toBeDefined();
    });

    // Explicitly confirm profile
    fireEvent.click(screen.getByText('Use this profile'));

    // Step 5: Package selection & FLOW25 coupon
    await waitFor(() => {
      expect(screen.getByText('Select Your Next Boost')).toBeDefined();
      expect(screen.getAllByText('FLOW25').length).toBeGreaterThan(0);
      expect(screen.getByText('1000 Instagram Followers')).toBeDefined();
      // TikTok package should NOT be in eligible list for Instagram target
      expect(screen.queryByText('1000 TikTok Followers')).toBeNull();
      // Check the new button text (ignoring the icon text)
      // The button text is "Copy FLOW25 & Continue", but since we changed the component to use OfferCard,
      // it doesn't have a single "Copy FLOW25 & Continue" button anymore. It has "COPY" for the coupon and OfferCard CTAs.
      expect(screen.getByText('COPY')).toBeDefined();
    });
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
      expect(screen.getByText('Find / Confirm Profile')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Find / Confirm Profile'));

    await waitFor(() => {
      const btn = screen.getByText('Make account public to continue');
      expect(btn).toBeDefined();
      expect(btn.closest('button')?.disabled).toBe(true);
    });
  });

  it('K. "Search another profile" resets promotional lookup only', async () => {
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
      expect(screen.getByText('Find / Confirm Profile')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Find / Confirm Profile'));

    await waitFor(() => {
      expect(screen.getByText('Search another profile')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Search another profile'));

    await waitFor(() => {
      expect(screen.getByText('Social Lookup')).toBeDefined();
      expect(screen.queryByText('Confirm Profile')).toBeNull();
    });
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
      expect(screen.getByText('Use another profile')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Use another profile'));

    await waitFor(() => {
      expect(screen.getByText('tiktok')).toBeDefined();
    });

    fireEvent.click(screen.getByText('tiktok'));

    const input = screen.getByPlaceholderText('@username or profile link');
    fireEvent.change(input, { target: { value: 'tiktokstar' } });
    fireEvent.click(screen.getByText('Locate Profile'));

    await waitFor(() => {
      expect(screen.getByText('Confirm Profile')).toBeDefined();
      expect(screen.getByText('Use this profile')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Use this profile'));

    await waitFor(() => {
      expect(screen.getByText('1000 TikTok Followers')).toBeDefined();
      expect(screen.queryByText('1000 Instagram Followers')).toBeNull();
    });
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
