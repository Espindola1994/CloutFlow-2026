import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import HomePage from '@/app/page';
import { useFunnelStore } from '@/stores/funnel.store';
import { resolveCommercialCardsForService } from '@/services/commercial-offer.resolver';
import { PROGRAMMATIC_SCROLL_START_EVENT } from '@/components/DesktopSmoothScroll';

vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));

describe('Mobile Guided Auto-Scroll Flow (<= 900px)', () => {
  let origScrollTo: typeof window.scrollTo;
  let scrollToCalls: Array<ScrollToOptions | { x: number; y: number }> = [];

  beforeEach(() => {
    useFunnelStore.getState().reset();
    window.sessionStorage.clear();
    scrollToCalls = [];

    origScrollTo = window.scrollTo;
    window.scrollTo = vi.fn((options: any) => {
      scrollToCalls.push(options);
      if (typeof options === 'object' && options.top !== undefined) {
        Object.defineProperty(window, 'pageYOffset', { value: options.top, writable: true });
        Object.defineProperty(document.documentElement, 'scrollTop', { value: options.top, writable: true });
      }
    }) as any;

    // Default mobile viewport <= 900px
    Object.defineProperty(window, 'innerWidth', { value: 390, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 844, writable: true });
    Object.defineProperty(window, 'pageYOffset', { value: 0, writable: true });
    Object.defineProperty(document.documentElement, 'scrollTop', { value: 0, writable: true });
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 4000, writable: true });

    // Mock matchMedia
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    // Mock API offers response & resolve
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/offers')) {
        const cards = resolveCommercialCardsForService('instagram', 'followers', [], 'home');
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
      if (url.includes('/api/leads/capture')) {
        return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
      }
      if (url.includes('/api/search/resolve')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            resolvedType: 'profile',
            data: {
              platform: 'instagram',
              username: 'cloutflow.test',
              full_name: 'CloutFlow Mobile User',
              link: 'https://instagram.com/cloutflow.test',
              followers_count: 15400,
            },
          }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
  });

  afterEach(() => {
    window.scrollTo = origScrollTo;
    vi.restoreAllMocks();
  });

  it('1. Mobile: Step 1 (Analyze clicked) scrolls automatically to Analyze profile section', async () => {
    const { container } = render(<HomePage initialPlatform="instagram" initialService="followers" />);

    // Mock element bounding rects
    const origGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () {
      if (this.classList && this.classList.contains('cf-pb-analyze')) {
        return { top: 450, bottom: 650, left: 0, right: 390, width: 390, height: 200, x: 0, y: 450, toJSON: () => {} };
      }
      if (this.classList && this.classList.contains('cf-plans-header')) {
        return { top: 0, bottom: 62, left: 0, right: 390, width: 390, height: 62, x: 0, y: 0, toJSON: () => {} };
      }
      return origGetBoundingClientRect.apply(this);
    };

    const inputs = container.querySelectorAll('.cf-pb-input input');
    fireEvent.change(inputs[0], { target: { value: 'cloutflow.test' } });
    fireEvent.change(inputs[1], { target: { value: 'user@cloutflow.co' } });

    // Click Analyze button
    const analyzeBtn = container.querySelector('.cf-pb-analyze-btn');
    expect(analyzeBtn).toBeDefined();

    await act(async () => {
      fireEvent.click(analyzeBtn!);
    });

    // Step 1 scroll triggered
    await waitFor(() => {
      expect(scrollToCalls.length).toBeGreaterThanOrEqual(1);
    });

    const firstCall = scrollToCalls[0] as ScrollToOptions;
    expect(firstCall.behavior).toBe('smooth');
    expect(firstCall.top).toBeGreaterThanOrEqual(370); // 450 - 62 - 14 = 374

    Element.prototype.getBoundingClientRect = origGetBoundingClientRect;
  });

  it('2. Mobile: Step 2 (Analysis completed + Result mounted) scrolls to found result, and STOPS before Pricing', async () => {
    const { container } = render(<HomePage initialPlatform="instagram" initialService="followers" />);

    const origGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () {
      if (this.classList && this.classList.contains('cf-pb-analyze')) {
        return { top: 450, bottom: 650, left: 0, right: 390, width: 390, height: 200, x: 0, y: 450, toJSON: () => {} };
      }
      if (this.classList && this.classList.contains('cf-premium-builder-result')) {
        return { top: 750, bottom: 1200, left: 0, right: 390, width: 390, height: 450, x: 0, y: 750, toJSON: () => {} };
      }
      if (this.classList && this.classList.contains('cf-plans-header')) {
        return { top: 0, bottom: 62, left: 0, right: 390, width: 390, height: 62, x: 0, y: 0, toJSON: () => {} };
      }
      return origGetBoundingClientRect.apply(this);
    };

    const inputs = container.querySelectorAll('.cf-pb-input input');
    fireEvent.change(inputs[0], { target: { value: 'cloutflow.test' } });
    fireEvent.change(inputs[1], { target: { value: 'user@cloutflow.co' } });

    const analyzeBtn = container.querySelector('.cf-pb-analyze-btn');
    await act(async () => {
      fireEvent.click(analyzeBtn!);
    });

    // Wait for "Yes, this is my profile" to appear
    const yesBtn = await screen.findByRole('button', { name: /Yes, this is my profile/i });
    expect(yesBtn).toBeDefined();

    // Verify result scroll happened
    await waitFor(() => {
      expect(scrollToCalls.length).toBeGreaterThanOrEqual(2);
    });

    const resultCall = scrollToCalls[scrollToCalls.length - 1] as ScrollToOptions;
    expect(resultCall.behavior).toBe('smooth');
    expect(resultCall.top).toBeGreaterThanOrEqual(670); // 750 - 62 - 14 = 674

    // Crucial rule: It stops at Step 2 and does NOT show or advance to pricing yet!
    expect(useFunnelStore.getState().getReadiness().canShowPlans).toBe(false);

    Element.prototype.getBoundingClientRect = origGetBoundingClientRect;
  });

  it('3. Mobile: Step 3 (Yes confirmation clicked) scrolls to Choose Your Growth Plan', async () => {
    const { container } = render(<HomePage initialPlatform="instagram" initialService="followers" />);

    const origGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () {
      if (this.classList && this.classList.contains('cf-pb-analyze')) {
        return { top: 450, bottom: 650, left: 0, right: 390, width: 390, height: 200, x: 0, y: 450, toJSON: () => {} };
      }
      if (this.classList && this.classList.contains('cf-premium-builder-result')) {
        return { top: 750, bottom: 1200, left: 0, right: 390, width: 390, height: 450, x: 0, y: 750, toJSON: () => {} };
      }
      if (this.classList && this.classList.contains('cf-plans-pricing')) {
        return { top: 1300, bottom: 2500, left: 0, right: 390, width: 390, height: 1200, x: 0, y: 1300, toJSON: () => {} };
      }
      if (this.classList && this.classList.contains('cf-plans-header')) {
        return { top: 0, bottom: 62, left: 0, right: 390, width: 390, height: 62, x: 0, y: 0, toJSON: () => {} };
      }
      return origGetBoundingClientRect.apply(this);
    };

    const inputs = container.querySelectorAll('.cf-pb-input input');
    fireEvent.change(inputs[0], { target: { value: 'cloutflow.test' } });
    fireEvent.change(inputs[1], { target: { value: 'user@cloutflow.co' } });

    fireEvent.click(container.querySelector('.cf-pb-analyze-btn')!);

    const yesBtn = await screen.findByRole('button', { name: /Yes, this is my profile/i });

    // Click "Yes, this is my profile"
    await act(async () => {
      fireEvent.click(yesBtn);
    });

    await waitFor(() => {
      const callsToPricing = scrollToCalls.filter((c: any) => c.top >= 1200);
      expect(callsToPricing.length).toBeGreaterThanOrEqual(1);
    });

    // Plans are now shown and ready
    expect(useFunnelStore.getState().getReadiness().canShowPlans).toBe(true);

    Element.prototype.getBoundingClientRect = origGetBoundingClientRect;
  });

  it('4. Search again resets flags and allows second cycle to execute identically', async () => {
    const { container } = render(<HomePage initialPlatform="instagram" initialService="followers" />);

    Element.prototype.getBoundingClientRect = function () {
      return { top: 500, bottom: 700, left: 0, right: 390, width: 390, height: 200, x: 0, y: 500, toJSON: () => {} };
    };

    const inputs = container.querySelectorAll('.cf-pb-input input');
    fireEvent.change(inputs[0], { target: { value: 'cloutflow.user1' } });
    fireEvent.change(inputs[1], { target: { value: 'user1@test.com' } });
    fireEvent.click(container.querySelector('.cf-pb-analyze-btn')!);

    const searchAgainBtn = await screen.findByRole('button', { name: /Search again/i });
    expect(searchAgainBtn).toBeDefined();

    // Click Search again
    await act(async () => {
      fireEvent.click(searchAgainBtn);
    });

    // Run cycle 2
    const inputs2 = container.querySelectorAll('.cf-pb-input input');
    fireEvent.change(inputs2[0], { target: { value: 'cloutflow.user2' } });
    fireEvent.change(inputs2[1], { target: { value: 'user2@test.com' } });

    const prevCallCount = scrollToCalls.length;
    fireEvent.click(container.querySelector('.cf-pb-analyze-btn')!);

    await waitFor(() => {
      expect(scrollToCalls.length).toBeGreaterThan(prevCallCount);
    });
  });

  it('5. Error in analysis does NOT advance to result or pricing', async () => {
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/search/resolve')) {
        return Promise.resolve({
          ok: false,
          status: 404,
          json: async () => ({ success: false, message: 'Profile not found' }),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });

    const { container } = render(<HomePage initialPlatform="instagram" initialService="followers" />);

    const inputs = container.querySelectorAll('.cf-pb-input input');
    fireEvent.change(inputs[0], { target: { value: 'unknown.user' } });
    fireEvent.change(inputs[1], { target: { value: 'user@test.com' } });

    fireEvent.click(container.querySelector('.cf-pb-analyze-btn')!);

    // Should display error and not show Yes button
    await screen.findByText(/Profile not found/i);
    expect(screen.queryByRole('button', { name: /Yes, this is my profile/i })).toBeNull();
    expect(useFunnelStore.getState().getReadiness().canShowPlans).toBe(false);
  });

  it('6. Desktop (>= 901px) does not execute mobile scroll logic', async () => {
    Object.defineProperty(window, 'innerWidth', { value: 1280, writable: true });
    let desktopEventTriggered = false;
    window.addEventListener(PROGRAMMATIC_SCROLL_START_EVENT, () => {
      desktopEventTriggered = true;
    });

    const { container } = render(<HomePage initialPlatform="instagram" initialService="followers" />);

    const inputs = container.querySelectorAll('.cf-pb-input input');
    fireEvent.change(inputs[0], { target: { value: 'desktop.user' } });
    fireEvent.change(inputs[1], { target: { value: 'desktop@test.com' } });

    // Click analyze on desktop: does not scroll mobile analyze
    fireEvent.click(container.querySelector('.cf-pb-analyze-btn')!);

    // In desktop, analyze click does not call window.scrollTo
    expect(scrollToCalls.length).toBe(0);
  });
});
