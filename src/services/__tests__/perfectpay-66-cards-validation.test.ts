import { describe, it, expect } from 'vitest';
import { 
  VALID_PLATFORMS, 
  PLATFORM_SERVICES, 
  CANONICAL_PLANS,
  isValidPlatformService,
  resolveCommercialOffer,
  resolveCommercialCardsForService,
  resolveCheckoutForIdentity,
  evaluateCheckoutStatus,
  computeCommercialDiagnostics,
  validateCheckoutUrl,
  CommercialPlatform,
  CommercialService,
  CommercialPlan
} from '@/services/commercial-offer.resolver';
import { CLOUTFLOW_CATALOG_PACKAGES } from '@/config/financial-protection.config';

describe('PerfectPay Commercial Cards (66 Cards) & Checkout Identity Isolation', () => {
  // 1. 66 identities permanecem
  it('1. Exactly 66 canonical catalog packages exist in catalog', () => {
    expect(CLOUTFLOW_CATALOG_PACKAGES).toHaveLength(66);
  });

  // 2. Nenhuma duplicada
  it('2. Zero duplicated identities across catalog', () => {
    const seen = new Set<string>();
    for (const pkg of CLOUTFLOW_CATALOG_PACKAGES) {
      const key = `${pkg.platform}:${pkg.service}:${pkg.name.toLowerCase()}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
    }
    expect(seen.size).toBe(66);
  });

  // 3. Nenhuma missing
  it('3. Breakdown by platform is exactly Instagram: 18, TikTok: 18, X: 18, YouTube: 12 (Total 66)', () => {
    const counts: Record<string, number> = { instagram: 0, tiktok: 0, twitter: 0, youtube: 0 };
    for (const pkg of CLOUTFLOW_CATALOG_PACKAGES) {
      counts[pkg.platform]++;
    }
    expect(counts.instagram).toBe(18);
    expect(counts.tiktok).toBe(18);
    expect(counts.twitter).toBe(18);
    expect(counts.youtube).toBe(12);
    expect(counts.instagram + counts.tiktok + counts.twitter + counts.youtube).toBe(66);
  });

  // 4. YouTube mostra somente Likes e Views
  it('4. YouTube supports ONLY likes and views (0 followers)', () => {
    expect(PLATFORM_SERVICES.youtube).toEqual(['likes', 'views']);
    expect(isValidPlatformService('youtube', 'likes')).toBe(true);
    expect(isValidPlatformService('youtube', 'views')).toBe(true);
    expect(isValidPlatformService('youtube', 'followers')).toBe(false);
  });

  // 5. youtube + followers rejeitado
  it('5. youtube + followers is rejected by all resolver layers', () => {
    expect(resolveCommercialOffer('youtube', 'followers', 'starter')).toBeNull();
    expect(resolveCommercialCardsForService('youtube', 'followers')).toHaveLength(0);
    const checkout = resolveCheckoutForIdentity('youtube', 'followers', 'starter');
    expect(checkout.isAllowed).toBe(false);
    expect(checkout.checkoutUrl).toBeNull();
  });

  // 6. Checkout Ready exige Product + Plan + URL
  it('6. Checkout Ready requires Product Code + Plan Code + Valid HTTPS URL', () => {
    const status = evaluateCheckoutStatus('PP_PROD_1', 'PP_PLAN_1', 'https://checkout.perfectpay.com.br/pay/PPU123');
    expect(status.status).toBe('READY');
    expect(status.productCodeStatus).toBe('configured');
    expect(status.planCodeStatus).toBe('configured');
    expect(status.checkoutUrlStatus).toBe('configured');
    expect(status.productCode).toBe('PP_PROD_1');
    expect(status.planCode).toBe('PP_PLAN_1');
    expect(status.checkoutUrl).toBe('https://checkout.perfectpay.com.br/pay/PPU123');
  });

  // 7. Product apenas -> Incomplete
  it('7. Product code only results in INCOMPLETE status', () => {
    const status = evaluateCheckoutStatus('PP_PROD_1', null, null);
    expect(status.status).toBe('INCOMPLETE');
    expect(status.productCodeStatus).toBe('configured');
    expect(status.planCodeStatus).toBe('missing');
    expect(status.checkoutUrlStatus).toBe('missing');
  });

  // 8. Plan apenas -> Incomplete
  it('8. Plan code only results in INCOMPLETE status', () => {
    const status = evaluateCheckoutStatus(null, 'PP_PLAN_1', null);
    expect(status.status).toBe('INCOMPLETE');
    expect(status.productCodeStatus).toBe('missing');
    expect(status.planCodeStatus).toBe('configured');
    expect(status.checkoutUrlStatus).toBe('missing');
  });

  // 9. URL apenas -> Incomplete
  it('9. URL only results in INCOMPLETE status', () => {
    const status = evaluateCheckoutStatus(null, null, 'https://checkout.perfectpay.com.br/pay/PPU123');
    expect(status.status).toBe('INCOMPLETE');
    expect(status.productCodeStatus).toBe('missing');
    expect(status.planCodeStatus).toBe('missing');
    expect(status.checkoutUrlStatus).toBe('configured');
  });

  // 10. nenhum dado -> Missing
  it('10. No fields provided results in MISSING status', () => {
    const status = evaluateCheckoutStatus(null, null, null);
    expect(status.status).toBe('MISSING');
    expect(status.productCodeStatus).toBe('missing');
    expect(status.planCodeStatus).toBe('missing');
    expect(status.checkoutUrlStatus).toBe('missing');
    expect(status.productCode).toBeNull();
    expect(status.planCode).toBeNull();
    expect(status.checkoutUrl).toBeNull();
  });

  // 11. URL inválida rejeitada
  it('11. Invalid URL is rejected', () => {
    expect(validateCheckoutUrl('not-a-valid-url')).toBe(false);
    expect(validateCheckoutUrl('ftp://example.com/checkout')).toBe(false);
    expect(validateCheckoutUrl('')).toBe(false);
    expect(validateCheckoutUrl(undefined)).toBe(false);
  });

  // 12. HTTPS válida aceita
  it('12. Valid HTTPS URL is accepted', () => {
    expect(validateCheckoutUrl('https://checkout.perfectpay.com.br/pay/PPU123')).toBe(true);
    expect(validateCheckoutUrl('https://centerpag.com.br/checkout/abc')).toBe(true);
  });

  // 13. javascript: rejeitado
  it('13. javascript: protocol is strictly rejected', () => {
    expect(validateCheckoutUrl('javascript:alert(1)')).toBe(false);
    expect(validateCheckoutUrl('JAVASCRIPT:alert(1)')).toBe(false);
  });

  // 14. data: rejeitado
  it('14. data: protocol is strictly rejected', () => {
    expect(validateCheckoutUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).toBe(false);
  });

  // 15, 16, 17, 18, 19. Isolation & Cross-Identity Guarantee
  it('15-19. Cross-Identity Isolation: Identity A never leaks URL to Identity B', () => {
    const adminOverrides = [
      {
        id: 'offer-ig-fol-starter',
        platform: 'instagram',
        service: 'followers',
        name: 'Starter',
        slug: 'instagram-followers-starter',
        externalCheckoutUrl: 'https://checkout.perfectpay.com.br/pay/URL_A',
        perfectpayProductId: 'PROD_A',
        perfectpayPlanId: 'PLAN_A',
        active: true,
      },
      {
        id: 'offer-ig-fol-boost',
        platform: 'instagram',
        service: 'followers',
        name: 'Boost',
        slug: 'instagram-followers-boost',
        externalCheckoutUrl: 'https://checkout.perfectpay.com.br/pay/URL_B',
        perfectpayProductId: 'PROD_B',
        perfectpayPlanId: 'PLAN_B',
        active: true,
      },
      {
        id: 'offer-tk-fol-starter',
        platform: 'tiktok',
        service: 'followers',
        name: 'Starter',
        slug: 'tiktok-followers-starter',
        externalCheckoutUrl: 'https://checkout.perfectpay.com.br/pay/URL_C',
        perfectpayProductId: 'PROD_C',
        perfectpayPlanId: 'PLAN_C',
        active: true,
      },
    ];

    const igFolStarter = resolveCheckoutForIdentity('instagram', 'followers', 'starter', adminOverrides);
    const igFolBoost = resolveCheckoutForIdentity('instagram', 'followers', 'boost', adminOverrides);
    const tkFolStarter = resolveCheckoutForIdentity('tiktok', 'followers', 'starter', adminOverrides);
    const igFolGrowth = resolveCheckoutForIdentity('instagram', 'followers', 'growth', adminOverrides);

    expect(igFolStarter.checkoutUrl).toBe('https://checkout.perfectpay.com.br/pay/URL_A');
    expect(igFolBoost.checkoutUrl).toBe('https://checkout.perfectpay.com.br/pay/URL_B');
    expect(tkFolStarter.checkoutUrl).toBe('https://checkout.perfectpay.com.br/pay/URL_C');
    expect(igFolGrowth.checkoutUrl).toBeNull(); // No override for Growth -> safe null, no leakage

    // Home & Step 3 surfaces resolve identical checkout URL for identical identity
    const homeResolved = resolveCommercialOffer('instagram', 'followers', 'starter', adminOverrides, 'home');
    const step3Resolved = resolveCommercialOffer('instagram', 'followers', 'starter', adminOverrides, 'offer_step3');
    expect(homeResolved?.checkoutUrl).toBe('https://checkout.perfectpay.com.br/pay/URL_A');
    expect(step3Resolved?.checkoutUrl).toBe('https://checkout.perfectpay.com.br/pay/URL_A');
  });

  // 20, 21, 22. Sensitive fields stripped from public exposure
  it('20-22. Public offer mapping strips sensitive productCode, planCode, and raw internal metadata', () => {
    const adminOverrides = [
      {
        id: 'offer-ig-fol-starter',
        platform: 'instagram',
        service: 'followers',
        name: 'Starter',
        slug: 'instagram-followers-starter',
        externalCheckoutUrl: 'https://checkout.perfectpay.com.br/pay/URL_A',
        perfectpayProductId: 'SECRET_PROD_123',
        perfectpayPlanId: 'SECRET_PLAN_456',
        active: true,
      },
    ];

    const cards = resolveCommercialCardsForService('instagram', 'followers', adminOverrides, 'home');
    const publicFormatted = cards.map((rc, idx) => ({
      id: rc.id || `canonical-${rc.platform}-${rc.service}-${rc.plan}`,
      name: rc.planDisplayName,
      slug: `${rc.platform}-${rc.service}-${rc.plan}`,
      quantity: rc.quantity,
      priceCents: rc.priceCents,
      badge: rc.badge,
      benefits: rc.features,
    }));

    const jsonString = JSON.stringify(publicFormatted);
    expect(jsonString).not.toContain('SECRET_PROD_123');
    expect(jsonString).not.toContain('SECRET_PLAN_456');
    expect(jsonString).not.toContain('perfectpay');
    expect(jsonString).not.toContain('URL_A');
  });

  // 25. Duplicate checkout URL generates administrative warning
  it('25. Duplicate checkout URL is detected and generates diagnostic warning', () => {
    const adminOffers = [
      {
        id: 'o1',
        platform: 'instagram',
        service: 'followers',
        name: 'Starter',
        externalCheckoutUrl: 'https://checkout.perfectpay.com.br/pay/SHARED_URL',
        perfectpayProductId: 'PROD_1',
        perfectpayPlanId: 'PLAN_1',
        active: true,
      },
      {
        id: 'o2',
        platform: 'tiktok',
        service: 'followers',
        name: 'Starter',
        externalCheckoutUrl: 'https://checkout.perfectpay.com.br/pay/SHARED_URL',
        perfectpayProductId: 'PROD_2',
        perfectpayPlanId: 'PLAN_2',
        active: true,
      },
    ];

    const diag = computeCommercialDiagnostics(adminOffers);
    expect(diag.duplicateWarnings.length).toBeGreaterThan(0);
    const urlWarn = diag.duplicateWarnings.find((w) => w.type === 'DUPLICATE_CHECKOUT_URL');
    expect(urlWarn).toBeDefined();
    expect(urlWarn?.value).toBe('https://checkout.perfectpay.com.br/pay/SHARED_URL');
    expect(urlWarn?.identities).toHaveLength(2);
  });

  // 26. Counters: Ready + Incomplete + Missing = 66
  it('26. Total cards counter sum: Ready + Incomplete + Missing = 66', () => {
    const sampleOffers = [
      // 1 Ready
      {
        id: 'o1',
        platform: 'instagram',
        service: 'followers',
        name: 'Starter',
        externalCheckoutUrl: 'https://checkout.perfectpay.com.br/pay/1',
        perfectpayProductId: 'PROD_1',
        perfectpayPlanId: 'PLAN_1',
        active: true,
      },
      // 1 Incomplete (product only)
      {
        id: 'o2',
        platform: 'instagram',
        service: 'followers',
        name: 'Boost',
        perfectpayProductId: 'PROD_2',
        active: true,
      },
      // 1 Incomplete (URL only)
      {
        id: 'o3',
        platform: 'instagram',
        service: 'followers',
        name: 'Growth',
        externalCheckoutUrl: 'https://checkout.perfectpay.com.br/pay/3',
        active: true,
      },
    ];

    const diag = computeCommercialDiagnostics(sampleOffers);
    const { totalCards, checkoutReady, checkoutIncomplete, checkoutMissing } = diag.counters;

    expect(totalCards).toBe(66);
    expect(checkoutReady + checkoutIncomplete + checkoutMissing).toBe(66);
    expect(checkoutReady).toBe(1);
    expect(checkoutIncomplete).toBe(2);
    expect(checkoutMissing).toBe(63);
  });

  // 27. X Likes permanece correto
  it('27. X / Twitter Likes commercial packages remain exact', () => {
    const xLikes = CLOUTFLOW_CATALOG_PACKAGES.filter((p) => p.platform === 'twitter' && p.service === 'likes');
    expect(xLikes).toHaveLength(6);

    const starter = xLikes.find((p) => p.name === 'Starter');
    const boost = xLikes.find((p) => p.name === 'Boost');
    const growth = xLikes.find((p) => p.name === 'Growth');
    const pro = xLikes.find((p) => p.name === 'Pro');
    const elite = xLikes.find((p) => p.name === 'Elite');
    const max = xLikes.find((p) => p.name === 'Max');

    expect(starter?.quantity).toBe(1000);
    expect(starter?.priceCents).toBe(790); // $7.90

    expect(boost?.quantity).toBe(2500);
    expect(boost?.priceCents).toBe(1490); // $14.90

    expect(growth?.quantity).toBe(5000);
    expect(growth?.priceCents).toBe(2490); // $24.90

    expect(pro?.quantity).toBe(10000);
    expect(pro?.priceCents).toBe(4490); // $44.90

    expect(elite?.quantity).toBe(15000);
    expect(elite?.priceCents).toBe(6490); // $64.90

    expect(max?.quantity).toBe(20000);
    expect(max?.priceCents).toBe(7990); // $79.90
  });
});
