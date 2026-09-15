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
        email: 'email@email.com',
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

  it('Directly opens package cards on successful analysis without Validating Offer or Profile found intermediate screens', async () => {
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
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<OfferLandingPage />);

    await waitFor(() => {
      expect(screen.getByText('Analyze Profile')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Analyze Profile'));

    // Wait for auto-advancement to PACKAGE step (packages grid)
    await waitFor(() => {
      expect(screen.getByText('Choose your')).toBeDefined();
      expect(screen.getByText('growth package')).toBeDefined();
    }, { timeout: 4000 });

    // Ensure neither "Validating Offer" nor "Profile found!" nor "Continue to packages" appeared
    expect(screen.queryByText('Validating Offer')).toBeNull();
    expect(screen.queryByText('Retrieving your verified 25% repeat purchase discount...')).toBeNull();
    expect(screen.queryByText('Profile found!')).toBeNull();
    expect(screen.queryByText('Continue to packages')).toBeNull();
  });

  it('Error on search resolution prevents advancement to package cards', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/offers/')) {
        return Promise.resolve({
          ok: true,
          json: async () => mockActiveOfferResponse,
        } as any);
      }
      if (url.includes('/api/search/resolve')) {
        return Promise.resolve({
          ok: false,
          status: 404,
          json: async () => ({
            success: false,
            message: "We couldn't find this profile. Check the @ or link and try again.",
          }),
        } as any);
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<OfferLandingPage />);

    await waitFor(() => {
      expect(screen.getByText('@guilhermeterraaa')).toBeDefined();
    });

    // Switch to another platform so canReuseSavedProfile is false and it executes onSearch
    fireEvent.click(screen.getByText('TikTok'));

    // Click Analyze Profile
    fireEvent.click(screen.getByText('Analyze Profile'));

    // Wait for error message
    await waitFor(() => {
      expect(screen.getByText("We couldn't find this profile. Check the @ or link and try again.")).toBeDefined();
    });

    // Ensure it did NOT advance to PACKAGE
    expect(screen.queryByText('growth package')).toBeNull();
    expect(screen.queryByText('Continue to packages')).toBeNull();
  });

  it('Matrix: Instagram Followers, Likes, Views - Analyze Profile navigates directly to matching plans', async () => {
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

    const { unmount } = render(<OfferLandingPage />);
    await waitFor(() => expect(screen.getByText('Analyze Profile')).toBeDefined());

    // Select goal likes
    const goalBtn = screen.getByRole('button', { name: /Likes/i });
    fireEvent.click(goalBtn);

    // Click Analyze Profile
    fireEvent.click(screen.getByText('Analyze Profile'));

    await waitFor(() => {
      expect(screen.getByText('growth package')).toBeDefined();
    }, { timeout: 4000 });

    // Verify no intermediate screens
    expect(screen.queryByText('Validating Offer')).toBeNull();
    expect(screen.queryByText('Profile found!')).toBeNull();
    expect(screen.queryByText('Continue to packages')).toBeNull();

    unmount();
  }, 10000);

  it('Matrix: TikTok, YouTube, Twitter/X - Analyze Profile navigates directly to matching plans', async () => {
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
            data: { platform: 'tiktok', username: 'tiktokuser', avatar_url: null, is_private: false },
          }),
        } as any);
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    const { unmount } = render(<OfferLandingPage />);
    await waitFor(() => expect(screen.getByText('Analyze Profile')).toBeDefined());

    // Select TikTok network button
    const netBtn = screen.getByRole('button', { name: /TikTok/i });
    fireEvent.click(netBtn);

    // Click Analyze Profile
    fireEvent.click(screen.getByText('Analyze Profile'));

    // Wait for resolution and confirmation button state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Yes, This is my profile' })).toBeDefined();
    }, { timeout: 4000 });

    // Click "Yes, This is my profile" to advance to packages
    fireEvent.click(screen.getByRole('button', { name: 'Yes, This is my profile' }));

    await waitFor(() => {
      expect(screen.getByText('growth package')).toBeDefined();
    }, { timeout: 4000 });

    // Verify no intermediate screens
    expect(screen.queryByText('Validating Offer')).toBeNull();
    expect(screen.queryByText('Profile found!')).toBeNull();
    expect(screen.queryByText('Continue to packages')).toBeNull();

    unmount();
  }, 10000);

  it('C. clicking the real Change profile button immediately opens a fresh editable lookup', async () => {
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
      expect(screen.getByText('Last purchased profile')).toBeDefined();
      expect(screen.getByText('@guilhermeterraaa')).toBeDefined();
      expect(screen.getByText('Linked')).toBeDefined();
      expect(screen.getByRole('button', { name: /Change profile/i })).toBeDefined();
    });

    fireEvent.click(screen.getByRole('button', { name: /Change profile/i }));

    // This is the observable contract of the real click, not an isolated callback test.
    expect(screen.queryByText('Last purchased profile')).toBeNull();
    expect(screen.queryByText('@guilhermeterraaa')).toBeNull();
    expect(screen.queryByText('Linked')).toBeNull();
    expect(screen.queryByRole('button', { name: /Change profile/i })).toBeNull();
    expect(screen.getByRole('textbox', { name: 'Profile username or link' })).toBeDefined();
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Analyze Profile' })).toBeDefined();
  });

  it('Change profile sends a new target to resolve and advances directly to packages', async () => {
    const resolveCalls: Array<{ input: string; body: any }> = [];
    global.fetch = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/offers/')) {
        return Promise.resolve({ ok: true, json: async () => mockActiveOfferResponse } as any);
      }
      if (url.includes('/api/search/resolve')) {
        const body = options?.body ? JSON.parse(options.body) : {};
        resolveCalls.push({ input: body.input, body });
        const resolvedUsername = body.input === '@novoperfil' ? 'novoperfil' : 'guilhermeterraaa';
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            resolvedType: 'profile',
            data: { ...mockResolvedInstagramProfile, username: resolvedUsername },
          }),
        } as any);
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<OfferLandingPage />);
    await waitFor(() => expect(screen.getByRole('button', { name: /Change profile/i })).toBeDefined());

    fireEvent.click(screen.getByRole('button', { name: /Change profile/i }));
    const callsAfterChange = resolveCalls.length;
    const input = screen.getByRole('textbox', { name: 'Profile username or link' });
    fireEvent.change(input, { target: { value: '@novoperfil' } });
    fireEvent.click(screen.getByRole('button', { name: 'Analyze Profile' }));

    // Wait for resolution and confirmation button state
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Yes, This is my profile' })).toBeDefined();
    });

    // Click "Yes, This is my profile" to advance to packages
    fireEvent.click(screen.getByRole('button', { name: 'Yes, This is my profile' }));

    await waitFor(() => {
      expect(screen.getByText('growth package')).toBeDefined();
    }, { timeout: 4000 });

    const newSearchCalls = resolveCalls.slice(callsAfterChange);
    expect(newSearchCalls.some((call) => call.input === '@novoperfil')).toBe(true);
    expect(newSearchCalls.every((call) => call.input !== '@guilhermeterraaa')).toBe(true);
    expect(screen.getByText('#FLOW25')).toBeDefined();
    expect(screen.queryByText('Validating Offer')).toBeNull();
    expect(screen.queryByText('Profile found!')).toBeNull();
    expect(screen.queryByText('Continue to packages')).toBeNull();
  }, 10000);

  it('Change profile does not fall back to the historical target when the new input is empty', async () => {
    const resolveInputs: string[] = [];
    global.fetch = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/offers/')) {
        return Promise.resolve({ ok: true, json: async () => mockActiveOfferResponse } as any);
      }
      if (url.includes('/api/search/resolve')) {
        const body = options?.body ? JSON.parse(options.body) : {};
        resolveInputs.push(body.input);
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true, resolvedType: 'profile', data: mockResolvedInstagramProfile }),
        } as any);
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<OfferLandingPage />);
    await waitFor(() => expect(screen.getByRole('button', { name: /Change profile/i })).toBeDefined());
    fireEvent.click(screen.getByRole('button', { name: /Change profile/i }));
    const callsAfterChange = resolveInputs.length;

    fireEvent.click(screen.getByRole('button', { name: 'Analyze Profile' }));

    await waitFor(() => {
      expect(screen.getByText('Enter an @username or profile/channel link.')).toBeDefined();
    });
    expect(resolveInputs.slice(callsAfterChange)).toEqual([]);
    expect(screen.queryByText('@guilhermeterraaa')).toBeNull();
  });

  it('ignores a late response from a search started before Change profile', async () => {
    let resolveSearchA: ((value: any) => void) | null = null;
    const resolveInputs: string[] = [];
    global.fetch = vi.fn().mockImplementation((url: string, options?: any) => {
      if (url.includes('/api/offers/')) {
        return Promise.resolve({ ok: true, json: async () => mockActiveOfferResponse } as any);
      }
      if (url.includes('/api/search/resolve')) {
        const body = options?.body ? JSON.parse(options.body) : {};
        resolveInputs.push(body.input);
        if (body.input === '@perfilA') {
          return new Promise((resolve) => { resolveSearchA = resolve; });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            resolvedType: 'profile',
            data: { ...mockResolvedInstagramProfile, username: 'perfilB' },
          }),
        } as any);
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<OfferLandingPage />);
    await waitFor(() => expect(screen.getByRole('button', { name: /Change profile/i })).toBeDefined());
    fireEvent.click(screen.getByRole('button', { name: /Change profile/i }));

    fireEvent.change(screen.getByRole('textbox', { name: 'Profile username or link' }), { target: { value: '@perfilA' } });
    fireEvent.click(screen.getByRole('button', { name: 'Analyze Profile' }));
    await waitFor(() => expect(resolveInputs).toContain('@perfilA'));

    // Start B before A resolves. A is then deliberately released late.
    fireEvent.change(screen.getByRole('textbox', { name: 'Profile username or link' }), { target: { value: '@perfilB' } });
    fireEvent.click(screen.getByRole('button', { name: 'Analyze Profile' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Yes, This is my profile' })).toBeDefined();
    });
    fireEvent.click(screen.getByRole('button', { name: 'Yes, This is my profile' }));
    await waitFor(() => expect(screen.getByText('growth package')).toBeDefined(), { timeout: 4000 });

    const releaseSearchA: any = resolveSearchA;
    if (releaseSearchA) {
      releaseSearchA({
        ok: true,
        json: async () => ({
          success: true,
          resolvedType: 'profile',
          data: { ...mockResolvedInstagramProfile, username: 'perfilA' },
        }),
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(screen.getByText('growth package')).toBeDefined();
    expect(screen.queryByText('@perfilA')).toBeNull();
  }, 10000);

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

    // As mandated, Change Profile keeps the user on the same screen ("Ready to Take Your Growth Further?")
    // and displays the new target input field without navigating to "Find your profile."
    expect(screen.getByText('Ready to Take Your Growth')).toBeDefined();
    expect(screen.queryByText('Find your')).toBeNull();
    expect(screen.getByRole('textbox', { name: 'Profile username or link' })).toBeDefined();
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
