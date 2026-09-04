import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as createCheckoutContext } from '@/app/api/checkout/context/route';
import { OFFICIAL_PERFECTPAY_66_DATASET } from '@/config/official-perfectpay-dataset';
import { canDispatchOrder } from '@/lib/fulfillment/guard';
import { evaluateSupplierOption } from '@/lib/routing/financial-routing';

const mockContextsStore: any[] = [];
let shouldFailDbInsert = false;

vi.mock('@/db', () => ({
  db: {
    insert: vi.fn((table: any) => ({
      values: vi.fn((val: any) => {
        if (shouldFailDbInsert) {
          return Promise.reject(new Error('DATABASE_CONNECTION_REFUSED'));
        }
        // Only collect checkoutContexts insertions
        if (val && val.contextId) {
          mockContextsStore.push(val);
        }
        return {
          returning: vi.fn().mockResolvedValue([{ id: 'gen_lead_123' }]),
          onConflictDoUpdate: vi.fn().mockResolvedValue([]),
        };
      }),
    })),
    transaction: vi.fn().mockImplementation(async (cb: any) => cb({
      insert: vi.fn(() => ({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 'tx_123' }]),
        }),
      })),
      query: {
        customers: { findMany: vi.fn().mockResolvedValue([]) },
      },
    })),
    query: {
      offers: {
        findMany: vi.fn().mockImplementation(async (opts?: any) => {
          // Exactly 1 physical offer in DB: Instagram Followers Starter
          // Return it ONLY if query is for instagram + followers (or no where clause)
          const all = [
            {
              id: '2e9b6558-eb6d-4767-b6fc-77c245778653',
              platform: 'instagram',
              service: 'followers',
              name: 'Starter',
              slug: 'instagram-followers-starter',
              quantity: 100,
              bonusQuantity: 10,
              priceCents: 490,
              perfectpayProductId: 'PPPBF6TP',
              perfectpayPlanId: 'PPLQQQ3F7',
              externalCheckoutUrl: 'https://go.centerpag.com/PPU38CQEOIF',
              active: true,
            },
          ];
          return all;
        }),
      },
      customers: {
        findMany: vi.fn().mockResolvedValue([]),
      },
      customerOffers: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    },
  },
}));

