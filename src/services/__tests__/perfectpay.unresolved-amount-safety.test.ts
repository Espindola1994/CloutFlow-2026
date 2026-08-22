import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processPerfectPayWebhook } from '@/services/perfectpay.service';

const mockDb = {
  webhookEvents: [] as Record<string, unknown>[],
  orders: [] as Record<string, unknown>[],
  orderItems: [] as Record<string, unknown>[],
  orderEvents: [] as Record<string, unknown>[],
  paymentLeads: [] as Record<string, unknown>[],
  offers: [] as Record<string, unknown>[],
};

vi.mock('@/db', () => ({
  db: {
    transaction: vi.fn().mockImplementation(async (callback) => {
      const tx = {
        query: {
          webhookEvents: {
            findMany: vi.fn().mockImplementation(() => Promise.resolve([])),
          },
          orders: {
            findMany: vi.fn().mockImplementation(() => Promise.resolve(mockDb.orders)),
          },
          offers: {
            findMany: vi.fn().mockImplementation(() => Promise.resolve(mockDb.offers)),
          },
          paymentLeads: {
            findMany: vi.fn().mockImplementation(() => Promise.resolve(mockDb.paymentLeads)),
          },
        },
        insert: vi.fn().mockImplementation(() => ({
          values: vi.fn().mockImplementation((values: Record<string, unknown>) => {
            const item = { id: `id_${Date.now()}_${Math.random()}`, ...values };
            if (values.publicId) {
              mockDb.orders.push(item);
            } else if (values.serviceName && values.planName) {
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
          set: vi.fn().mockImplementation((setVals: Record<string, unknown>) => ({
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

describe('PerfectPay Approved Safety & Unresolved Amount Handling', () => {
  const TEST_TOKEN = 'test_webhook_token_approved_safety';

  beforeEach(() => {
    mockDb.webhookEvents = [];
    mockDb.orders = [];
    mockDb.orderItems = [];
    mockDb.orderEvents = [];
    mockDb.offers = [];
    mockDb.paymentLeads = [];
    process.env.PERFECTPAY_WEBHOOK_TOKEN = TEST_TOKEN;
    process.env.PERFECTPAY_WEBHOOK_VERIFIED = 'true';
  });

  it('Safe Unresolved Amount Behavior: Rejects silent $0 order creation when amount is missing and offer is unmatched', async () => {
    // Webhook with no monetary amount and no matched offer in db
    const payload = {
      token: TEST_TOKEN,
      code: 'PPCPMTB5HJ3M1O9NJM',
      sale_status_enum: 2, // approved
      product: { code: 'UNMATCHED_PROD' },
      plan: { code: 'UNMATCHED_PLAN' },
    };

    const result = await processPerfectPayWebhook(payload);

    expect(result.success).toBe(false);
    expect(result.authenticated).toBe(true);
    expect(result.action).toBe('EVENT_LOGGED');
    expect(result.message).toContain('unresolved monetary amount');
    // Order must NOT be created
    expect(mockDb.orders).toHaveLength(0);
    // Webhook event is logged with UNRESOLVED_AMOUNT_ERROR
    expect(mockDb.webhookEvents).toHaveLength(1);
    expect(mockDb.webhookEvents[0].processingStatus).toBe('UNRESOLVED_AMOUNT_ERROR');
  });

  it('Explicit Zero Dollar Checkout Flow: Allows legitimate $0 order when sale_amount is explicitly 0 and offer is matched', async () => {
    mockDb.offers = [
      {
        id: 'off_free_tier',
        platform: 'instagram',
        service: 'followers',
        name: 'Free Trial Followers',
        quantity: 50,
        priceCents: 0,
        perfectpayProductId: 'PPP_FREE',
        perfectpayPlanId: 'PPL_FREE',
        active: true,
      },
    ];

    const payload = {
      token: TEST_TOKEN,
      code: 'PPCPMTB5FREE001',
      sale_status_enum: 2, // approved
      sale_amount: 0, // explicit zero
      currency_paid: 'USD',
      product: { code: 'PPP_FREE', name: 'Free Trial' },
      plan: { code: 'PPL_FREE', name: '50 Followers' },
    };

    const result = await processPerfectPayWebhook(payload);

    expect(result.success).toBe(true);
    expect(result.action).toBe('ORDER_CREATED');
    expect(mockDb.orders).toHaveLength(1);
    expect(mockDb.orders[0].totalCents).toBe(0);
    expect(mockDb.orders[0].subtotalCents).toBe(0);
  });
});
