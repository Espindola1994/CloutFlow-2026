import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processPerfectPayWebhook } from '@/services/perfectpay.service';

const mockDb = {
  webhookEvents: [] as any[],
  orders: [] as any[],
  orderItems: [] as any[],
  orderEvents: [] as any[],
  paymentLeads: [] as any[],
  offers: [] as any[],
  checkoutContexts: [] as any[],
};

vi.mock('@/db', () => ({
  db: {
    transaction: vi.fn().mockImplementation(async (callback) => {
      const tx = {
        query: {
          webhookEvents: { findMany: vi.fn().mockResolvedValue([]) },
          orders: { findMany: vi.fn().mockImplementation(() => Promise.resolve(mockDb.orders)) },
          offers: { findMany: vi.fn().mockImplementation(() => Promise.resolve(mockDb.offers)) },
          paymentLeads: { findMany: vi.fn().mockResolvedValue([]) },
          checkoutContexts: {
            findMany: vi.fn().mockImplementation(({ where }: any = {}) => {
              return Promise.resolve(mockDb.checkoutContexts);
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
            } else if (values.description && values.orderId) {
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
              if (mockDb.checkoutContexts.length > 0 && setVals.consumedAt) {
                mockDb.checkoutContexts[0].consumedAt = setVals.consumedAt;
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

describe('PerfectPay Webhook Context Resolution Tests', () => {
  const TEST_TOKEN = 'test_token_ctx_res';

  beforeEach(() => {
    mockDb.webhookEvents = [];
    mockDb.orders = [];
    mockDb.orderItems = [];
    mockDb.orderEvents = [];
    mockDb.checkoutContexts = [];
    mockDb.offers = [];
    process.env.PERFECTPAY_WEBHOOK_TOKEN = TEST_TOKEN;
    process.env.PERFECTPAY_WEBHOOK_VERIFIED = 'true';
  });

  it('1. Valid CFCTX_ in metadata.src resolves social_username, profile_url, target_url, and marks consumed_at', async () => {
    const offer = {
      id: 'off_starter_ctx',
      platform: 'instagram',
      service: 'followers',
      name: 'Starter 2k',
      quantity: 2000,
      priceCents: 1490,
      perfectpayProductId: 'PPPBF6TP',
      perfectpayPlanId: 'PPLQQQ3F7',
      active: true,
    };
    mockDb.offers = [offer];

    const context = {
      id: 'ctx_row_1',
      contextId: 'CFCTX_a1b2c3d4e5f6789012345678',
      platform: 'instagram',
      service: 'followers',
      socialUsername: 'julianabrizolaoficial',
      profileUrl: 'https://www.instagram.com/julianabrizolaoficial',
      targetUrl: 'https://www.instagram.com/julianabrizolaoficial',
      offerId: 'off_starter_ctx',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour in future
      consumedAt: null,
    };
    mockDb.checkoutContexts = [context];

    const payload = {
      token: TEST_TOKEN,
      code: 'PP-ORD-CTX-01',
      sale_status_enum: 2,
      sale_amount: 14.90,
      currency_paid: 'USD',
      product: { code: 'PPPBF6TP' },
      plan: { code: 'PPLQQQ3F7' },
      metadata: { src: 'CFCTX_a1b2c3d4e5f6789012345678' },
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.action).toBe('ORDER_CREATED');
    expect(mockDb.orders.length).toBe(1);

    const order = mockDb.orders[0];
    expect(order.socialUsername).toBe('julianabrizolaoficial');
    expect(order.profileUrl).toBe('https://www.instagram.com/julianabrizolaoficial');
    expect(order.targetUrl).toBe('https://www.instagram.com/julianabrizolaoficial');
    expect(context.consumedAt).toBeDefined();
  });

  it('2. Context with platform mismatch (e.g. context is tiktok, offer is instagram) is rejected safely', async () => {
    const offer = {
      id: 'off_starter_ctx',
      platform: 'instagram',
      service: 'followers',
      perfectpayProductId: 'PPPBF6TP',
      perfectpayPlanId: 'PPLQQQ3F7',
      active: true,
    };
    mockDb.offers = [offer];

    const context = {
      id: 'ctx_row_2',
      contextId: 'CFCTX_b2c3d4e5f678901234567890',
      platform: 'tiktok', // Mismatch!
      service: 'followers',
      socialUsername: 'tiktok_user',
      offerId: 'off_starter_ctx',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    };
    mockDb.checkoutContexts = [context];

    const payload = {
      token: TEST_TOKEN,
      code: 'PP-ORD-CTX-02',
      sale_status_enum: 2,
      product: { code: 'PPPBF6TP' },
      plan: { code: 'PPLQQQ3F7' },
      metadata: { src: 'CFCTX_b2c3d4e5f678901234567890' },
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.action).toBe('ORDER_CREATED');
    expect(mockDb.orders[0].socialUsername).toBeNull(); // Rejected safely
  });
});
