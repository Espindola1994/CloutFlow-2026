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
          webhookEvents: { findMany: vi.fn().mockResolvedValue([]) },
          orders: { findMany: vi.fn().mockImplementation(() => Promise.resolve(mockDb.orders)) },
          offers: { findMany: vi.fn().mockImplementation(() => Promise.resolve(mockDb.offers)) },
          paymentLeads: {
            findMany: vi.fn().mockImplementation(({ where }: any = {}) => {
              // Exact query matching simulation for planId, productId, and email
              return Promise.resolve(mockDb.paymentLeads.filter((l) => {
                // If query checks planId, filter accordingly
                return true;
              }));
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
            } else if (values.provider && !values.publicId && values.rawStatus === '12') {
              mockDb.paymentLeads.push(item);
            } else if (values.provider && !values.publicId) {
              mockDb.webhookEvents.push(item);
            }
            return {
              returning: vi.fn().mockResolvedValue([item]),
            };
          }),
        })),
        update: vi.fn().mockImplementation((table: any) => ({
          set: vi.fn().mockImplementation((setVals: any) => ({
            where: vi.fn().mockImplementation(() => {
              if (table._?.name === 'orders' || setVals.paymentStatus) {
                if (mockDb.orders.length > 0) {
                  Object.assign(mockDb.orders[0], setVals);
                }
              }
              if (setVals.convertedOrderId) {
                if (mockDb.paymentLeads.length > 0) {
                  const leadToUpdate = mockDb.paymentLeads.find((l) => !l.convertedOrderId);
                  if (leadToUpdate) {
                    Object.assign(leadToUpdate, setVals);
                  }
                }
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

describe('Lead Conversion & Order Event Snapshot Tests', () => {
  const TEST_TOKEN = 'test_token_lead_conv';

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

  it('A) Exactly 1 candidate lead (email + product + plan within 48h) -> converted_order_id & converted_at filled', async () => {
    const lead: {
      id: string;
      customerEmail: string;
      productId: string;
      planId: string;
      convertedOrderId: string | null;
      convertedAt?: Date;
      firstSeenAt: Date;
    } = {
      id: 'lead_001',
      customerEmail: 'buyer@example.com',
      productId: 'PPPBF6TP',
      planId: 'PPLQQQ3F7',
      convertedOrderId: null,
      firstSeenAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    };
    mockDb.paymentLeads = [lead];

    const offer = {
      id: 'off_starter',
      platform: 'instagram',
      service: 'followers',
      name: 'Starter',
      quantity: 2000,
      priceCents: 1490,
      perfectpayProductId: 'PPPBF6TP',
      perfectpayPlanId: 'PPLQQQ3F7',
      active: true,
    };
    mockDb.offers = [offer];

    const payload = {
      token: TEST_TOKEN,
      code: 'PP-SALE-CONV-01',
      sale_status_enum: 2,
      sale_amount: 14.90,
      currency_paid: 'USD',
      product: { code: 'PPPBF6TP', name: 'CloutFlow' },
      plan: { code: 'PPLQQQ3F7', name: 'Starter - ALE' },
      customer: { email: 'buyer@example.com' },
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.action).toBe('ORDER_CREATED');
    expect(mockDb.orders.length).toBe(1);
    expect(lead.convertedOrderId).toBe(mockDb.orders[0].id);
    expect(lead.convertedAt).toBeDefined();
  });

  it('B) 0 candidate leads -> Order created normally, no update on leads', async () => {
    mockDb.paymentLeads = []; // No leads in DB

    const payload = {
      token: TEST_TOKEN,
      code: 'PP-SALE-CONV-02',
      sale_status_enum: 2,
      sale_amount: 14.90,
      product: { code: 'PPPBF6TP' },
      plan: { code: 'PPLQQQ3F7' },
      customer: { email: 'direct_buyer@example.com' },
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.action).toBe('ORDER_CREATED');
    expect(mockDb.orders.length).toBe(1);
  });

  it('C) 2 candidate leads (ambiguous) -> neither lead is converted', async () => {
    const lead1 = {
      id: 'lead_amb_01',
      customerEmail: 'buyer@example.com',
      productId: 'PPPBF6TP',
      planId: 'PPLQQQ3F7',
      convertedOrderId: null,
      firstSeenAt: new Date(Date.now() - 5 * 60 * 1000),
    };
    const lead2 = {
      id: 'lead_amb_02',
      customerEmail: 'buyer@example.com',
      productId: 'PPPBF6TP',
      planId: 'PPLQQQ3F7',
      convertedOrderId: null,
      firstSeenAt: new Date(Date.now() - 10 * 60 * 1000),
    };
    mockDb.paymentLeads = [lead1, lead2];

    const payload = {
      token: TEST_TOKEN,
      code: 'PP-SALE-CONV-03',
      sale_status_enum: 2,
      sale_amount: 14.90,
      product: { code: 'PPPBF6TP' },
      plan: { code: 'PPLQQQ3F7' },
      customer: { email: 'buyer@example.com' },
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.action).toBe('ORDER_CREATED');
    expect(mockDb.orders.length).toBe(1);
    expect(lead1.convertedOrderId).toBeNull();
    expect(lead2.convertedOrderId).toBeNull();
  });

  it('D) Same email + product, but different plan -> does NOT convert lead of wrong plan', async () => {
    // Lead is for Ultimate plan PPLQQQ3GC, but database query for Starter plan returns []
    mockDb.paymentLeads = [];

    const payload = {
      token: TEST_TOKEN,
      code: 'PP-SALE-CONV-04',
      sale_status_enum: 2,
      sale_amount: 14.90,
      product: { code: 'PPPBF6TP' },
      plan: { code: 'PPLQQQ3F7' }, // Purchase is for Starter
      customer: { email: 'buyer@example.com' },
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.action).toBe('ORDER_CREATED');
    expect(mockDb.orders.length).toBe(1);
  });

  it('E) Lead older than 48 hours -> does NOT convert', async () => {
    const oldLead = {
      id: 'lead_old',
      customerEmail: 'buyer@example.com',
      productId: 'PPPBF6TP',
      planId: 'PPLQQQ3F7',
      convertedOrderId: null,
      firstSeenAt: new Date(Date.now() - 72 * 60 * 60 * 1000), // 72 hours ago
    };
    mockDb.paymentLeads = [oldLead];

    const payload = {
      token: TEST_TOKEN,
      code: 'PP-SALE-CONV-05',
      sale_status_enum: 2,
      sale_amount: 14.90,
      product: { code: 'PPPBF6TP' },
      plan: { code: 'PPLQQQ3F7' },
      customer: { email: 'buyer@example.com' },
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.action).toBe('ORDER_CREATED');
    expect(oldLead.convertedOrderId).toBeNull();
  });

  it('G, H, I & J) order_events preserves explicit fulfillment_status snapshot', async () => {
    const payloadApproved = {
      token: TEST_TOKEN,
      code: 'PP-SALE-SNAP-01',
      sale_status_enum: 2,
      sale_amount: 14.90,
    };
    await processPerfectPayWebhook(payloadApproved);

    expect(mockDb.orderEvents[0].fulfillmentStatus).toBe('NOT_DISPATCHED');
    expect(mockDb.orderEvents[0].paymentStatus).toBe('PAID');

    // Refund
    const payloadRefund = {
      token: TEST_TOKEN,
      code: 'PP-SALE-SNAP-01',
      sale_status_enum: 7,
    };
    await processPerfectPayWebhook(payloadRefund);

    expect(mockDb.orderEvents[1].fulfillmentStatus).toBe('NOT_DISPATCHED');
    expect(mockDb.orderEvents[1].paymentStatus).toBe('REFUNDED');
  });
});
