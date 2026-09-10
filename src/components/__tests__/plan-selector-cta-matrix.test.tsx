import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PlanSelector } from '@/components/funnel/plan-selector';
import { resolveCommercialCardsForService } from '@/services/commercial-offer.resolver';

vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));

describe('PlanSelector Frontend CTA Click to Checkout Callback Matrix', () => {
  const platforms = ['instagram', 'tiktok', 'twitter', 'youtube'] as const;

  beforeEach(() => {
    // Default desktop environment
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 });
  });

  for (const platform of platforms) {
    const services = platform === 'youtube' ? (['likes', 'views'] as const) : (['followers', 'likes', 'views'] as const);

    for (const service of services) {
      it(`renders CTAs and triggers onSelectPlan callback for ${platform} ${service} on Starter plan click`, async () => {
        const resolvedCards = resolveCommercialCardsForService(platform, service, [], 'home');
        expect(resolvedCards.length).toBe(6);

        const mockOnSelectPlan = vi.fn();

        const publicOffers = resolvedCards.map((c, idx) => ({
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
        }));

        const { container } = render(
          <PlanSelector
            plans={publicOffers}
            username="cloutflow_test_user"
            platform={platform}
            service={service}
            hasTarget={true}
            onSelectPlan={mockOnSelectPlan}
          />
        );

        // Find Starter card or CTA button
        const starterCard = container.querySelector('.cf-o10-package-ref-card');
        expect(starterCard).not.toBeNull();

        const starterCta = starterCard?.querySelector('.cf-o10-package-ref-cta');
        expect(starterCta).not.toBeNull();

        // Click the CTA
        fireEvent.click(starterCta!);

        expect(mockOnSelectPlan).toHaveBeenCalledTimes(1);
        expect(mockOnSelectPlan).toHaveBeenCalledWith(publicOffers[0].id);
      });
    }
  }

  describe('Mobile (<= 900px) vs Desktop (>= 901px) behavior', () => {
    const viewportsMobile = [320, 360, 375, 390, 412, 430, 600, 768, 820, 900];
    const viewportsDesktop = [901, 1024, 1366, 1440, 1920];
    const planIndices = [0, 1, 2, 3, 4, 5]; // Starter, Boost, Growth, Pro, Elite, Max
    const planNames = ['Starter', 'Boost', 'Growth', 'Pro', 'Elite', 'Max'];

    const resolvedCards = resolveCommercialCardsForService('instagram', 'followers', [], 'home');
    const publicOffers = resolvedCards.map((c, idx) => ({
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
    }));

    for (const width of viewportsMobile) {
      it(`[Mobile ${width}px]: card body click does NOT trigger checkout, CTA click triggers checkout 1 time`, async () => {
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });

        const mockOnSelectPlan = vi.fn();
        const { container } = render(
          <PlanSelector
            plans={publicOffers}
            username="cloutflow_test_user"
            platform="instagram"
            service="followers"
            hasTarget={true}
            onSelectPlan={mockOnSelectPlan}
          />
        );

        const cards = container.querySelectorAll('.cf-o10-package-ref-card');
        expect(cards.length).toBe(6);

        // Test clicking card body on each plan: must NOT trigger checkout
        for (let i = 0; i < 6; i++) {
          fireEvent.click(cards[i]);
          expect(mockOnSelectPlan).not.toHaveBeenCalled();
        }

        // Test clicking CTA on each plan: MUST trigger checkout exactly 1 time
        for (let i = 0; i < 6; i++) {
          mockOnSelectPlan.mockClear();
          const cta = cards[i].querySelector('.cf-o10-package-ref-cta');
          expect(cta).not.toBeNull();

          fireEvent.click(cta!);
          expect(mockOnSelectPlan).toHaveBeenCalledTimes(1);
          expect(mockOnSelectPlan).toHaveBeenCalledWith(publicOffers[i].id);
        }
      });
    }

    it('blocks double-clicks on mobile and displays loading only on the clicked CTA', async () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 390 });

      let resolvePromise: () => void = () => {};
      const pendingCheckout = new Promise<void>((resolve) => {
        resolvePromise = resolve;
      });
      const mockOnSelectPlan = vi.fn().mockReturnValue(pendingCheckout);

      const { container } = render(
        <PlanSelector
          plans={publicOffers}
          username="cloutflow_test_user"
          platform="instagram"
          service="followers"
          hasTarget={true}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      const cards = container.querySelectorAll('.cf-o10-package-ref-card');
      const starterCta = cards[0].querySelector('.cf-o10-package-ref-cta');
      const boostCta = cards[1].querySelector('.cf-o10-package-ref-cta');

      // First click on Starter
      fireEvent.click(starterCta!);
      expect(mockOnSelectPlan).toHaveBeenCalledTimes(1);

      // Starter CTA shows loading
      expect(starterCta?.classList.contains('is-mobile-loading')).toBe(true);
      expect(starterCta?.textContent).toContain('Opening checkout...');

      // Boost CTA is NOT in loading state
      expect(boostCta?.classList.contains('is-mobile-loading')).toBe(false);

      // Immediate second click on Starter CTA: blocked
      fireEvent.click(starterCta!);
      expect(mockOnSelectPlan).toHaveBeenCalledTimes(1);

      // Immediate click on Boost CTA while mobile checkout is in-flight: blocked
      fireEvent.click(boostCta!);
      expect(mockOnSelectPlan).toHaveBeenCalledTimes(1);

      // Resolve checkout
      resolvePromise();
    });

    it('restores CTA state on mobile if onSelectPlan throws an error', async () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 390 });

      let rejectError: (err: any) => void = () => {};
      const failingPromise = new Promise<void>((_, reject) => {
        rejectError = reject;
      });
      const mockOnSelectPlan = vi.fn().mockReturnValue(failingPromise);

      const { container } = render(
        <PlanSelector
          plans={publicOffers}
          username="cloutflow_test_user"
          platform="instagram"
          service="followers"
          hasTarget={true}
          onSelectPlan={mockOnSelectPlan}
        />
      );

      const cards = container.querySelectorAll('.cf-o10-package-ref-card');
      const starterCta = cards[0].querySelector('.cf-o10-package-ref-cta');

      // Click to trigger mobile checkout
      fireEvent.click(starterCta!);

      // Should be loading now
      expect(starterCta?.classList.contains('is-mobile-loading')).toBe(true);
      expect(starterCta?.textContent).toContain('Opening checkout...');

      // Reject the operation
      rejectError(new Error('Network failure'));

      // Wait for loading to be removed
      await waitFor(() => {
        expect(starterCta?.classList.contains('is-mobile-loading')).toBe(false);
      });

      // Button is enabled again for retry
      expect(starterCta?.hasAttribute('disabled')).toBe(false);
    });

    for (const width of viewportsDesktop) {
      it(`[Desktop ${width}px]: preserves desktop behavior (card body click calls select)`, async () => {
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });

        const mockOnSelectPlan = vi.fn();
        const { container } = render(
          <PlanSelector
            plans={publicOffers}
            username="cloutflow_test_user"
            platform="instagram"
            service="followers"
            hasTarget={true}
            onSelectPlan={mockOnSelectPlan}
          />
        );

        const cards = container.querySelectorAll('.cf-o10-package-ref-card');
        expect(cards.length).toBe(6);

        // On desktop, clicking card body triggers onSelectPlan
        for (let i = 0; i < 6; i++) {
          mockOnSelectPlan.mockClear();
          fireEvent.click(cards[i]);
          expect(mockOnSelectPlan).toHaveBeenCalledTimes(1);
          expect(mockOnSelectPlan).toHaveBeenCalledWith(publicOffers[i].id);
        }
      });
    }
  });
});