describe('ETAPA 8C - Controlled Verification Suite', () => {
  beforeEach(() => {
    mockContextsStore.length = 0;
    shouldFailDbInsert = false;
  });

  it('1. 66/66 Canonical Offers: context created, canonical_offer_id populated, offer_id UUID or NULL appropriately', async () => {
    expect(OFFICIAL_PERFECTPAY_66_DATASET).toHaveLength(66);

    for (const item of OFFICIAL_PERFECTPAY_66_DATASET) {
      const canonicalOfferId = `canonical-${item.platform}-${item.service}-${item.plan}`;
      const isInstagramFollowersStarter = item.platform === 'instagram' && item.service === 'followers' && item.plan === 'starter';

      let targetPayload: Record<string, any> = {
        offerId: canonicalOfferId,
        email: 'test@cloutflow.co',
      };

      if (item.service === 'followers') {
        const username = 'testuser';
        targetPayload = {
          ...targetPayload,
          targetType: item.platform === 'youtube' ? 'channel' : 'profile',
          targetValue: username,
          socialUsername: username,
          profileUrl: `https://${item.platform === 'twitter' ? 'x.com' : item.platform + '.com'}/${username}`,
        };
      } else {
        const contentUrl = item.platform === 'youtube'
          ? 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
          : item.platform === 'twitter'
          ? 'https://x.com/user/status/123456789'
          : item.platform === 'tiktok'
          ? 'https://www.tiktok.com/@user/video/123456789'
          : 'https://www.instagram.com/p/C-xyz123/';

        targetPayload = {
          ...targetPayload,
          targetType: item.platform === 'youtube' || item.platform === 'tiktok' ? 'video' : 'post',
          targetValue: contentUrl,
          targetUrl: contentUrl,
        };
      }

      const req = new Request('http://localhost:3000/api/checkout/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetPayload),
      });

      const res = await createCheckoutContext(req);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.checkoutUrl).toBeDefined();

      const lastPersisted = mockContextsStore[mockContextsStore.length - 1];
      expect(lastPersisted).toBeDefined();
      expect(lastPersisted.canonicalOfferId).toBe(canonicalOfferId);

      if (isInstagramFollowersStarter) {
        expect(lastPersisted.offerId).toBe('2e9b6558-eb6d-4767-b6fc-77c245778653');
      } else {
        expect(lastPersisted.offerId).toBeNull();
      }

      expect(lastPersisted.perfectpayProductId).toBe(item.productCode);
      expect(lastPersisted.perfectpayPlanId).toBe(item.planCode);
      expect(lastPersisted.customerEmail).toBe('test@cloutflow.co');
      expect(lastPersisted.expiresAt).toBeInstanceOf(Date);
    }

    expect(mockContextsStore).toHaveLength(66);
    const overridesCount = mockContextsStore.filter((c) => c.offerId !== null).length;
    const nullOverridesCount = mockContextsStore.filter((c) => c.offerId === null).length;
    expect(overridesCount).toBe(1);
    expect(nullOverridesCount).toBe(65);
  });

  it('2. Negative Test: DB INSERT failure yields HTTP 503 and NO checkoutUrl (Silent catch removed)', async () => {
    shouldFailDbInsert = true;

    const req = new Request('http://localhost:3000/api/checkout/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offerId: 'canonical-tiktok-followers-starter',
        targetType: 'profile',
        socialUsername: 'tt_test',
        profileUrl: 'https://www.tiktok.com/@tt_test',
        email: 'fail@test.com',
      }),
    });

    const res = await createCheckoutContext(req);
    expect(res.status).toBe(503);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.data).toBeUndefined();
    expect(data.error?.message).toContain('Database failure');
  });

  it('3. Negative Test: Invalid or unsupported platform/service rejected with 400', async () => {
    const req = new Request('http://localhost:3000/api/checkout/context', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offerId: 'canonical-youtube-followers-starter', // YouTube Followers is invalid in matrix
        targetType: 'channel',
        socialUsername: 'yt_test',
        email: 'invalid@test.com',
      }),
    });

    const res = await createCheckoutContext(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('4. Fulfillment Guard: canDispatchOrder permits canonical-only order without physical override if valid', () => {
    const canonicalOnlyOrder = {
      id: 'ord_canonical_only_1',
      paymentStatus: 'PAID',
      fulfillmentStatus: 'NOT_DISPATCHED',
      canonicalOfferId: 'canonical-tiktok-followers-starter',
      offerId: null, // No physical override!
      platform: 'tiktok',
      service: 'followers',
      quantity: 100,
      socialUsername: 'tiktok_user_valid',
    };

    // Should be eligible because canonicalOfferId is present and other conditions are met
    expect(canDispatchOrder(canonicalOnlyOrder, null)).toBe(true);

    // Negative guard tests:
    // Missing target
    expect(canDispatchOrder({ ...canonicalOnlyOrder, socialUsername: '' }, null)).toBe(false);
    // Unpaid
    expect(canDispatchOrder({ ...canonicalOnlyOrder, paymentStatus: 'PENDING' }, null)).toBe(false);
    // Wrong fulfillment status
    expect(canDispatchOrder({ ...canonicalOnlyOrder, fulfillmentStatus: 'SUBMITTING' }, null)).toBe(false);
    // Invalid quantity
    expect(canDispatchOrder({ ...canonicalOnlyOrder, quantity: 0 }, null)).toBe(false);
    // Neither canonicalOfferId nor offerId
    expect(canDispatchOrder({ ...canonicalOnlyOrder, canonicalOfferId: null, offerId: null }, null)).toBe(false);
  });

  it('5. Cost Ceiling and Financial Protection Guard dry-run preserved', () => {
    // Evaluating a supplier option against financial rules
    const resultSafe = evaluateSupplierOption({
      orderId: 'ord_safe_1',
      platform: 'instagram',
      serviceType: 'followers',
      quantity: 100,
      sellingPrice: 4.90,
      costCeilingEnabled: true,
      manualReviewEnabled: false,
      minimumGrossMarginPercent: 20,
      minimumGrossProfit: 0.50,
      maxSupplierCostAbsolute: 3.50,
      supplierServiceId: '101',
      supplierPosition: 'priority',
      supplierRate: 2.00, // Cost = (100 / 1000) * 2.00 = $0.20 -> Gross profit = 4.70 -> Safe
    });
    expect(resultSafe.allowed).toBe(true);
    expect(resultSafe.decision).toBe('ACCEPTED');

    const resultExceededCeiling = evaluateSupplierOption({
      orderId: 'ord_unsafe_1',
      platform: 'tiktok',
      serviceType: 'likes',
      quantity: 1000,
      sellingPrice: 5.00,
      costCeilingEnabled: true,
      manualReviewEnabled: false,
      minimumGrossMarginPercent: 50,
      minimumGrossProfit: 2.50,
      maxSupplierCostAbsolute: 2.00,
      supplierServiceId: '102',
      supplierPosition: 'priority',
      supplierRate: 3.50, // Cost = $3.50 -> exceeds max allowed cost $2.00
    });
    expect(resultExceededCeiling.allowed).toBe(false);
    expect(resultExceededCeiling.decision).toBe('HOLD_COST');
  });
});
