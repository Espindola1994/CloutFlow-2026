import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processPerfectPayWebhook } from '@/services/perfectpay.service';

// Mock DB memory state
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
            findMany: vi.fn().mockImplementation(() => {
              return Promise.resolve(mockDb.webhookEvents.filter(() => false));
            }),
          },
          orders: {
            findMany: vi.fn().mockImplementation(() => {
              return Promise.resolve(mockDb.orders);
            }),
          },
          offers: {
            findMany: vi.fn().mockResolvedValue([]),
          },
        },
        insert: vi.fn().mockImplementation((table: any) => ({
          values: vi.fn().mockImplementation((values: any) => ({
            returning: vi.fn().mockImplementation(() => {
              const item = { id: `id_${Date.now()}_${Math.random()}`, ...values };
              if (values.provider && values.payload) {
                const isDupEventId = values.externalEventId && mockDb.webhookEvents.some((e) => e.externalEventId === values.externalEventId);
                const isDupDedup = values.deduplicationKey && mockDb.webhookEvents.some((e) => e.deduplicationKey === values.deduplicationKey);
                if (isDupEventId || isDupDedup) {
                  const error: any = new Error('duplicate key value violates unique constraint');
                  error.code = '23505';
                  throw error;
                }
                mockDb.webhookEvents.push(item);
              } else if (values.publicId) {
                mockDb.orders.push(item);
              } else if (values.serviceName) {
                mockDb.orderItems.push(item);
              } else if (values.orderId && values.description) {
                mockDb.orderEvents.push(item);
              } else if (values.provider && !values.payload) {
                mockDb.paymentLeads.push(item);
              }
              return Promise.resolve([item]);
            }),
          })),
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

describe('PerfectPay Webhook Service - Phase 2.10B Observation Mode & CRM Payment Leads', () => {
  const TEST_VALID_TOKEN = 'pp_pub_token_valid_12345';

  beforeEach(() => {
    mockDb.webhookEvents = [];
    mockDb.orders = [];
    mockDb.orderItems = [];
    mockDb.orderEvents = [];
    mockDb.paymentLeads = [];
    process.env.PERFECTPAY_WEBHOOK_TOKEN = TEST_VALID_TOKEN;
    delete process.env.PERFECTPAY_WEBHOOK_VERIFIED;
  });

  it('A) Observation + pre_checkout -> Creates payment_lead and webhook_event, NO Order', async () => {
    process.env.PERFECTPAY_WEBHOOK_VERIFIED = 'false';

    const payload = {
      token: TEST_VALID_TOKEN,
      event_id: 'evt_unverified_003',
      sale_status: 'pre_checkout',
      sale_code: 'PPCCKT15GC9WEZ',
      customer: { email: 'lead@buyer.com', name: 'Ana Clara' },
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.authenticated).toBe(true);
    expect(res.action).toBe('LEAD_RECORDED');
    expect(res.mode).toBe('OBSERVATION');
    expect(mockDb.paymentLeads.length).toBe(1);
    expect(mockDb.paymentLeads[0].customerEmail).toBe('lead@buyer.com');
    expect(mockDb.orders.length).toBe(0);
    expect(mockDb.orderItems.length).toBe(0);
    expect(mockDb.orderEvents.length).toBe(0);
    expect(mockDb.webhookEvents.length).toBe(1);
    expect(mockDb.webhookEvents[0].processingStatus).toBe('OBSERVED_AUTHENTICATED');
  });

  it('B) Observation + pre_checkout + CFCTX -> payment_lead.src preserves CFCTX token', async () => {
    process.env.PERFECTPAY_WEBHOOK_VERIFIED = 'false';

    const payload = {
      token: TEST_VALID_TOKEN,
      event_id: 'evt_real_ref_001',
      sale_status: 'pre_checkout',
      sale_code: 'PPCCKT15GC9WEZ',
      product: { code: 'PPPBF6TP' },
      plan: { code: 'PPLQQQ3F7' },
      metadata: { src: 'CFCTX_d195d41035e1e05b90f5d4cc' },
      customer: { email: 'anaclara@test.com' },
      amount_cents: 538,
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.authenticated).toBe(true);
    expect(res.action).toBe('LEAD_RECORDED');
    expect(res.mode).toBe('OBSERVATION');
    expect(mockDb.paymentLeads.length).toBe(1);
    expect(mockDb.paymentLeads[0].src).toBe('CFCTX_d195d41035e1e05b90f5d4cc');
    expect(mockDb.paymentLeads[0].productId).toBe('PPPBF6TP');
    expect(mockDb.paymentLeads[0].planId).toBe('PPLQQQ3F7');
    expect(mockDb.paymentLeads[0].amountCents).toBe(538);
    expect(mockDb.orders.length).toBe(0);
  });

  it('C) Observation duplicate pre_checkout -> Only 1 payment_lead created, second returns DUPLICATE_IGNORED', async () => {
    process.env.PERFECTPAY_WEBHOOK_VERIFIED = 'false';

    const payload = {
      token: TEST_VALID_TOKEN,
      event_id: 'evt_dup_precheckout_001',
      sale_status: 'pre_checkout',
      sale_code: 'PPCCKT15GC9WEZ',
      customer: { email: 'dup@buyer.com' },
    };

    const first = await processPerfectPayWebhook(payload);
    expect(first.action).toBe('LEAD_RECORDED');
    expect(mockDb.paymentLeads.length).toBe(1);

    const second = await processPerfectPayWebhook(payload);
    expect(second.action).toBe('DUPLICATE_IGNORED');
    expect(mockDb.paymentLeads.length).toBe(1);
    expect(mockDb.webhookEvents.length).toBe(1);
  });

  it('E) Observation + Approved payload -> Does NOT create Order, logs OBSERVED_AUTHENTICATED', async () => {
    process.env.PERFECTPAY_WEBHOOK_VERIFIED = 'false';

    const payload = {
      token: TEST_VALID_TOKEN,
      event_id: 'evt_unverified_001',
      sale_status: 'approved',
      sale_code: 'PP-TEST-001',
      amount_cents: 2990,
      customer: { email: 'test@buyer.com' },
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.authenticated).toBe(true);
    expect(res.action).toBe('OBSERVED_AUTHENTICATED');
    expect(res.mode).toBe('OBSERVATION');
    expect(mockDb.orders.length).toBe(0);
    expect(mockDb.orderItems.length).toBe(0);
    expect(mockDb.webhookEvents.length).toBe(1);
    expect(mockDb.webhookEvents[0].processingStatus).toBe('OBSERVED_AUTHENTICATED');
  });

  it('F) Observation + Completed payload -> Does NOT create or update Order', async () => {
    process.env.PERFECTPAY_WEBHOOK_VERIFIED = 'false';

    const payload = {
      token: TEST_VALID_TOKEN,
      event_id: 'evt_unverified_002',
      sale_status: 'completed',
      sale_code: 'PP-TEST-002',
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.authenticated).toBe(true);
    expect(res.action).toBe('OBSERVED_AUTHENTICATED');
    expect(mockDb.orders.length).toBe(0);
  });

  it('G) Observation + Refunded payload -> Does NOT update Order', async () => {
    process.env.PERFECTPAY_WEBHOOK_VERIFIED = 'false';

    const payload = {
      token: TEST_VALID_TOKEN,
      event_id: 'evt_unverified_ref_001',
      sale_status: 'refunded',
      sale_code: 'PP-TEST-REF',
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.authenticated).toBe(true);
    expect(res.action).toBe('OBSERVED_AUTHENTICATED');
    expect(res.mode).toBe('OBSERVATION');
    expect(mockDb.orders.length).toBe(0);
  });

  it('H) Observation + Cancelled payload -> Does NOT update Order', async () => {
    process.env.PERFECTPAY_WEBHOOK_VERIFIED = 'false';

    const payload = {
      token: TEST_VALID_TOKEN,
      event_id: 'evt_unverified_can_001',
      sale_status: 'cancelled',
      sale_code: 'PP-TEST-CAN',
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.authenticated).toBe(true);
    expect(res.action).toBe('OBSERVED_AUTHENTICATED');
    expect(mockDb.orders.length).toBe(0);
  });

  it('I) Observation + Chargeback payload -> Does NOT update Order', async () => {
    process.env.PERFECTPAY_WEBHOOK_VERIFIED = 'false';

    const payload = {
      token: TEST_VALID_TOKEN,
      event_id: 'evt_unverified_chg_001',
      sale_status: 'chargeback',
      sale_code: 'PP-TEST-CHG',
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.authenticated).toBe(true);
    expect(res.action).toBe('OBSERVED_AUTHENTICATED');
    expect(mockDb.orders.length).toBe(0);
  });

  it('J) Verified Mode + pre_checkout -> Creates payment_lead with VERIFIED mode', async () => {
    process.env.PERFECTPAY_WEBHOOK_VERIFIED = 'true';

    const payload = {
      token: TEST_VALID_TOKEN,
      event_id: 'evt_verified_pre_001',
      sale_status: 'pre_checkout',
      sale_code: 'PP-VER-LEAD',
      customer: { email: 'verlead@buyer.com' },
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.authenticated).toBe(true);
    expect(res.action).toBe('LEAD_RECORDED');
    expect(res.mode).toBe('VERIFIED');
    expect(mockDb.paymentLeads.length).toBe(1);
    expect(mockDb.orders.length).toBe(0);
  });

  it('K) Verified Processing Mode Enabled -> Processes sales and creates Order as normal', async () => {
    process.env.PERFECTPAY_WEBHOOK_VERIFIED = 'true';

    const payload = {
      token: TEST_VALID_TOKEN,
      event_id: 'evt_verified_001',
      sale_status: 'approved',
      sale_code: 'PP-VERIFIED-001',
      amount_cents: 4990,
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.authenticated).toBe(true);
    expect(res.action).toBe('ORDER_CREATED');
    expect(res.mode).toBe('VERIFIED');
    expect(mockDb.orders.length).toBe(1);
    expect(mockDb.orders[0].paymentStatus).toBe('PAID');
    expect(mockDb.webhookEvents[0].processingStatus).toBe('PROCESSED');
  });
});
