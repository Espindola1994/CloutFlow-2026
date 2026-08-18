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
            findMany: vi.fn().mockImplementation(() => Promise.resolve([])),
          },
          orders: {
            findMany: vi.fn().mockImplementation(() => Promise.resolve(mockDb.orders)),
          },
          offers: {
            findMany: vi.fn().mockImplementation(({ where }: any = {}) => {
              // Exact query simulation matching Drizzle schema
              return Promise.resolve(mockDb.offers);
            }),
          },
        },
        insert: vi.fn().mockImplementation(() => ({
          values: vi.fn().mockImplementation((values: any) => {
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

describe('Forensic Trace - Exact Production Payload Simulation', () => {
  const TEST_TOKEN = 'pp_token_exact_prod_trace';

  beforeEach(() => {
    mockDb.webhookEvents = [];
    mockDb.orders = [];
    mockDb.orderItems = [];
    mockDb.orderEvents = [];
    mockDb.offers = [];
    process.env.PERFECTPAY_WEBHOOK_TOKEN = TEST_TOKEN;
    process.env.PERFECTPAY_WEBHOOK_VERIFIED = 'true';
  });

  it('Trace exact real production event PPCPMTB5HJ0EM3ORDE', async () => {
    // 1. Setup exact production Offer in database
    const prodOffer = {
      id: 'off_starter_prod_id',
      platform: 'instagram',
      service: 'followers',
      name: '2,000 Followers Pay for 1,000 - Get 2,000 total',
      quantity: 2000,
      priceCents: 1490,
      perfectpayProductId: 'PPPBF6TP',
      perfectpayPlanId: 'PPLQQQ3F7',
      active: true,
    };
    mockDb.offers = [prodOffer];

    // 2. Exact production payload structure
    const prodPayload = {
      token: TEST_TOKEN,
      code: 'PPCPMTB5HJ0EM3ORDE',
      sale_status_enum: 2, // rawStatus: '2', normalizedStatus: 'approved'
      sale_amount: 5.00, // amount_cents: 500
      currency_paid: 'USD',
      product: { code: 'PPPBF6TP', name: 'CloutFlow' },
      plan: { code: 'PPLQQQ3F7', name: 'Starter - ALE' },
    };

    const result = await processPerfectPayWebhook(prodPayload);

    expect(result.success).toBe(true);
    expect(result.authenticated).toBe(true);
    expect(result.mode).toBe('VERIFIED');
    expect(result.action).toBe('ORDER_CREATED');
    expect(result.orderId).toBeDefined();

    // Verify Orders table
    expect(mockDb.orders.length).toBe(1);
    const createdOrder = mockDb.orders[0];
    expect(createdOrder.externalOrderId).toBe('PPCPMTB5HJ0EM3ORDE');
    expect(createdOrder.offerId).toBe('off_starter_prod_id');
    expect(createdOrder.platform).toBe('instagram');
    expect(createdOrder.service).toBe('followers');
    expect(createdOrder.quantity).toBe(2000);
    expect(createdOrder.totalCents).toBe(500); // Exact $5.00 from webhook
    expect(createdOrder.paymentStatus).toBe('PAID');
    expect(createdOrder.status).toBe('PROCESSING');
    expect(createdOrder.fulfillmentStatus).toBe('NOT_DISPATCHED');

    // Verify Order Items table
    expect(mockDb.orderItems.length).toBe(1);
    expect(mockDb.orderItems[0].orderId).toBe(createdOrder.id);
    expect(mockDb.orderItems[0].quantity).toBe(2000);
    expect(mockDb.orderItems[0].totalPriceCents).toBe(500);

    // Verify Order Events table
    expect(mockDb.orderEvents.length).toBe(1);
    expect(mockDb.orderEvents[0].orderId).toBe(createdOrder.id);
    expect(mockDb.orderEvents[0].paymentStatus).toBe('PAID');

    // Verify Webhook Events table
    expect(mockDb.webhookEvents.length).toBe(1);
    expect(mockDb.webhookEvents[0].orderId).toBe(createdOrder.id);
    expect(mockDb.webhookEvents[0].processingStatus).toBe('PROCESSED');
  });
});
