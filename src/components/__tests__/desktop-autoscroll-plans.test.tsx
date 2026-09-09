import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import HomePage from '@/app/page';
import { useFunnelStore } from '@/stores/funnel.store';
import { resolveCommercialCardsForService } from '@/services/commercial-offer.resolver';
import { PROGRAMMATIC_SCROLL_START_EVENT, PROGRAMMATIC_SCROLL_END_EVENT } from '@/components/DesktopSmoothScroll';

vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));

describe('Desktop Auto-Scroll to Plans on "Yes, this is my content / profile"', () => {
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

    // Default desktop viewport
    Object.defineProperty(window, 'innerWidth', { value: 1280, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, writable: true });
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

    // Mock API offers response
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('/api/offers')) {
        const cards = resolveCommercialCardsForService('instagram', 'likes', [], 'home');
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
              full_name: 'CloutFlow Test Content',
              link: 'https://instagram.com/p/C-xyz123/',
              followers_count: 12000,
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

  it('1. First click on "Yes, this is my content" triggers desktop auto-scroll to plans with programmatic start/end events', async () => {
    let programmaticStartCount = 0;
    let programmaticEndCount = 0;
    window.addEventListener(PROGRAMMATIC_SCROLL_START_EVENT, () => {
      programmaticStartCount++;
    });
    window.addEventListener(PROGRAMMATIC_SCROLL_END_EVENT, () => {
      programmaticEndCount++;
    });

    const { container } = render(<HomePage initialPlatform="instagram" initialService="likes" />);

    // Mock section layout bounding rect
    const origGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () {
      if (this.classList && this.classList.contains('cf-plans-pricing')) {
        return {
          top: 900,
          bottom: 1500,
          left: 0,
          right: 900,
          width: 900,
          height: 600,
          x: 0,
          y: 900,
          toJSON: () => {},
        };
      }
      if (this.classList && this.classList.contains('cf-plans-header')) {
        return {
          top: 0,
          bottom: 68,
          left: 0,
          right: 1280,
          width: 1280,
          height: 68,
          x: 0,
          y: 0,
          toJSON: () => {},
        };
      }
      return origGetBoundingClientRect.apply(this);
    };

    // Fill inputs
    const inputs = container.querySelectorAll('.cf-pb-input input');
    fireEvent.change(inputs[0], { target: { value: 'https://www.instagram.com/p/C-xyz123/' } });
    fireEvent.change(inputs[1], { target: { value: 'user@test.com' } });

    // Click Analyze
    const analyzeBtn = container.querySelector('.cf-pb-analyze-btn');
    fireEvent.click(analyzeBtn!);

    // Wait for "Yes, this is my content"
    const yesBtn = await screen.findByRole('button', { name: /Yes, this is my content/i });
    expect(yesBtn).toBeDefined();

    // Click "Yes, this is my content"
    await act(async () => {
      fireEvent.click(yesBtn);
    });

    // Verify programmatic scroll start was dispatched
    await waitFor(() => {
      expect(programmaticStartCount).toBeGreaterThanOrEqual(1);
      expect(scrollToCalls.length).toBeGreaterThanOrEqual(1);
    });

    const lastCall = scrollToCalls[scrollToCalls.length - 1] as ScrollToOptions;
    expect(lastCall.behavior).toBe('smooth');
    expect(lastCall.top).toBeGreaterThan(0);

    // Verify title and subtitle exist in DOM
    expect(container.querySelector('.cf-plans-section-title h2')).toHaveTextContent(/Choose Your.*Growth Plan/i);
    expect(container.querySelector('.cf-plans-section-title p')).toHaveTextContent(/Pick a plan for your goals/i);

    Element.prototype.getBoundingClientRect = origGetBoundingClientRect;
  });

  it('2. Repeated clicks on "Yes, this is my content" do not break and re-trigger auto-scroll safely', async () => {
    const { container } = render(<HomePage initialPlatform="instagram" initialService="likes" />);

    // Mock section layout
    const origGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () {
      if (this.classList && this.classList.contains('cf-plans-pricing')) {
        return {
          top: 900,
          bottom: 1500,
          left: 0,
          right: 900,
          width: 900,
          height: 600,
          x: 0,
          y: 900,
          toJSON: () => {},
        };
      }
      return origGetBoundingClientRect.apply(this);
    };

    const inputs = container.querySelectorAll('.cf-pb-input input');
    fireEvent.change(inputs[0], { target: { value: 'https://www.instagram.com/p/C-xyz123/' } });
    fireEvent.change(inputs[1], { target: { value: 'user@test.com' } });

    fireEvent.click(container.querySelector('.cf-pb-analyze-btn')!);

    const yesBtn = await screen.findByRole('button', { name: /Yes, this is my content/i });

    // First click
    await act(async () => {
      fireEvent.click(yesBtn);
    });

    await waitFor(() => {
      expect(scrollToCalls.length).toBeGreaterThanOrEqual(1);
    });
    const firstCallCount = scrollToCalls.length;

    // Second click while still on result stage
    await act(async () => {
      fireEvent.click(yesBtn);
    });

    await waitFor(() => {
      expect(scrollToCalls.length).toBeGreaterThan(firstCallCount);
    });

    Element.prototype.getBoundingClientRect = origGetBoundingClientRect;
  });

  it('3. Mobile <= 900px does NOT trigger desktop programmatic scroll', async () => {
    Object.defineProperty(window, 'innerWidth', { value: 768, writable: true });

    let programmaticStartCalled = false;
    window.addEventListener(PROGRAMMATIC_SCROLL_START_EVENT, () => {
      programmaticStartCalled = true;
    });

    const { container } = render(<HomePage initialPlatform="instagram" initialService="likes" />);

    const inputs = container.querySelectorAll('.cf-pb-input input');
    fireEvent.change(inputs[0], { target: { value: 'https://www.instagram.com/p/C-xyz123/' } });
    fireEvent.change(inputs[1], { target: { value: 'user@test.com' } });

    fireEvent.click(container.querySelector('.cf-pb-analyze-btn')!);

    const yesBtn = await screen.findByRole('button', { name: /Yes, this is my content/i });

    await act(async () => {
      fireEvent.click(yesBtn);
    });

    // Desktop programmatic start must NOT be called on mobile
    expect(programmaticStartCalled).toBe(false);
  });

  it.each([
    { width: 1920, height: 1080, name: '1920x1080' },
    { width: 1600, height: 900, name: '1600x900' },
    { width: 1440, height: 900, name: '1440x900' },
    { width: 1366, height: 768, name: '1366x768' },
    { width: 1280, height: 720, name: '1280x720' },
    { width: 1024, height: 768, name: '1024x768' },
    { width: 901, height: 768, name: '901x768' },
  ])('4. Correct target anchoring for viewport $name', async (vp) => {
    scrollToCalls = [];
    Object.defineProperty(window, 'innerWidth', { value: vp.width, writable: true });
    Object.defineProperty(window, 'innerHeight', { value: vp.height, writable: true });
    Object.defineProperty(window, 'pageYOffset', { value: 0, writable: true });
    Object.defineProperty(document.documentElement, 'scrollTop', { value: 0, writable: true });

    // Section top = 1000px, height = 700px, header = 68px
    const origGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () {
      if (this.classList && this.classList.contains('cf-plans-pricing')) {
        return {
          top: 1000,
          bottom: 1700,
          left: 0,
          right: 900,
          width: 900,
          height: 700,
          x: 0,
          y: 1000,
          toJSON: () => {},
        };
      }
      if (this.classList && this.classList.contains('cf-plans-header')) {
        return {
          top: 0,
          bottom: 68,
          left: 0,
          right: vp.width,
          width: vp.width,
          height: 68,
          x: 0,
          y: 0,
          toJSON: () => {},
        };
      }
      return origGetBoundingClientRect.apply(this);
    };

    const { container } = render(<HomePage initialPlatform="instagram" initialService="likes" />);

    const inputs = container.querySelectorAll('.cf-pb-input input');
    fireEvent.change(inputs[0], { target: { value: 'https://www.instagram.com/p/C-xyz123/' } });
    fireEvent.change(inputs[1], { target: { value: 'user@test.com' } });

    fireEvent.click(container.querySelector('.cf-pb-analyze-btn')!);

    const yesBtn = await screen.findByRole('button', { name: /Yes, this is my content/i });

    await act(async () => {
      fireEvent.click(yesBtn);
    });

    await waitFor(() => {
      expect(scrollToCalls.length).toBeGreaterThanOrEqual(1);
    });

    const lastCall = scrollToCalls[scrollToCalls.length - 1] as ScrollToOptions;
    expect(lastCall.top).toBeDefined();

    // On notebook (e.g. 720/768 height), usable space = height - 68.
    // 700px section is taller than usable space - 48, so target anchors at sectionTop - (68 + 24) = 1000 - 92 = 908px.
    // This guarantees section title & subtitle are always fully visible below the sticky header!
    if (vp.height <= 768) {
      expect(lastCall.top).toBe(908);
    }

    Element.prototype.getBoundingClientRect = origGetBoundingClientRect;
  });

  it('5. New run resets once-per-run lock and auto-scrolls successfully on RUN 2', async () => {
    const { container } = render(<HomePage initialPlatform="instagram" initialService="likes" />);

    const origGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = function () {
      if (this.classList && this.classList.contains('cf-plans-pricing')) {
        return {
          top: 900,
          bottom: 1500,
          left: 0,
          right: 900,
          width: 900,
          height: 600,
          x: 0,
          y: 900,
          toJSON: () => {},
        };
      }
      return origGetBoundingClientRect.apply(this);
    };

    // --- RUN 1 ---
    const inputs1 = container.querySelectorAll('.cf-pb-input input');
    fireEvent.change(inputs1[0], { target: { value: 'https://www.instagram.com/p/C-xyz123/' } });
    fireEvent.change(inputs1[1], { target: { value: 'user@test.com' } });

    fireEvent.click(container.querySelector('.cf-pb-analyze-btn')!);

    const yesBtn1 = await screen.findByRole('button', { name: /Yes, this is my content/i });

    await act(async () => {
      fireEvent.click(yesBtn1);
    });

    await waitFor(() => {
      expect(scrollToCalls.length).toBeGreaterThanOrEqual(1);
    });
    const run1ScrollCount = scrollToCalls.length;

    // Reset viewport scroll to 0 (user scrolled back up or clicked search again)
    Object.defineProperty(window, 'pageYOffset', { value: 0, writable: true });
    Object.defineProperty(document.documentElement, 'scrollTop', { value: 0, writable: true });

    // Click "Search again"
    const searchAgainBtn = screen.getByRole('button', { name: /Search again/i });
    fireEvent.click(searchAgainBtn);

    // --- RUN 2 ---
    const inputs2 = container.querySelectorAll('.cf-pb-input input');
    fireEvent.change(inputs2[0], { target: { value: 'https://www.instagram.com/p/C-xyz456/' } });
    fireEvent.change(inputs2[1], { target: { value: 'user2@test.com' } });

    // Click Analyze for second run
    fireEvent.click(container.querySelector('.cf-pb-analyze-btn')!);

    // Wait for "Yes, this is my content" on run 2
    const yesBtn2 = await screen.findByRole('button', { name: /Yes, this is my content/i });

    await act(async () => {
      fireEvent.click(yesBtn2);
    });

    // Verify auto-scroll occurred for RUN 2 as well!
    await waitFor(() => {
      expect(scrollToCalls.length).toBeGreaterThan(run1ScrollCount);
    });

    Element.prototype.getBoundingClientRect = origGetBoundingClientRect;
  });
});
