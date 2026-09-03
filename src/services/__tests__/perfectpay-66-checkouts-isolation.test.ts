import { describe, it, expect } from 'vitest';
import { OFFICIAL_PERFECTPAY_66_DATASET } from '@/config/official-perfectpay-dataset';
import {
  resolveCommercialOffer,
  resolveCommercialCardsForService,
  resolveCheckoutForIdentity,
  computeCommercialDiagnostics,
  VALID_PLATFORMS,
  PLATFORM_SERVICES,
  CANONICAL_PLANS,
} from '@/services/commercial-offer.resolver';
import { CLOUTFLOW_CATALOG_PACKAGES } from '@/config/financial-protection.config';

describe('66 Checkouts Commercial Resolution & Cross-Identity Isolation Tests', () => {
  // Create mock DB offers representing the 66 cards populated with the official dataset
  const mockDbOffers = OFFICIAL_PERFECTPAY_66_DATASET.map((item, index) => {
    const canonical = CLOUTFLOW_CATALOG_PACKAGES.find(
      (p) =>
        p.platform === item.platform &&
        p.service === item.service &&
        p.name.toLowerCase() === item.plan.toLowerCase()
    )!;

    return {
      id: `offer_${index + 1}`,
      platform: item.platform,
      service: item.service,
      name: canonical.name,
      quantity: canonical.quantity,
      bonusQuantity: 0,
      priceCents: canonical.priceCents,
      oldPriceCents: canonical.priceCents * 1.5,
      perfectpayProductId: item.productCode,
      perfectpayPlanId: item.planCode,
      externalCheckoutUrl: item.checkoutUrl,
      syncHome: true,
      syncOfferStep3: true,
      active: true,
      priorityServiceId: '31249',
      fallback1ServiceId: '22042',
      fallback2ServiceId: null,
      costCeilingEnabled: true,
      manualReviewEnabled: true,
    };
  });

  it('should confirm 66/66 CHECKOUT READY status in diagnostics', () => {
    const diag = computeCommercialDiagnostics(mockDbOffers);
    expect(diag.counters.totalCards).toBe(66);
    expect(diag.counters.checkoutReady).toBe(66);
    expect(diag.counters.checkoutIncomplete).toBe(0);
    expect(diag.counters.checkoutMissing).toBe(0);
    expect(diag.counters.productCodeConfigured).toBe(66);
    expect(diag.counters.planCodeConfigured).toBe(66);
    expect(diag.counters.checkoutUrlConfigured).toBe(66);
    expect(diag.duplicateWarnings).toHaveLength(0);
  });

  it('should confirm exact resolution for Instagram Followers Starter', () => {
    const resolved = resolveCheckoutForIdentity('instagram', 'followers', 'starter', mockDbOffers);
    expect(resolved).not.toBeNull();
    expect(resolved?.checkoutUrl).toBe('https://go.centerpag.com/PPU38CQEOIF');
    expect(resolved?.productCode).toBe('PPPBF6TP');
    expect(resolved?.planCode).toBe('PPLQQQ3F7');
    expect(resolved?.status).toBe('READY');
  });

  it('should confirm exact resolution for Instagram Likes Starter', () => {
    const resolved = resolveCheckoutForIdentity('instagram', 'likes', 'starter', mockDbOffers);
    expect(resolved).not.toBeNull();
    expect(resolved?.checkoutUrl).toBe('https://go.centerpag.com/PPU38CQEOSR');
    expect(resolved?.productCode).toBe('PPPBF6TP');
    expect(resolved?.planCode).toBe('PPLQQQ3N7');
    expect(resolved?.status).toBe('READY');
  });

  it('should confirm exact resolution for TikTok Followers Starter', () => {
    const resolved = resolveCheckoutForIdentity('tiktok', 'followers', 'starter', mockDbOffers);
    expect(resolved).not.toBeNull();
    expect(resolved?.checkoutUrl).toBe('https://go.centerpag.com/PPU38CQFR8B');
    expect(resolved?.productCode).toBe('PPPBF6TP');
    expect(resolved?.planCode).toBe('PPLQQQD0I');
    expect(resolved?.status).toBe('READY');
  });

  it('should confirm exact resolution for Twitter Followers Starter', () => {
    const resolved = resolveCheckoutForIdentity('twitter', 'followers', 'starter', mockDbOffers);
    expect(resolved).not.toBeNull();
    expect(resolved?.checkoutUrl).toBe('https://go.centerpag.com/PPU38CQFR9O');
    expect(resolved?.productCode).toBe('PPPBF6TP');
    expect(resolved?.planCode).toBe('PPLQQQD1C');
    expect(resolved?.status).toBe('READY');
  });

  it('should confirm exact resolution for YouTube Likes Starter', () => {
    const resolved = resolveCheckoutForIdentity('youtube', 'likes', 'starter', mockDbOffers);
    expect(resolved).not.toBeNull();
    expect(resolved?.checkoutUrl).toBe('https://go.centerpag.com/PPU38CQFRFH');
    expect(resolved?.productCode).toBe('PPPBF6TP');
    expect(resolved?.planCode).toBe('PPLQQQD2V');
    expect(resolved?.status).toBe('READY');
  });

  it('should confirm strict cross-identity isolation (no shared URLs across different identities)', () => {
    const sampledIdentities = [
      { platform: 'instagram', service: 'followers', plan: 'starter', expectedUrl: 'https://go.centerpag.com/PPU38CQEOIF' },
      { platform: 'instagram', service: 'likes', plan: 'pro', expectedUrl: 'https://go.centerpag.com/PPU38CQEOSU' },
      { platform: 'instagram', service: 'views', plan: 'max', expectedUrl: 'https://go.centerpag.com/PPU38CQFR84' },
      { platform: 'tiktok', service: 'followers', plan: 'starter', expectedUrl: 'https://go.centerpag.com/PPU38CQFR8B' },
      { platform: 'tiktok', service: 'likes', plan: 'elite', expectedUrl: 'https://go.centerpag.com/PPU38CQFR9L' },
      { platform: 'tiktok', service: 'views', plan: 'max', expectedUrl: 'https://go.centerpag.com/PPU38CQFR99' },
      { platform: 'twitter', service: 'followers', plan: 'starter', expectedUrl: 'https://go.centerpag.com/PPU38CQFR9O' },
      { platform: 'twitter', service: 'likes', plan: 'pro', expectedUrl: 'https://go.centerpag.com/PPU38CQFREA' },
      { platform: 'twitter', service: 'views', plan: 'max', expectedUrl: 'https://go.centerpag.com/PPU38CQFREP' },
      { platform: 'youtube', service: 'likes', plan: 'starter', expectedUrl: 'https://go.centerpag.com/PPU38CQFRFH' },
      { platform: 'youtube', service: 'views', plan: 'elite', expectedUrl: 'https://go.centerpag.com/PPU38CQFRG8' },
      { platform: 'youtube', service: 'views', plan: 'max', expectedUrl: 'https://go.centerpag.com/PPU38CQFRGF' },
    ];

    for (const sample of sampledIdentities) {
      const resolved = resolveCheckoutForIdentity(sample.platform, sample.service, sample.plan, mockDbOffers);
      expect(resolved?.checkoutUrl).toBe(sample.expectedUrl);
    }
  });

  it('should verify Home and Step 3 return identical prices, quantities and checkout URLs', () => {
    for (const item of OFFICIAL_PERFECTPAY_66_DATASET) {
      const homeResolved = resolveCommercialOffer(item.platform, item.service, item.plan, mockDbOffers, 'home');
      const step3Resolved = resolveCommercialOffer(item.platform, item.service, item.plan, mockDbOffers, 'offer_step3');

      expect(homeResolved).not.toBeNull();
      expect(step3Resolved).not.toBeNull();
      expect(homeResolved?.priceCents).toBe(step3Resolved?.priceCents);
      expect(homeResolved?.quantity).toBe(step3Resolved?.quantity);
      expect(homeResolved?.checkoutUrl).toBe(step3Resolved?.checkoutUrl);
      expect(homeResolved?.checkoutUrl).toBe(item.checkoutUrl);
    }
  });

  it('should confirm X Likes commercial values remain intact', () => {
    const xLikes = resolveCommercialCardsForService('twitter', 'likes', mockDbOffers, 'home');
    expect(xLikes).toHaveLength(6);

    const expectedXLikes = [
      { plan: 'starter', quantity: 1000, priceCents: 790, priceFormatted: '$7.90' },
      { plan: 'boost', quantity: 2500, priceCents: 1490, priceFormatted: '$14.90' },
      { plan: 'growth', quantity: 5000, priceCents: 2490, priceFormatted: '$24.90' },
      { plan: 'pro', quantity: 10000, priceCents: 4490, priceFormatted: '$44.90' },
      { plan: 'elite', quantity: 15000, priceCents: 6490, priceFormatted: '$64.90' },
      { plan: 'max', quantity: 20000, priceCents: 7990, priceFormatted: '$79.90' },
    ];

    for (let i = 0; i < expectedXLikes.length; i++) {
      expect(xLikes[i].plan).toBe(expectedXLikes[i].plan);
      expect(xLikes[i].quantity).toBe(expectedXLikes[i].quantity);
      expect(xLikes[i].priceCents).toBe(expectedXLikes[i].priceCents);
      expect(xLikes[i].priceFormatted).toBe(expectedXLikes[i].priceFormatted);
    }
  });

  it('should confirm YouTube Followers is 0 and completely rejected', () => {
    const ytFollowers = resolveCommercialCardsForService('youtube', 'followers', mockDbOffers, 'home');
    expect(ytFollowers).toHaveLength(0);

    const singleResolve = resolveCommercialOffer('youtube', 'followers', 'starter', mockDbOffers, 'home');
    expect(singleResolve).toBeNull();

    const checkoutResolve = resolveCheckoutForIdentity('youtube', 'followers', 'starter', mockDbOffers);
    expect(checkoutResolve.status).toBe('MISSING');
    expect(checkoutResolve.isAllowed).toBe(false);
  });
});
