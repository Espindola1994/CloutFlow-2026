import { describe, it, expect } from 'vitest';
import { CLOUTFLOW_CATALOG_PACKAGES } from '@/config/financial-protection.config';
import { CANONICAL_SUPPLIER_ROUTING } from '@/app/api/admin/supplier-routing/canonical-fix/route';

/**
 * Supplier catalog mock specifications based on Peakerr real parameters
 */
export const PEAKERR_SUPPLIER_SPECS: Record<string, { min: number; max: number; name: string }> = {
  // Instagram Followers
  '31714': { min: 10, max: 100000, name: 'Instagram Followers Priority' },
  '31849': { min: 10, max: 100000, name: 'Instagram Followers Fallback 1' },
  '31850': { min: 10, max: 100000, name: 'Instagram Followers Fallback 2' },

  // Instagram Likes
  '31783': { min: 10, max: 100000, name: 'Instagram Likes Priority' },
  '31784': { min: 10, max: 100000, name: 'Instagram Likes Fallback 1' },
  '31785': { min: 10, max: 100000, name: 'Instagram Likes Fallback 2' },

  // Instagram Views
  '26641': { min: 100, max: 10000000, name: 'Instagram Views Priority' },
  '16453': { min: 100, max: 10000000, name: 'Instagram Views Fallback 1' },
  '14863': { min: 100, max: 10000000, name: 'Instagram Views Fallback 2' },

  // TikTok Followers
  '30159': { min: 10, max: 500000, name: 'TikTok Followers Priority' },
  '32771': { min: 10, max: 500000, name: 'TikTok Followers Fallback 1' },
  '33105': { min: 10, max: 500000, name: 'TikTok Followers Fallback 2' },

  // TikTok Likes
  '31040': { min: 10, max: 100000, name: 'TikTok Likes Priority' },
  '30163': { min: 10, max: 100000, name: 'TikTok Likes Fallback 1' },
  '31264': { min: 10, max: 100000, name: 'TikTok Likes Fallback 2' },

  // TikTok Views
  '32011': { min: 100, max: 10000000, name: 'TikTok Views Priority' },
  '29890': { min: 100, max: 10000000, name: 'TikTok Views Fallback 1' },
  '31761': { min: 100, max: 10000000, name: 'TikTok Views Fallback 2' },

  // X (Twitter) Followers
  '33882': { min: 10, max: 200000, name: 'X Followers Priority' },
  '33608': { min: 10, max: 200000, name: 'X Followers Fallback 1' },
  '33883': { min: 10, max: 200000, name: 'X Followers Fallback 2' },

  // X (Twitter) Likes
  '33478': { min: 10, max: 5000, name: 'X Likes Priority (Max 5K)' },
  '33696': { min: 10, max: 20000, name: 'X Likes Fallback 1 (Max 20K)' },

  // X (Twitter) Views
  '29863': { min: 100, max: 10000000, name: 'X Views Priority' },
  '29859': { min: 100, max: 10000000, name: 'X Views Fallback 1' },
  '9276': { min: 100, max: 10000000, name: 'X Views Fallback 2' },

  // YouTube Likes
  '33471': { min: 10, max: 100000, name: 'YouTube Likes Priority' },
  '33528': { min: 10, max: 100000, name: 'YouTube Likes Fallback 1' },
  '33529': { min: 10, max: 100000, name: 'YouTube Likes Fallback 2' },

  // YouTube Views
  '33451': { min: 100, max: 1000000, name: 'YouTube Views Priority' },
  '30202': { min: 100, max: 1000000, name: 'YouTube Views Fallback 1' },
  '30751': { min: 100, max: 1000000, name: 'YouTube Views Fallback 2' },
};

