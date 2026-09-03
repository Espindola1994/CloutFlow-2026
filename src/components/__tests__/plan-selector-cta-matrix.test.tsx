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
});
