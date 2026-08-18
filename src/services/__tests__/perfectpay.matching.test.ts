import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processPerfectPayWebhook } from '@/services/perfectpay.service';

const mockDb = {
  webhookEvents: [] as any[],
  orders: [] as any[],
  orderItems: [] as any[],
  orderEvents: [] as any[],
  paymentLeads: [] as any[],
  offers: [] as any[],
};

vi.mock('@/db', () => ({
  db: {
    transaction: vi.fn().mockImplementation(async (callback) => {
      const tx = {
        query: {
          webhookEvents: {
            findMany: vi.fn().mockResolvedValue([]),
          },
          orders: {
            findMany: vi.fn().mockImplementation(() => {
              return Promise.resolve(mockDb.orders);
            }),
          },
          offers: {
            findMany: vi.fn().mockImplementation(({ where }: any = {}) => {
              return Promise.resolve(mockDb.offers);
            }),
          },
        },
        insert: vi.fn().mockImplementation((table: any) => ({
          values: vi.fn().mockImplementation((values: any) => {
            const item = { id: `id_${Date.now()}_${Math.random()}`, ...values };
            if (values.publicId) {
              mockDb.orders.push(item);
            } else if (values.planName) {
              mockDb.orderItems.push(item);
            } else if (values.description) {
              mockDb.orderEvents.push(item);
            } else if (values.provider && !values.publicId) {
              mockDb.webhookEvents.push(item);
            }
            return {
              returning: vi.fn().mockResolvedValue([item]),
            };
          }),
        })),
        update: vi.fn().mockImplementation(() => ({
          set: vi.fn().mockImplementation((setVals: any) => ({
            where: vi.fn().mockImplementation(() => {
              if (mockDb.orders.length > 0) {
                Object.assign(mockDb.orders[0], setVals);
              }
              if (mockDb.webhookEvents.length > 0 && setVals.processingStatus) {
                Object.assign(mockDb.webhookEvents[0], setVals);
              }
              return Promise.resolve();
            }),
          })),
        })),
      };

      return callback(tx);
    }),
  },
}));

describe('PerfectPay Webhook Service - Phase 2.3B Strict Product + Plan Matching', () => {
  const TEST_TOKEN = 'pp_token_matching_test';

  beforeEach(() => {
    mockDb.webhookEvents = [];
    mockDb.orders = [];
    mockDb.orderItems = [];
    mockDb.orderEvents = [];
    mockDb.paymentLeads = [];
    mockDb.offers = [];
    process.env.PERFECTPAY_WEBHOOK_TOKEN = TEST_TOKEN;
    process.env.PERFECTPAY_WEBHOOK_VERIFIED = 'true';
  });

  it('TESTE A — MATCH EXATO (PPPBF6TP + PPLQQQ3F7) -> Matches Offer and snapshots quantity & name', async () => {
    mockDb.offers = [
      {
        id: 'offer_starter_01',
        platform: 'instagram',
        service: 'followers',
        name: 'Starter - 2,000 Followers',
        quantity: 2000,
        priceCents: 1490,
        perfectpayProductId: 'PPPBF6TP',
        perfectpayPlanId: 'PPLQQQ3F7',
        active: true,
      },
    ];

    const payload = {
      token: TEST_TOKEN,
      code: 'PP-SALE-001',
      sale_status_enum: 2, // Approved
      sale_amount: 14.90,
      currency_paid: 'USD',
      product: { code: 'PPPBF6TP', name: 'CloutFlow' },
      plan: { code: 'PPLQQQ3F7', name: 'Starter - ALE' },
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.action).toBe('ORDER_CREATED');
    expect(mockDb.orders.length).toBe(1);
    expect(mockDb.orders[0].offerId).toBe('offer_starter_01');
    expect(mockDb.orders[0].quantity).toBe(2000);
    expect(mockDb.orders[0].currency).toBe('USD');
    expect(mockDb.orderItems[0].planName).toBe('Starter - 2,000 Followers');
  });

  it('TESTE B — MESMO PRODUCT / PLAN DIFERENTE -> NO MATCH (Does not match Starter)', async () => {
    // Database only has Starter Offer
    mockDb.offers = []; // Simulating query result when planId does not match

    const payload = {
      token: TEST_TOKEN,
      code: 'PP-SALE-002',
      sale_status_enum: 2,
      sale_amount: 39.90,
      currency_enum: 2, // USD
      product: { code: 'PPPBF6TP', name: 'CloutFlow' },
      plan: { code: 'PPLQQQ3GC', name: 'Ultimate - ALE' },
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.action).toBe('ORDER_CREATED');
    expect(mockDb.orders.length).toBe(1);
    expect(mockDb.orders[0].offerId).toBeNull(); // Nullified since no matchedOffer
    expect(mockDb.orders[0].quantity).toBe(0); // quantity fallback to 0
    expect(mockDb.orders[0].platform).toBeNull(); // platform fallback to null
    expect(mockDb.orders[0].service).toBeNull(); // service fallback to null
    expect(mockDb.orders[0].totalCents).toBe(3990); // Preserves exact real financial amount
    expect(mockDb.orders[0].paymentStatus).toBe('PAID');
    expect(mockDb.orders[0].fulfillmentStatus).toBe('NOT_DISPATCHED');
    expect(mockDb.orders[0].currency).toBe('USD');
    expect(mockDb.webhookEvents[0].processingStatus).toBe('UNMATCHED_OFFER');
  });

  it('TESTE F — DUAS OFFERS COM MESMO PRODUCT (PPPBF6TP + PPLQQQ3GC) -> Matches exactly Offer B (Ultimate)', async () => {
    const offerStarter = {
      id: 'offer_starter_01',
      platform: 'instagram',
      service: 'followers',
      name: 'Starter - 2,000 Followers',
      quantity: 2000,
      perfectpayProductId: 'PPPBF6TP',
      perfectpayPlanId: 'PPLQQQ3F7',
      active: true,
    };
    const offerUltimate = {
      id: 'offer_ultimate_02',
      platform: 'instagram',
      service: 'followers',
      name: 'Ultimate - 10,000 Followers',
      quantity: 10000,
      perfectpayProductId: 'PPPBF6TP',
      perfectpayPlanId: 'PPLQQQ3GC',
      active: true,
    };

    // When queried for Ultimate planId, tx returns offerUltimate
    mockDb.offers = [offerUltimate];

    const payload = {
      token: TEST_TOKEN,
      code: 'PP-SALE-003',
      sale_status_enum: 2,
      sale_amount: 59.90,
      currency_paid: 'USD',
      product: { code: 'PPPBF6TP', name: 'CloutFlow' },
      plan: { code: 'PPLQQQ3GC', name: 'Ultimate - ALE' },
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.action).toBe('ORDER_CREATED');
    expect(mockDb.orders.length).toBe(1);
    expect(mockDb.orders[0].offerId).toBe('offer_ultimate_02');
    expect(mockDb.orders[0].quantity).toBe(10000);
    expect(mockDb.orderItems[0].planName).toBe('Ultimate - 10,000 Followers');
  });
});
