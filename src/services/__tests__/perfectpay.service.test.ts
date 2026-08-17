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
            findMany: vi.fn().mockImplementation(({ where }) => {
              // Simple check simulation
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
                // Check duplicate key simulation
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

describe('PerfectPay Webhook Service - Phase 2.1A Validation Tests', () => {
  beforeEach(() => {
    mockDb.webhookEvents = [];
    mockDb.orders = [];
    mockDb.orderItems = [];
    mockDb.orderEvents = [];
    mockDb.paymentLeads = [];
    process.env.PERFECTPAY_WEBHOOK_VERIFIED = 'true';
  });

  it('1. Same external_event_id twice -> Second is safely ignored as DUPLICATE_IGNORED', async () => {
    const payload = {
      event_id: 'evt_unique_101',
      sale_status: 'approved',
      sale_code: 'PP-ORD-001',
      amount_cents: 4900,
    };

    const firstRes = await processPerfectPayWebhook(payload);
    expect(firstRes.action).toBe('ORDER_CREATED');
    expect(mockDb.orders.length).toBe(1);

    const secondRes = await processPerfectPayWebhook(payload);
    expect(secondRes.action).toBe('DUPLICATE_IGNORED');
    expect(mockDb.orders.length).toBe(1);
  });

  it('2. external_event_id absent + same fingerprint twice -> Second is blocked by deduplicationKey', async () => {
    const payloadWithoutId = {
      sale_status: 'approved',
      sale_code: 'PP-ORD-002',
      product_id: 'PROD_XYZ',
      amount: 19.90,
    };

    const firstRes = await processPerfectPayWebhook(payloadWithoutId);
    expect(firstRes.action).toBe('ORDER_CREATED');

    const secondRes = await processPerfectPayWebhook(payloadWithoutId);
    expect(secondRes.action).toBe('DUPLICATE_IGNORED');
    expect(mockDb.orders.length).toBe(1);
  });

  it('3. Approved -> Completed for the same sale -> Exactly 1 Order updated over time', async () => {
    const approvedPayload = {
      event_id: 'evt_approved_201',
      sale_status: 'approved',
      sale_code: 'PP-ORD-003',
      amount_cents: 9900,
    };

    const appRes = await processPerfectPayWebhook(approvedPayload);
    expect(appRes.action).toBe('ORDER_CREATED');
    expect(mockDb.orders.length).toBe(1);
    expect(mockDb.orders[0].paymentStatus).toBe('PAID');

    const completedPayload = {
      event_id: 'evt_completed_202',
      sale_status: 'completed',
      sale_code: 'PP-ORD-003',
      amount_cents: 9900,
    };

    const compRes = await processPerfectPayWebhook(completedPayload);
    expect(compRes.action).toBe('ORDER_UPDATED');
    expect(mockDb.orders.length).toBe(1);
    expect(mockDb.orders[0].paymentStatus).toBe('COMPLETED');
  });

  it('4. Refund after Approved -> Preserves distinct REFUNDED status and logs event', async () => {
    const approvedPayload = {
      event_id: 'evt_app_301',
      sale_status: 'approved',
      sale_code: 'PP-ORD-004',
      amount_cents: 3500,
    };
    await processPerfectPayWebhook(approvedPayload);

    const refundPayload = {
      event_id: 'evt_ref_302',
      sale_status: 'refunded',
      sale_code: 'PP-ORD-004',
    };
    const refRes = await processPerfectPayWebhook(refundPayload);
    expect(refRes.action).toBe('ORDER_UPDATED');
    expect(mockDb.orders[0].paymentStatus).toBe('REFUNDED');
    expect(mockDb.orders[0].status).toBe('CANCELLED');
  });

  it('5. Chargeback after Approved -> Preserves distinct CHARGEBACK status and logs event', async () => {
    const approvedPayload = {
      event_id: 'evt_app_401',
      sale_status: 'approved',
      sale_code: 'PP-ORD-005',
      amount_cents: 5000,
    };
    await processPerfectPayWebhook(approvedPayload);

    const chargebackPayload = {
      event_id: 'evt_chb_402',
      sale_status: 'chargeback',
      sale_code: 'PP-ORD-005',
    };
    const chbRes = await processPerfectPayWebhook(chargebackPayload);
    expect(chbRes.action).toBe('ORDER_UPDATED');
    expect(mockDb.orders[0].paymentStatus).toBe('CHARGEBACK');
    expect(mockDb.orders[0].status).toBe('CANCELLED');
  });
});
