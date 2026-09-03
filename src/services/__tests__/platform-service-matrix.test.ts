import { describe, it, expect, vi } from 'vitest';
import { 
  PLATFORM_SERVICES, 
  VALID_PLATFORMS, 
  CANONICAL_PLANS,
  isValidPlatformService, 
  resolveCommercialOffer,
  resolveCommercialCardsForService,
  CommercialPlatform,
  CommercialService,
  CommercialPlan
} from '@/services/commercial-offer.resolver';
import { CLOUTFLOW_CATALOG_PACKAGES } from '@/config/financial-protection.config';

describe('Matriz de Serviços por Plataforma e Bloqueio de YouTube Followers', () => {
  // 1. YouTube mostra apenas Likes e Views no Growth/Offer / Shared Matrix
  it('1. YouTube possui apenas Likes e Views na matriz comercial oficial', () => {
    expect(PLATFORM_SERVICES.youtube).toEqual(['likes', 'views']);
    expect(PLATFORM_SERVICES.youtube).not.toContain('followers');
    expect(isValidPlatformService('youtube', 'likes')).toBe(true);
    expect(isValidPlatformService('youtube', 'views')).toBe(true);
    expect(isValidPlatformService('youtube', 'followers')).toBe(false);
  });

  // 2. YouTube Followers não aparece no select / é bloqueado pelo helper
  it('2. YouTube Followers é explicitamente inválido', () => {
    expect(isValidPlatformService('youtube', 'followers')).toBe(false);
    const resolved = resolveCommercialCardsForService('youtube', 'followers', []);
    expect(resolved).toEqual([]);
    const singleResolved = resolveCommercialOffer('youtube', 'followers', 'starter', []);
    expect(singleResolved).toBeNull();
  });

  // 3. Trocar Instagram Followers -> YouTube limpa/normaliza Followers para serviço válido
  it('3. Trocar Instagram Followers -> YouTube normaliza para serviço válido (Likes ou Views)', () => {
    const prevPlatform: CommercialPlatform = 'instagram';
    const prevService: CommercialService = 'followers';
    expect(PLATFORM_SERVICES[prevPlatform]).toContain(prevService);

    const nextPlatform: CommercialPlatform = 'youtube';
    const validServices = PLATFORM_SERVICES[nextPlatform];
    const safeService = validServices.includes(prevService) ? prevService : validServices[0];

    expect(safeService).toBe('likes');
    expect(validServices).not.toContain('followers');
  });

  // 4. API / Resolver rejeita youtube + followers
  it('4. API / Resolver rejeita youtube + followers', () => {
    expect(isValidPlatformService('youtube', 'followers')).toBe(false);
    expect(resolveCommercialOffer('youtube', 'followers', 'pro')).toBeNull();
    expect(resolveCommercialCardsForService('youtube', 'followers')).toHaveLength(0);
  });

  // 5. Home não mostra Followers para YouTube (cards resolvidos para Home são 0 para YT followers)
  it('5. Home não resolve nem renderiza Followers para YouTube', () => {
    const homeCards = resolveCommercialCardsForService('youtube', 'followers', [], 'home');
    expect(homeCards).toHaveLength(0);

    const homeLikes = resolveCommercialCardsForService('youtube', 'likes', [], 'home');
    expect(homeLikes).toHaveLength(6);

    const homeViews = resolveCommercialCardsForService('youtube', 'views', [], 'home');
    expect(homeViews).toHaveLength(6);
  });

  // 6. Step 3 não mostra Followers para YouTube
  it('6. Step 3 não resolve nem renderiza Followers para YouTube', () => {
    const step3Cards = resolveCommercialCardsForService('youtube', 'followers', [], 'offer_step3');
    expect(step3Cards).toHaveLength(0);

    const step3Likes = resolveCommercialCardsForService('youtube', 'likes', [], 'offer_step3');
    expect(step3Likes).toHaveLength(6);

    const step3Views = resolveCommercialCardsForService('youtube', 'views', [], 'offer_step3');
    expect(step3Views).toHaveLength(6);
  });

  // 7. Instagram continua com Followers, Likes, Views
  it('7. Instagram continua com Followers, Likes, Views', () => {
    expect(PLATFORM_SERVICES.instagram).toEqual(['followers', 'likes', 'views']);
    expect(isValidPlatformService('instagram', 'followers')).toBe(true);
    expect(isValidPlatformService('instagram', 'likes')).toBe(true);
    expect(isValidPlatformService('instagram', 'views')).toBe(true);
  });

  // 8. TikTok continua com Followers, Likes, Views
  it('8. TikTok continua com Followers, Likes, Views', () => {
    expect(PLATFORM_SERVICES.tiktok).toEqual(['followers', 'likes', 'views']);
    expect(isValidPlatformService('tiktok', 'followers')).toBe(true);
    expect(isValidPlatformService('tiktok', 'likes')).toBe(true);
    expect(isValidPlatformService('tiktok', 'views')).toBe(true);
  });

  // 9. X continua com Followers, Likes, Views
  it('9. X (Twitter) continua com Followers, Likes, Views', () => {
    expect(PLATFORM_SERVICES.twitter).toEqual(['followers', 'likes', 'views']);
    expect(isValidPlatformService('twitter', 'followers')).toBe(true);
    expect(isValidPlatformService('twitter', 'likes')).toBe(true);
    expect(isValidPlatformService('twitter', 'views')).toBe(true);
  });

  // 10. Editar quantity de um card altera SOMENTE aquela identity
  it('10. Editar quantity de um card altera somente aquela identity', () => {
    const adminOffers = [
      {
        id: 'override-ig-followers-pro',
        platform: 'instagram',
        service: 'followers',
        name: 'Pro',
        quantity: 99999,
        priceCents: 6990,
        active: true,
        syncHome: true,
        syncOfferStep3: true,
      },
    ];

    const igFollowersPro = resolveCommercialOffer('instagram', 'followers', 'pro', adminOffers, 'home');
    expect(igFollowersPro?.quantity).toBe(99999);

    const igLikesPro = resolveCommercialOffer('instagram', 'likes', 'pro', adminOffers, 'home');
    expect(igLikesPro?.quantity).not.toBe(99999);
    expect(igLikesPro?.quantity).toBe(20000); // canonical package quantity

    const ttFollowersPro = resolveCommercialOffer('tiktok', 'followers', 'pro', adminOffers, 'home');
    expect(ttFollowersPro?.quantity).not.toBe(99999);
    expect(ttFollowersPro?.quantity).toBe(25000); // canonical package quantity
  });

  // 11. Editar price de um card altera SOMENTE aquela identity
  it('11. Editar price de um card altera somente aquela identity', () => {
    const adminOffers = [
      {
        id: 'override-yt-likes-starter',
        platform: 'youtube',
        service: 'likes',
        name: 'Starter',
        quantity: 1000,
        priceCents: 1990, // Custom price
        active: true,
        syncHome: true,
        syncOfferStep3: true,
      },
    ];

    const ytLikesStarter = resolveCommercialOffer('youtube', 'likes', 'starter', adminOffers, 'home');
    expect(ytLikesStarter?.priceCents).toBe(1990);

    const ytViewsStarter = resolveCommercialOffer('youtube', 'views', 'starter', adminOffers, 'home');
    expect(ytViewsStarter?.priceCents).toBe(1490); // canonical catalog untouched

    const igLikesStarter = resolveCommercialOffer('instagram', 'likes', 'starter', adminOffers, 'home');
    expect(igLikesStarter?.priceCents).toBe(590); // canonical catalog untouched
  });

  // 12. Home e Step 3 espelham a mesma quantity
  it('12. Home e Step 3 espelham a mesma quantity', () => {
    const adminOffers = [
      {
        id: 'override-x-followers-growth',
        platform: 'twitter',
        service: 'followers',
        name: 'Growth',
        quantity: 15000,
        priceCents: 9990,
        active: true,
        syncHome: true,
        syncOfferStep3: true,
      },
    ];

    const homeCard = resolveCommercialOffer('twitter', 'followers', 'growth', adminOffers, 'home');
    const step3Card = resolveCommercialOffer('twitter', 'followers', 'growth', adminOffers, 'offer_step3');

    expect(homeCard?.quantity).toBe(15000);
    expect(step3Card?.quantity).toBe(15000);
    expect(homeCard?.quantity).toBe(step3Card?.quantity);
  });

  // 13. Home e Step 3 espelham o mesmo price
  it('13. Home e Step 3 espelham o mesmo price', () => {
    const adminOffers = [
      {
        id: 'override-tt-views-boost',
        platform: 'tiktok',
        service: 'views',
        name: 'Boost',
        quantity: 25000,
        priceCents: 1890,
        active: true,
        syncHome: true,
        syncOfferStep3: true,
      },
    ];

    const homeCard = resolveCommercialOffer('tiktok', 'views', 'boost', adminOffers, 'home');
    const step3Card = resolveCommercialOffer('tiktok', 'views', 'boost', adminOffers, 'offer_step3');

    expect(homeCard?.priceCents).toBe(1890);
    expect(step3Card?.priceCents).toBe(1890);
    expect(homeCard?.priceCents).toBe(step3Card?.priceCents);
  });

  // 14. Total continua exatamente 66 cards
  it('14. Total continua exatamente 66 cards no catálogo canônico', () => {
    expect(CLOUTFLOW_CATALOG_PACKAGES.length).toBe(66);

    const igCards = CLOUTFLOW_CATALOG_PACKAGES.filter((p) => p.platform === 'instagram');
    const ttCards = CLOUTFLOW_CATALOG_PACKAGES.filter((p) => p.platform === 'tiktok');
    const xCards = CLOUTFLOW_CATALOG_PACKAGES.filter((p) => p.platform === 'twitter');
    const ytCards = CLOUTFLOW_CATALOG_PACKAGES.filter((p) => p.platform === 'youtube');

    expect(igCards.length).toBe(18); // 3 services * 6 plans
    expect(ttCards.length).toBe(18); // 3 services * 6 plans
    expect(xCards.length).toBe(18);  // 3 services * 6 plans
    expect(ytCards.length).toBe(12);  // 2 services * 6 plans (Likes + Views only)

    expect(igCards.length + ttCards.length + xCards.length + ytCards.length).toBe(66);
  });

  // 15. Nenhum card existente é removido e todos os 6 planos existem para cada combinação válida
  it('15. Todos os 6 planos existem para cada combinação válida platform + service', () => {
    const expectedPlans = ['Starter', 'Boost', 'Growth', 'Pro', 'Elite', 'Max'];

    for (const [platform, services] of Object.entries(PLATFORM_SERVICES)) {
      for (const service of services) {
        const cards = CLOUTFLOW_CATALOG_PACKAGES.filter(
          (p) => p.platform === platform && p.service === service
        );
        expect(cards.length).toBe(6);
        const cardPlanNames = cards.map((c) => c.name);
        for (const expectedPlan of expectedPlans) {
          expect(cardPlanNames).toContain(expectedPlan);
        }
      }
    }
  });

  // 16. Cada identidade platform + service + plan resolve exatamente UM card correspondente
  it('16. Cada identidade platform + service + plan resolve exatamente UM card correspondente', () => {
    let resolvedCount = 0;
    for (const platform of VALID_PLATFORMS) {
      const allowedServices = PLATFORM_SERVICES[platform];
      for (const service of allowedServices) {
        for (const plan of CANONICAL_PLANS) {
          const resolved = resolveCommercialOffer(platform, service, plan.key, [], 'home');
          expect(resolved).not.toBeNull();
          expect(resolved?.platform).toBe(platform);
          expect(resolved?.service).toBe(service);
          expect(resolved?.plan).toBe(plan.key);
          resolvedCount++;
        }
      }
    }
    expect(resolvedCount).toBe(66);
  });
});
