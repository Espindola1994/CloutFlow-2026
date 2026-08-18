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
          webhookEvents: { findMany: vi.fn().mockResolvedValue([]) },
          orders: { findMany: vi.fn().mockImplementation(() => Promise.resolve(mockDb.orders)) },
          offers: { findMany: vi.fn().mockImplementation(() => Promise.resolve(mockDb.offers)) },
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

describe('Order Items Sanitization & Minimal Snapshot Tests', () => {
  const TEST_TOKEN = 'test_token_order_item_sanitization';

  beforeEach(() => {
    mockDb.webhookEvents = [];
    mockDb.orders = [];
    mockDb.orderItems = [];
    mockDb.orderEvents = [];
    mockDb.offers = [];
    process.env.PERFECTPAY_WEBHOOK_TOKEN = TEST_TOKEN;
    process.env.PERFECTPAY_WEBHOOK_VERIFIED = 'true';
  });

  it('New order_item metadata contains strictly minimal snapshot and ZERO PII/tokens/payload duplicates', async () => {
    const offer = {
      id: 'off_starter_clean',
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

    const payload = {
      token: TEST_TOKEN,
      code: 'PP-CLEAN-001',
      sale_status_enum: 2,
      sale_amount: 14.90,
      currency_paid: 'USD',
      product: { code: 'PPPBF6TP', name: 'CloutFlow' },
      plan: { code: 'PPLQQQ3F7', name: 'Starter - ALE' },
      customer: {
        email: 'buyer@example.com',
        full_name: 'John Sensitive Doe',
        phone_number: '12345678',
        identification_number: '11122233344',
      },
      client_ip: '192.168.1.1',
      user_agent: 'Mozilla/5.0 Secret',
      affiliate_id: 'aff_secret_99',
      commission: 5.0,
      _fbc: 'fb.1.12345',
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.action).toBe('ORDER_CREATED');
    expect(mockDb.orderItems.length).toBe(1);

    const itemMeta = mockDb.orderItems[0].metadata;

    // A to E: Forbidden fields must be strictly UNDEFINED in order_items metadata
    expect(itemMeta.rawPayloadPreview).toBeUndefined();
    expect(itemMeta.token).toBeUndefined();
    expect(itemMeta.client_ip).toBeUndefined();
    expect(itemMeta.user_agent).toBeUndefined();
    expect(itemMeta.customer).toBeUndefined();
    expect(itemMeta.email).toBeUndefined();
    expect(itemMeta.identification_number).toBeUndefined();
    expect(itemMeta.commission).toBeUndefined();
    expect(itemMeta.affiliate_id).toBeUndefined();
    expect(itemMeta._fbc).toBeUndefined();

    // F to K: Required snapshot fields must be present and exact
    expect(itemMeta.matchedOfferId).toBe('off_starter_clean');
    expect(itemMeta.matchedOfferName).toBe('Starter 2k');
    expect(itemMeta.perfectpay.externalOrderId).toBe('PP-CLEAN-001');
    expect(itemMeta.perfectpay.productCode).toBe('PPPBF6TP');
    expect(itemMeta.perfectpay.productName).toBe('CloutFlow');
    expect(itemMeta.perfectpay.planCode).toBe('PPLQQQ3F7');
    expect(itemMeta.perfectpay.planName).toBe('Starter - ALE');
    expect(itemMeta.perfectpay.amountCents).toBe(1490);
    expect(itemMeta.perfectpay.currency).toBe('USD');
  });
});
