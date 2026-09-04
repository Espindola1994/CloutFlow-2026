import { describe, it, expect } from 'vitest';
import { OFFICIAL_PERFECTPAY_66_DATASET } from '@/config/official-perfectpay-dataset';
import { CLOUTFLOW_CATALOG_PACKAGES } from '@/config/financial-protection.config';
import { 
  VALID_PLATFORMS, 
  PLATFORM_SERVICES, 
  CANONICAL_PLANS,
  getCanonicalPerfectPayItem,
  resolveCommercialOffer,
  normalizePlatform,
  normalizeService,
  normalizePlan
} from '@/services/commercial-offer.resolver';

describe('ETAPA 9B — Integridade dos 66 Cards PerfectPay & Unicidade', () => {
  it('1. Deve conter exatamente 66 itens no dataset oficial', () => {
    expect(OFFICIAL_PERFECTPAY_66_DATASET).toHaveLength(66);
  });

  it('2. Deve conter distribuição exata por plataforma: 18 IG, 18 TT, 18 TW/X, 12 YT', () => {
    const ig = OFFICIAL_PERFECTPAY_66_DATASET.filter((i) => i.platform === 'instagram');
    const tt = OFFICIAL_PERFECTPAY_66_DATASET.filter((i) => i.platform === 'tiktok');
    const tw = OFFICIAL_PERFECTPAY_66_DATASET.filter((i) => i.platform === 'twitter');
    const yt = OFFICIAL_PERFECTPAY_66_DATASET.filter((i) => i.platform === 'youtube');

    expect(ig).toHaveLength(18);
    expect(tt).toHaveLength(18);
    expect(tw).toHaveLength(18);
    expect(yt).toHaveLength(12);
  });

  it('3. YouTube NUNCA deve ter followers', () => {
    const ytFollowers = OFFICIAL_PERFECTPAY_66_DATASET.filter(
      (i) => i.platform === 'youtube' && i.service === 'followers'
    );
    expect(ytFollowers).toHaveLength(0);
  });

  it('4. Deve possuir 66 Plan Codes ÚNICOS (0 duplicatas)', () => {
    const planCodes = OFFICIAL_PERFECTPAY_66_DATASET.map((i) => i.planCode);
    const uniquePlanCodes = new Set(planCodes);
    expect(uniquePlanCodes.size).toBe(66);
  });

  it('5. Deve possuir 66 Checkout URLs ÚNICAS com HTTPS e domínio go.centerpag.com', () => {
    const urls = OFFICIAL_PERFECTPAY_66_DATASET.map((i) => i.checkoutUrl);
    const uniqueUrls = new Set(urls);
    expect(uniqueUrls.size).toBe(66);

    for (const url of urls) {
      expect(url.startsWith('https://go.centerpag.com/PPU')).toBe(true);
    }
  });

  it('6. Product Code deve ser PPPBF6TP em todos os 66 cards por design', () => {
    for (const item of OFFICIAL_PERFECTPAY_66_DATASET) {
      expect(item.productCode).toBe('PPPBF6TP');
    }
  });

  it('7. Paridade 1:1 entre OFFICIAL_PERFECTPAY_66_DATASET e CLOUTFLOW_CATALOG_PACKAGES', () => {
    expect(CLOUTFLOW_CATALOG_PACKAGES).toHaveLength(66);

    for (const pkg of CLOUTFLOW_CATALOG_PACKAGES) {
      const plat = normalizePlatform(pkg.platform)!;
      const serv = normalizeService(pkg.service)!;
      const pl = normalizePlan(pkg.name)!;

      const pp = getCanonicalPerfectPayItem(plat, serv, pl);
      expect(pp).toBeDefined();
      expect(pp?.productCode).toBe('PPPBF6TP');
      expect(pp?.planCode).toBeTruthy();
      expect(pp?.checkoutUrl).toBeTruthy();
    }
  });

  it('8. Validação byte-a-byte dos 4 Starters fundamentais', () => {
    // Instagram Followers Starter
    const igStarter = getCanonicalPerfectPayItem('instagram', 'followers', 'starter');
    expect(igStarter).toEqual({
      platform: 'instagram',
      service: 'followers',
      plan: 'starter',
      productCode: 'PPPBF6TP',
      planCode: 'PPLQQQ3F7',
      checkoutUrl: 'https://go.centerpag.com/PPU38CQEOIF',
    });

    // TikTok Followers Starter
    const ttStarter = getCanonicalPerfectPayItem('tiktok', 'followers', 'starter');
    expect(ttStarter).toEqual({
      platform: 'tiktok',
      service: 'followers',
      plan: 'starter',
      productCode: 'PPPBF6TP',
      planCode: 'PPLQQQD0I',
      checkoutUrl: 'https://go.centerpag.com/PPU38CQFR8B',
    });

    // X Followers Starter
    const xStarter = getCanonicalPerfectPayItem('twitter', 'followers', 'starter');
    expect(xStarter).toEqual({
      platform: 'twitter',
      service: 'followers',
      plan: 'starter',
      productCode: 'PPPBF6TP',
      planCode: 'PPLQQQD1C',
      checkoutUrl: 'https://go.centerpag.com/PPU38CQFR9O',
    });

    // YouTube Views Starter
    const ytStarter = getCanonicalPerfectPayItem('youtube', 'views', 'starter');
    expect(ytStarter).toEqual({
      platform: 'youtube',
      service: 'views',
      plan: 'starter',
      productCode: 'PPPBF6TP',
      planCode: 'PPLQQQD2O',
      checkoutUrl: 'https://go.centerpag.com/PPU38CQFRET',
    });
  });

  it('9. Resolução comercial sem override físico retorna 66 ofertas com checkout configurado', () => {
    let count = 0;
    for (const plat of VALID_PLATFORMS) {
      for (const serv of PLATFORM_SERVICES[plat]) {
        for (const plan of CANONICAL_PLANS) {
          const resolved = resolveCommercialOffer(plat, serv, plan.key, [], 'home');
          expect(resolved).not.toBeNull();
          const canonicalPP = getCanonicalPerfectPayItem(plat, serv, plan.key);
          expect(canonicalPP).not.toBeNull();
          count++;
        }
      }
    }
    expect(count).toBe(66);
  });
});
