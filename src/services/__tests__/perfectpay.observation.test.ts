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
              if (table._?.name === 'webhook_events' || values.provider) {
                const isDupEventId = values.externalEventId && mockDb.webhookEvents.some((e) => e.externalEventId === values.externalEventId);
                const isDupDedup = values.deduplicationKey && mockDb.webhookEvents.some((e) => e.deduplicationKey === values.deduplicationKey);
                if (isDupEventId || isDupDedup) {
                  const error: any = new Error('duplicate key value violates unique constraint');
                  error.code = '23505';
                  throw error;
                }
                mockDb.webhookEvents.push(item);
              }
              if (values.publicId) {
                mockDb.orders.push(item);
              }
              if (values.serviceName) {
                mockDb.orderItems.push(item);
              }
              if (values.orderId && values.description) {
                mockDb.orderEvents.push(item);
              }
              if (values.customerEmail && values.rawStatus && !values.publicId && !values.metadataSafe) {
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

describe('PerfectPay Webhook Service - Phase 2.2A Observation Mode & Security Gates', () => {
  beforeEach(() => {
    mockDb.webhookEvents = [];
    mockDb.orders = [];
    mockDb.orderItems = [];
    mockDb.orderEvents = [];
    mockDb.paymentLeads = [];
    delete process.env.PERFECTPAY_WEBHOOK_VERIFIED;
  });

  it('A) Unverified + Approved payload -> Does NOT create Order, logs UNVERIFIED audit event', async () => {
    process.env.PERFECTPAY_WEBHOOK_VERIFIED = 'false';

    const payload = {
      event_id: 'evt_unverified_001',
      sale_status: 'approved',
      sale_code: 'PP-TEST-001',
      amount_cents: 2990,
      customer: { email: 'test@buyer.com' },
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.action).toBe('OBSERVED_UNVERIFIED');
    expect(res.mode).toBe('OBSERVATION');
    expect(mockDb.orders.length).toBe(0);
    expect(mockDb.orderItems.length).toBe(0);
    expect(mockDb.webhookEvents.length).toBe(1);
    expect(mockDb.webhookEvents[0].processingStatus).toBe('UNVERIFIED');
  });

  it('B) Unverified + Completed payload -> Does NOT create or update Order', async () => {
    process.env.PERFECTPAY_WEBHOOK_VERIFIED = 'false';

    const payload = {
      event_id: 'evt_unverified_002',
      sale_status: 'completed',
      sale_code: 'PP-TEST-002',
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.action).toBe('OBSERVED_UNVERIFIED');
    expect(mockDb.orders.length).toBe(0);
  });

  it('C) Unverified + Pre_checkout -> Does NOT create operational payment_lead', async () => {
    process.env.PERFECTPAY_WEBHOOK_VERIFIED = 'false';

    const payload = {
      event_id: 'evt_unverified_003',
      sale_status: 'pre_checkout',
      customer: { email: 'lead@buyer.com' },
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.action).toBe('OBSERVED_UNVERIFIED');
    expect(mockDb.paymentLeads.length).toBe(0);
  });

  it('D) Unverified duplicate event -> Idempotency is preserved and returns DUPLICATE_IGNORED', async () => {
    process.env.PERFECTPAY_WEBHOOK_VERIFIED = 'false';

    const payload = {
      event_id: 'evt_unverified_dup_001',
      sale_status: 'approved',
      sale_code: 'PP-TEST-DUP',
    };

    const first = await processPerfectPayWebhook(payload);
    expect(first.action).toBe('OBSERVED_UNVERIFIED');

    const second = await processPerfectPayWebhook(payload);
    expect(second.action).toBe('DUPLICATE_IGNORED');
    expect(mockDb.webhookEvents.length).toBe(1);
  });

  it('E) Verified Processing Mode Enabled -> Processes sales and creates Order as normal', async () => {
    process.env.PERFECTPAY_WEBHOOK_VERIFIED = 'true';

    const payload = {
      event_id: 'evt_verified_001',
      sale_status: 'approved',
      sale_code: 'PP-VERIFIED-001',
      amount_cents: 4990,
    };

    const res = await processPerfectPayWebhook(payload);
    expect(res.action).toBe('ORDER_CREATED');
    expect(res.mode).toBe('VERIFIED');
    expect(mockDb.orders.length).toBe(1);
    expect(mockDb.orders[0].paymentStatus).toBe('PAID');
    expect(mockDb.webhookEvents[0].processingStatus).toBe('PROCESSED');
  });
});