describe('Catalog Quantity Compatibility & Regression Prevention', () => {
  it('A) Exactly 66 commercial cards exist in canonical catalog', () => {
    expect(CLOUTFLOW_CATALOG_PACKAGES.length).toBe(66);
  });

  it('B) Instagram Followers Max is exactly 100k and fits priority supplier 31714 (max 100k)', () => {
    const igMax = CLOUTFLOW_CATALOG_PACKAGES.find(
      (c) => c.platform === 'instagram' && c.service === 'followers' && c.name === 'Max'
    );
    expect(igMax).toBeDefined();
    expect(igMax?.quantity).toBe(100000);
    expect(igMax?.priceCents).toBe(19990);

    const routing = CANONICAL_SUPPLIER_ROUTING['instagram:followers'];
    expect(routing.primary).toBe('31714');
    expect(routing.fallback1).toBe('31849');
    expect(routing.fallback2).toBe('31850');

    const prioritySpec = PEAKERR_SUPPLIER_SPECS[routing.primary];
    expect(igMax!.quantity).toBeLessThanOrEqual(prioritySpec.max);
    expect(igMax!.quantity).toBeGreaterThanOrEqual(prioritySpec.min);
  });

  it('C) X Likes packages have expected quantity routing and compatibility', () => {
    const routing = CANONICAL_SUPPLIER_ROUTING['twitter:likes'];
    expect(routing.primary).toBe('33478');
    expect(routing.fallback1).toBe('33696');
    expect(routing.fallback2).toBeNull();

    const prioritySpec = PEAKERR_SUPPLIER_SPECS[routing.primary]; // max 5k
    const fb1Spec = PEAKERR_SUPPLIER_SPECS[routing.fallback1]; // max 20k

    const xLikesCards = CLOUTFLOW_CATALOG_PACKAGES.filter(
      (c) => c.platform === 'twitter' && c.service === 'likes'
    );
    expect(xLikesCards.length).toBe(6);

    // Starter 1k: Priority 33478 (fits <= 5k)
    const starter = xLikesCards.find((c) => c.name === 'Starter')!;
    expect(starter.quantity).toBe(1000);
    expect(starter.quantity <= prioritySpec.max).toBe(true);

    // Boost 2.5k: Priority 33478 (fits <= 5k)
    const boost = xLikesCards.find((c) => c.name === 'Boost')!;
    expect(boost.quantity).toBe(2500);
    expect(boost.quantity <= prioritySpec.max).toBe(true);

    // Growth 5k: Priority 33478 (fits <= 5k)
    const growth = xLikesCards.find((c) => c.name === 'Growth')!;
    expect(growth.quantity).toBe(5000);
    expect(growth.quantity <= prioritySpec.max).toBe(true);

    // Pro 10k: Priority incompatible (> 5k), Fallback 1 compatible (<= 20k)
    const pro = xLikesCards.find((c) => c.name === 'Pro')!;
    expect(pro.quantity).toBe(10000);
    expect(pro.quantity > prioritySpec.max).toBe(true);
    expect(pro.quantity <= fb1Spec.max).toBe(true);

    // Elite 15k: Priority incompatible (> 5k), Fallback 1 compatible (<= 20k)
    const elite = xLikesCards.find((c) => c.name === 'Elite')!;
    expect(elite.quantity).toBe(15000);
    expect(elite.priceCents).toBe(6490);
    expect(elite.quantity > prioritySpec.max).toBe(true);
    expect(elite.quantity <= fb1Spec.max).toBe(true);

    // Max 20k: Priority incompatible (> 5k), Fallback 1 compatible (<= 20k)
    const max = xLikesCards.find((c) => c.name === 'Max')!;
    expect(max.quantity).toBe(20000);
    expect(max.priceCents).toBe(7990);
    expect(max.quantity > prioritySpec.max).toBe(true);
    expect(max.quantity <= fb1Spec.max).toBe(true);
  });

  it('D) PREVENTIVE VALIDATION: All 66 catalog cards have at least one individual compatible route without split orders', () => {
    let fullyCompatibleCount = 0;
    const incompatibleCards: any[] = [];

    for (const card of CLOUTFLOW_CATALOG_PACKAGES) {
      const routingKey = `${card.platform}:${card.service}`;
      const routing = CANONICAL_SUPPLIER_ROUTING[routingKey];
      expect(routing).toBeDefined();

      const candidateIds = [routing.primary, routing.fallback1, routing.fallback2].filter(
        (id): id is string => Boolean(id && id.trim().length > 0)
      );

      const compatibleCandidates = candidateIds.filter((id) => {
        const spec = PEAKERR_SUPPLIER_SPECS[id];
        if (!spec) return false;
        return card.quantity >= spec.min && card.quantity <= spec.max;
      });

      if (compatibleCandidates.length > 0) {
        fullyCompatibleCount++;
      } else {
        incompatibleCards.push({
          card: `${card.platform} > ${card.service} > ${card.name} (${card.quantity})`,
          candidateIds,
        });
      }
    }

    expect(incompatibleCards).toEqual([]);
    expect(fullyCompatibleCount).toBe(66);
  });
});
