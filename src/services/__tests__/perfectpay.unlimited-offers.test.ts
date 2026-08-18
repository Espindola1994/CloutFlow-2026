import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processPerfectPayWebhook } from '@/services/perfectpay.service';

const mockDb = {
  webhookEvents: [] as any[],
  orders: [] as any[],
  orderItems: [] as any[],
  orderEvents: [] as any[],
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
            findMany: vi.fn().mockImplementation(({ where }: any = {}) => {
              // Only return existing order if querying for existing externalOrderId
              return Promise.resolve([]);
            }),
          },
          offers: {
            findMany: vi.fn().mockImplementation(() => {
              return Promise.resolve(mockDb.offers);
            }),
          },
        },
        insert: vi.fn().mockImplementation(() => ({
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
              return Promise.resolve();
            }),
          })),
        })),
      };

      return callback(tx);
    }),
  },
}));

describe('Unlimited Digital Offers & Quantity Integrity Tests', () => {
  const TEST_TOKEN = 'test_token_unlimited_offers';

  beforeEach(() => {
    mockDb.webhookEvents = [];
    mockDb.orders = [];
    mockDb.orderItems = [];
    mockDb.orderEvents = [];
    mockDb.offers = [];
    process.env.PERFECTPAY_WEBHOOK_TOKEN = TEST_TOKEN;
    process.env.PERFECTPAY_WEBHOOK_VERIFIED = 'true';
  });

  it('A, B & C) Multiple purchases of the same offer all deliver exact service quantity and NEVER decrement offer quantity', async () => {
    const offer = {
      id: 'offer_starter_2k',
      platform: 'instagram',
      service: 'followers',
      name: 'Starter - 2,000 Followers',
      quantity: 2000,
      priceCents: 1490,
      perfectpayProductId: 'PPPBF6TP',
      perfectpayPlanId: 'PPLQQQ3F7',
      active: true,
    };
    mockDb.offers = [offer];

    // First purchase
    const payload1 = {
      token: TEST_TOKEN,
      code: 'PP-SALE-ORD-01',
      sale_status_enum: 2,
      sale_amount: 14.90,
      product: { code: 'PPPBF6TP' },
      plan: { code: 'PPLQQQ3F7' },
    };
    await processPerfectPayWebhook(payload1);

    expect(mockDb.orders[0].quantity).toBe(2000);
    expect(mockDb.orderItems[0].quantity).toBe(2000);
    expect(offer.quantity).toBe(2000); // Offer remains 2000, not decremented

    // Second purchase
    const payload2 = {
      token: TEST_TOKEN,
      code: 'PP-SALE-ORD-02',
      sale_status_enum: 2,
      sale_amount: 14.90,
      product: { code: 'PPPBF6TP' },
      plan: { code: 'PPLQQQ3F7' },
    };
    await processPerfectPayWebhook(payload2);

    expect(mockDb.orders[1].quantity).toBe(2000);
    expect(mockDb.orderItems[1].quantity).toBe(2000);
    expect(offer.quantity).toBe(2000); // Offer remains 2000, unlimited sales capability
  });

  it('E) Editing an offer to a new quantity does not alter past historical order snapshots', async () => {
    const offer = {
      id: 'offer_starter_2k',
      platform: 'instagram',
      service: 'followers',
      name: 'Starter - 2,000 Followers',
      quantity: 2000,
      priceCents: 1490,
      perfectpayProductId: 'PPPBF6TP',
      perfectpayPlanId: 'PPLQQQ3F7',
      active: true,
    };
    mockDb.offers = [offer];

    // Old purchase at 2,000
    await processPerfectPayWebhook({
      token: TEST_TOKEN,
      code: 'PP-HISTORICAL-01',
      sale_status_enum: 2,
      sale_amount: 14.90,
      product: { code: 'PPPBF6TP' },
      plan: { code: 'PPLQQQ3F7' },
    });

    // Admin edits offer quantity to 5,000
    offer.quantity = 5000;
    offer.name = 'Upgraded Starter - 5,000 Followers';

    // New purchase at 5,000
    await processPerfectPayWebhook({
      token: TEST_TOKEN,
      code: 'PP-HISTORICAL-02',
      sale_status_enum: 2,
      sale_amount: 29.90,
      product: { code: 'PPPBF6TP' },
      plan: { code: 'PPLQQQ3F7' },
    });

    // Old order remains 2,000
    expect(mockDb.orders[0].quantity).toBe(2000);
    expect(mockDb.orderItems[0].planName).toBe('Starter - 2,000 Followers');

    // New order receives 5,000
    expect(mockDb.orders[1].quantity).toBe(5000);
    expect(mockDb.orderItems[1].planName).toBe('Upgraded Starter - 5,000 Followers');
  });
});
