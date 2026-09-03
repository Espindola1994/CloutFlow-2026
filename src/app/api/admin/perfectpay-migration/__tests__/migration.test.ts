import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from '../route';
import { OFFICIAL_PERFECTPAY_66_DATASET } from '@/config/official-perfectpay-dataset';
import { CLOUTFLOW_CATALOG_PACKAGES } from '@/config/financial-protection.config';
import { NextRequest } from 'next/server';

vi.mock('@/lib/auth', () => ({
  requireAdmin: vi.fn().mockResolvedValue({ id: 'admin_root', role: 'SUPER_ADMIN' }),
}));

// In-memory mock database for testing migration endpoint
let mockOffersDb: any[] = [];

vi.mock('@/db', () => ({
  db: {
    select: () => ({
      from: () => Promise.resolve(mockOffersDb),
    }),
    transaction: async (cb: any) => {
      const tx = {
        update: () => ({
          set: (updateObj: any) => ({
            where: (condition: any) => ({
              returning: (retObj: any) => {
                // Find matching item in mockOffersDb
                return Promise.resolve([{ id: 'mock_updated' }]);
              },
            }),
          }),
        }),
      };
      return cb(tx);
    },
  },
}));

describe('Admin PerfectPay Migration Endpoint Tests', () => {
  beforeEach(() => {
    // Populate mock DB with 66 canonical packages
    mockOffersDb = CLOUTFLOW_CATALOG_PACKAGES.map((pkg, index) => ({
      id: `offer_${index + 1}`,
      platform: pkg.platform,
      service: pkg.service,
      name: pkg.name,
      slug: `${pkg.platform}-${pkg.service}-${pkg.name.toLowerCase()}`,
      quantity: pkg.quantity,
      bonusQuantity: 0,
      priceCents: pkg.priceCents,
      oldPriceCents: pkg.priceCents * 1.5,
      currency: 'USD',
      badge: null,
      isPopular: false,
      externalCheckoutUrl: null,
      perfectpayProductId: null,
      perfectpayPlanId: null,
      syncHome: true,
      syncOfferStep3: true,
      active: true,
      sortOrder: index,
      priorityServiceId: '31249',
      fallback1ServiceId: '22042',
      fallback2ServiceId: null,
      minimumGrossMarginPercent: 40,
      minimumGrossProfitCents: 500,
      maxSupplierCostAbsoluteCents: null,
      costCeilingEnabled: true,
      manualReviewEnabled: true,
      updatedAt: new Date('2026-09-01T00:00:00.000Z'),
    }));
  });

  it('GET /api/admin/perfectpay-migration should diagnose 66 records, 0 duplicates, 0 missing', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/perfectpay-migration');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.diagnostic.totalDbOffers).toBe(66);
    expect(json.diagnostic.canonicalIdentitiesCount).toBe(66);
    expect(json.diagnostic.platformCounts.instagram).toBe(18);
    expect(json.diagnostic.platformCounts.tiktok).toBe(18);
    expect(json.diagnostic.platformCounts.twitter).toBe(18);
    expect(json.diagnostic.platformCounts.youtube).toBe(12);
    expect(json.diagnostic.youtubeFollowersCount).toBe(0);
    expect(json.diagnostic.duplicateIdentities).toHaveLength(0);
    expect(json.diagnostic.missingIdentities).toHaveLength(0);
    expect(json.snapshot).toHaveLength(66);
  });

  it('POST /api/admin/perfectpay-migration should validate dataset and process 66 records in transaction', async () => {
    const req = new NextRequest('http://localhost:3000/api/admin/perfectpay-migration', {
      method: 'POST',
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.recordsUpdated).toBe(66);
    expect(json.beforeSnapshot).toHaveLength(66);
    expect(json.afterSnapshot).toHaveLength(66);
  });
});
